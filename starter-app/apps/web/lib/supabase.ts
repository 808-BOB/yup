// Re-export centralized Supabase client
export { 
  getSupabaseClient,
  createClientSupabaseClient,
  createServiceSupabaseClient,
  supabase
} from '../../../packages/utils/supabase'

// For backwards compatibility
import { getSupabaseClient } from '../../../packages/utils/supabase'
export default getSupabaseClient() 