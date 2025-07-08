import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    console.log('Debug: Checking user with ID:', id);

    // Check if user exists in auth
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(id);
    console.log('Auth user result:', { authUser, authError });

    // Check if user exists in users table
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id);

    console.log('Database user query result:', { dbUser, dbError, count: dbUser?.length });

    // Also check with service role for RLS bypass
    const { data: serviceRoleUser, error: serviceError } = await supabase
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