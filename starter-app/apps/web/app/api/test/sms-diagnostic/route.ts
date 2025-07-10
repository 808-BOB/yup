import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const twilio = require('twilio');
    
    // Check if all required environment variables are present
    const requiredEnvVars = {
      TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
      TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
      TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
      TWILIO_VERIFY_SERVICE_SID: process.env.TWILIO_VERIFY_SERVICE_SID,
    };

    const missingVars = Object.entries(requiredEnvVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      return NextResponse.json({
        success: false,
        error: "Missing environment variables",
        missingVars
      }, { status: 500 });
    }

    // Test Twilio connection
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // Test account access
    const account = await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
    
    // Test verify service access
    const verifyService = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .fetch();

    return NextResponse.json({
      success: true,
      message: "Twilio SMS diagnostics passed",
      account: {
        sid: account.sid,
        friendlyName: account.friendlyName,
        status: account.status
      },
      verifyService: {
        sid: verifyService.sid,
        friendlyName: verifyService.friendlyName,
        status: verifyService.status
      },
      phoneNumber: process.env.TWILIO_PHONE_NUMBER
    });

  } catch (error: any) {
    console.error('SMS diagnostic error:', error);
    return NextResponse.json({
      success: false,
      error: "Twilio configuration error",
      details: error.message,
      code: error.code
    }, { status: 500 });
  }
} 