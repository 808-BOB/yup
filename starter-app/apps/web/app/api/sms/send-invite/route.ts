import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function sendEventInviteSMS(
  to: string,
  eventName: string,
  eventDate: string,
  rsvpLink: string
) {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      throw new Error('Missing required Twilio environment variables');
    }

    // Validate phone number format (basic validation)
    if (!to.match(/^\+?[1-9]\d{1,14}$/)) {
      throw new Error('Invalid phone number format. Use E.164 format (e.g., +1234567890)');
    }

    const message = `You're invited to ${eventName} on ${eventDate}! RSVP here: ${rsvpLink}`;
    
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });

    return {
      success: true,
      messageSid: result.sid,
    };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, eventName, eventDate, rsvpLink, hostId } = await request.json();

    // Validate required fields
    if (!phoneNumber || !eventName || !eventDate || !rsvpLink) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields: phoneNumber, eventName, eventDate, rsvpLink"
      }, { status: 400 });
    }

    // Send the SMS invite
    const result = await sendEventInviteSMS(
      phoneNumber,
      eventName,
      eventDate,
      rsvpLink
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageSid: result.messageSid,
        message: "SMS invite sent successfully"
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || "Failed to send SMS invite"
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in send-invite API:', error);
    return NextResponse.json({
      success: false,
      error: "Internal server error"
    }, { status: 500 });
  }
} 