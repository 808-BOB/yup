import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

function normalizePhoneNumber(phoneNumber: string): string {
  let normalized = phoneNumber.replace(/[^\d+]/g, '');
  
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

async function testSimpleMessage(to: string) {
  try {
    const result = await client.messages.create({
      body: 'Test message',
      from: process.env.TWILIO_PHONE_NUMBER,
      to: normalizePhoneNumber(to),
    });
    
    return {
      success: true,
      messageSid: result.sid,
      status: result.status,
      type: 'simple'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      type: 'simple'
    };
  }
}

async function testPersonalMessage(to: string) {
  try {
    const result = await client.messages.create({
      body: 'Hi! This is a test message from your event app.',
      from: process.env.TWILIO_PHONE_NUMBER,
      to: normalizePhoneNumber(to),
    });
    
    return {
      success: true,
      messageSid: result.sid,
      status: result.status,
      type: 'personal'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      type: 'personal'
    };
  }
}

async function checkMessageStatus(messageSid: string) {
  try {
    const message = await client.messages(messageSid).fetch();
    return {
      success: true,
      status: message.status,
      errorCode: message.errorCode,
      errorMessage: message.errorMessage,
      dateCreated: message.dateCreated,
      dateSent: message.dateSent,
      dateUpdated: message.dateUpdated,
      price: message.price,
      priceUnit: message.priceUnit,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, action, messageSid } = body;

    console.log('SMS Diagnostic API called with:', { phoneNumber, action, messageSid });

    if (action === 'check_status' && messageSid) {
      const status = await checkMessageStatus(messageSid);
      console.log('Message status check result:', status);
      return NextResponse.json(status);
    }

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    let results = [];

    if (action === 'test_all' || !action) {
      // Test multiple message types
      console.log('Testing simple message...');
      const simpleResult = await testSimpleMessage(phoneNumber);
      results.push(simpleResult);
      console.log('Simple message result:', simpleResult);

      // Wait a moment before next test
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('Testing personal message...');
      const personalResult = await testPersonalMessage(phoneNumber);
      results.push(personalResult);
      console.log('Personal message result:', personalResult);

    } else if (action === 'test_simple') {
      const result = await testSimpleMessage(phoneNumber);
      results.push(result);
    } else if (action === 'test_personal') {
      const result = await testPersonalMessage(phoneNumber);
      results.push(result);
    }

    return NextResponse.json({
      success: true,
      results,
      instructions: {
        'check_status': 'Use action=check_status with messageSid to check delivery',
        'test_all': 'Test multiple message formats',
        'test_simple': 'Test simple message only',
        'test_personal': 'Test personal message only'
      }
    });

  } catch (error) {
    console.error('Error in SMS diagnostic API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 