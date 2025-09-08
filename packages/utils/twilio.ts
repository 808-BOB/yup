import twilio from 'twilio';

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export interface SMSOptions {
  to: string;
  message: string;
  from?: string; // Optional: use if you have multiple phone numbers
}

export interface SMSResponse {
  success: boolean;
  messageSid?: string;
  error?: string;
}

/**
 * Send an SMS message using Twilio
 * @param options SMS options containing recipient, message, and optional sender
 * @returns Promise with success status and message SID or error
 */
export async function sendSMS(options: SMSOptions): Promise<SMSResponse> {
  try {
    // Validate required environment variables
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      throw new Error('Missing required Twilio environment variables');
    }

    // Validate phone number format (basic validation)
    if (!options.to.match(/^\+?[1-9]\d{1,14}$/)) {
      throw new Error('Invalid phone number format. Use E.164 format (e.g., +1234567890)');
    }

    const message = await client.messages.create({
      body: options.message,
      from: options.from || process.env.TWILIO_PHONE_NUMBER,
      to: options.to,
    });

    return {
      success: true,
      messageSid: message.sid,
    };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Send event invitation SMS
 * @param to Recipient phone number
 * @param eventName Name of the event
 * @param eventDate Date of the event
 * @param rsvpLink Link to RSVP
 * @returns Promise with SMS response
 */
export async function sendEventInviteSMS(
  to: string,
  eventName: string,
  eventDate: string,
  rsvpLink: string
): Promise<SMSResponse> {
  const message = `You're invited to ${eventName} on ${eventDate}! RSVP here: ${rsvpLink}`;
  
  return sendSMS({
    to,
    message,
  });
}

/**
 * Send event reminder SMS
 * @param to Recipient phone number
 * @param eventName Name of the event
 * @param eventDate Date of the event
 * @param eventTime Time of the event
 * @returns Promise with SMS response
 */
export async function sendEventReminderSMS(
  to: string,
  eventName: string,
  eventDate: string,
  eventTime: string
): Promise<SMSResponse> {
  const message = `Reminder: ${eventName} is tomorrow (${eventDate}) at ${eventTime}. See you there!`;
  
  return sendSMS({
    to,
    message,
  });
}

/**
 * Send RSVP notification SMS to event host
 * @param hostPhoneNumber Host's phone number
 * @param guestName Name of the person who RSVP'd
 * @param eventName Name of the event
 * @param responseType The RSVP response (yup, nope, maybe)
 * @param guestCount Number of guests (including the respondent)
 * @returns Promise with SMS response
 */
export async function sendRSVPNotificationSMS(
  hostPhoneNumber: string,
  guestName: string,
  eventName: string,
  responseType: "yup" | "nope" | "maybe",
  guestCount: number = 1
): Promise<SMSResponse> {
  const responseText = responseType === "yup" ? "YES" : responseType === "nope" ? "NO" : "MAYBE";
  const guestText = guestCount > 1 ? ` (bringing ${guestCount - 1} guest${guestCount > 2 ? 's' : ''})` : '';
  
  const message = `🎉 RSVP Update: ${guestName} responded ${responseText} to "${eventName}"${guestText}`;
  
  return sendSMS({
    to: hostPhoneNumber,
    message,
  });
}

export default client; 