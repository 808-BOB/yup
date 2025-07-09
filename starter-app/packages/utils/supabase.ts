import { createBrowserClient } from '@supabase/ssr'

export function createClientSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Singleton pattern for client-side usage
let supabaseClient: ReturnType<typeof createClientSupabaseClient> | null = null

export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClientSupabaseClient()
  }
  return supabaseClient
}

// For backwards compatibility, provide a default export
export const supabase = getSupabaseClient()
export default supabase 