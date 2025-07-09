import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: false,
    message: "SMS notifications are temporarily disabled"
  });
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