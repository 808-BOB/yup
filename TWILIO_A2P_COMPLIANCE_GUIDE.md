# Twilio A2P Compliance Guide for YUP.RSVP

This guide outlines the complete A2P (Application-to-Person) compliance implementation for YUP.RSVP's SMS messaging system.

## 🚀 Quick Setup Checklist

### 1. Database Setup
```bash
# Run the SMS compliance tables migration
psql -d your_database < sms-compliance-tables.sql
```

### 2. Environment Variables
Ensure these are set in your environment:
```bash
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_phone_number
TWILIO_VERIFY_SERVICE_SID=your_verify_service_sid
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### 3. Twilio Webhook Configuration
Configure your Twilio phone number webhook URL to:
```
https://your-domain.com/api/sms/webhook
```

### 4. Deploy and Test
- Deploy all changes to production
- Test opt-out functionality by sending "STOP" to your number
- Verify terms of service page is accessible

## 📋 A2P Campaign Registration Requirements

### Campaign Information
When registering your A2P campaign with Twilio, use these details:

**Campaign Name**: YUP.RSVP Event Management  
**Campaign Description**: Event management platform sending account verification codes, event invitations, RSVP confirmations, and event notifications.

**Use Case**: Account Notification  
**Vertical**: Events & Entertainment  
**Brand Name**: YUP.RSVP  
**Website**: https://yuprsvp.com

### Message Types
1. **Account Verification**: One-time passcodes for phone number verification
2. **Event Invitations**: Notifications about event invitations
3. **RSVP Confirmations**: Confirmations of RSVP responses
4. **Event Notifications**: Updates about events and responses

### Opt-in Process
Users provide explicit consent through:
- Phone verification checkbox with clear SMS consent language
- Terms of service acceptance
- Logged consent timestamp in database

### Opt-out Process
Multiple opt-out methods provided:
- Reply "STOP" to any message (automated)
- Web interface at /sms/opt-out
- Account settings (manual)
- Contact support

## 🔧 Technical Implementation

### SMS Compliance System
The system includes:

#### 1. Compliance Utility (`packages/utils/sms-compliance.ts`)
- `checkOptOutStatus()`: Verifies if user has opted out
- `sendCompliantSMS()`: Sends messages with compliance footers
- `logSMSComplianceEvent()`: Tracks all SMS events
- `SMSTemplates`: Pre-formatted compliant message templates

#### 2. Database Schema
- `sms_opt_outs`: Tracks opt-out requests
- `sms_webhook_logs`: Logs incoming SMS messages
- `sms_compliance_logs`: Comprehensive audit trail
- `users` table: Added SMS opt-out columns

#### 3. API Endpoints
- `/api/sms/webhook`: Processes incoming SMS (STOP, START, HELP)
- `/api/sms/opt-out`: Web-based opt-out
- `/api/sms/opt-in`: Web-based opt-in

#### 4. Frontend Pages
- `/terms`: Terms of service with SMS compliance section
- `/sms/opt-out`: User-friendly opt-out interface

### Message Templates
All messages now include:
- Opt-out instructions ("Reply STOP to opt out")
- Terms URL for verification and invitation messages
- Data rates notice for appropriate message types
- Compliance logging

### Webhook Processing
Incoming messages are processed for:
- **STOP, STOPALL, UNSUBSCRIBE, CANCEL, END, QUIT**: Opt-out processing
- **START, UNSTOP, CONTINUE**: Opt-in processing
- **HELP, INFO, SUPPORT**: Help responses

## 📊 Compliance Monitoring

### Logging
Every SMS interaction is logged with:
- Phone number
- Message content
- Campaign type
- Consent timestamp
- Opt-out status

### Audit Trail
The system maintains:
- Complete message history
- Opt-in/opt-out events
- Webhook processing logs
- Compliance event tracking

### Reporting
Query compliance logs:
```sql
-- Check opt-out rates
SELECT COUNT(*) as total_optouts 
FROM sms_opt_outs 
WHERE opt_out_date >= NOW() - INTERVAL '30 days';

