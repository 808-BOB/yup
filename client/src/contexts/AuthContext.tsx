import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { apiRequest } from "@/lib/queryClient";
import { type User } from "@shared/schema";
import { 
  signInWithGoogle, 
  signInWithApple, 
  signOut, 
  onAuthStateChange
} from "@/lib/firebase";
import { User as FirebaseUser } from "firebase/auth";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  signup: (
    username: string,
    displayName: string,
    password: string,
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

  // Check for traditional session auth on startup
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try to get user from traditional auth
        const userData = await apiRequest<User>("GET", "/api/auth/me", undefined, { credentials: 'include' });
        setUser(userData);
        console.log("User session found:", userData?.username);
      } catch (err) {
        // User is not logged in
        setUser(null);
        console.log("Not logged in");
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Sync Firebase user data with our backend
  const syncUserWithBackend = async (firebaseUser: FirebaseUser) => {
    try {
      setIsLoading(true);
      // Send Firebase token to backend to verify and create/update user
      const idToken = await firebaseUser.getIdToken();
      
      // Call our backend to handle the Firebase token
      const userData = await apiRequest<User>("POST", "/api/auth/firebase", {
        idToken,
        displayName: firebaseUser.displayName || 'User',
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL,
        uid: firebaseUser.uid,
        provider: firebaseUser.providerData[0]?.providerId
      });
      
      setUser(userData);
    } catch (err) {
      console.error("Error syncing with backend:", err);
      setError("Failed to authenticate with server");
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    console.log("AuthContext: Attempting login with username:", username);

    try {
      // Simple direct endpoint call with debug logging
      console.log("Sending login request to /api/auth/login");
      
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include"
      });
      
      console.log("Login response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Login failed:", response.status, errorText);
        throw new Error(`${response.status}: ${errorText}`);
      }
      
      const userData = await response.json();
      console.log("AuthContext: Login successful, user data:", userData);
      setUser(userData);
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
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const userData = await apiRequest<User>("POST", "/api/auth/signup", {
        username,
        displayName,
        password,
      });

      setUser(userData);
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
      await signInWithGoogle();
      // User state will be updated by the auth state listener
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
      await signInWithApple();
      // User state will be updated by the auth state listener
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
      // First try to sign out from Firebase
      await signOut();
      
      // Also sign out from our backend session
      await apiRequest("POST", "/api/auth/logout");
      
      // Clear user state
      setUser(null);
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
