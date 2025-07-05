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

  // Fetch user profile data including premium status
  const fetchUserProfile = async (userId: string) => {
    console.log("[Auth] fetchUserProfile →", userId);
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) {
      console.error('[Auth] fetchUserProfile error', error);
    } else {
      console.log('[Auth] fetchUserProfile result', profile);
    }

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return profile;
  };

  // Hydrate from local session on first load
  useEffect(() => {
    const init = async () => {
      console.log('[Auth] init - checking existing session');
      const { data } = await supabase.auth.getSession();
      console.log('[Auth] init session data', data);
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
      console.log('[Auth] onAuthStateChange', _event, session);
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
    console.log('[Auth] login attempt', email);
    setIsLoading(true);
    try {
      const { error: signInErr, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInErr) throw signInErr;
      console.log('[Auth] login success - user', data.user);

      const profile = await fetchUserProfile(data.user!.id);
      setUser({ ...data.user, ...profile });
      console.log('[Auth] redirecting to /my-events');
      if (typeof window !== 'undefined') {
        window.location.href = '/my-events';
      }
    } catch (err: any) {
      console.error('[Auth] login error', err);
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
    console.log('[Auth] signup attempt', username);
    setIsLoading(true);
    try {
      // For demo we use username as email if it contains @ else append placeholder domain
      const email = username.includes("@") ? username : `${username}@example.com`;
      console.log('[Auth] signup using email', email);

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
      console.log('[Auth] signup success - redirecting to /my-events');
      if (typeof window !== 'undefined') {
        window.location.href = '/my-events';
      }
    } catch (err: any) {
      console.error('[Auth] signup error', err);
      setError(err.message || "Signup failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    console.log('[Auth] loginWithGoogle initiating');
    setIsLoading(true);
    try {
      const origin =
        typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL;
      console.log('[Auth] loginWithGoogle origin', origin);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      });
      if (error) throw error;
      console.log('[Auth] signInWithOAuth triggered, awaiting redirect');
    } catch (err: any) {
      console.error('[Auth] loginWithGoogle error', err);
      setError(err.message || "Google sign-in failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    if (!user) return;
    console.log('[Auth] refreshUser called');
    const profile = await fetchUserProfile(user.id);
    if (profile) {
      setUser({ ...user, ...profile });
      console.log('[Auth] refreshUser completed');
    }
  };

  const value: AuthContextValue = { user, isLoading, error, login, signup, loginWithGoogle, logout, refreshUser };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
