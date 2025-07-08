import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header with the access token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json([], { status: 200 });
    }

    const accessToken = authHeader.replace('Bearer ', '');

    // Create server-side Supabase client
    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL)!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get the authenticated user using the access token
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    
    if (userError || !user) {
      return NextResponse.json([], { status: 200 });
    }

    // Create service role client to fetch events
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

    // Fetch events the user has been invited to (has a response or viewed the event)
    const { data: invitedEvents, error: invitedError } = await serviceSupabase
      .from("events")
      .select(`
        id,
        title,
        slug,
        date,
        location,
        start_time,
        end_time,
        description,
        image_url,
        host_id,
        created_at,
        responses!left(
          user_id,
          response_type,
          created_at
        )
      `)
      .eq("responses.user_id", user.id)
      .neq("host_id", user.id) // Don't include events they're hosting
      .order("created_at", { ascending: false });

    if (invitedError) {
      return NextResponse.json({ error: invitedError.message }, { status: 500 });
    }

    // Format the response to include the user's response type and counts
    const formattedEvents = invitedEvents?.map(event => {
      const { responses, ...eventData } = event;

      // Get the latest response for each user
      const uniqueResponses = responses?.reduce((acc: any[], response: any) => {
        const existingIndex = acc.findIndex(r => r.user_id === response.user_id);
        if (existingIndex >= 0) {
          if (new Date(response.created_at) > new Date(acc[existingIndex].created_at)) {
            acc[existingIndex] = response;
          }
        } else {
          acc.push(response);
        }
        return acc;
      }, []) || [];

      // Calculate response counts
      const counts = uniqueResponses.reduce((acc: any, response: any) => {
        if (response.response_type === 'yup') acc.yupCount++;
        else if (response.response_type === 'nope') acc.nopeCount++;
        else if (response.response_type === 'maybe') acc.maybeCount++;
        return acc;
      }, { yupCount: 0, nopeCount: 0, maybeCount: 0 });

      // Get the user's latest response
      const userResponse = responses?.find(r => r.user_id === user.id)?.response_type || null;

      return {
        ...eventData,
        user_response: userResponse,
        response_counts: counts
      };
    }) || [];

    return NextResponse.json(formattedEvents);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 