import { apiRequest } from "@/lib/queryClient";
import type { Event, InsertEvent } from "@shared/schema";

export const eventService = {
  // Get all events
  getAllEvents: (): Promise<Event[]> => {
    return apiRequest("GET", "/api/events");
  },

  // Get single event by ID
  getEvent: (id: number): Promise<Event> => {
    return apiRequest("GET", `/api/events/${id}`);
  },

  // Get event by slug
  getEventBySlug: (slug: string): Promise<Event> => {
    return apiRequest("GET", `/api/events/slug/${slug}`);
  },

  // Create new event
  createEvent: (eventData: InsertEvent): Promise<Event> => {
    return apiRequest("POST", "/api/events", eventData);
  },

  // Update existing event
  updateEvent: (id: number, eventData: Partial<InsertEvent>): Promise<Event> => {
    return apiRequest("PUT", `/api/events/${id}`, eventData);
  },

  // Delete event
  deleteEvent: (id: number): Promise<{ message: string }> => {
    return apiRequest("DELETE", `/api/events/${id}`);
  },

  // Get user's events
  getUserEvents: (userId: string): Promise<Event[]> => {
    return apiRequest("GET", `/api/users/${userId}/events`);
  },

  // Get events user is invited to
  getUserInvites: (userId: string): Promise<Event[]> => {
    return apiRequest("GET", `/api/users/${userId}/invites`);
  },

  // Get event connections (LinkedIn)
  getEventConnections: (id: number): Promise<any> => {
    return apiRequest("GET", `/api/events/${id}/connections`);
  }
};