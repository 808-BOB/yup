import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Basic environment check
    const envCheck = {
      hasAccountSid: !!process.env.TWILIO_ACCOUNT_SID,
      hasAuthToken: !!process.env.TWILIO_AUTH_TOKEN,
      hasPhoneNumber: !!process.env.TWILIO_PHONE_NUMBER,
      hasVerifyServiceSid: !!process.env.TWILIO_VERIFY_SERVICE_SID,
    };

    return NextResponse.json({
      success: true,
      message: "Twilio configuration check",
      environment: envCheck,
      allConfigured: Object.values(envCheck).every(Boolean)
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "Failed to check Twilio configuration"
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testType } = body;

    if (testType === 'verify-service') {
      const twilio = require('twilio');
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );

      try {
        const service = await client.verify.v2
          .services(process.env.TWILIO_VERIFY_SERVICE_SID)
          .fetch();

        return NextResponse.json({
          success: true,
          message: 'Verify service is working',
          serviceName: service.friendlyName,
          serviceSid: service.sid,
          status: service.status,
        });
      } catch (twilioError: any) {
        return NextResponse.json({
          success: false,
          error: 'Twilio service error',
          details: twilioError.message,
          code: twilioError.code,
        });
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid test type',
    });
  } catch (error) {
    console.error('Error in test-twilio POST:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 