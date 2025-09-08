import { supabase } from '@/lib/supabase';
import twilio from 'twilio';

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export interface SMSComplianceOptions {
  campaignType: 'verification' | 'notification' | 'invitation' | 'reminder';
  includeOptOut?: boolean;
  includeTermsUrl?: boolean;
  customOptOutText?: string;
}

export interface SMSComplianceResult {
  canSend: boolean;
  reason?: string;
  complianceText: string;
}

/**
 * Check if a phone number has opted out of SMS
 */
export async function checkOptOutStatus(phoneNumber: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('sms_opt_out')
      .eq('phone_number', phoneNumber)
      .single();

    if (error) {
      console.error('Error checking opt-out status:', error);
      return false; // Default to allowing if we can't check
    }

    return data?.sms_opt_out === true;
  } catch (error) {
    console.error('Error in checkOptOutStatus:', error);
    return false;
  }
}

/**
 * Log SMS compliance event
 */
export async function logSMSComplianceEvent(
  phoneNumber: string,
  eventType: 'opt_in' | 'opt_out' | 'message_sent' | 'message_failed',
  messageContent?: string,
  campaignType?: string,
  messageSid?: string
): Promise<void> {
  try {
    await supabase
      .from('sms_compliance_logs')
      .insert({
        phone_number: phoneNumber,
        event_type: eventType,
        message_content: messageContent,
        campaign_type: campaignType,
        message_sid: messageSid,
        consent_timestamp: new Date().toISOString()
      });
  } catch (error) {
    console.error('Error logging SMS compliance event:', error);
  }
}

/**
 * Get compliance footer text based on campaign type
 */
export function getComplianceFooter(options: SMSComplianceOptions): string {
  const { campaignType, includeOptOut = true, includeTermsUrl = true, customOptOutText } = options;
  
  let footer = '';
  
  // Add opt-out instruction
  if (includeOptOut) {
    const optOutText = customOptOutText || 'Reply STOP to opt out';
    footer += `\n\n${optOutText}`;
  }
  
  // Add terms URL for certain campaign types
  if (includeTermsUrl && (campaignType === 'verification' || campaignType === 'invitation')) {
    const termsUrl = process.env.NEXT_PUBLIC_SITE_URL + '/terms';
    footer += `. Terms: ${termsUrl}`;
  }
  
  // Add data rates notice for verification and invitation
  if (campaignType === 'verification' || campaignType === 'invitation') {
    footer += '. Msg&data rates may apply';
  }
  
  return footer;
}

/**
 * Format SMS message with compliance text
 */
export function formatSMSWithCompliance(
  message: string,
  options: SMSComplianceOptions
): string {
  const complianceFooter = getComplianceFooter(options);
  return message + complianceFooter;
}

/**
 * Check if SMS can be sent and get compliance text
 */
export async function checkSMSCompliance(
  phoneNumber: string,
  options: SMSComplianceOptions
): Promise<SMSComplianceResult> {
  try {
    // Check opt-out status
    const hasOptedOut = await checkOptOutStatus(phoneNumber);
    
    if (hasOptedOut) {
      return {
        canSend: false,
        reason: 'User has opted out of SMS notifications',
        complianceText: getComplianceFooter(options)
      };
    }
    
    return {
      canSend: true,
      complianceText: getComplianceFooter(options)
    };
  } catch (error) {
    console.error('Error checking SMS compliance:', error);
    return {
      canSend: false,
      reason: 'Error checking compliance status',
      complianceText: getComplianceFooter(options)
    };
  }
}

/**
 * Send compliant SMS message
 */
export async function sendCompliantSMS(
  phoneNumber: string,
  message: string,
  options: SMSComplianceOptions
): Promise<{
  success: boolean;
  messageSid?: string;
  error?: string;
}> {
  try {
    // Check compliance
    const complianceCheck = await checkSMSCompliance(phoneNumber, options);
    
    if (!complianceCheck.canSend) {
      console.log(`SMS blocked for ${phoneNumber}: ${complianceCheck.reason}`);
      return {
        success: false,
        error: complianceCheck.reason
      };
    }
    
    // Format message with compliance text
    const compliantMessage = formatSMSWithCompliance(message, options);
    
    // Send message
    const result = await client.messages.create({
      body: compliantMessage,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });
    
    // Log compliance event
    await logSMSComplianceEvent(
      phoneNumber,
      'message_sent',
      compliantMessage,
      options.campaignType,
      result.sid
    );
    
    return {
      success: true,
      messageSid: result.sid
    };
    
  } catch (error) {
    console.error('Error sending compliant SMS:', error);
    
    // Log failure
    await logSMSComplianceEvent(
      phoneNumber,
      'message_failed',
      message,
      options.campaignType
    );
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Common SMS templates with compliance
 */
export const SMSTemplates = {
  verification: (code: string) => ({
    message: `Your YUP.RSVP verification code is ${code}`,
    options: { campaignType: 'verification' as const }
  }),
  
  eventInvitation: (hostName: string, eventName: string, eventDate: string, rsvpLink: string) => ({
    message: `${hostName} invited you to "${eventName}" on ${eventDate}. RSVP: ${rsvpLink}`,
    options: { campaignType: 'invitation' as const }
  }),
  
  rsvpNotification: (guestName: string, eventName: string, responseType: string, guestCount: number) => {
    const responseText = responseType === "yup" ? "YES" : responseType === "nope" ? "NO" : "MAYBE";
    const guestText = guestCount > 1 ? ` (bringing ${guestCount - 1} guest${guestCount > 2 ? 's' : ''})` : '';
    return {
      message: `🎉 RSVP Update: ${guestName} responded ${responseText} to "${eventName}"${guestText}`,
      options: { campaignType: 'notification' as const }
    };
  },
  
  eventReminder: (eventName: string, eventDate: string, rsvpLink: string) => ({
    message: `Reminder: "${eventName}" is ${eventDate}. Update your RSVP: ${rsvpLink}`,
    options: { campaignType: 'reminder' as const }
  })
};

/**
 * Create opt-out link for web-based opt-out
 */
export function createOptOutLink(phoneNumber: string): string {
  const encodedPhone = encodeURIComponent(phoneNumber);
  return `${process.env.NEXT_PUBLIC_SITE_URL}/sms/opt-out?phone=${encodedPhone}`;
}

/**
 * Validate phone number format
 */
export function validatePhoneNumber(phoneNumber: string): boolean {
  // E.164 format validation
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phoneNumber);
}

/**
 * Normalize phone number to E.164 format
 */
export function normalizePhoneNumber(phoneNumber: string): string {
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