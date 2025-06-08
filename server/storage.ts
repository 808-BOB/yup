import {
  type User,
  type InsertUser,
  type UpsertUser,
  type Event,
  type InsertEvent,
  type Response,
  type InsertResponse,
} from "@shared/schema";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_PROJECT_URL!,
  process.env.SUPABASE_API_KEY!
);

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByLinkedInId(linkedin_id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, userData: Partial<User>): Promise<User | undefined>;
  updateUserBranding(id: string, brandData: { brand_theme?: string, logo_url?: string }): Promise<User | undefined>;
  updateUserLinkedIn(id: string, linkedinData: { 
    linkedin_id?: string, 
    linkedin_access_token?: string, 
    linkedin_profile_url?: string, 
    linkedin_connections?: string 
  }): Promise<User | undefined>;
  updateStripeCustomerId(userId: string, customerId: string): Promise<User | undefined>;
  updateStripeSubscriptionId(userId: string, subscriptionId: string): Promise<User | undefined>;
  updateUserStripeInfo(userId: string, stripeData: { 
    stripe_customer_id?: string, 
    stripe_subscription_id?: string 
  }): Promise<User | undefined>;
  getUserByStripeCustomerId(customerId: string): Promise<User | undefined>;

  // Event operations
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, eventUpdate: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;
  getEvent(id: number): Promise<Event | undefined>;
  getEventBySlug(slug: string): Promise<Event | undefined>;
  getUserEvents(userId: string): Promise<Event[]>;
  getAllEvents(): Promise<Event[]>;

  // Invitation operations
  createInvitation(eventId: number, userId: string): Promise<void>;
  getEventInvitations(eventId: number): Promise<string[]>;
  getEventsUserInvitedTo(userId: string): Promise<Event[]>;

  // Response operations
  createResponse(response: InsertResponse): Promise<Response>;
  getResponsesByEvent(eventId: number): Promise<Response[]>;
  getUserEventResponse(eventId: number, userId: string | null): Promise<Response | undefined>;
  getEventResponses(eventId: number): Promise<{ yupCount: number; nopeCount: number; maybeCount: number }>;
  getResponseById(id: number): Promise<Response | undefined>;
  updateResponse(id: number, responseUpdate: Partial<InsertResponse>): Promise<Response | undefined>;
  deleteResponse(id: number): Promise<void>;

  // Count operations
  getUserCount(): Promise<number>;
  getEventCount(): Promise<number>;
  getResponseCount(): Promise<number>;
}

// Supabase Storage Implementation
class SupabaseStorage implements IStorage {

  async getUser(id: string): Promise<User | undefined> {
    const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
    if (error) return undefined;
    return data || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabase.from('users').select('*').eq('username', username).single();
    if (error) return undefined;
    return data || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await supabase.from('users').select('*').eq('email', email).single();
    if (error) return undefined;
    return data || undefined;
  }

