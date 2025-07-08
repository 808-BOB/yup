import twilio from 'twilio';

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export interface VerifyResponse {
  success: boolean;
  status?: string;
  sid?: string;
  error?: string;
}

export interface VerifyCheckResponse {
  success: boolean;
  status?: string;
  valid?: boolean;
  error?: string;
}

/**
 * Normalize phone number to E.164 format
 * @param phoneNumber Raw phone number input
 * @returns Normalized phone number in E.164 format
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
 * Send a verification code via SMS
 * @param phoneNumber Phone number in E.164 format (e.g., +1234567890)
 * @returns Promise with verification response
 */
export async function sendVerificationCode(phoneNumber: string): Promise<VerifyResponse> {
  try {
    // Validate required environment variables
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_VERIFY_SERVICE_SID) {
      console.error('Missing Twilio environment variables:', {
        accountSid: !!process.env.TWILIO_ACCOUNT_SID,
        authToken: !!process.env.TWILIO_AUTH_TOKEN,
        verifyServiceSid: !!process.env.TWILIO_VERIFY_SERVICE_SID,
        actualServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID
      });
      throw new Error('Missing required Twilio environment variables for Verify service');
    }

    // Normalize phone number
    const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);
    console.log('Sending verification code:', { 
      original: phoneNumber, 
      normalized: normalizedPhoneNumber,
      serviceSid: process.env.TWILIO_VERIFY_SERVICE_SID
    });

    // Validate phone number format
    if (!normalizedPhoneNumber.match(/^\+[1-9]\d{1,14}$/)) {
      throw new Error(`Invalid phone number format after normalization: ${normalizedPhoneNumber}. Use E.164 format (e.g., +1234567890)`);
    }

    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications
      .create({
        to: normalizedPhoneNumber,
        channel: 'sms'
      });

    console.log('Verification code sent successfully:', {
      to: normalizedPhoneNumber,
      status: verification.status,
      sid: verification.sid
    });

    return {
      success: true,
      status: verification.status,
      sid: verification.sid,
    };
  } catch (error: any) {
    console.error('Error sending verification code:', error);
    
    // Handle specific Twilio error codes
    let errorMessage = 'Unknown error occurred';
    
    if (error.code === 20404) {
      errorMessage = 'Invalid Verify Service. Please contact support.';
    } else if (error.code === 21211) {
      errorMessage = 'Invalid phone number. Please check the format and try again.';
    } else if (error.code === 21614) {
      errorMessage = 'Phone number is not valid for SMS delivery.';
    } else if (error.code === 20429) {
      errorMessage = 'Too many requests. Please wait before sending another code.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Verify a code entered by the user
 * @param phoneNumber Phone number that received the code
 * @param code The verification code entered by the user
 * @returns Promise with verification check response
 */
export async function verifyCode(phoneNumber: string, code: string): Promise<VerifyCheckResponse> {
  try {
    // Validate required environment variables
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_VERIFY_SERVICE_SID) {
      console.error('Missing Twilio environment variables for verification:', {
        accountSid: !!process.env.TWILIO_ACCOUNT_SID,
        authToken: !!process.env.TWILIO_AUTH_TOKEN,
        verifyServiceSid: !!process.env.TWILIO_VERIFY_SERVICE_SID,
        actualServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID
      });
      throw new Error('Missing required Twilio environment variables for Verify service');
    }

    // Validate inputs
    if (!phoneNumber || !code) {
      throw new Error('Phone number and verification code are required');
    }

    // Normalize phone number to match the format used when sending
    const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);
    
    // Remove any whitespace from code
    const cleanCode = code.replace(/\s/g, '');

    console.log('Verifying code:', {
      originalPhone: phoneNumber,
      normalizedPhone: normalizedPhoneNumber,
      code: cleanCode,
      serviceSid: process.env.TWILIO_VERIFY_SERVICE_SID
    });

    const verificationCheck = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks
      .create({
        to: normalizedPhoneNumber,
        code: cleanCode
      });

    console.log('Verification check result:', {
      status: verificationCheck.status,
      valid: verificationCheck.status === 'approved',
      to: normalizedPhoneNumber
    });

    return {
      success: true,
      status: verificationCheck.status,
      valid: verificationCheck.status === 'approved',
    };
  } catch (error: any) {
    console.error('Error verifying code:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      status: error.status,
      moreInfo: error.moreInfo
    });
    
    // Handle specific Twilio error codes
    let errorMessage = 'Unknown error occurred';
    
    if (error.code === 20404) {
      if (error.message?.includes('Service')) {
        errorMessage = 'Verification service not configured properly. Please contact support.';
      } else if (error.message?.includes('VerificationCheck')) {
        errorMessage = 'No pending verification found for this phone number. Please request a new code.';
      } else {
        errorMessage = 'Verification code has expired or was already used. Please request a new code.';
      }
    } else if (error.code === 20429) {
      errorMessage = 'Too many verification attempts. Please wait before trying again.';
    } else if (error.code === 60200) {
      errorMessage = 'Invalid verification code. Please check and try again.';
    } else if (error.code === 60202) {
      errorMessage = 'Maximum verification attempts reached. Please request a new code.';
    } else if (error.code === 60203) {
      errorMessage = 'Verification code has expired. Please request a new code.';
    } else if (error.message?.includes('service was not found')) {
      errorMessage = 'Verification service is not properly configured. Please contact support.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send verification code for user phone verification during registration/login
 * @param phoneNumber User's phone number
 * @returns Promise with verification response
 */
export async function sendUserVerificationCode(phoneNumber: string): Promise<VerifyResponse> {
  return sendVerificationCode(phoneNumber);
}

/**
 * Verify user's phone number with the code they entered
 * @param phoneNumber User's phone number
 * @param code Verification code from user
 * @returns Promise with verification check response
 */
export async function verifyUserPhone(phoneNumber: string, code: string): Promise<VerifyCheckResponse> {
  return verifyCode(phoneNumber, code);
}

export default client; 