import { apiRequest } from "@/lib/queryClient";
import type { Response, InsertResponse } from "@shared/schema";

export const responseService = {
  // Get responses for an event
  getEventResponses: (eventId: number): Promise<Response[]> => {
    return apiRequest("GET", `/api/events/${eventId}/responses`);
  },

  // Create or update RSVP response
  createResponse: (responseData: InsertResponse): Promise<Response> => {
    return apiRequest("POST", "/api/responses", responseData);
  },

  // Update existing response
  updateResponse: (id: number, responseData: Partial<InsertResponse>): Promise<Response> => {
    return apiRequest("PUT", `/api/responses/${id}`, responseData);
  },

  // Delete response
  deleteResponse: (id: number): Promise<{ message: string }> => {
    return apiRequest("DELETE", `/api/responses/${id}`);
  },

  // Get user's response for a specific event
  getUserEventResponse: (userId: string, eventId: number): Promise<Response | null> => {
    return apiRequest("GET", `/api/users/${userId}/events/${eventId}/response`);
  }
};