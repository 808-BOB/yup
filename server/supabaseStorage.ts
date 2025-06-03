import { createClient } from '@supabase/supabase-js';
import type { IStorage } from './storage';
import type { User, InsertUser, Event, InsertEvent, Response, InsertResponse } from '@shared/schema';

const supabaseUrl = process.env.SUPABASE_PROJECT_URL || '';
const supabaseKey = process.env.SUPABASE_API_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export class SupabaseStorage implements IStorage {
  constructor() {
    this.initializeDatabase();
  }

  private async initializeDatabase() {
    console.log('Initializing Supabase database...');
    
    // Create tables using raw SQL through Supabase
    const tables = [
      {
        name: 'users',
        sql: `
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password TEXT,
            display_name TEXT NOT NULL,
            email TEXT,
            phone_number TEXT,
            reset_token TEXT,
            reset_token_expiry TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_admin BOOLEAN DEFAULT FALSE,
            is_pro BOOLEAN DEFAULT FALSE,
            is_premium BOOLEAN DEFAULT FALSE,
            profile_image_url TEXT,
            brand_theme TEXT,
            logo_url TEXT,
            stripe_customer_id TEXT,
            stripe_subscription_id TEXT,
            linkedin_id TEXT,
            linkedin_access_token TEXT,
            linkedin_profile_url TEXT,
            linkedin_connections TEXT
          );
        `
      },
      {
        name: 'events',
        sql: `
          CREATE TABLE IF NOT EXISTS events (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            date TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            location TEXT NOT NULL,
            address TEXT,
            host_id TEXT NOT NULL,
            status TEXT DEFAULT 'open',
            slug TEXT UNIQUE NOT NULL,
            image_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            allow_guest_rsvp BOOLEAN DEFAULT TRUE,
            allow_plus_one BOOLEAN DEFAULT TRUE,
            max_guests_per_rsvp INTEGER DEFAULT 1,
            capacity INTEGER
          );
        `
      },
      {
        name: 'responses',
        sql: `
          CREATE TABLE IF NOT EXISTS responses (
            id SERIAL PRIMARY KEY,
            event_id INTEGER NOT NULL,
            user_id TEXT,
            response TEXT NOT NULL,
            is_guest BOOLEAN DEFAULT FALSE,
            guest_name TEXT,
            guest_email TEXT,
            guest_count INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `
      },
      {
        name: 'invitations',
        sql: `
          CREATE TABLE IF NOT EXISTS invitations (
            id SERIAL PRIMARY KEY,
            event_id INTEGER NOT NULL,
            user_id TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(event_id, user_id)
          );
        `
      }
    ];

    for (const table of tables) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: table.sql });
        if (error) {
          console.log(`Table ${table.name} setup:`, error.message);
        } else {
          console.log(`Table ${table.name} ready`);
        }
      } catch (err) {
        console.log(`Setting up ${table.name} table...`);
      }
    }

    // Create admin user
    await this.createAdminUser();
  }

  private async createAdminUser() {
    try {
      const { data, error } = await supabase
        .from('users')
        .upsert({
          id: 'subourbon-admin',
          username: 'subourbon',
          password: 'events',
          display_name: 'Subourbon Admin',
          is_admin: true,
          is_premium: true,
          brand_theme: '#84793d',
          created_at: new Date().toISOString()
        }, {
          onConflict: 'username'
        })
        .select();

      if (error) {
        console.log('Admin user setup:', error.message);
      } else {
        console.log('Admin user ready');
      }
    } catch (err) {
      console.log('Setting up admin user...');
    }
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    return error ? undefined : data;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    return error ? undefined : data;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    return error ? undefined : data;
  }

  async getUserByLinkedInId(linkedin_id: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('linkedin_id', linkedin_id)
      .single();
    
    return error ? undefined : data;
  }

  async createUser(user: InsertUser): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert(user)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async upsertUser(user: any): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .upsert(user)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .update(userData)
      .eq('id', id)
      .select()
      .single();
    
    return error ? undefined : data;
  }

  async updateUserBranding(id: string, brandData: { brand_theme?: string, logo_url?: string }): Promise<User | undefined> {
    return this.updateUser(id, brandData);
  }

  async updateUserLinkedIn(id: string, linkedinData: { 
    linkedin_id?: string, 
    linkedin_access_token?: string, 
    linkedin_profile_url?: string, 
    linkedin_connections?: string 
  }): Promise<User | undefined> {
    return this.updateUser(id, linkedinData);
  }

  async updateStripeCustomerId(userId: string, customerId: string): Promise<User | undefined> {
    return this.updateUser(userId, { stripe_customer_id: customerId });
  }

  async updateStripeSubscriptionId(userId: string, subscriptionId: string): Promise<User | undefined> {
    return this.updateUser(userId, { stripe_subscription_id: subscriptionId });
  }

  async updateUserStripeInfo(userId: string, stripeData: { 
    stripe_customer_id?: string, 
    stripe_subscription_id?: string 
  }): Promise<User | undefined> {
    return this.updateUser(userId, stripeData);
  }

  async getUserByStripeCustomerId(customerId: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('stripe_customer_id', customerId)
      .single();
    
    return error ? undefined : data;
  }

  // Event operations
  async getAllEvents(): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });
    
    return error ? [] : data;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const { data, error } = await supabase
      .from('events')
      .insert(event)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateEvent(id: number, eventData: Partial<Event>): Promise<Event | undefined> {
    const { data, error } = await supabase
      .from('events')
      .update(eventData)
      .eq('id', id)
      .select()
      .single();
    
    return error ? undefined : data;
  }

  async deleteEvent(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);
    
    return !error;
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();
    
    return error ? undefined : data;
  }

  async getEventBySlug(slug: string): Promise<Event | undefined> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('slug', slug)
      .single();
    
    return error ? undefined : data;
  }

  async getUserEvents(userId: string): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('host_id', userId)
      .order('date', { ascending: false });
    
    return error ? [] : data;
  }

  // Response operations
  async createResponse(response: InsertResponse): Promise<Response> {
    const { data, error } = await supabase
      .from('responses')
      .insert(response)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getEventResponses(eventId: number): Promise<{ yupCount: number; nopeCount: number; maybeCount: number }> {
    const { data, error } = await supabase
      .from('responses')
      .select('*')
      .eq('event_id', eventId);
    
    if (error || !data) {
      return { yupCount: 0, nopeCount: 0, maybeCount: 0 };
    }

    const yupCount = data.filter(r => r.response === 'yup').length;
    const nopeCount = data.filter(r => r.response === 'nope').length;
    const maybeCount = data.filter(r => r.response === 'maybe').length;

    return { yupCount, nopeCount, maybeCount };
  }

  async getResponsesByEvent(eventId: number): Promise<Response[]> {
    const { data, error } = await supabase
      .from('responses')
      .select('*')
      .eq('event_id', eventId);
    
    return error ? [] : data;
  }

  async getUserEventResponse(eventId: number, userId: string | null): Promise<Response | undefined> {
    if (!userId) return undefined;
    
    const { data, error } = await supabase
      .from('responses')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single();
    
    return error ? undefined : data;
  }

  async getResponseById(id: number): Promise<Response | undefined> {
    const { data, error } = await supabase
      .from('responses')
      .select('*')
      .eq('id', id)
      .single();
    
    return error ? undefined : data;
  }

  async updateResponse(id: number, responseUpdate: Partial<InsertResponse>): Promise<Response | undefined> {
    const { data, error } = await supabase
      .from('responses')
      .update(responseUpdate)
      .eq('id', id)
      .select()
      .single();
    
    return error ? undefined : data;
  }

  async deleteResponse(id: number): Promise<void> {
    await supabase
      .from('responses')
      .delete()
      .eq('id', id);
  }

  // Invitation operations
  async createInvitation(eventId: number, userId: string): Promise<void> {
    await supabase
      .from('invitations')
      .insert({ event_id: eventId, user_id: userId });
  }

  async getEventInvitations(eventId: number): Promise<string[]> {
    const { data, error } = await supabase
      .from('invitations')
      .select('user_id')
      .eq('event_id', eventId);
    
    return error ? [] : data.map(inv => inv.user_id);
  }

  async getEventsUserInvitedTo(userId: string): Promise<Event[]> {
    const { data, error } = await supabase
      .from('invitations')
      .select('event_id')
      .eq('user_id', userId);
    
    if (error || !data.length) return [];
    
    const eventIds = data.map(inv => inv.event_id);
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .in('id', eventIds);
    
    return eventsError ? [] : events;
  }

  // Admin operations
  async getUserCount(): Promise<number> {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    return error ? 0 : count || 0;
  }

  async getEventCount(): Promise<number> {
    const { count, error } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true });
    
    return error ? 0 : count || 0;
  }

  async getResponseCount(): Promise<number> {
    const { count, error } = await supabase
      .from('responses')
      .select('*', { count: 'exact', head: true });
    
    return error ? 0 : count || 0;
  }
}