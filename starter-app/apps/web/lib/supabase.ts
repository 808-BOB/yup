// Re-export from the centralized client configuration
export * from '../../../packages/utils/supabase';
import { getSupabaseClient } from '../../../packages/utils/supabase';
export default getSupabaseClient(); 