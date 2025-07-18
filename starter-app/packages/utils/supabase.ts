import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
// Removed server-specific imports to keep this file universal (usable in both client and server environments)
// (no CookieOptions import – server-only logic moved)

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
    throw new Error('Missing required Supabase environment variables');
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

export function getSupabaseClient() {
  if (typeof window === 'undefined') {
    // Server-side: create a new client each time
    return createClient(supabaseUrl!, supabaseAnonKey!)
  }
  
  // Client-side: use singleton
  if (!browserClient) {
    browserClient = createClientSupabaseClient()
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
  get auth() { return getSupabaseClient().auth },
  get from() { return getSupabaseClient().from },
  get storage() { return getSupabaseClient().storage },
  get realtime() { return getSupabaseClient().realtime },
  get functions() { return getSupabaseClient().functions },
  get channel() { return getSupabaseClient().channel },
  get removeChannel() { return getSupabaseClient().removeChannel },
  get removeAllChannels() { return getSupabaseClient().removeAllChannels },
  get getChannels() { return getSupabaseClient().getChannels },
}

export default supabase 