import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header with the access token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
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
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Get request body
    const { invitationToken, eventSlug } = await request.json();

    if (!invitationToken || !eventSlug) {
      return NextResponse.json(
        { error: 'Missing invitation token or event slug' },
        { status: 400 }
      );
    }

    // Create service role client for database operations
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

    // First, get the event ID from slug
    const { data: eventData, error: eventError } = await serviceSupabase
      .from('events')
      .select('id')
      .eq('slug', eventSlug)
      .single();

    if (eventError || !eventData) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Find the invitation by token and event
    const { data: invitation, error: invitationError } = await serviceSupabase
      .from('invitations')
      .select('id, recipient_email, recipient_phone, event_id, user_id')
      .eq('invitation_token', invitationToken)
      .eq('event_id', eventData.id)
      .single();

    if (invitationError || !invitation) {
      return NextResponse.json(
        { error: 'Invalid invitation token' },
        { status: 404 }
      );
    }

    // Check if the user's email or phone matches the invitation
    const userEmail = user.email?.toLowerCase();
    const userPhone = user.phone;
    const invitationEmail = invitation.recipient_email?.toLowerCase();
    const invitationPhone = invitation.recipient_phone;

    const emailMatches = userEmail && invitationEmail && userEmail === invitationEmail;
    const phoneMatches = userPhone && invitationPhone && userPhone === invitationPhone;

    // If the user was authenticated via the token flow, link the invitation to the user account
    // even if the email/phone doesn't match, so it shows up in their Invited list.
    // We still return a 403 below only if we cannot persist the link for some reason.
    const shouldLinkToUser = !invitation.user_id || invitation.user_id !== user.id;
    if (shouldLinkToUser) {
      const { error: linkErr } = await serviceSupabase
        .from('invitations')
        .update({ user_id: user.id, opened_at: new Date().toISOString(), status: 'opened' })
        .eq('id', invitation.id);

      if (linkErr) {
        // If linking fails and there is no match, block
        if (!emailMatches && !phoneMatches) {
          return NextResponse.json(
            { 
              error: 'Your account does not match the invitation recipient',
              details: 'The invitation was sent to a different email or phone number'
            },
            { status: 403 }
          );
        }
      }
    }

    // Check if user already has a response for this event
    const { data: existingResponse, error: responseError } = await serviceSupabase
      .from('responses')
      .select('id')
      .eq('event_id', eventData.id)
      .eq('user_id', user.id)
      .single();

    // If user doesn't have a response yet, the invitation will show up in their invited list
    // Update invitation status to indicate it was accessed by the authenticated user (idempotent)
    await serviceSupabase
      .from('invitations')
      .update({ 
        opened_at: new Date().toISOString(),
        status: 'opened',
        user_id: user.id
      })
      .eq('id', invitation.id);

    return NextResponse.json({
      success: true,
      message: 'Invitation linked to user account',
      hasExistingResponse: !!existingResponse,
      invitation: {
        id: invitation.id,
        eventId: invitation.event_id
      }
    });

  } catch (error: any) {
    console.error('Error linking invitation to user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
