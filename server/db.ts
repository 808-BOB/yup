import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

// Use Supabase connection string from environment
const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
const supabaseKey = process.env.SUPABASE_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "SUPABASE_PROJECT_URL and SUPABASE_API_KEY must be set. Please configure your Supabase credentials.",
  );
}

// Extract the database URL from Supabase project URL
// Format: https://xxx.supabase.co -> postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres
const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
const connectionString = `postgresql://postgres:${supabaseKey}@db.${projectRef}.supabase.co:5432/postgres`;

export const client = postgres(connectionString, { 
  prepare: false,
  ssl: 'require'
});
export const db = drizzle(client, { schema });