import { supabase } from "@/lib/supabase";
import type { Event, InsertEvent } from "@shared/schema";

function handle<T>(data: T | null, error: any): T {
  if (error) throw error;
  return data as T;
}

export const eventService = {
  // Get all events
  getAllEvents: async (): Promise<Event[]> => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });
    return handle(data, error);
  },

  // Alias for getAllEvents (used by frontend hooks)
  getEvents: (): Promise<Event[]> => {
    return eventService.getAllEvents();
  },

  // Get single event by ID
  getEvent: async (id: number): Promise<Event> => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();
    return handle(data, error);
  },

  // Get event by slug
  getEventBySlug: async (slug: string): Promise<Event> => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("slug", slug)
      .single();
    return handle(data, error);
  },

  // Create new event
  createEvent: async (eventData: InsertEvent): Promise<Event> => {
    const { data, error } = await supabase
      .from("events")
      .insert(eventData)
      .select()
      .single();
    return handle(data, error);
  },

  // Update existing event
  updateEvent: async (id: number, eventData: Partial<InsertEvent>): Promise<Event> => {
    const { data, error } = await supabase
      .from("events")
      .update(eventData)
      .eq("id", id)
      .select()
      .single();
    return handle(data, error);
  },

  // Delete event
  deleteEvent: async (id: number): Promise<{ message: string }> => {
    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return { message: "Deleted" };
  },

  // Get user's events
  getUserEvents: async (userId: string): Promise<Event[]> => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("host_id", userId)
      .order("created_at", { ascending: false });
    return handle(data, error);
  },

  // Get my events (current user's events)
  getMyEvents: async (): Promise<Event[]> => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw new Error("Not logged in");
    return eventService.getUserEvents(data.user.id);
  },

  // Get events user is invited to
  getUserInvites: async (userId: string): Promise<Event[]> => {
    const { data, error } = await supabase
      .from("invitations")
      .select("events(*)")
      .eq("user_id", userId);

    const events = (data ?? [])
      .map((i: any) => i.events)
      .filter((e: any) => e && e.host_id !== userId);

    return handle(events, error);
  },

  // Get event connections (LinkedIn)
  getEventConnections: (id: number): Promise<any> => {
    // placeholder – not yet migrated
    return Promise.resolve([]);
  }
};