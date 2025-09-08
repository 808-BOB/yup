import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate required environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      console.error('Missing required environment variables for debug endpoint');
      return NextResponse.json(
        { 
          error: "Configuration error", 
          details: "Missing required Supabase environment variables",
          missingVars: {
            supabaseUrl: !supabaseUrl,
            supabaseServiceKey: !supabaseServiceKey,
            supabaseAnonKey: !supabaseAnonKey
          }
        },
        { status: 500 }
      );
    }

    console.log('Debug: Checking user with ID:', id);

    // Create service role client for admin operations
    const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Create regular client for user operations
    const anonSupabase = createClient(supabaseUrl, supabaseAnonKey);

    // Check if user exists in auth (requires service role)
    const { data: authUser, error: authError } = await serviceSupabase.auth.admin.getUserById(id);
    console.log('Auth user result:', { authUser, authError });

    // Check if user exists in users table with anon client
    const { data: dbUser, error: dbError } = await anonSupabase
      .from('users')
      .select('*')
      .eq('id', id);

    console.log('Database user query result:', { dbUser, dbError, count: dbUser?.length });

    // Also check with service role for RLS bypass
    const { data: serviceRoleUser, error: serviceError } = await serviceSupabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    console.log('Service role query result:', { serviceRoleUser, serviceError });

    return NextResponse.json({
      userId: id,
      authUser: authUser?.user ? { id: authUser.user.id, email: authUser.user.email } : null,
      authError: authError?.message,
      dbUsers: dbUser,
      dbUserCount: dbUser?.length || 0,
      dbError: dbError?.message,
      serviceRoleUser: serviceRoleUser ? { id: serviceRoleUser.id, phone_number: serviceRoleUser.phone_number } : null,
      serviceError: serviceError?.message,
    });

  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      { error: "Debug endpoint failed", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Add runtime configuration to prevent static generation
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; 