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

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in, sync with our backend
        await syncUserWithBackend(firebaseUser);
      } else {
        // Try to get user from traditional auth
        try {
          const userData = await apiRequest<User>("GET", "/api/auth/me", undefined, { credentials: 'include' });
          setUser(userData);
        } catch (err) {
          // User is not logged in with either method
          setUser(null);
          console.log("Not logged in");
        } finally {
          setIsLoading(false);
        }
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
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
      // Make sure we're using the correct endpoint with proper credentials
      const userData = await apiRequest<User>(
        "POST", 
        "/api/auth/login", 
        { username, password },
        { credentials: 'include' }
      );
      
      console.log("AuthContext: Login successful, user data:", userData);
      setUser(userData);
    } catch (err) {
      console.error("AuthContext: Login error:", err);
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
