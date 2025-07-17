import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import twilio from 'twilio';

// Initialize Twilio client for validation
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Opt-out keywords as per telecom regulations
const OPT_OUT_KEYWORDS = [
  'STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT', 'REMOVE'
];

// Opt-in keywords
const OPT_IN_KEYWORDS = [
  'START', 'SUBSCRIBE', 'UNSTOP', 'BEGIN', 'CONTINUE', 'RESUME'
];

// Help keywords
const HELP_KEYWORDS = [
  'HELP', 'INFO', 'SUPPORT'
];

/**
 * Process opt-out request
 */
async function processOptOut(phoneNumber: string, messageBody: string) {
  try {
    console.log(`Processing opt-out for ${phoneNumber}: ${messageBody}`);
    
    // Update user's opt-out status
    const { error: userError } = await supabase
      .from('users')
      .update({ 
        sms_opt_out: true,
        sms_opt_out_date: new Date().toISOString(),
        sms_opt_out_keyword: messageBody.trim().toUpperCase()
      })
      .eq('phone_number', phoneNumber);

    if (userError) {
      console.error('Error updating user opt-out status:', userError);
    }

    // Log the opt-out event
    await supabase
      .from('sms_opt_outs')
      .insert({
        phone_number: phoneNumber,
        opt_out_keyword: messageBody.trim().toUpperCase(),
        opt_out_date: new Date().toISOString(),
        method: 'sms'
      });

    // Send confirmation response
    const confirmationMessage = `You have been unsubscribed from YUP.RSVP SMS messages. You will no longer receive event notifications. Reply START to resubscribe. For help, visit ${process.env.NEXT_PUBLIC_SITE_URL}/support`;
    
    await client.messages.create({
      body: confirmationMessage,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });

    console.log(`Opt-out processed successfully for ${phoneNumber}`);
    return true;
  } catch (error) {
    console.error('Error processing opt-out:', error);
    return false;
  }
}

/**
 * Process opt-in request
 */
async function processOptIn(phoneNumber: string, messageBody: string) {
  try {
    console.log(`Processing opt-in for ${phoneNumber}: ${messageBody}`);
    
    // Update user's opt-in status
    const { error: userError } = await supabase
      .from('users')
      .update({ 
        sms_opt_out: false,
        sms_opt_in_date: new Date().toISOString(),
        sms_opt_in_keyword: messageBody.trim().toUpperCase()
      })
      .eq('phone_number', phoneNumber);

    if (userError) {
      console.error('Error updating user opt-in status:', userError);
    }

    // Log the opt-in event
    await supabase
      .from('sms_opt_outs')
      .delete()
      .eq('phone_number', phoneNumber);

    // Send confirmation response
    const confirmationMessage = `Welcome back to YUP.RSVP! You will now receive event notifications and account updates. Reply STOP to unsubscribe. Msg&data rates may apply. Terms: ${process.env.NEXT_PUBLIC_SITE_URL}/terms`;
    
    await client.messages.create({
      body: confirmationMessage,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });

    console.log(`Opt-in processed successfully for ${phoneNumber}`);
    return true;
  } catch (error) {
    console.error('Error processing opt-in:', error);
    return false;
  }
}

/**
 * Process help request
 */
async function processHelp(phoneNumber: string) {
  try {
    const helpMessage = `YUP.RSVP SMS Help:
• Reply STOP to unsubscribe
• Reply START to resubscribe
• Msg&data rates may apply
• Support: ${process.env.NEXT_PUBLIC_SITE_URL}/support
• Terms: ${process.env.NEXT_PUBLIC_SITE_URL}/terms`;
    
    await client.messages.create({
      body: helpMessage,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });

    console.log(`Help response sent to ${phoneNumber}`);
    return true;
  } catch (error) {
    console.error('Error sending help response:', error);
    return false;
  }
}

/**
 * Check if user has opted out
 */
async function isOptedOut(phoneNumber: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('users')
    .select('sms_opt_out')
    .eq('phone_number', phoneNumber)
    .single();

  if (error) {
    console.error('Error checking opt-out status:', error);
    return false;
  }

  return data?.sms_opt_out === true;
}

/**
 * Main webhook handler
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the incoming webhook data
    const formData = await request.formData();
    const messageBody = formData.get('Body') as string;
    const fromNumber = formData.get('From') as string;
    const toNumber = formData.get('To') as string;
    const messageSid = formData.get('MessageSid') as string;

    console.log('Incoming SMS webhook:', {
      from: fromNumber,
      to: toNumber,
      body: messageBody,
      messageSid
    });

    // Validate the webhook (optional but recommended)
    // You can implement Twilio webhook signature validation here

    if (!messageBody || !fromNumber) {
      console.error('Missing required webhook data');
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
    }

    // Normalize phone number
    const normalizedPhone = fromNumber.startsWith('+') ? fromNumber : `+${fromNumber}`;
    const cleanMessage = messageBody.trim().toUpperCase();

    // Log the incoming message
    await supabase
      .from('sms_webhook_logs')
      .insert({
        phone_number: normalizedPhone,
        message_body: messageBody,
        message_sid: messageSid,
        processed_at: new Date().toISOString(),
        webhook_type: 'incoming'
      });

    // Process based on message content
    if (OPT_OUT_KEYWORDS.includes(cleanMessage)) {
      await processOptOut(normalizedPhone, cleanMessage);
    } else if (OPT_IN_KEYWORDS.includes(cleanMessage)) {
      await processOptIn(normalizedPhone, cleanMessage);
    } else if (HELP_KEYWORDS.includes(cleanMessage)) {
      await processHelp(normalizedPhone);
    } else {
      // For other messages, just log them
      console.log(`Unhandled message from ${normalizedPhone}: ${messageBody}`);
      
      // Optional: Send generic response
      const genericResponse = `Thanks for your message! For help, reply HELP. To unsubscribe, reply STOP. Support: ${process.env.NEXT_PUBLIC_SITE_URL}/support`;
      
      await client.messages.create({
        body: genericResponse,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: normalizedPhone
      });
    }

    // Return TwiML response (required for Twilio)
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Message processed successfully</Message>
</Response>`,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/xml'
        }
      }
    );

  } catch (error) {
    console.error('Error in SMS webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle GET requests for webhook validation
export async function GET(request: NextRequest) {
  // Twilio sometimes sends GET requests for webhook validation
  return NextResponse.json({ message: 'SMS webhook endpoint active' });
} 