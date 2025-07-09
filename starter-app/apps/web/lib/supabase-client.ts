import { createBrowserClient } from '@supabase/ssr'

export function createClientSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  return createBrowserClient(url, anonKey)
}

// Singleton pattern for client-side usage
let supabaseClient: ReturnType<typeof createClientSupabaseClient> | null = null

export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClientSupabaseClient()
  }
  return supabaseClient
} 