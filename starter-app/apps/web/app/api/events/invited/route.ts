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

    // Fetch events the user has been invited to (either via invitations table or has a response)
    console.log('Fetching invited events for user:', user.id, 'email:', user.email);

    // First, get event IDs where user was specifically invited
    const { data: invitationData, error: invitationError } = await serviceSupabase
      .from('invitations')
      .select('event_id')
      .or(`recipient_email.eq.${user.email},recipient_phone.eq.${user.phone || 'none'}`);

    // Get event IDs where user has responded  
    const { data: responseData, error: responseError } = await serviceSupabase
      .from('responses')
      .select('event_id')
      .eq('user_id', user.id);

    console.log('Invitation data:', invitationData?.length || 0);
    console.log('Response data:', responseData?.length || 0);

    // Combine and deduplicate event IDs
    const invitedEventIds = [
      ...(invitationData?.map(i => i.event_id) || []),
      ...(responseData?.map(r => r.event_id) || [])
    ];

    const uniqueEventIds = [...new Set(invitedEventIds)];
    console.log('Total unique invited event IDs:', uniqueEventIds.length);

    // If no invited events, return empty array
    if (uniqueEventIds.length === 0) {
      console.log('No invited events found for user');
      return NextResponse.json([]);
    }

    // Fetch the actual event data for invited events
    const { data: invitedEvents, error: eventsError } = await serviceSupabase
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
        created_at
      `)
      .in('id', uniqueEventIds)
      .neq("host_id", user.id) // Don't include events they're hosting
      .order("created_at", { ascending: false });

    // Fetch responses for these events
    let allResponses = [];
    if (uniqueEventIds.length > 0) {
      const { data: responses, error: responsesError } = await serviceSupabase
        .from("responses")
        .select('event_id, user_id, response_type, created_at')
        .in('event_id', uniqueEventIds);

      if (responsesError) {
        console.error('Error fetching responses:', responsesError);
      } else {
        allResponses = responses || [];
      }
    }

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      return NextResponse.json({ error: eventsError.message }, { status: 500 });
    }

    // Format the response to include the user's response type and counts
    const formattedEvents = invitedEvents?.map(event => {
      // Get responses for this specific event
      const eventResponses = allResponses.filter(r => r.event_id === event.id);

      // Get the latest response for each user for this event
      const uniqueResponses = eventResponses.reduce((acc: any[], response: any) => {
        const existingIndex = acc.findIndex(r => r.user_id === response.user_id);
        if (existingIndex >= 0) {
          if (new Date(response.created_at) > new Date(acc[existingIndex].created_at)) {
            acc[existingIndex] = response;
          }
        } else {
          acc.push(response);
        }
        return acc;
      }, []);

      // Calculate response counts
      const counts = uniqueResponses.reduce((acc: any, response: any) => {
        if (response.response_type === 'yup') acc.yupCount++;
        else if (response.response_type === 'nope') acc.nopeCount++;
        else if (response.response_type === 'maybe') acc.maybeCount++;
        return acc;
      }, { yupCount: 0, nopeCount: 0, maybeCount: 0 });

      // Get the user's latest response for this event
      const userResponse = eventResponses.find(r => r.user_id === user.id)?.response_type || null;

      return {
        ...event,
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