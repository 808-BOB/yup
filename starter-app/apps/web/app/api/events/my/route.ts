import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Get user_id from a custom header instead of the full JWT
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json([], { status: 200 });
    }

    // Create server-side Supabase client
    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL)!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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

    // Fetch ONLY events the user is hosting
    const { data: hostedEvents, error: hostedError } = await serviceSupabase
      .from("events")
      .select("id,title,slug,date,location,start_time,end_time,description,image_url,host_id,created_at")
      .eq("host_id", userId)
      .order("created_at", { ascending: false });

    if (hostedError) {
      return NextResponse.json({ error: hostedError.message }, { status: 500 });
    }

    // Fetch response counts for all hosted events
    const eventIds = hostedEvents?.map(event => event.id) || [];
    let responseCounts = {};
    
    if (eventIds.length > 0) {
      const { data: responses, error: responsesError } = await serviceSupabase
        .from("responses")
        .select("event_id, response_type")
        .in("event_id", eventIds);

      if (!responsesError && responses) {
        // Calculate response counts for each event
        responseCounts = responses.reduce((acc, response) => {
          if (!acc[response.event_id]) {
            acc[response.event_id] = { yupCount: 0, nopeCount: 0, maybeCount: 0 };
          }
          acc[response.event_id][`${response.response_type}Count`]++;
          return acc;
        }, {});
      }
    }

    // Add response counts to events
    const eventsWithCounts = hostedEvents?.map(event => ({
      ...event,
      response_counts: responseCounts[event.id] || { yupCount: 0, nopeCount: 0, maybeCount: 0 }
    })) || [];

    return NextResponse.json(eventsWithCounts || []);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 