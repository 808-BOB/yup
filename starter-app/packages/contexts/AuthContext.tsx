import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { apiRequest } from "@/lib/queryClient";
import { type User } from "@/types";
import { supabase } from "@/lib/supabase";
import { useLocation } from "wouter";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  signup: (
    username: string,
    displayName: string,
    password: string,
    phoneNumber?: string,
    email?: string,
  ) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  // Initial load: hydrate user from persisted session
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: profileRow, error: profileErr } = await supabase
          .from("users")
          .select("*")
          .eq("id", data.session.user.id)
          .single();

        if (profileErr && profileErr.code === "PGRST116") {
          // Profile row missing — create it
          const defaultUsername = data.session.user.email?.split("@")[0] ?? data.session.user.id.slice(0, 8);
          const { data: inserted } = await supabase
            .from("users")
            .insert({
              id: data.session.user.id,
              username: defaultUsername,
              display_name: data.session.user.user_metadata.full_name ?? defaultUsername,
              email: data.session.user.email,
            })
            .select()
            .single();
          setUser(inserted as User);
        } else {
          setUser(profileRow as User);
        }
      } finally {
        setIsLoading(false);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Supabase listener to keep profile in sync
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // fetch profile row from backend (or directly from Supabase if you expose RLS)
        try {
          const { data: profileRow, error: profileErr } = await supabase
            .from("users")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (profileErr && profileErr.code === "PGRST116") {
            // No profile yet – create one
            const defaultUsername = session.user.email?.split("@")[0] ?? session.user.id.slice(0, 8);
            const { data: inserted } = await supabase
              .from("users")
              .insert({
                id: session.user.id,
                username: defaultUsername,
                display_name: session.user.user_metadata.full_name ?? defaultUsername,
                email: session.user.email,
              })
              .select()
              .single();
            setUser(inserted as User);
            // Do not force redirect; stay on current page
          } else {
            setUser(profileRow as User);
          }
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      let signInEmail = username;
      if (!signInEmail.includes("@")) {
        // treat as username, resolve to email
        const { data: row, error: uErr } = await supabase
          .from("users")
          .select("email")
          .eq("username", signInEmail)
          .single();

        if (uErr || !row?.email) {
          setError("User not found");
          return;
        }
        signInEmail = row.email;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: signInEmail,
        password,
      });
      if (error) throw error;

      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", data.user!.id)
        .single();

      setUser(profile as User);
      setLocation("/my-events");
    } catch (err) {
      console.error("AuthContext: Login error:", err instanceof Error ? err.message : err);
      setError("Invalid username or password");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (
    username: string,
    displayName: string,
    password: string,
    phoneNumber?: string,
    email?: string,
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. create auth user
      const { data, error } = await supabase.auth.signUp({
        email: email!,
        password,
        options: {
          data: { username, display_name: displayName, phone_number: phoneNumber },
        },
      });
      if (error) throw error;

      // 2. insert profile row (will succeed via RLS)
      const { data: profile } = await supabase
        .from("users")
        .insert({
          id: data.user!.id,
          username,
          display_name: displayName,
          email,
          phone_number: phoneNumber,
        })
        .select()
        .single();

      setUser(profile as User);
      setLocation("/my-events");
    } catch (err) {
      setError("Failed to create account. Username may already be taken.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
      if (error) throw error;
    } catch (err) {
      console.error("Google sign-in error:", err);
      setError("Failed to sign in with Google");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithApple = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: "apple" });
      if (error) throw error;
    } catch (err) {
      console.error("Apple sign-in error:", err);
      setError("Failed to sign in with Apple");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Logout error:", err);
      setError("Failed to logout");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Method to refresh user data from the server
  const refreshUser = async () => {
    setIsLoading(true);
    
    try {
      const userData = await apiRequest<User>("GET", "/api/auth/me", undefined, { credentials: 'include' });
      setUser(userData);
      setLocation("/my-events");
    } catch (err) {
      // If we can't get the user data, they might be logged out
      setUser(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        signup,
        loginWithGoogle,
        loginWithApple,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
