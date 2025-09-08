import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';
import crypto from 'crypto';

interface GuestResponse {
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  responseType: 'yup' | 'nope' | 'maybe';
  guestCount: number;
  invitationToken?: string; // If they came from an invitation link
}

// Generate a deterministic UUID for guest users based on email/phone
function generateGuestUserId(identifier: string): string {
  const namespace = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // Fixed UUID namespace
  const hash = crypto.createHash('sha1')
    .update(namespace)
    .update(identifier.toLowerCase().trim())
    .digest();

  // Format as UUID v5
  const uuid = [
    hash.slice(0, 4).toString('hex'),
    hash.slice(4, 6).toString('hex'),
    ((hash[6] & 0x0f) | 0x50).toString(16) + hash.slice(7, 8).toString('hex'),
    ((hash[8] & 0x3f) | 0x80).toString(16) + hash.slice(9, 10).toString('hex'),
    hash.slice(10, 16).toString('hex'),
  ].join('-');

  return uuid;
}

// Send SMS notification to host about guest response
async function notifyHostOfGuestResponse(
  hostPhone: string,
  guestName: string,
  eventName: string,
  responseType: string,
  guestCount: number
): Promise<boolean> {
  try {
    if (!process.env.TWILIO_PHONE_NUMBER || !process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.log('Twilio not configured, skipping SMS notification');
      return false;
    }

    // Create Twilio client inside the function
    const twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const responseText = responseType === "yup" ? "YES" : responseType === "nope" ? "NO" : "MAYBE";
    const guestText = guestCount > 1 ? ` (bringing ${guestCount - 1} guest${guestCount > 2 ? 's' : ''})` : '';
    
    const message = `🎉 New RSVP: ${guestName} responded ${responseText} to "${eventName}"${guestText}`;
    
    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: hostPhone,
    });

    return true;
  } catch (error) {
    console.error('Error sending host notification:', error);
    return false;
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
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

    // Create Supabase client with service role for guest operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const eventSlug = (await params).slug;
    const {
      guestName,
      guestEmail,
      guestPhone,
      responseType,
      guestCount = 1,
      invitationToken
    }: GuestResponse = await request.json();

    // Validate required fields
    if (!guestName || !responseType) {
      return NextResponse.json(
        { error: 'Missing required fields: guestName, responseType' },
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

    // Validate guest count
    if (guestCount < 1 || guestCount > 10) {
      return NextResponse.json(
        { error: 'Guest count must be between 1 and 10' },
        { status: 400 }
      );
    }

    console.log('Processing guest response:', { eventSlug, guestName, responseType, guestCount });

    // First, try to find the event without status filter to debug
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select(`
        id, title, slug, host_id, status, date,
        allow_guest_rsvp, public_rsvp_enabled, 
        auto_approve_guests, max_guests_per_rsvp
      `)
      .eq('slug', eventSlug)
      .single();

    console.log('Event lookup result:', { eventData, eventError });

    if (eventError || !eventData) {
      console.error('Event not found:', eventError);
      return NextResponse.json(
        { error: 'Event not found or not available for guest responses' },
        { status: 404 }
      );
    }

    // Check if event is in a valid status (allow 'active' and 'open')
    if (eventData.status !== 'active' && eventData.status !== 'open') {
      console.log('Event status not valid for responses:', eventData.status);
      return NextResponse.json(
        { error: `Event is ${eventData.status} and not accepting responses` },
        { status: 403 }
      );
    }

    // Check if guest RSVPs are enabled
    if (!eventData.allow_guest_rsvp && !eventData.public_rsvp_enabled) {
      return NextResponse.json(
        { error: 'Guest responses are not enabled for this event' },
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

    // Validate guest count against event settings
    if (eventData.max_guests_per_rsvp && guestCount > eventData.max_guests_per_rsvp) {
      return NextResponse.json(
        { error: `Maximum ${eventData.max_guests_per_rsvp} guests allowed per RSVP` },
        { status: 400 }
      );
    }

    // Generate a unique identifier for the guest (but don't create a user record)
    const guestIdentifier = guestEmail || guestPhone || `${guestName}_${eventData.id}`;
    const guestIdentifierHash = generateGuestUserId(guestIdentifier);

    console.log('Processing guest with identifier:', guestIdentifierHash);

    // Check for existing response from this guest using guest_email/guest_name
    let existingResponseQuery = supabase
      .from('responses')
      .select('id, response_type')
      .eq('event_id', eventData.id)
      .eq('is_guest', true);

    // Match by email if provided, otherwise by name and event
    if (guestEmail) {
      existingResponseQuery = existingResponseQuery.eq('guest_email', guestEmail);
    } else {
      existingResponseQuery = existingResponseQuery.eq('guest_name', guestName);
    }

    const { data: existingResponse, error: existingError } = await existingResponseQuery.single();

    let responseData;
    let isUpdate = false;

    if (existingResponse) {
      // Update existing response
      console.log('Updating existing guest response');
      isUpdate = true;

      const { data: updatedResponse, error: updateError } = await supabase
        .from('responses')
        .update({
          response_type: responseType,
          guest_count: guestCount,
          guest_name: guestName,
          guest_email: guestEmail,
          responded_at: new Date().toISOString()
        })
        .eq('id', existingResponse.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating guest response:', updateError);
        return NextResponse.json(
          { error: 'Failed to update response' },
          { status: 500 }
        );
      }

      responseData = updatedResponse;
    } else {
      // Create new response
      console.log('Creating new guest response');

      const newResponseData: any = {
        event_id: eventData.id,
        user_id: null, // No user record for guests
        response_type: responseType,
        is_guest: true,
        guest_name: guestName,
        guest_email: guestEmail,
        guest_count: guestCount,
        responded_at: new Date().toISOString()
      };

      // Link to invitation if token is provided
      if (invitationToken) {
        const { data: invitation, error: invitationError } = await supabase
          .from('invitations')
          .select('id')
          .eq('invitation_token', invitationToken)
          .eq('event_id', eventData.id)
          .single();

        if (invitation && !invitationError) {
          newResponseData.invitation_id = invitation.id;
          
          // Update invitation status to opened (if not already responded)
          await supabase
            .from('invitations')
            .update({ 
              opened_at: new Date().toISOString(),
              status: 'opened'
            })
            .eq('id', invitation.id)
            .is('opened_at', null);
        }
      }

      const { data: newResponse, error: createError } = await supabase
        .from('responses')
        .insert(newResponseData)
        .select()
        .single();

      if (createError) {
        console.error('Error creating guest response:', createError);
        return NextResponse.json(
          { error: 'Failed to create response' },
          { status: 500 }
        );
      }

      responseData = newResponse;
    }

    // Send notification to host if they have a phone number
    try {
      const { data: hostData, error: hostError } = await supabase
        .from('users')
        .select('phone_number, display_name')
        .eq('id', eventData.host_id)
        .single();

      if (hostData?.phone_number && !hostError) {
        console.log('Sending SMS notification to host');
        await notifyHostOfGuestResponse(
          hostData.phone_number,
          guestName,
          eventData.title,
          responseType,
          guestCount
        );
      }
    } catch (notificationError) {
      console.error('Error sending host notification:', notificationError);
      // Don't fail the response if notification fails
    }

    // Generate a response token for the guest to potentially update their response later
    const responseToken = responseData.response_token || crypto.randomUUID();
    
    if (!responseData.response_token) {
      await supabase
        .from('responses')
        .update({ response_token: responseToken })
        .eq('id', responseData.id);
    }

    return NextResponse.json({
      success: true,
      message: isUpdate ? 'Response updated successfully' : 'Response recorded successfully',
      response: {
        id: responseData.id,
        response_type: responseData.response_type,
        guest_count: responseData.guest_count,
        response_token: responseToken
      },
      event: {
        title: eventData.title,
        date: eventData.date
      }
    });

  } catch (error: any) {
    console.error('Error in guest response API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve guest response (for editing)
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { searchParams } = new URL(request.url);
    const responseToken = searchParams.get('token');
    const invitationToken = searchParams.get('inv');

    if (!responseToken && !invitationToken) {
      return NextResponse.json(
        { error: 'Missing response token or invitation token' },
        { status: 400 }
      );
    }

    const eventSlug = (await params).slug;

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

    // Create Supabase client with service role for guest operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Fetch event data
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('id, title, allow_guest_rsvp, public_rsvp_enabled')
      .eq('slug', eventSlug)
      .single();

    if (eventError || !eventData) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    let responseData = null;

    if (responseToken) {
      // Look up existing response by token
      const { data: response, error: responseError } = await supabase
        .from('responses')
        .select('*')
        .eq('response_token', responseToken)
        .eq('event_id', eventData.id)
        .eq('is_guest', true)
        .single();

      if (response && !responseError) {
        responseData = response;
      }
    }

    if (invitationToken && !responseData) {
      // Check if there's a response linked to this invitation
      const { data: invitation, error: invitationError } = await supabase
        .from('invitations')
        .select(`
          id, recipient_name, recipient_email, recipient_phone,
          responses (*)
        `)
        .eq('invitation_token', invitationToken)
        .eq('event_id', eventData.id)
        .single();

      if (invitation && !invitationError) {
        // Mark invitation as opened
        await supabase
          .from('invitations')
          .update({ 
            opened_at: new Date().toISOString(),
            status: 'opened'
          })
          .eq('id', invitation.id)
          .is('opened_at', null);

        // If there's already a response, return it
        if (invitation.responses && invitation.responses.length > 0) {
          responseData = invitation.responses[0];
        } else {
          // Return invitation data for pre-filling the form
          return NextResponse.json({
            success: true,
            invitation: {
              recipient_name: invitation.recipient_name,
              recipient_email: invitation.recipient_email,
              recipient_phone: invitation.recipient_phone
            },
            event: {
              title: eventData.title
            }
          });
        }
      }
    }

    if (responseData) {
      return NextResponse.json({
        success: true,
        response: {
          response_type: responseData.response_type,
          guest_name: responseData.guest_name,
          guest_email: responseData.guest_email,
          guest_count: responseData.guest_count,
          responded_at: responseData.responded_at
        },
        event: {
          title: eventData.title
        }
      });
    }

    return NextResponse.json(
      { error: 'Response not found' },
      { status: 404 }
    );

  } catch (error: any) {
    console.error('Error fetching guest response:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Add runtime configuration to prevent static generation
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; 