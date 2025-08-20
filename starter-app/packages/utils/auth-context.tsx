"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabase';
import { debouncedSyncSubscription } from './subscription-sync';

interface ExtendedProfile {
  display_name?: string | null;
  profile_image_url?: string | null;
  phone_number?: string | null;
  is_premium?: boolean | null;
  is_pro?: boolean | null;
  is_admin?: boolean | null;
}

interface AuthContextType {
  user: (User & ExtendedProfile) | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, displayName: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>; // alias for signOut (legacy)
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch (err) {
    console.error('❌ [AuthProvider] Failed to create Supabase client:', err);
    setError('Failed to initialize Supabase client');
    setIsLoading(false);
    return (
      <AuthContext.Provider value={{
        user: null,
        session: null,
        isLoading: false,
        error: 'Failed to initialize Supabase client',
        login: async () => { throw new Error('Supabase not available'); },
        signup: async () => { throw new Error('Supabase not available'); },
        loginWithGoogle: async () => { throw new Error('Supabase not available'); },
        resetPassword: async () => { throw new Error('Supabase not available'); },
        logout: async () => { throw new Error('Supabase not available'); },
        signOut: async () => { throw new Error('Supabase not available'); },
        refreshUser: async () => { throw new Error('Supabase not available'); },
      }}>
        {children}
      </AuthContext.Provider>
    );
  }

    // Helper to merge additional profile columns into the auth user
  const attachProfileData = async (authUser: User | null): Promise<(User & ExtendedProfile) | null> => {
    if (!authUser) return null;

    try {
      console.log('[AuthContext] Fetching profile for user:', authUser.id);

      // Add timeout to profile query - reduced timeout to 10 seconds to be faster
      const profilePromise = supabase
        .from('users')
        .select('display_name, profile_image_url, phone_number, is_premium, is_pro, is_admin')
        .eq('id', authUser.id)
        .single();

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile query timeout')), 10000);
      });

      const { data: profile, error } = await Promise.race([profilePromise, timeoutPromise]) as any;

      if (error && error.code === 'PGRST116') {
        // Profile row missing — create it
        console.log('[AuthContext] Profile not found, creating new profile for user:', authUser.id);

        const defaultUsername = authUser.email?.split('@')[0] ?? authUser.id.slice(0, 8);
        const displayName = authUser.user_metadata?.display_name ?? authUser.user_metadata?.full_name ?? defaultUsername;

        const { data: newProfile, error: insertError } = await supabase
          .from('users')
          .insert({
            id: authUser.id,
            username: defaultUsername,
            display_name: displayName,
            email: authUser.email,
          })
          .select('display_name, profile_image_url, phone_number, is_premium, is_pro, is_admin')
          .single();

        if (insertError) {
          console.error('[AuthContext] Failed to create profile:', insertError);
          return authUser as User & ExtendedProfile;
        }

        console.log('[AuthContext] Profile created successfully:', newProfile);
        return { ...authUser, ...newProfile } as User & ExtendedProfile;
      } else if (error) {
        if (error.message === 'Profile query timeout') {
          console.warn('[AuthContext] Profile query timed out, proceeding with basic user data');
        } else {
          console.warn('[AuthContext] Error fetching profile:', error.message);
        }
        return authUser as User & ExtendedProfile;
      }

