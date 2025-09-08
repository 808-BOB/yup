import { NextResponse } from 'next/server';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_API_KEY;
  
  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV,
    supabaseUrl: supabaseUrl ? 'Set' : 'Not set',
    supabaseServiceKey: supabaseServiceKey ? 'Set' : 'Not set',
    actualUrl: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'None',
    usingVariables: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'NEXT_PUBLIC_SUPABASE_URL' : 'NEXT_PUBLIC_SUPABASE_PROJECT_URL',
      key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SUPABASE_SERVICE_ROLE_KEY' : 'SUPABASE_API_KEY'
    },
    availableEnvVars: Object.keys(process.env).filter(key => 
      key.includes('SUPABASE') || key.includes('NEXT_PUBLIC')
    ),
  });
} 