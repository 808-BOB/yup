"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "./supabase";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";

interface UserProfile {
  id: string;
  username?: string;
  display_name?: string;
  email?: string;
  phone_number?: string;
  profile_image_url?: string;
  is_premium?: boolean;
  is_admin?: boolean;
  is_pro?: boolean;
  // Legacy branding fields
  brand_theme?: string;
  logo_url?: string;
  // New comprehensive branding fields
  brand_primary_color?: string;
  brand_secondary_color?: string;
  brand_tertiary_color?: string;
  custom_yup_text?: string;
  custom_nope_text?: string;
  custom_maybe_text?: string;
}

interface AuthContextValue {
  user: (SupabaseAuthUser & UserProfile) | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (username: string, displayName: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<(SupabaseAuthUser & UserProfile) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simple fetch user profile without auto-creation
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    console.log("[Auth] fetchUserProfile →", userId);
    
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('[Auth] fetchUserProfile error', error);
        return null;
      }

      console.log('[Auth] fetchUserProfile result', profile);
      return profile;
    } catch (err) {
      console.error('[Auth] fetchUserProfile exception:', err);
      return null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    const init = async () => {
      console.log('[Auth] init - checking existing session');
      
      try {
        const { data } = await supabase.auth.getSession();
        console.log('[Auth] init session data', data);
        
        if (data.session?.user) {
          const profile = await fetchUserProfile(data.session.user.id);
          
          if (profile) {
            setUser({ ...data.session.user, ...profile });
          } else {
            // No profile yet, but user is authenticated
            console.log('[Auth] No profile found, user needs setup');
            setUser({ 
              ...data.session.user, 
              id: data.session.user.id,
              email: data.session.user.email,
              is_premium: false,
              is_admin: false,
              is_pro: false,
            });
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('[Auth] init error:', err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    init();

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] onAuthStateChange', event, session?.user?.id);
      
      if (session?.user) {
        // Give a small delay for profile creation to complete
        if (event === 'SIGNED_IN') {
          setTimeout(async () => {
            const profile = await fetchUserProfile(session.user.id);
            
            if (profile) {
              setUser({ ...session.user, ...profile });
            } else {
              setUser({ 
                ...session.user, 
                id: session.user.id,
                email: session.user.email,
                is_premium: false,
                is_admin: false,
                is_pro: false,
              });
            }
          }, 1000); // 1 second delay for profile creation
        } else {
          const profile = await fetchUserProfile(session.user.id);
          
          if (profile) {
            setUser({ ...session.user, ...profile });
          } else {
            setUser({ 
              ...session.user, 
              id: session.user.id,
              email: session.user.email,
              is_premium: false,
              is_admin: false,
              is_pro: false,
            });
          }
        }
      } else {
        setUser(null);
      }
      
      setIsLoading(false);
    });
    
    return () => listener?.subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    console.log('[Auth] login attempt', email);
    setIsLoading(true);
    setError(null);
    
    try {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (signInErr) throw signInErr;
      console.log('[Auth] login success');
      
    } catch (err: any) {
      console.error('[Auth] login error', err);
      setError(err.message || "Login failed");
      setIsLoading(false);
      throw err;
    }
  };

  const logout = async () => {
    console.log('[Auth] logout attempt');
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (err: any) {
      console.error('[Auth] logout error', err);
      setError(err.message || "Logout failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (username: string, displayName: string, password: string) => {
    console.log('[Auth] signup attempt', username);
    setIsLoading(true);
    setError(null);
    
    try {
      const email = username.includes("@") ? username : `${username}@example.com`;
      console.log('[Auth] signup using email', email);

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username, display_name: displayName } },
      });
      
      if (error) throw error;
      
    } catch (err: any) {
      console.error('[Auth] signup error', err);
      setError(err.message || "Signup failed");
      setIsLoading(false);
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    console.log('[Auth] loginWithGoogle initiating');
    setIsLoading(true);
    setError(null);
    
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
      console.log('[Auth] loginWithGoogle origin', origin);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      });
      
      if (error) throw error;
      console.log('[Auth] OAuth redirect initiated');
    } catch (err: any) {
      console.error('[Auth] loginWithGoogle error', err);
      setError(err.message || "Google sign-in failed");
      setIsLoading(false);
      throw err;
    }
  };

  const refreshUser = async () => {
    if (!user) return;

    console.log('[Auth] refreshUser called for user:', user.id);
    
    try {
      const profile = await fetchUserProfile(user.id);
      
      if (profile) {
        setUser({ ...user, ...profile });
        console.log('[Auth] User refreshed successfully');
      }
    } catch (error) {
      console.error('[Auth] Error refreshing user:', error);
    }
  };

  const value: AuthContextValue = { 
    user, 
    isLoading, 
    error, 
    login, 
    signup, 
    loginWithGoogle, 
    logout, 
    refreshUser 
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