      console.log('[AuthContext] Profile data fetched successfully:', profile);
      return { ...authUser, ...profile } as User & ExtendedProfile;
    } catch (err: any) {
      if (err?.message === 'Profile query timeout') {
        console.warn('[AuthContext] Profile query timed out, proceeding with basic user data');
      } else {
        console.error('[AuthContext] Failed to load profile row:', err);
      }
      return authUser as User & ExtendedProfile;
    }
  };

  useEffect(() => {
    // Handle initial session and OAuth callbacks
    const getInitialSession = async () => {
      try {
        console.log('[AuthContext] Getting initial session...');

        // Increase timeout to 20 seconds to handle OAuth callbacks better
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Auth initialization timeout')), 20000);
        });

        // For OAuth callbacks, this will handle the code exchange automatically
        const sessionPromise = supabase.auth.getSession();

        const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]) as any;

        if (error) {
          console.error('[AuthContext] Error getting initial session:', error);
          setError(error.message);
          setSession(null);
          setUser(null);
        } else {
          console.log('[AuthContext] Initial session loaded:', !!session, session?.user?.email);
          setSession(session);

          if (session?.user) {
            console.log('[AuthContext] Fetching profile data for user:', session.user.id);
            const mergedUser = await attachProfileData(session.user);
            console.log('[AuthContext] Profile data attached:', !!mergedUser);
            setUser(mergedUser);
          } else {
            console.log('[AuthContext] No user in session');
            setUser(null);
          }
          setError(null);
        }
      } catch (error: any) {
        console.error('[AuthContext] Failed to get initial session:', error);
        setError('Failed to initialize authentication');
        setSession(null);
        setUser(null);
        
        // Add retry logic for OAuth callback failures
        const isOAuthCallback = typeof window !== 'undefined' && window.location.pathname === '/auth/callback';
        if (isOAuthCallback) {
          console.log('[AuthContext] OAuth callback detected, error may be temporary');
        }
      } finally {
        console.log('[AuthContext] Setting isLoading to false');
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    console.log('[AuthContext] Starting auth initialization...');
    getInitialSession();

    // Add visibility change handler to refresh auth state when returning to tab
    const handleVisibilityChange = () => {
      if (!document.hidden && isInitialized && !user) {
        console.log('[AuthContext] Tab became visible, checking for lost session...');
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            console.log('[AuthContext] Restoring lost session on tab focus');
            attachProfileData(session.user).then(setUser);
            setSession(session);
          }
        });
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Listen for auth changes (including OAuth completion)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        console.log('[AuthContext] Auth state changed:', event, !!session, session?.user?.email);

        // Only update if session actually changed to prevent unnecessary re-renders
        setSession((prevSession: Session | null) => {
          if (prevSession?.access_token === session?.access_token && 
              prevSession?.user?.id === session?.user?.id) {
            return prevSession; // No change, return previous session
          }
          return session;
        });

        // Clear any previous errors on successful auth events
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setError(null);
          if (session?.user) {
            const mergedUser = await attachProfileData(session.user);
            setUser(mergedUser);
          } else {
            setUser(null);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }

        // Only set loading to false on initial load or auth events that complete the flow
        if (!isInitialized || event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          setIsLoading(false);
          setIsInitialized(true);
        }

        // Log successful OAuth completion and sync subscription
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('[AuthContext] User signed in successfully:', session.user.email);
          
          // Sync subscription status after successful sign in
          setTimeout(() => {
            console.log('[AuthContext] Syncing subscription after sign in...');
            debouncedSyncSubscription(1000); // 1 second delay to let auth settle
          }, 500);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []); // Remove supabase.auth dependency to prevent re-initialization

  // Add automatic error recovery - clear auth errors after 30 seconds
  useEffect(() => {
    if (error && isInitialized) {
      const errorTimeout = setTimeout(() => {
        console.log('[AuthContext] Auto-clearing auth error after timeout:', error);
        setError(null);
      }, 30000); // 30 seconds

      return () => clearTimeout(errorTimeout);
    }
  }, [error, isInitialized]);

  const login = useCallback(async (email: string, password: string) => {
    console.log('[AuthContext] Login attempt:', email);
    setIsLoading(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('[AuthContext] Login error:', signInError);
        setError(signInError.message);
        throw signInError;
      }

      console.log('[AuthContext] Login successful');
    } catch (error: any) {
      console.error('[AuthContext] Login exception:', error);
      setError(error.message || 'Login failed');
      setIsLoading(false);
      throw error;
    }
  }, [supabase.auth]);

    const signup = useCallback(async (email: string, displayName: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Get redirect URL for email confirmation
      const origin = typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      const redirectTo = `${origin}/auth/callback`;

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName
          }
        },
      });

      if (signUpError) {
        console.error('[AuthContext] Signup error:', signUpError);
        setError(signUpError.message);
        throw signUpError;
      }

      if (data.user) {
        console.log('[AuthContext] Signup successful - user created');
        // Update user state immediately since no email confirmation is needed
        const userWithProfile = await attachProfileData(data.user);
        setUser(userWithProfile);
        setSession(data.session);
        
        // Force a profile creation to ensure it exists for event creation
        if (userWithProfile && !userWithProfile.display_name) {
          console.log('[AuthContext] Ensuring profile exists for new user');
          await attachProfileData(data.user);
        }
        
        // Sync subscription status after successful signup (in case user had previous subscriptions)
        setTimeout(() => {
          console.log('[AuthContext] Syncing subscription after signup...');
          debouncedSyncSubscription(2000); // 2 second delay for new users
        }, 1000);
      }
    } catch (error: any) {
      console.error('[AuthContext] Signup exception:', error);
      setError(error.message || 'Signup failed');
      setIsLoading(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [supabase.auth]);

    const loginWithGoogle = useCallback(async () => {
    console.log('[AuthContext] Google login initiated');
    setError(null);

    try {
      // Use production URL from environment variable or fallback to current origin
      const origin = typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SITE_URL || "https://yup.rsvp";
      const redirectTo = `${origin}/auth/callback`;

      console.log('[AuthContext] Google login redirect URL:', redirectTo);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('[AuthContext] Google login error:', error);
        setError(error.message);
        throw error;
      }

      console.log('[AuthContext] Google OAuth redirect initiated successfully');
      // Don't set loading here as the redirect will happen
    } catch (error: any) {
      console.error('[AuthContext] Google login exception:', error);
      setError(error.message || 'Google sign-in failed');
      throw error;
    }
  }, [supabase.auth]);

  const resetPassword = useCallback(async (email: string) => {
    console.log('[AuthContext] Password reset requested for:', email);
    setError(null);

    try {
      // Get redirect URL for password reset
      const origin = typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SITE_URL || "https://yup.rsvp";
      const redirectTo = `${origin}/auth/callback`;

      console.log('[AuthContext] Password reset redirect URL:', redirectTo);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        console.error('[AuthContext] Password reset error:', error);
        setError(error.message);
        throw error;
      }

      console.log('[AuthContext] Password reset email sent successfully');
    } catch (error: any) {
      console.error('[AuthContext] Password reset exception:', error);
      setError(error.message || 'Password reset failed');
      throw error;
    }
  }, [supabase.auth]);

  const signOut = useCallback(async () => {
    try {
      console.log('[AuthContext] Signing out...');
      setIsLoading(true);
      await supabase.auth.signOut();
    } catch (error) {
      console.error('[AuthContext] Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase.auth]);

  // --- NEW: refreshUser helper ---
  const refreshUser = useCallback(async () => {
    console.log('[AuthContext] Refreshing user with fresh profile data...');
    setIsLoading(true);
    try {
      const { data: { user: freshUser }, error: refreshError } = await supabase.auth.getUser();
      if (refreshError) {
        console.error('[AuthContext] refreshUser error:', refreshError);
        setError(refreshError.message);
      } else {
        // Force fresh profile data fetch (don't use cached data)
        const mergedUser = await attachProfileData(freshUser);
        console.log('[AuthContext] Refreshed user data:', {
          id: mergedUser?.id,
          is_premium: (mergedUser as any)?.is_premium,
          is_pro: (mergedUser as any)?.is_pro,
        });
        setUser(mergedUser);
        setError(null);
      }
    } catch (e: any) {
      console.error('[AuthContext] refreshUser exception:', e);
      setError(e.message || 'Failed to refresh user');
    } finally {
      setIsLoading(false);
    }
  }, [supabase.auth]);

  const refreshSession = useCallback(async () => {
    try {
      console.log('[AuthContext] Manually refreshing session...');
      
      // Don't show loading state for manual refresh to avoid flicker
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('[AuthContext] Error refreshing session:', error);
        return;
      }
      
      if (session?.user) {
        // Quick check - if user ID matches, just restore without profile fetch to avoid delay
        if (user?.id === session.user.id) {
          setSession(session);
          console.log('[AuthContext] Session restored for existing user');
        } else {
          const mergedUser = await attachProfileData(session.user);
          setUser(mergedUser);
          setSession(session);
          console.log('[AuthContext] Session refreshed with new user data');
        }
      } else {
        setUser(null);
        setSession(null);
        console.log('[AuthContext] No session found during refresh');
      }
    } catch (error) {
      console.error('[AuthContext] Failed to refresh session:', error);
    }
  }, [user?.id]);

  const value = useMemo(() => ({
    user,
    session,
    isLoading,
    error,
    login,
    signup,
    loginWithGoogle,
    resetPassword,
    logout: signOut,
    signOut,
    refreshUser,
    refreshSession,
  }), [user, session, isLoading, error, login, signup, loginWithGoogle, resetPassword, signOut, refreshUser, refreshSession]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
