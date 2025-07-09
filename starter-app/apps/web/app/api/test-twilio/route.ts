import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: false,
    message: "Twilio testing is temporarily disabled"
  });
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