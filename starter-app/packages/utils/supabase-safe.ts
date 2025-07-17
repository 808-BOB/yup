import { createClient } from '@supabase/supabase-js';

// Build-safe Supabase client creation
export function createSafeSupabaseClient(url?: string, key?: string, options?: any) {
  const supabaseUrl = url || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = key || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

  // If we have placeholder values, return a mock client
  if (supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        admin: {
          getUserById: () => Promise.resolve({ data: { user: null }, error: null }),
          createUser: () => Promise.resolve({ data: { user: null }, error: null }),
        }
      },
      from: (table: string) => ({
        select: (columns?: string) => ({
          eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }),
          in: () => Promise.resolve({ data: [], error: null }),
          order: () => Promise.resolve({ data: [], error: null }),
          limit: () => Promise.resolve({ data: [], error: null }),
          single: () => Promise.resolve({ data: null, error: null }),
        }),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => Promise.resolve({ data: null, error: null }),
        delete: () => Promise.resolve({ data: null, error: null }),
        upsert: () => Promise.resolve({ data: null, error: null }),
      }),
      storage: {
        from: () => ({
          upload: () => Promise.resolve({ data: null, error: null }),
          download: () => Promise.resolve({ data: null, error: null }),
          remove: () => Promise.resolve({ data: null, error: null }),
          createSignedUrl: () => Promise.resolve({ data: null, error: null }),
        })
      }
    } as any;
  }

  return createClient(supabaseUrl, supabaseKey, options);
}

// For convenience, also export individual safe clients
export function createSafeServiceClient() {
  return createSafeSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function createSafeAnonClient() {
  return createSafeSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
} 