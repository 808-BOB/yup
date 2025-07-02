import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
    supabaseApiKey: process.env.SUPABASE_API_KEY ? 'Set' : 'Not set',
    viteSupabaseUrl: process.env.VITE_SUPABASE_PROJECT_URL ? 'Set' : 'Not set',
    nodeEnv: process.env.NODE_ENV,
  });
} 