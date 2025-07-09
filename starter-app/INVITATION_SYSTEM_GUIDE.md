# Optimized Invitation & Response System

This document outlines the comprehensive invitation and response system that has been built to handle SMS/email invitations and guest responses efficiently.

## Overview

The new system provides:
- **Unified invitation management** for SMS and email
- **Guest response capabilities** for public events without requiring accounts
- **Proper invitation tracking** with analytics
- **Template-based messaging** with custom branding
- **Automatic host notifications** via SMS
- **Response tokens** for guest response management

## Database Schema

### New Tables

#### 1. `invitations` Table
Tracks all invitations sent for events:
- `id`: Primary key
- `event_id`: References events table
- `invited_by`: Host who sent the invitation
- `invitation_method`: 'sms', 'email', or 'link'
- `recipient_phone/email/name`: Contact information
- `status`: 'sent', 'delivered', 'failed', 'opened', 'responded'
- `invitation_token`: UUID for tracking clicks/opens
- `twilio_message_sid`: For SMS tracking
- `email_message_id`: For email tracking

#### 2. `invitation_templates` Table
User-customizable templates for invitations:
- `user_id`: Template owner
- `template_type`: 'sms' or 'email'
- `message_template`: Template with placeholders like `{{event_name}}`
- `subject`: For email templates
- `use_custom_branding`: Enable branded styling

#### 3. `guest_invitation_links` Table
Shareable links for bulk guest access:
- `event_id`: Associated event
- `link_token`: Unique access token
- `max_uses`: Optional usage limit
- `expires_at`: Optional expiration

### Updated Tables

#### `responses` Table Enhancements
- `invitation_id`: Links responses to invitations
- `response_token`: Allows guests to edit responses later
- `responded_at`: Timestamp tracking

#### `events` Table Enhancements
- `public_rsvp_enabled`: Allow public guest responses
- `guest_approval_required`: Host approval for guests
- `auto_approve_guests`: Automatic approval setting

## API Endpoints

### 1. Unified Invitation API (`/api/invitations/send`)

**POST** - Send invitations via SMS or email
```typescript
{
  eventId: number;
  hostId: string;
  method: 'sms' | 'email';
  recipients: Array<{
    phone?: string;
    email?: string;
    name?: string;
  }>;
  customMessage?: string;
  templateId?: number;
}
```

**GET** - Retrieve invitation analytics
```
/api/invitations/send?eventId=123&hostId=user-id
```

### 2. Guest Response API (`/api/events/[slug]/guest-response`)

**POST** - Submit guest response
```typescript
{
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  responseType: 'yup' | 'nope' | 'maybe';
  guestCount: number;
  invitationToken?: string;
}
```

**GET** - Retrieve existing response or invitation data
```
/api/events/[slug]/guest-response?token=response-token
/api/events/[slug]/guest-response?inv=invitation-token
```

## Features

### Template System

The system supports customizable invitation templates with placeholders:

**Available Placeholders:**
- `{{event_name}}` - Event title
- `{{event_date}}` - Formatted event date
- `{{event_time}}` - Event start time
- `{{event_location}}` - Event location
- `{{event_description}}` - Event description
- `{{host_name}}` - Host display name
- `{{rsvp_link}}` - RSVP link with tracking
- `{{recipient_name}}` - Recipient's name

**Example SMS Template:**
```
Hi {{recipient_name}}! {{host_name}} invited you to "{{event_name}}" on {{event_date}}. RSVP here: {{rsvp_link}}
```

**Example Email Template:**
```
Subject: Invitation: {{event_name}}

Hi {{recipient_name}}!

{{host_name}} has invited you to {{event_name}}.

Date: {{event_date}}
Time: {{event_time}}
Location: {{event_location}}

{{event_description}}

Please RSVP here: {{rsvp_link}}

Looking forward to seeing you there!
```

### Invitation Tracking

Each invitation gets a unique token that enables:
- **Open tracking** when recipients click the RSVP link
- **Response linking** connecting invitations to responses
- **Analytics** showing delivery and response rates

