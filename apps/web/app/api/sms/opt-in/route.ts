import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logSMSComplianceEvent } from '@/utils/sms-compliance';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    console.log(`Processing web opt-in for ${phoneNumber}`);

    // Update user's opt-in status
    const { error: userError } = await supabase
      .from('users')
      .update({ 
        sms_opt_out: false,
        sms_opt_in_date: new Date().toISOString(),
        sms_opt_in_keyword: 'WEB_OPTIN'
      })
      .eq('phone_number', phoneNumber);

    if (userError) {
      console.error('Error updating user opt-in status:', userError);
      // Don't fail if user doesn't exist - they might not be registered
    }

    // Remove from opt-out list
    await supabase
      .from('sms_opt_outs')
      .delete()
      .eq('phone_number', phoneNumber);

    // Log compliance event
    await logSMSComplianceEvent(
      phoneNumber,
      'opt_in',
      'User opted in via web interface',
      'notification'
    );

    console.log(`Web opt-in processed successfully for ${phoneNumber}`);

    return NextResponse.json({
      success: true,
      message: 'Successfully opted in to SMS messages'
    });

  } catch (error) {
    console.error('Error in SMS opt-in API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 