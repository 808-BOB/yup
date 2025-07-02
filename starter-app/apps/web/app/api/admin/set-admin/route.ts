import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Update the user's admin status in the public.users table
    const { error: updateError } = await supabase
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