### Guest Response System

#### For Public Events
- Guests can RSVP without creating accounts
- Form collects name, optional email/phone, response, and guest count
- Responses are linked to invitations if they came from an invitation link
- Host receives SMS notification of new responses

#### Guest Response Form Component
```typescript
<GuestResponseForm
  eventSlug="my-event"
  eventTitle="Summer BBQ"
  eventDate="Saturday, July 15, 2024"
  eventLocation="Central Park"
  maxGuestsPerRsvp={5}
  customRSVPText={{ yup: 'Count me in!', nope: 'Can't make it', maybe: 'Maybe' }}
  brandColors={{ primary: '#3b82f6', secondary: '#f1f5f9', tertiary: '#1e293b' }}
  invitationToken="uuid-from-url"
  onResponseSubmitted={(response) => console.log('Response submitted:', response)}
/>
```

### Host Notifications

Hosts automatically receive SMS notifications when:
- Someone responds to their event
- Response includes guest name, response type, and guest count
- Works for both authenticated users and guest responses

Example notification:
```
🎉 RSVP Update: John Smith responded YES to "Summer BBQ" (bringing 2 guests)
```

## Implementation Examples

### 1. Sending Invitations

```typescript
// Send SMS invitations
const response = await fetch('/api/invitations/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    eventId: 123,
    hostId: 'user-id',
    method: 'sms',
    recipients: [
      { phone: '+1234567890', name: 'John Doe' },
      { phone: '+0987654321', name: 'Jane Smith' }
    ],
    customMessage: 'Special invitation message here!'
  })
});
```

### 2. Processing Guest Responses

```typescript
// Submit guest response
const response = await fetch('/api/events/summer-bbq/guest-response', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    guestName: 'John Doe',
    guestEmail: 'john@example.com',
    responseType: 'yup',
    guestCount: 2,
    invitationToken: 'uuid-from-invitation-link'
  })
});
```

### 3. Getting Analytics

```typescript
// Fetch invitation analytics
const analytics = await fetch('/api/invitations/send?eventId=123&hostId=user-id');
const data = await analytics.json();

console.log('Analytics:', data.summary);
// {
//   total_sent: 10,
//   sms_sent: 6,
//   email_sent: 4,
//   delivered: 8,
//   opened: 5,
//   responded: 3,
//   failed: 1
// }
```

## Setup Instructions

### 1. Run Database Migration

Execute the SQL script to create the new tables and views:
```bash
# Run in Supabase SQL Editor
psql -f optimize-invitations-schema.sql
```

### 2. Environment Variables

Add email configuration to your environment:
```env
# Email Service (for sending email invitations)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Existing Twilio variables
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=your-twilio-number
```

### 3. Install Dependencies

```bash
# Add nodemailer for email support
npm install nodemailer
npm install @types/nodemailer --save-dev
```

## Benefits

### For Hosts
- **Unified interface** for sending both SMS and email invitations
- **Professional templates** with custom branding support
- **Real-time analytics** showing invitation performance
- **Automatic notifications** when guests respond
- **Guest management** without requiring guests to create accounts

### For Guests
- **No account required** for public events
- **Simple RSVP process** with clear form
- **Editable responses** using response tokens
- **Professional branded experience** matching host's branding

### For Developers
- **Clean API design** with proper error handling
- **Comprehensive tracking** of all invitation activities
- **Scalable architecture** with proper database relationships
- **Flexible template system** for customization

## Future Enhancements

1. **Email Templates**: Rich HTML email templates with drag-and-drop editor
2. **Bulk Import**: CSV upload for mass invitation sending
3. **Calendar Integration**: Add to calendar links in invitations
4. **Reminder System**: Automated follow-up reminders
5. **Advanced Analytics**: Response rate trends and insights
6. **Integration APIs**: Webhook support for external systems
7. **Multi-language**: Template translations for international events

This system provides a complete, production-ready solution for invitation management that scales from small personal events to large corporate gatherings. 