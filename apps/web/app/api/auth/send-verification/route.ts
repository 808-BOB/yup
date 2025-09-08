import { NextRequest, NextResponse } from 'next/server';
import { sendUserVerificationCode } from '@/utils/twilio-verify';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber } = body;

    // Validate required fields
    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Send verification code
    const result = await sendUserVerificationCode(phoneNumber);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Verification code sent successfully',
        status: result.status,
      });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in send verification API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Example usage:
// POST /api/auth/send-verification
// {
//   "phoneNumber": "+1234567890"
// } 