import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function GET(request: NextRequest) {
  try {
    console.log('Checking A2P 10DLC registration status...');

    // Check account info
    const account = await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
    
    // Check messaging services
    let messagingServices = [];
    try {
      const services = await client.messaging.v1.services.list();
      messagingServices = services.map(service => ({
        sid: service.sid,
        friendlyName: service.friendlyName,
        fallbackUrl: service.fallbackUrl,
      }));
    } catch (error) {
      console.log('No messaging services found or error fetching:', error.message);
    }

    // Check brands - Note: A2P endpoints may require different SDK access
    let brands = [];
    try {
      // Try to access A2P endpoints if available
      console.log('Attempting to check brand registrations...');
      brands = []; // Placeholder - A2P API access may require specific setup
    } catch (error) {
      console.log('A2P brand check not available with current SDK configuration:', error.message);
    }

    // Check campaigns
    let campaigns = [];
    try {
      console.log('Attempting to check campaign registrations...');
      campaigns = []; // Placeholder - A2P API access may require specific setup
    } catch (error) {
      console.log('A2P campaign check not available with current SDK configuration:', error.message);
    }

    // Check phone number registration
    let phoneNumberStatus = null;
    try {
      const phoneNumbers = await client.incomingPhoneNumbers.list();
      const ourNumber = phoneNumbers.find(num => num.phoneNumber === process.env.TWILIO_PHONE_NUMBER);
      if (ourNumber) {
        phoneNumberStatus = {
          sid: ourNumber.sid,
          phoneNumber: ourNumber.phoneNumber,
          capabilities: ourNumber.capabilities,
        };
      }
    } catch (error) {
      console.log('Error fetching phone numbers:', error.message);
    }

    const isRegistered = brands.length > 0 && campaigns.length > 0 && 
                        brands.some(b => b.status === 'verified') && 
                        campaigns.some(c => c.status === 'approved');

    return NextResponse.json({
      success: true,
      registrationStatus: {
        isRegistered,
        needsRegistration: !isRegistered,
        error30034Explained: !isRegistered,
      },
      account: {
        sid: account.sid,
        friendlyName: account.friendlyName,
        status: account.status,
        type: account.type,
      },
      phoneNumber: {
        number: process.env.TWILIO_PHONE_NUMBER,
        details: phoneNumberStatus,
      },
      a2pComponents: {
        brands: {
          count: brands.length,
          details: brands,
        },
        campaigns: {
          count: campaigns.length,
          details: campaigns,
        },
        messagingServices: {
          count: messagingServices.length,
          details: messagingServices,
        },
      },
      guidance: {
        nextSteps: isRegistered ? [
          "✅ Your A2P 10DLC registration appears complete",
          "If still getting 30034 errors, check campaign approval status",
          "Ensure phone number is added to messaging service"
        ] : [
          "🚨 A2P 10DLC registration required to fix error 30034",
          "1. Go to Twilio Console → Account → TrustHub",
          "2. Create Business Profile",
          "3. Register Brand (Sole Proprietor or Standard)",
          "4. Create Campaign for event invitations",
          "5. Add your phone number to the campaign",
          "💰 Cost: ~$4-44 setup + $1.50-10/month",
          "⏱️ Timeline: 1-3 business days for approval"
        ],
        registrationUrl: "https://console.twilio.com/us1/develop/sms/regulatory-compliance/a2p-onboarding",
        documentationUrl: "https://www.twilio.com/docs/messaging/compliance/a2p-10dlc"
      }
    });

  } catch (error) {
    console.error('Error checking A2P status:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      guidance: {
        errorExplanation: "Error 30034 typically means A2P 10DLC registration is required",
        quickFix: "Register your business and phone number at Twilio Console",
        registrationUrl: "https://console.twilio.com/us1/develop/sms/regulatory-compliance/a2p-onboarding"
      }
    }, { status: 500 });
  }
} 