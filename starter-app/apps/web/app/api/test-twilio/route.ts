import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check environment variables
    const config = {
      accountSid: process.env.TWILIO_ACCOUNT_SID ? '✅ Set' : '❌ Missing',
      authToken: process.env.TWILIO_AUTH_TOKEN ? '✅ Set' : '❌ Missing',
      verifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID ? '✅ Set' : '❌ Missing',
      actualVerifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID,
    };

    return NextResponse.json({
      success: true,
      message: 'Twilio Environment Variables Check',
      config,
      nodeEnv: process.env.NODE_ENV,
    });
  } catch (error) {
    console.error('Error in test-twilio API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
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