import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';
import crypto from 'crypto';

// Create a service role client to bypass RLS for test operations
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

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Generate a valid UUID for guest users
function generateGuestUserId(userName: string): string {
  // Create a deterministic UUID based on the guest name
  const namespace = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // A fixed UUID namespace
  const hash = crypto.createHash('sha1')
    .update(namespace)
    .update(userName.toLowerCase())
    .digest();

  // Format the hash as a UUID v5 (name-based)
  const uuid = [
    hash.slice(0, 4).toString('hex'),
    hash.slice(4, 6).toString('hex'),
    // Set version 5
    ((hash[6] & 0x0f) | 0x50).toString(16) + hash.slice(7, 8).toString('hex'),
    // Set variant
    ((hash[8] & 0x3f) | 0x80).toString(16) + hash.slice(9, 10).toString('hex'),
    hash.slice(10, 16).toString('hex'),
  ].join('-');

  return uuid;
}

async function sendRSVPNotificationSMS(
  hostPhoneNumber: string,
  guestName: string,
  eventName: string,
  responseType: "yup" | "nope" | "maybe",
  guestCount: number = 1
) {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      throw new Error('Missing required Twilio environment variables');
    }

    const responseText = responseType === "yup" ? "YES" : responseType === "nope" ? "NO" : "MAYBE";
    const guestText = guestCount > 1 ? ` (bringing ${guestCount - 1} guest${guestCount > 2 ? 's' : ''})` : '';
    
    const message = `🎉 RSVP Update: ${guestName} responded ${responseText} to "${eventName}"${guestText}`;
    
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: hostPhoneNumber,
    });

    return {
      success: true,
      messageSid: result.sid,
    };
  } catch (error) {
    console.error('Error sending RSVP notification SMS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      eventId,
      eventName,
      userName, 
      response, 
      guestCount = 1,
      hostPhoneNumber 
    } = body;

    // Validate required fields
    if (!eventId || !eventName || !userName || !response) {
      return NextResponse.json(
        { error: 'Missing required fields: eventId, eventName, userName, response' },
        { status: 400 }
      );
    }

    // Validate response type
    if (!['yup', 'nope', 'maybe'].includes(response)) {
      return NextResponse.json(
        { error: 'Invalid response type. Must be "yup", "nope", or "maybe"' },
        { status: 400 }
      );
    }

    console.log('Creating test RSVP response:', {
      eventId,
      userName,
      response,
      guestCount
    });

    // First, get the event to get the host_id
    const { data: event, error: eventError } = await serviceSupabase
      .from('events')
      .select('host_id')
      .eq('id', eventId)
      .single();

    if (eventError) {
      console.error('Error fetching event:', eventError);
      return NextResponse.json(
        { error: 'Failed to fetch event details', details: eventError.message },
        { status: 500 }
      );
    }

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Generate a valid UUID for the guest user
    const guestUserId = generateGuestUserId(userName);

    // Insert RSVP response into database
    const rsvpData = {
      event_id: Number(eventId),
      user_id: guestUserId, // Use the generated UUID for the guest
      response_type: response,
      guest_count: guestCount,
      is_guest: true,
      guest_name: userName,
      guest_email: `${userName.toLowerCase().replace(/\s+/g, '.')}@test.com`
    };

    const { data: rsvpResponse, error: rsvpError } = await serviceSupabase
      .from('responses')
      .insert(rsvpData)
      .select()
      .single();

    if (rsvpError) {
      console.error('Database error creating RSVP:', rsvpError);
      return NextResponse.json(
        { error: 'Failed to create RSVP response', details: rsvpError.message },
        { status: 500 }
      );
    }

    console.log('Test RSVP response created successfully:', rsvpResponse);

    // Send SMS notification to host if phone number provided
    let notificationResult = null;
    if (hostPhoneNumber) {
      console.log('Sending RSVP notification SMS to:', hostPhoneNumber);
      notificationResult = await sendRSVPNotificationSMS(
        hostPhoneNumber,
        userName,
        eventName,
        response,
        guestCount
      );

      if (notificationResult.success) {
        console.log('RSVP notification SMS sent successfully:', notificationResult.messageSid);
      } else {
        console.error('Failed to send RSVP notification SMS:', notificationResult.error);
      }
    }

    return NextResponse.json({
      success: true,
      rsvpResponse,
      notification: notificationResult ? {
        sent: notificationResult.success,
        messageSid: notificationResult.messageSid,
        error: notificationResult.error
      } : { sent: false, reason: 'No host phone number provided' }
    });

  } catch (error) {
    console.error('Error in test RSVP response API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Example usage:
// POST /api/test/rsvp-response
// {
//   "eventId": "123",
//   "eventName": "Test Birthday Party",
//   "userName": "John Doe",
//   "response": "yup",
//   "guestCount": 2,
//   "hostPhoneNumber": "+13129199669"
// } 