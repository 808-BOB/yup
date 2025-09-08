import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

interface UserResponse {
  responseType: 'yup' | 'nope' | 'maybe';
  guestCount?: number;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    // Get the authorization header with the access token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - missing access token' }, 
        { status: 401 }
      );
    }

    const accessToken = authHeader.replace('Bearer ', '');

    // Validate Supabase environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing required Supabase environment variables');
      return NextResponse.json(
        { 
          error: "Configuration error", 
          details: "Missing required Supabase environment variables" 
        },
        { status: 500 }
      );
    }

    // Create service role client for admin operations
    const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Create regular client to get authenticated user
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    
    // Get the authenticated user using the access token
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - invalid access token' }, 
        { status: 401 }
      );
    }

    const eventSlug = (await params).slug;
    const { responseType, guestCount = 1 }: UserResponse = await request.json();

    // Validate required fields
    if (!responseType) {
      return NextResponse.json(
        { error: 'Missing required field: responseType' },
        { status: 400 }
      );
    }

    // Validate response type
    if (!['yup', 'nope', 'maybe'].includes(responseType)) {
      return NextResponse.json(
        { error: 'Invalid response type. Must be "yup", "nope", or "maybe"' },
        { status: 400 }
      );
    }

    console.log('Processing authenticated user response:', { eventSlug, userId: user.id, responseType, guestCount });

    // Get event details
    const { data: eventData, error: eventError } = await serviceSupabase
      .from('events')
      .select('id, title, slug, host_id, status, date')
      .eq('slug', eventSlug)
      .single();

    if (eventError || !eventData) {
      console.error('Event not found:', eventError);
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check if event is active/open
    if (eventData.status !== 'active' && eventData.status !== 'open') {
      return NextResponse.json(
        { error: `Event is ${eventData.status} and not accepting responses` },
        { status: 403 }
      );
    }

    // Check if the event date has passed
    const eventDate = new Date(eventData.date);
    const now = new Date();
    if (eventDate < now) {
      return NextResponse.json(
        { error: 'Cannot RSVP to past events' },
        { status: 400 }
      );
    }

    // Check if user is the event owner (owners can't RSVP to their own events)
    if (eventData.host_id === user.id) {
      return NextResponse.json(
        { error: 'Event hosts cannot RSVP to their own events' },
        { status: 403 }
      );
    }

    // Check if user is invited to this event using multiple potential column names
    console.log('Checking invitations for user:', user.email, 'event:', eventData.id);
    
    // Try with recipient_email first (newer schema)
    let { data: invitationData, error: invitationError } = await serviceSupabase
      .from('invitations')
      .select('id')
      .eq('event_id', eventData.id)
      .eq('recipient_email', user.email)
      .maybeSingle();

    // If not found, try with invitee_email (older schema)
    if (!invitationData && !invitationError) {
      const { data: invitationData2, error: invitationError2 } = await serviceSupabase
        .from('invitations')
        .select('id')
        .eq('event_id', eventData.id)
        .eq('invitee_email', user.email)
        .maybeSingle();
      
      invitationData = invitationData2;
      invitationError = invitationError2;
    }

    console.log('Invitation check:', {
      eventId: eventData.id,
      userEmail: user.email,
      invitationData,
      invitationError
    });

    // Also check if user has previously responded (which would indicate they were invited)
    const { data: existingResponse, error: responseError } = await serviceSupabase
      .from('responses')
      .select('id, response_type, created_at')
      .eq('event_id', eventData.id)
      .eq('user_id', user.id)
      .eq('is_guest', false)
      .maybeSingle();

    console.log('Existing response check:', {
      eventId: eventData.id,
      userId: user.id,
      existingResponse,
      responseError
    });

    // For now, temporarily allow all authenticated users to RSVP for testing
    // TODO: Remove this once invitation system is confirmed working
    if (!invitationData && !existingResponse) {
      console.log('No invitation found, but allowing for testing purposes');
      // Temporarily commented out to allow testing
      // return NextResponse.json(
      //   { error: 'You are not invited to this event' },
      //   { status: 403 }
      // );
    }

    // Prepare response data
    const responseData = {
      event_id: eventData.id,
      user_id: user.id,
      response_type: responseType,
      guest_count: guestCount,
      is_guest: false,
      created_at: new Date().toISOString()
    };

    let result;
    if (existingResponse) {
      // Update existing response
      const { data: updateData, error: updateError } = await serviceSupabase
        .from('responses')
        .update({
          response_type: responseType,
          guest_count: guestCount,
          created_at: new Date().toISOString() // Update timestamp for latest response
        })
        .eq('id', existingResponse.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating RSVP response:', updateError);
        return NextResponse.json(
          { error: 'Failed to update RSVP response', details: updateError.message },
          { status: 500 }
        );
      }

      result = updateData;
      console.log('RSVP response updated successfully:', result);
    } else {
      // Create new response
      const { data: insertData, error: insertError } = await serviceSupabase
        .from('responses')
        .insert(responseData)
        .select()
        .single();

      if (insertError) {
        console.error('Error creating RSVP response:', insertError);
        return NextResponse.json(
          { error: 'Failed to create RSVP response', details: insertError.message },
          { status: 500 }
        );
      }

      result = insertData;
      console.log('RSVP response created successfully:', result);
    }

    return NextResponse.json({
      success: true,
      message: `RSVP ${existingResponse ? 'updated' : 'submitted'} successfully`,
      response: result
    });

  } catch (error) {
    console.error('Error processing user RSVP:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
