import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { id } = await params;

    // Validate the user ID
    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Validate Supabase environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing required Supabase environment variables');
      return NextResponse.json(
        { 
          error: "Configuration error", 
          details: "Missing required Supabase environment variables" 
        },
        { status: 500 }
      );
    }

    // Create Supabase client inside the function
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    // Get the authorization header with the access token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing or invalid authorization header');
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const accessToken = authHeader.replace('Bearer ', '');

    // Set the session on the supabase client
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(accessToken);
    
    if (userError || !user) {
      console.error('Auth verification error:', userError);
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      );
    }

    // Ensure user can only update their own profile
    if (user.id !== id) {
      return NextResponse.json(
        { error: "Unauthorized to update this profile" },
        { status: 403 }
      );
    }

    // Validate and sanitize the update data
    const allowedFields = [
      'display_name',
      'email',
      'phone_number',
      'profile_image_url',
      'brand_theme',
      'brand_primary_color',
      'brand_secondary_color',
      'brand_tertiary_color',
      'custom_yup_text',
      'custom_nope_text',
      'custom_maybe_text',
      'logo_url'
    ];

    const updateData: Record<string, any> = {};
    
    // Only include allowed fields in the update
    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateData[key] = value;
      }
    }

    // If no valid fields to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided for update" },
        { status: 400 }
      );
    }

    // Create a service role client to bypass RLS for admin operations
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

    console.log('Attempting to update user profile for:', id, 'with data:', updateData);

    // Use upsert to handle both update and insert cases
    const { data: upsertedUser, error: upsertError } = await serviceSupabase
      .from('users')
      .upsert({
        id,
        email: user.email,
        display_name: user.user_metadata?.display_name || user.email?.split('@')[0],
        is_premium: false,
        is_admin: false,
        ...updateData // Include the phone number and other update data
      }, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (upsertError) {
      console.error('Upsert user error:', upsertError);
      return NextResponse.json(
        { error: "Failed to update user profile", details: upsertError.message },
        { status: 500 }
      );
    }

    console.log('User upserted successfully:', upsertedUser);
    return NextResponse.json(upsertedUser);

  } catch (error) {
    console.error('User update API error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate the user ID
    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Validate Supabase environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing required Supabase environment variables');
      return NextResponse.json(
        { 
          error: "Configuration error", 
          details: "Missing required Supabase environment variables" 
        },
        { status: 500 }
      );
    }

    // Create Supabase client inside the function
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    // Get the user profile from Supabase
    const { data: user, error } = await supabaseClient
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Remove sensitive fields before returning
    const { password, reset_token, linkedin_access_token, ...safeUser } = user;

    return NextResponse.json(safeUser);

  } catch (error) {
    console.error('Get user API error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Add runtime configuration to prevent static generation
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; 