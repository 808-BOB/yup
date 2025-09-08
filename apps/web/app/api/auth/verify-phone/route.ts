import { NextRequest, NextResponse } from 'next/server';
import { verifyUserPhone } from '@/utils/twilio-verify';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, code } = body;

    // Validate required fields
    if (!phoneNumber || !code) {
      return NextResponse.json(
        { error: 'Phone number and verification code are required' },
        { status: 400 }
      );
    }

    // Verify the code
    const result = await verifyUserPhone(phoneNumber, code);

    if (result.success) {
      if (result.valid) {
        return NextResponse.json({
          success: true,
          verified: true,
          message: 'Phone number verified successfully',
        });
      } else {
        return NextResponse.json({
          success: true,
          verified: false,
          message: 'Invalid verification code',
        }, { status: 400 });
      }
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in verify phone API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Example usage:
// POST /api/auth/verify-phone
// {
//   "phoneNumber": "+1234567890",
//   "code": "277273"
// } 