-- Check message volume by type
SELECT campaign_type, COUNT(*) as message_count
FROM sms_compliance_logs 
WHERE event_type = 'message_sent'
AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY campaign_type;
```

## 🎯 Campaign Registration Details

### Brand Information
- **Brand Name**: YUP.RSVP
- **Brand URL**: https://yuprsvp.com
- **Brand Logo**: [Upload your logo]
- **Brand Description**: Event management and RSVP platform

### Use Case Details
- **Primary Use Case**: Account notifications
- **Secondary Use Case**: Event updates
- **Expected Volume**: [Your expected monthly volume]
- **Peak Traffic**: Event-driven (spikes during event creation/responses)

### Sample Messages
Include these in your campaign registration:

**Verification:**
```
Your YUP.RSVP verification code is 123456

Reply STOP to opt out. Terms: https://yuprsvp.com/terms. Msg&data rates may apply
```

**Event Invitation:**
```
John invited you to "Birthday Party" on March 15, 2024. RSVP: https://yuprsvp.com/events/birthday-party

Reply STOP to opt out. Terms: https://yuprsvp.com/terms. Msg&data rates may apply
```

**RSVP Notification:**
```
🎉 RSVP Update: Sarah responded YES to "Birthday Party"

Reply STOP to opt out
```

### Compliance Statements
For the campaign registration form:

**Opt-in Process**: Users explicitly consent to SMS messages during phone verification by checking a clearly labeled consent checkbox and accepting terms of service.

**Opt-out Process**: Users can opt out by replying STOP to any message, visiting our web opt-out page, or contacting support. All opt-out requests are processed immediately.

**Message Types**: Account verification codes, event invitations, RSVP confirmations, and event notifications.

**Data Retention**: SMS consent and opt-out data is retained for compliance and audit purposes.

## 🔒 Security & Privacy

### Data Protection
- Phone numbers stored securely in database
- Opt-out status checked before every message
- Compliance logs for audit purposes
- No sharing of user data with third parties

### Privacy Policy
Ensure your privacy policy includes:
- SMS data collection and use
- Opt-out procedures
- Data retention policies
- Third-party sharing (Twilio for message delivery)

## 🚨 Important Notes

1. **Webhook Security**: Consider implementing Twilio webhook signature validation
2. **Rate Limiting**: Implement rate limiting to prevent abuse
3. **Error Handling**: All SMS failures are logged for compliance
4. **Testing**: Test thoroughly in sandbox before production
5. **Documentation**: Keep this guide updated as requirements change

## 📞 Support & Resources

- **Twilio A2P Documentation**: https://www.twilio.com/docs/sms/a2p
- **CTIA Guidelines**: https://www.ctia.org/the-wireless-industry/industry-commitments/messaging-guidelines
- **TCPA Compliance**: https://www.fcc.gov/document/tcpa-rules

## 🔄 Deployment Steps

1. **Deploy Database Changes**
   ```bash
   psql -d production_db < sms-compliance-tables.sql
   ```

2. **Update Environment Variables**
   - Set all required Twilio and app URLs
   - Verify webhook endpoint is accessible

3. **Deploy Application**
   - Deploy all new API endpoints
   - Deploy frontend pages
   - Test webhook functionality

4. **Configure Twilio**
   - Set webhook URL in Twilio Console
   - Submit A2P campaign registration
   - Wait for approval (typically 1-2 weeks)

5. **Monitor & Verify**
   - Check compliance logs
   - Test opt-out functionality
   - Monitor message delivery rates

## ✅ Campaign Registration Checklist

- [ ] Database tables created
- [ ] Webhook endpoint configured
- [ ] Terms of service page deployed
- [ ] Opt-out page deployed
- [ ] All SMS templates updated
- [ ] Compliance logging implemented
- [ ] Campaign details prepared
- [ ] Sample messages ready
- [ ] Brand information complete
- [ ] A2P campaign submitted to Twilio

Once your campaign is approved, you'll receive confirmation and can begin sending compliant SMS messages through your application.

## 🔧 Troubleshooting

### Common Issues
1. **Webhook not receiving messages**: Check URL and security settings
2. **Opt-out not working**: Verify database permissions and table structure
3. **Messages not sending**: Check opt-out status and compliance logs
4. **Campaign rejected**: Review sample messages and opt-in/opt-out processes

### Debug Commands
```bash
# Check webhook logs
tail -f /var/log/your-app/webhook.log

# Check opt-out status
psql -c "SELECT phone_number, sms_opt_out FROM users WHERE phone_number = '+1234567890';"

# Check compliance logs
psql -c "SELECT * FROM sms_compliance_logs ORDER BY created_at DESC LIMIT 10;"
``` 