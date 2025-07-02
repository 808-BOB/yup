import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL as string;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabaseServer = () => {
  return createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: false,
    },
  });
}; 