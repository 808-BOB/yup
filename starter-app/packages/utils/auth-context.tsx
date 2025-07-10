"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabase';

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
  signup: (username: string, displayName: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>; // alias for signOut (legacy)
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  console.log('🚀 [AuthProvider] Component mounting...');
  
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  console.log('🔧 [AuthProvider] Creating Supabase client...');
  let supabase;
  try {
    supabase = getSupabaseClient();
    console.log('✅ [AuthProvider] Supabase client created successfully');
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
      
      // Add timeout to profile query
      const profilePromise = supabase
        .from('users')
        .select('display_name, profile_image_url, phone_number, is_premium, is_pro, is_admin')
        .eq('id', authUser.id)
        .single();
        
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile query timeout')), 5000);
      });

      const { data: profile, error } = await Promise.race([profilePromise, timeoutPromise]) as any;

      if (error) {
        console.warn('[AuthContext] No profile row found / error fetching profile:', error.message);
        return authUser as User & ExtendedProfile;
      }

      console.log('[AuthContext] Profile data fetched successfully:', profile);
      return { ...authUser, ...profile } as User & ExtendedProfile;
    } catch (err) {
      console.error('[AuthContext] Failed to load profile row:', err);
      return authUser as User & ExtendedProfile;
    }
  };

  useEffect(() => {
    // Handle initial session and OAuth callbacks
    const getInitialSession = async () => {
      try {
        console.log('[AuthContext] Getting initial session...');
        
        // Add a timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Auth initialization timeout')), 10000);
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
      } finally {
        console.log('[AuthContext] Setting isLoading to false');
        setIsLoading(false);
      }
    };

    console.log('[AuthContext] Starting auth initialization...');
    getInitialSession();

    // Listen for auth changes (including OAuth completion)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthContext] Auth state changed:', event, !!session, session?.user?.email);
        
        setSession(session);
        const mergedUser = await attachProfileData(session?.user ?? null);
        setUser(mergedUser);
        setIsLoading(false);
        setError(null);
        
        // Log successful OAuth completion
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('[AuthContext] User signed in successfully:', session.user.email);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const login = async (email: string, password: string) => {
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
  };

  const signup = async (username: string, displayName: string, password: string) => {
    console.log('[AuthContext] Signup attempt:', username);
    setIsLoading(true);
    setError(null);
    
    try {
      const email = username.includes("@") ? username : `${username}@example.com`;
      console.log('[AuthContext] Signup using email:', email);

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { 
          data: { 
            username, 
            display_name: displayName 
          } 
        },
      });
      
      if (signUpError) {
        console.error('[AuthContext] Signup error:', signUpError);
        setError(signUpError.message);
        throw signUpError;
      }
      
      console.log('[AuthContext] Signup successful');
    } catch (error: any) {
      console.error('[AuthContext] Signup exception:', error);
      setError(error.message || 'Signup failed');
      setIsLoading(false);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
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
  };

  const signOut = async () => {
    try {
      console.log('[AuthContext] Signing out...');
      setIsLoading(true);
      await supabase.auth.signOut();
    } catch (error) {
      console.error('[AuthContext] Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- NEW: refreshUser helper ---
  const refreshUser = async () => {
    console.log('[AuthContext] Refreshing user…');
    setIsLoading(true);
    try {
      const { data: { user: freshUser }, error: refreshError } = await supabase.auth.getUser();
      if (refreshError) {
        console.error('[AuthContext] refreshUser error:', refreshError);
        setError(refreshError.message);
      } else {
        const mergedUser = await attachProfileData(freshUser);
        setUser(mergedUser);
        setError(null);
      }
    } catch (e: any) {
      console.error('[AuthContext] refreshUser exception:', e);
      setError(e.message || 'Failed to refresh user');
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    session,
    isLoading,
    error,
    login,
    signup,
    loginWithGoogle,
    logout: signOut,
    signOut,
    refreshUser,
  };

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
