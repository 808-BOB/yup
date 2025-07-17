import { NextRequest, NextResponse } from 'next/server';
import { sendCompliantSMS, SMSTemplates } from '@/utils/sms-compliance';

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

    // Use the compliance template for RSVP notifications
    const template = SMSTemplates.rsvpNotification(guestName, eventName, responseType, guestCount);
    
    const result = await sendCompliantSMS(
      hostPhoneNumber,
      template.message,
      template.options
    );

    return {
      success: result.success,
      messageSid: result.messageSid,
      error: result.error
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
    const { hostPhoneNumber, guestName, eventName, responseType, guestCount } = await request.json();

    // Validate required fields
    if (!hostPhoneNumber || !guestName || !eventName || !responseType) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields: hostPhoneNumber, guestName, eventName, responseType"
      }, { status: 400 });
    }

    // Send RSVP notification SMS
    const result = await sendRSVPNotificationSMS(
      hostPhoneNumber,
      guestName,
      eventName,
      responseType,
      guestCount || 1
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageSid: result.messageSid,
        message: "RSVP notification sent successfully"
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || "Failed to send RSVP notification"
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in rsvp-notification API:', error);
    return NextResponse.json({
      success: false,
      error: "Internal server error"
    }, { status: 500 });
  }
}

// Example usage:
// POST /api/sms/rsvp-notification
// {
//   "hostPhoneNumber": "+1234567890",
//   "guestName": "John Doe",
//   "eventName": "Birthday Party", 
//   "responseType": "yup",
//   "guestCount": 2
// } 