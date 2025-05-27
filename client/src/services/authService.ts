import { apiRequest } from "@/lib/queryClient";
import type { User, InsertUser } from "@shared/schema";

export const authService = {
  // User registration
  register: (userData: InsertUser): Promise<{ user: User; message: string }> => {
    return apiRequest("POST", "/api/auth/register", userData);
  },

  // User login
  login: (credentials: { username: string; password: string }): Promise<{ user: User; message: string }> => {
    return apiRequest("POST", "/api/auth/login", credentials);
  },

  // User logout
  logout: (): Promise<{ message: string }> => {
    return apiRequest("POST", "/api/auth/logout");
  },

  // Get current user session
  getCurrentUser: (): Promise<User> => {
    return apiRequest("GET", "/api/auth/me");
  },

  // Password reset request
  requestPasswordReset: (email: string): Promise<{ message: string }> => {
    return apiRequest("POST", "/api/auth/forgot-password", { email });
  },

  // Reset password with token
  resetPassword: (token: string, password: string): Promise<{ message: string }> => {
    return apiRequest("POST", "/api/auth/reset-password", { token, password });
  }
};