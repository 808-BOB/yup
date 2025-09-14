import { NextRequest, NextResponse } from "next/server";
import { sendRSVPNotificationEmail } from "@/utils/sendgrid";

export async function POST(request: NextRequest) {
  try {
    const {
      hostEmail,
      hostName,
      guestName,
      guestEmail,
      eventName,
      responseType,
      guestCount = 1
    } = await request.json();

    // Validate required fields
    if (!hostEmail || !guestName || !eventName || !responseType) {
      return NextResponse.json(
        { error: 'Missing required fields: hostEmail, guestName, eventName, responseType' },
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

    console.log('Sending RSVP email notification:', {
      hostEmail,
      guestName,
      eventName,
      responseType
    });

    // Send the email notification
    const result = await sendRSVPNotificationEmail({
      hostEmail,
      hostName: hostName || 'Host',
      guestName,
      guestEmail,
      eventName,
      responseType,
      guestCount
    });

    if (result.success) {
      console.log('RSVP email notification sent successfully:', result.messageId);
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        message: 'Email notification sent successfully'
      });
    } else {
      console.error('Failed to send RSVP email notification:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to send email notification' },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Error in RSVP email notification API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