  async getUserByLinkedInId(linkedinId: string): Promise<User | undefined> {
    const { data, error } = await supabase.from('users').select('*').eq('linkedin_id', linkedinId).single();
    if (error) return undefined;
    return data || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const { data, error } = await supabase.from('users').insert(insertUser).select().single();
    if (error) throw new Error(`Failed to create user: ${error.message}`);
    return data;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const { data, error } = await supabase.from('users').upsert(userData).select().single();
    if (error) throw new Error(`Failed to upsert user: ${error.message}`);
    return data;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User | undefined> {
    const { data, error } = await supabase.from('users').update(userData).eq('id', id).select().single();
    if (error) return undefined;
    return data || undefined;
  }

  async updateUserBranding(id: string, brandData: { brand_theme?: string, logo_url?: string }): Promise<User | undefined> {
    const { data, error } = await supabase.from('users').update(brandData).eq('id', id).select().single();
    if (error) return undefined;
    return data || undefined;
  }

  async updateStripeCustomerId(userId: string, customerId: string): Promise<User | undefined> {
    const { data, error } = await supabase.from('users').update({ stripe_customer_id: customerId }).eq('id', userId).select().single();
    if (error) return undefined;
    return data || undefined;
  }

  async updateStripeSubscriptionId(userId: string, subscriptionId: string): Promise<User | undefined> {
    const { data, error } = await supabase.from('users').update({ stripe_subscription_id: subscriptionId }).eq('id', userId).select().single();
    if (error) return undefined;
    return data || undefined;
  }

  async updateUserStripeInfo(userId: string, stripeData: { stripe_customer_id?: string, stripe_subscription_id?: string }): Promise<User | undefined> {
    const { data, error } = await supabase.from('users').update(stripeData).eq('id', userId).select().single();
    if (error) return undefined;
    return data || undefined;
  }

  async getUserByStripeCustomerId(customerId: string): Promise<User | undefined> {
    const { data, error } = await supabase.from('users').select('*').eq('stripe_customer_id', customerId).single();
    if (error) return undefined;
    return data || undefined;
  }

  async updateUserLinkedIn(id: string, linkedinData: { linkedin_id?: string, linkedin_access_token?: string, linkedin_profile_url?: string, linkedin_connections?: string }): Promise<User | undefined> {
    const { data, error } = await supabase.from('users').update(linkedinData).eq('id', id).select().single();
    if (error) return undefined;
    return data || undefined;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const { data, error } = await supabase.from('events').insert(event).select().single();
    if (error) throw new Error(`Failed to create event: ${error.message}`);
    return data;
  }

  async updateEvent(id: number, eventUpdate: Partial<InsertEvent>): Promise<Event | undefined> {
    const { data, error } = await supabase.from('events').update(eventUpdate).eq('id', id).select().single();
    if (error) return undefined;
    return data || undefined;
  }

  async deleteEvent(id: number): Promise<boolean> {
    const { error } = await supabase.from('events').delete().eq('id', id);
    return !error;
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const { data, error } = await supabase.from('events').select('*').eq('id', id).single();
    if (error) return undefined;
    return data || undefined;
  }

  async getEventBySlug(slug: string): Promise<Event | undefined> {
    const { data, error } = await supabase.from('events').select('*').eq('slug', slug).single();
    if (error) return undefined;
    return data || undefined;
  }

  async getUserEvents(userId: string): Promise<Event[]> {
    const { data, error } = await supabase.from('events').select('*').eq('host_id', userId);
    if (error) return [];
    return data || [];
  }

  async createInvitation(eventId: number, userId: string): Promise<void> {
    await supabase.from('invitations').insert({ event_id: eventId, user_id: userId });
  }

  async getEventInvitations(eventId: number): Promise<string[]> {
    const { data, error } = await supabase.from('invitations').select('user_id').eq('event_id', eventId);
    if (error) return [];
    return data?.map((inv: any) => inv.user_id) || [];
  }

  async getEventsUserInvitedTo(userId: string): Promise<Event[]> {
    const { data, error } = await supabase
      .from('invitations')
      .select('events(*)')
      .eq('user_id', userId);
    if (error) return [];
    return data?.map((inv: any) => inv.events).filter(Boolean) || [];
  }

  async getAllEvents(): Promise<Event[]> {
    const { data, error } = await supabase.from('events').select('*');
    if (error) return [];
    return data || [];
  }

  async createResponse(response: InsertResponse): Promise<Response> {
    const { data, error } = await supabase.from('responses').insert(response).select().single();
    if (error) throw new Error(`Failed to create response: ${error.message}`);
    return data;
  }

  async getResponsesByEvent(eventId: number): Promise<Response[]> {
    const { data, error } = await supabase.from('responses').select('*').eq('event_id', eventId);
    if (error) return [];
    return data || [];
  }

  async getUserEventResponse(eventId: number, userId: string | null): Promise<Response | undefined> {
    if (!userId) return undefined;
    const { data, error } = await supabase.from('responses').select('*').eq('event_id', eventId).eq('user_id', userId).single();
    if (error) return undefined;
    return data || undefined;
  }

  async getEventResponses(eventId: number): Promise<{ yupCount: number; nopeCount: number; maybeCount: number }> {
    const { data, error } = await supabase.from('responses').select('response_type').eq('event_id', eventId);
    
    if (error) return { yupCount: 0, nopeCount: 0, maybeCount: 0 };
    
    const yupCount = data?.filter((r: any) => r.response_type === 'yup').length || 0;
    const nopeCount = data?.filter((r: any) => r.response_type === 'nope').length || 0;
    const maybeCount = data?.filter((r: any) => r.response_type === 'maybe').length || 0;
    
    return { yupCount, nopeCount, maybeCount };
  }

  async getResponseById(id: number): Promise<Response | undefined> {
    const { data, error } = await supabase.from('responses').select('*').eq('id', id).single();
    if (error) return undefined;
    return data || undefined;
  }

  async updateResponse(id: number, responseUpdate: Partial<InsertResponse>): Promise<Response | undefined> {
    const { data, error } = await supabase.from('responses').update(responseUpdate).eq('id', id).select().single();
    if (error) return undefined;
    return data || undefined;
  }

  async deleteResponse(id: number): Promise<void> {
    await supabase.from('responses').delete().eq('id', id);
  }

  async getUserCount(): Promise<number> {
    const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true });
    if (error) return 0;
    return count || 0;
  }

  async getEventCount(): Promise<number> {
    const { count, error } = await supabase.from('events').select('*', { count: 'exact', head: true });
    if (error) return 0;
    return count || 0;
  }

  async getResponseCount(): Promise<number> {
    const { count, error } = await supabase.from('responses').select('*', { count: 'exact', head: true });
    if (error) return 0;
    return count || 0;
  }
}

export const storage = new SupabaseStorage();