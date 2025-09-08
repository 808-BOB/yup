# A2P Campaign Registration Checklist

## Pre-Registration Setup
- [x] Database tables created
- [x] Webhook endpoint configured
- [x] Terms of service page deployed
- [x] Opt-out page deployed
- [x] All SMS templates updated
- [x] Compliance logging implemented

## Campaign Registration Information
- [ ] Brand Name: YUP.RSVP
- [ ] Brand URL: yup.rsvp
- [ ] Brand Logo: [Upload your logo]
- [ ] Campaign Name: YUP.RSVP Event Management
- [ ] Use Case: Account Notification
- [ ] Vertical: Events & Entertainment
- [ ] Expected Volume: [Enter your expected monthly volume]
- [ ] Sample Messages: Use content from a2p-sample-messages.txt

## Post-Registration
- [ ] Campaign submitted to Twilio
- [ ] Campaign approved
- [ ] Webhook URL configured in Twilio Console
- [ ] Production testing completed
- [ ] Compliance monitoring enabled

## Twilio Console Configuration
1. Go to Twilio Console > Phone Numbers > Manage > Active Numbers
2. Click on your SMS-enabled phone number
3. Set Webhook URL to: yup.rsvp/api/sms/webhook
4. Set HTTP Method to: POST
5. Save configuration

## Testing Commands
Test opt-out: Send "STOP" to your Twilio number
Test opt-in: Send "START" to your Twilio number  
Test help: Send "HELP" to your Twilio number
