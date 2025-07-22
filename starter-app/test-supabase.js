require('dotenv').config({ path: './apps/web/.env.local' });
const { getSupabaseClient } = require('./packages/utils/supabase.ts');

console.log('Testing Supabase client...');
console.log('Environment variables:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');

try {
  const client = getSupabaseClient();
  console.log('Client created successfully:', !!client);
  console.log('Client has auth:', !!client.auth);
  console.log('Client has from:', !!client.from);
} catch(e) {
  console.error('Error creating client:', e.message);
} 