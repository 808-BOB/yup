import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Get the authorization header with the access token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const accessToken = authHeader.replace('Bearer ', '');

    // Create server-side Supabase client
    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL)!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Get the authenticated user using the access token
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError) throw userError;
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Create service role client for admin operations
    const serviceSupabase = createClient(
      supabaseUrl,
      (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_API_KEY)!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Update the user's admin status in the public.users table
    const { error: updateError } = await serviceSupabase
      .from('users')
      .update({ is_admin: true })
      .eq('id', user.id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting admin status:', error);
    return NextResponse.json(
      { error: 'Failed to set admin status' },
      { status: 500 }
    );
  }
} 