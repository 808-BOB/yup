import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { CookieOptions } from '@supabase/ssr'

// Environment variables with fallback support
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_API_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Browser/Client-side Supabase client (singleton)
let browserClient: ReturnType<typeof createBrowserClient> | null = null

export function createClientSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
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

// Server-side Supabase client
export async function createServerSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch (error) {
          // The `delete` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  })
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

// For backwards compatibility
export const supabase = getSupabaseClient()
export default supabase 