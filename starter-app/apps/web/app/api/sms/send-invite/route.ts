import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { supabase } from '@/lib/supabase';

// Initialize Twilio client - using same config as verification
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Normalize phone number to E.164 format (same as verification system)
 */
function normalizePhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters except +
  let normalized = phoneNumber.replace(/[^\d+]/g, '');
  
  // If it doesn't start with +, assume it's US number and add +1
  if (!normalized.startsWith('+')) {
    if (normalized.length === 10) {
      normalized = '+1' + normalized;
    } else if (normalized.length === 11 && normalized.startsWith('1')) {
      normalized = '+' + normalized;
    } else {
      normalized = '+' + normalized;
    }
  }
  
  return normalized;
}

/**
 * Fetch host branding data from database
 */
async function getHostBranding(hostId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        display_name,
        logo_url,
        brand_primary_color,
        brand_secondary_color,
        brand_tertiary_color,
        custom_yup_text,
        custom_nope_text,
        custom_maybe_text,
        is_premium
      `)
      .eq('id', hostId)
      .single();

    if (error) {
      console.error('Error fetching host branding:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getHostBranding:', error);
    return null;
  }
}

/**
 * Create branded SMS message
 */
function createBrandedMessage(
  eventName: string,
  eventDate: string,
  rsvpLink: string,
  hostBranding: any = null
) {
  const hostName = hostBranding?.display_name || 'Someone';
  const customYup = hostBranding?.custom_yup_text || 'Yup';
  const customNope = hostBranding?.custom_nope_text || 'Nope';
  const customMaybe = hostBranding?.custom_maybe_text || 'Maybe';
  
  // Create a branded message that mentions the custom RSVP options
  let message = `Hi! ${hostName} invited you to "${eventName}" on ${eventDate}.\n\n`;
  
  // Add custom branding mention if host has premium branding
  if (hostBranding?.is_premium && (hostBranding?.logo_url || hostBranding?.brand_primary_color)) {
    message += `🎨 This invite includes custom branding - check it out!\n\n`;
  }
  
  // Add custom RSVP text if different from defaults
  if (customYup !== 'Yup' || customNope !== 'Nope' || customMaybe !== 'Maybe') {
    message += `Reply with: "${customYup}" / "${customMaybe}" / "${customNope}"\n\n`;
  }
  
  message += `RSVP: ${rsvpLink}`;
  
  return message;
}

async function sendEventInviteSMS(
  to: string,
  eventName: string,
  eventDate: string,
  rsvpLink: string,
  hostId?: string
) {
  try {
    console.log('sendEventInviteSMS called with:', { to, eventName, eventDate, rsvpLink, hostId });

    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      console.log('Missing Twilio env vars:', {
        hasSID: !!process.env.TWILIO_ACCOUNT_SID,
        hasToken: !!process.env.TWILIO_AUTH_TOKEN,
        hasPhone: !!process.env.TWILIO_PHONE_NUMBER
      });
      throw new Error('Missing required Twilio environment variables');
    }

    // Fetch host branding if hostId is provided
    let hostBranding = null;
    if (hostId) {
      hostBranding = await getHostBranding(hostId);
      console.log('Host branding fetched:', hostBranding ? 'Yes' : 'No');
    }

    // Normalize phone number like verification system
    const normalizedTo = normalizePhoneNumber(to);
    console.log('Normalized phone number:', { original: to, normalized: normalizedTo });

    // Create branded message
    const message = createBrandedMessage(eventName, eventDate, rsvpLink, hostBranding);
    console.log('Sending branded SMS message:', message);
    console.log('From:', process.env.TWILIO_PHONE_NUMBER, 'To:', normalizedTo);
    
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: normalizedTo,
    });

    console.log('Twilio response:', result);

    // For trial accounts, check if the message was actually queued properly
    if (result.status === 'queued') {
      console.log('⚠️  Message queued - if you\'re on trial account and not receiving SMS:');
      console.log('1. Verify your phone number is verified in Twilio Console');
      console.log('2. Check for carrier filtering/delays');
      console.log('3. Message ID for tracking:', result.sid);
    }

    return {
      success: true,
      messageSid: result.sid,
      status: result.status,
      hostBranding: hostBranding ? {
        hasLogo: !!hostBranding.logo_url,
        hasCustomColors: !!hostBranding.brand_primary_color,
        hasCustomRSVPText: !!(hostBranding.custom_yup_text && hostBranding.custom_yup_text !== 'Yup'),
        isPremium: !!hostBranding.is_premium
      } : null
    };
  } catch (error) {
    console.error('Error sending SMS:', error);
    
    // Enhanced error handling like verification system
    let errorMessage = 'Unknown error occurred';
    
    if (error.code === 21211) {
      errorMessage = 'Invalid phone number. Please check the format and try again.';
    } else if (error.code === 21614) {
      errorMessage = 'Phone number is not valid for SMS delivery.';
    } else if (error.code === 21608) {
      errorMessage = 'This phone number is not verified. In trial mode, only verified numbers can receive SMS.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Alternative: Use Twilio Verify service (bypasses trial restrictions)
async function sendInviteViaVerifyService(
  to: string,
  eventName: string,
  eventDate: string,
  rsvpLink: string,
  hostId?: string
) {
  try {
    if (!process.env.TWILIO_VERIFY_SERVICE_SID) {
      throw new Error('TWILIO_VERIFY_SERVICE_SID not configured');
    }

    // Fetch host branding if hostId is provided
    let hostBranding = null;
    if (hostId) {
      hostBranding = await getHostBranding(hostId);
    }

    const normalizedTo = normalizePhoneNumber(to);
    console.log('🔄 Trying Verify service as fallback...');
    
    // Use a branded custom message via Verify service
    const customMessage = createBrandedMessage(eventName, eventDate, rsvpLink, hostBranding);
    
    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications
      .create({
        to: normalizedTo,
        channel: 'sms',
        customMessage: customMessage
      });

    console.log('✅ Verify service response:', verification);

    return {
      success: true,
      messageSid: verification.sid,
      status: verification.status,
      hostBranding: hostBranding ? {
        hasLogo: !!hostBranding.logo_url,
        hasCustomColors: !!hostBranding.brand_primary_color,
        hasCustomRSVPText: !!(hostBranding.custom_yup_text && hostBranding.custom_yup_text !== 'Yup'),
        isPremium: !!hostBranding.is_premium
      } : null
    };
  } catch (error) {
    console.error('❌ Verify service failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, eventName, eventDate, rsvpLink, hostId } = body;

    console.log('SMS Invite API called with:', {
      phoneNumber,
      eventName, 
      eventDate,
      rsvpLink,
      hostId
    });

    // Validate required fields
    if (!phoneNumber || !eventName || !eventDate || !rsvpLink) {
      console.log('Missing required fields:', { phoneNumber, eventName, eventDate, rsvpLink });
      return NextResponse.json(
        { error: 'Missing required fields: phoneNumber, eventName, eventDate, rsvpLink' },
        { status: 400 }
      );
    }

    console.log('Attempting to send branded SMS invitation...');

    // For trial accounts, try Verify service first (since it works for phone verification)
    if (process.env.TWILIO_PHONE_NUMBER?.includes('855')) {
      console.log('🔍 Trial account detected - trying Verify service first...');
      const verifyResult = await sendInviteViaVerifyService(
        phoneNumber,
        eventName,
        eventDate,
        rsvpLink,
        hostId
      );
      
      if (verifyResult.success) {
        return NextResponse.json({
          success: true,
          message: 'SMS invitation sent successfully via Verify service',
          messageSid: verifyResult.messageSid,
          status: verifyResult.status,
          method: 'verify-service',
          branding: verifyResult.hostBranding
        });
      } else {
        console.log('⚠️  Verify service failed, falling back to regular SMS...');
      }
    }

    // Regular SMS sending with branding
    const result = await sendEventInviteSMS(
      phoneNumber,
      eventName,
      eventDate,
      rsvpLink,
      hostId
    );

    console.log('SMS sending result:', result);

    if (result.success) {
      console.log('SMS sent successfully with SID:', result.messageSid);
      return NextResponse.json({
        success: true,
        message: 'SMS invitation sent successfully',
        messageSid: result.messageSid,
        status: result.status,
        branding: result.hostBranding
      });
    } else {
      console.log('SMS sending failed:', result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in SMS invite API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Example usage:
// POST /api/sms/send-invite
// {
//   "phoneNumber": "+1234567890",
//   "eventName": "Birthday Party",
//   "eventDate": "January 15, 2024",
//   "rsvpLink": "https://yourapp.com/event/birthday-party",
//   "hostId": "host-user-id-optional"
// }

console.log('Twilio Account Info:', {
  accountSid: process.env.TWILIO_ACCOUNT_SID,
  fromNumber: process.env.TWILIO_PHONE_NUMBER,
  isLikelyTrial: process.env.TWILIO_PHONE_NUMBER?.includes('855') || false
}); 