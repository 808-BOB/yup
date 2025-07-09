import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: false,
    message: "A2P status checking is temporarily disabled",
    guidance: {
      note: "SMS functionality is currently disabled",
      nextSteps: "This feature will be implemented later"
    }
  });
} 