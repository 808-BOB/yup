#!/usr/bin/env node

/**
 * Twilio Verify Service Diagnostic & Fix Tool
 * 
 * This script will check your Twilio credentials and Service SID,
 * and create a new service if needed.
 */

const { config } = require('dotenv');
const twilio = require('twilio');

// Load environment variables
config();

console.log('🔧 Twilio Verify Service Diagnostic Tool');
console.log('==========================================\n');

async function main() {
  // Check environment variables
  const requiredVars = [
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN', 
    'TWILIO_VERIFY_SERVICE_SID'
  ];

  console.log('1. Checking environment variables...');
  let missingVars = [];
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (!value) {
      console.log(`❌ ${varName}: Missing`);
      missingVars.push(varName);
    } else {
      const maskedValue = varName.includes('TOKEN') || varName.includes('SID') 
        ? value.substring(0, 8) + '...' + value.substring(value.length - 4)
        : value;
      console.log(`✅ ${varName}: ${maskedValue}`);
    }
  }

  if (missingVars.length > 0) {
    console.log(`\n❌ Missing required environment variables: ${missingVars.join(', ')}`);
    console.log('Please add them to your .env file and try again.\n');
    process.exit(1);
  }

  console.log('\n2. Testing Twilio credentials...');

  try {
    // Initialize Twilio client
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID, 
      process.env.TWILIO_AUTH_TOKEN
    );

    // Test credentials by fetching account info
    const account = await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
    console.log(`✅ Credentials valid! Account: ${account.friendlyName}`);

    console.log('\n3. Testing current Verify Service...');
    
    // Test if the current Verify Service exists
    try {
      const service = await client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID).fetch();
      console.log(`✅ Current Verify Service found!`);
      console.log(`   - Service Name: ${service.friendlyName}`);
      console.log(`   - Code Length: ${service.codeLength} digits`);
      console.log(`   - Service SID: ${service.sid}`);
      
      console.log('\n4. Testing verification creation...');
      
      // Test creating a verification with Twilio test number
      try {
        const verification = await client.verify.v2
          .services(process.env.TWILIO_VERIFY_SERVICE_SID)
          .verifications
          .create({
            to: '+15005550006', // Twilio test number
            channel: 'sms'
          });
        
        console.log(`✅ Test verification created successfully!`);
        console.log(`   - Verification SID: ${verification.sid}`);
        console.log(`   - Status: ${verification.status}`);
        
        console.log('\n✅ Your Twilio Verify Service is working correctly!');
        console.log('The 404 error might be because:');
        console.log('1. Your verification code expired (codes last 10 minutes)');
        console.log('2. You exceeded maximum verification attempts');
        console.log('3. The verification was already used');
        console.log('\nTry clicking "Resend Code" on your phone verification page.');
        
      } catch (verifyError) {
        console.log(`❌ Failed to create test verification: ${verifyError.message}`);
        console.log('   Your service exists but might have issues.');
      }
      
    } catch (serviceError) {
      console.log(`❌ Current Verify Service not found!`);
      console.log(`   Error: ${serviceError.message}`);
      console.log(`   Service SID: ${process.env.TWILIO_VERIFY_SERVICE_SID}`);
      
      // Create a new service
      console.log('\n🔧 Creating a new Verify Service...');
      try {
        const newService = await client.verify.v2.services.create({
          friendlyName: 'Yup RSVP Phone Verification'
        });
        
        console.log(`✅ New Verify Service created successfully!`);
        console.log(`   - Service Name: ${newService.friendlyName}`);
        console.log(`   - Service SID: ${newService.sid}`);
        console.log(`   - Code Length: ${newService.codeLength} digits`);
        
        console.log(`\n📝 UPDATE YOUR .env FILE:`);
        console.log(`Replace this line in your .env file:`);
        console.log(`TWILIO_VERIFY_SERVICE_SID=${process.env.TWILIO_VERIFY_SERVICE_SID}`);
        console.log(`\nWith this line:`);
        console.log(`TWILIO_VERIFY_SERVICE_SID=${newService.sid}`);
        
        console.log(`\n🔄 After updating your .env file, restart your dev server:`);
        console.log(`1. Stop the current server (Ctrl+C)`);
        console.log(`2. Run: cd starter-app && pnpm dev`);
        
      } catch (createError) {
        console.log(`❌ Failed to create new service: ${createError.message}`);
        
        if (createError.code === 20003) {
          console.log('   This usually means your Twilio credentials are incorrect.');
        }
      }
    }

  } catch (error) {
    console.log(`❌ Twilio credentials test failed!`);
    console.log(`   Error: ${error.message}`);
    
    if (error.code === 20003) {
      console.log('   This usually means your Account SID or Auth Token is incorrect.');
      console.log('   Check your Twilio Console: https://console.twilio.com/');
    }
  }

  console.log('\n🎯 Next Steps:');
  console.log('1. If a new service was created, update your .env file with the new SID');
  console.log('2. Restart your development server');
  console.log('3. Try the phone verification again');
  console.log('4. Click "Resend Code" if you get expired code errors');
}

// Run the diagnostic
main().catch(console.error); 