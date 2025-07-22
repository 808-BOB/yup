import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

// Environment variables with fallback support
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_API_KEY

// Browser/Client-side Supabase client (singleton)
let browserClient: ReturnType<typeof createBrowserClient> | null = null

export function createClientSupabaseClient() {
  // Use consistent environment variable names with fallbacks
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables:', {
      url: supabaseUrl ? 'SET' : 'NOT SET',
      key: supabaseAnonKey ? 'SET' : 'NOT SET'
    });
    throw new Error('Missing required Supabase environment variables');
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

export function getSupabaseClient() {
  if (typeof window === 'undefined') {
    // Server-side: create a new client each time
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables for server-side client');
    }
    return createClient(supabaseUrl, supabaseAnonKey)
  }
  
  // Client-side: use singleton
  if (!browserClient) {
    try {
      browserClient = createClientSupabaseClient()
    } catch (error) {
      console.error('Failed to create Supabase browser client:', error);
      throw error;
    }
  }
  return browserClient
}

// Service role client (for admin operations)
export function createServiceSupabaseClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase service role key')
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// For backwards compatibility, provide a default export
// Create a lazy-loaded client that only initializes when first accessed
export const supabase = {
  get auth() { 
    try {
      return getSupabaseClient().auth 
    } catch (error) {
      console.error('Failed to get Supabase auth:', error);
      throw error;
    }
  },
  get from() { 
    try {
      return getSupabaseClient().from 
    } catch (error) {
      console.error('Failed to get Supabase from:', error);
      throw error;
    }
  },
  get storage() { 
    try {
      return getSupabaseClient().storage 
    } catch (error) {
      console.error('Failed to get Supabase storage:', error);
      throw error;
    }
  },
  get realtime() { 
    try {
      return getSupabaseClient().realtime 
    } catch (error) {
      console.error('Failed to get Supabase realtime:', error);
      throw error;
    }
  },
  get functions() { 
    try {
      return getSupabaseClient().functions 
    } catch (error) {
      console.error('Failed to get Supabase functions:', error);
      throw error;
    }
  },
  get channel() { 
    try {
      return getSupabaseClient().channel 
    } catch (error) {
      console.error('Failed to get Supabase channel:', error);
      throw error;
    }
  },
  get removeChannel() { 
    try {
      return getSupabaseClient().removeChannel 
    } catch (error) {
      console.error('Failed to get Supabase removeChannel:', error);
      throw error;
    }
  },
  get removeAllChannels() { 
    try {
      return getSupabaseClient().removeAllChannels 
    } catch (error) {
      console.error('Failed to get Supabase removeAllChannels:', error);
      throw error;
    }
  },
  get getChannels() { 
    try {
      return getSupabaseClient().getChannels 
    } catch (error) {
      console.error('Failed to get Supabase getChannels:', error);
      throw error;
    }
  },
}

export default supabase 