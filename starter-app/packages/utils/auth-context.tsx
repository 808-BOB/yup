"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "./supabase";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";

interface UserProfile {
  id: string;
  username?: string;
  display_name?: string;
  email?: string;
  profile_image_url?: string;
  is_premium?: boolean;
  is_admin?: boolean;
}

interface AuthContextValue {
  user: (SupabaseAuthUser & UserProfile) | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (username: string, displayName: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<(SupabaseAuthUser & UserProfile) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile data including premium status
  const fetchUserProfile = async (userId: string) => {
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    
    return profile;
  };

  // Hydrate from local session on first load
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        const profile = await fetchUserProfile(data.session.user.id);
        setUser({ ...data.session.user, ...profile });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };
    init();

    // Subscribe to auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setUser({ ...session.user, ...profile });
      } else {
        setUser(null);
      }
    });
    return () => listener?.subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error: signInErr, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInErr) throw signInErr;
      
      const profile = await fetchUserProfile(data.user!.id);
      setUser({ ...data.user, ...profile });
      // Redirect to my-events after successful login
      if (typeof window !== 'undefined') {
        window.location.href = '/my-events';
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const signup = async (username: string, displayName: string, password: string) => {
    setIsLoading(true);
    try {
      // For demo we use username as email if it contains @ else append placeholder domain
      const email = username.includes("@") ? username : `${username}@example.com`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username, display_name: displayName } },
      });
      if (error) throw error;

      // Insert profile row (RLS will allow)
      const { data: profile, error: profileError } = await supabase.from("users").insert({
        id: data.user!.id,
        username,
        display_name: displayName,
        email,
        is_premium: false, // Default to non-premium
        is_admin: false, // Default to non-admin
      }).select().single();

      if (profileError) throw profileError;

      setUser({ ...data.user, ...profile });
      // Redirect to my-events after successful signup
      if (typeof window !== 'undefined') {
        window.location.href = '/my-events';
      }
    } catch (err: any) {
      setError(err.message || "Signup failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      const origin =
        typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || "Google sign-in failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextValue = { user, isLoading, error, login, signup, loginWithGoogle, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
} 