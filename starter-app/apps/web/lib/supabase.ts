// Re-export from the centralized client configuration
export { getSupabaseClient as supabase, createClientSupabaseClient } from './supabase-client'

// For backwards compatibility, provide a default export
import { getSupabaseClient } from './supabase-client'
export default getSupabaseClient() 