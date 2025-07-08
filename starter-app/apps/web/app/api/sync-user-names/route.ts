import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Create a service role client for admin operations
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get all users from auth.users
    const { data: authUsers, error: authError } = await serviceSupabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
      return NextResponse.json(
        { error: "Failed to fetch auth users", details: authError.message },
        { status: 500 }
      );
    }

    let syncedCount = 0;
    let errors: string[] = [];

    // Sync each auth user to the users table with proper display name
    for (const authUser of authUsers.users) {
      try {
        const displayName = authUser.user_metadata?.display_name || 
                           authUser.user_metadata?.full_name ||
                           authUser.user_metadata?.name ||
                           authUser.email?.split('@')[0] ||
                           'User';

        // Upsert the user with the correct display name
        const { error: upsertError } = await serviceSupabase
          .from('users')
          .upsert({
            id: authUser.id,
            email: authUser.email,
            display_name: displayName,
            is_premium: false,
            is_admin: false,
            profile_image_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture,
            created_at: authUser.created_at
          }, {
            onConflict: 'id'
          });

        if (upsertError) {
          errors.push(`Failed to sync user ${authUser.id}: ${upsertError.message}`);
        } else {
          syncedCount++;
        }
      } catch (error: any) {
        errors.push(`Error processing user ${authUser.id}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${syncedCount} users`,
      syncedCount,
      totalUsers: authUsers.users.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error: any) {
    console.error('Sync user names API error:', error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
} 