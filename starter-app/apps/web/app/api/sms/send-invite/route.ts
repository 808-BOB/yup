import { NextRequest, NextResponse } from "next/server";

// SMS functionality temporarily disabled
export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: "SMS functionality is temporarily disabled"
  }, { status: 501 });
} 