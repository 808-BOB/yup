import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { apiRequest } from "@/lib/queryClient";
import { type User } from "@shared/schema";

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
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const userData = await apiRequest<User>("GET", "/api/auth/me", undefined, { credentials: 'include' });
        setUser(userData);
      } catch (err) {
        // User is not logged in, that's okay
        console.log("Not logged in");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const userData = await apiRequest<User>("POST", "/api/auth/login", {
        username,
        password,
      });

      setUser(userData);
    } catch (err) {
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

  const logout = async () => {
    setIsLoading(true);

    try {
      await apiRequest("POST", "/api/auth/logout");
      setUser(null);
    } catch (err) {
      setError("Failed to logout");
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
