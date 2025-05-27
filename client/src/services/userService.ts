import { apiRequest } from "@/lib/queryClient";
import type { User, InsertUser } from "@shared/schema";

export const userService = {
  // Get user profile
  getUser: (id: string): Promise<User> => {
    return apiRequest("GET", `/api/users/${id}`);
  },

  // Update user profile
  updateUser: (id: string, userData: Partial<InsertUser>): Promise<User> => {
    return apiRequest("PUT", `/api/users/${id}`, userData);
  },

  // Update user branding
  updateUserBranding: (id: string, branding: { brandTheme?: string; logoUrl?: string }): Promise<User> => {
    return apiRequest("PUT", `/api/users/${id}/branding`, branding);
  },

  // Get user's subscription status
  getUserSubscription: (id: string): Promise<any> => {
    return apiRequest("GET", `/api/users/${id}/subscription`);
  }
};