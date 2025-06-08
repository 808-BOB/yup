import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

// Check for Supabase credentials first
const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
const supabaseKey = process.env.SUPABASE_API_KEY;

// Use direct DATABASE_URL if available, otherwise construct from Supabase
let connectionString = process.env.DATABASE_URL;

if (!connectionString && supabaseUrl && supabaseKey) {
  // Extract project reference and use connection pooler
  const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
  connectionString = `postgresql://postgres.${projectRef}:${supabaseKey}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;
}

if (!connectionString) {
  throw new Error(
    "DATABASE_URL or Supabase credentials (SUPABASE_PROJECT_URL and SUPABASE_API_KEY) must be set.",
  );
}

console.log('Database connection configured');

export const client = postgres(connectionString, { 
  prepare: false,
  ssl: 'require',
  idle_timeout: 20,
  max_lifetime: 60 * 30
});
export const db = drizzle(client, { schema });