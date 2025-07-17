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

    console.log(`Processing web opt-out for ${phoneNumber}`);

    // Update user's opt-out status
    const { error: userError } = await supabase
      .from('users')
      .update({ 
        sms_opt_out: true,
        sms_opt_out_date: new Date().toISOString(),
        sms_opt_out_keyword: 'WEB_OPTOUT'
      })
      .eq('phone_number', phoneNumber);

    if (userError) {
      console.error('Error updating user opt-out status:', userError);
      // Don't fail if user doesn't exist - they might not be registered
    }

    // Log the opt-out event
    await supabase
      .from('sms_opt_outs')
      .insert({
        phone_number: phoneNumber,
        opt_out_keyword: 'WEB_OPTOUT',
        opt_out_date: new Date().toISOString(),
        method: 'web'
      });

    // Log compliance event
    await logSMSComplianceEvent(
      phoneNumber,
      'opt_out',
      'User opted out via web interface',
      'notification'
    );

    console.log(`Web opt-out processed successfully for ${phoneNumber}`);

    return NextResponse.json({
      success: true,
      message: 'Successfully opted out of SMS messages'
    });

  } catch (error) {
    console.error('Error in SMS opt-out API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 