import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';
import nodemailer from 'nodemailer';

// Create Supabase client with service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Initialize email client (using nodemailer with your email service)
const emailClient = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

interface InvitationData {
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

// Helper function to normalize phone number
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

// Helper function to replace template placeholders
function replacePlaceholders(
  template: string, 
  eventData: any, 
  hostData: any, 
  rsvpLink: string,
  recipientName?: string
): string {
  return template
    .replace(/\{\{event_name\}\}/g, eventData.title || '')
    .replace(/\{\{event_date\}\}/g, formatEventDate(eventData.date) || '')
    .replace(/\{\{event_time\}\}/g, eventData.start_time || '')
    .replace(/\{\{event_location\}\}/g, eventData.location || '')
    .replace(/\{\{event_description\}\}/g, eventData.description || '')
    .replace(/\{\{host_name\}\}/g, hostData.display_name || hostData.email || 'Someone')
    .replace(/\{\{rsvp_link\}\}/g, rsvpLink)
    .replace(/\{\{recipient_name\}\}/g, recipientName || 'there');
}

function formatEventDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}

// Send SMS invitation
async function sendSMSInvitation(
  invitation: any,
  eventData: any,
  hostData: any,
  messageTemplate: string,
  rsvpLink: string
): Promise<{ success: boolean; messageSid?: string; error?: string }> {
  try {
    if (!invitation.recipient_phone) {
      throw new Error('Phone number is required for SMS invitation');
    }

    const normalizedPhone = normalizePhoneNumber(invitation.recipient_phone);
    const message = replacePlaceholders(
      messageTemplate,
      eventData,
      hostData,
      rsvpLink,
      invitation.recipient_name
    );

    console.log('Sending SMS to:', normalizedPhone);
    console.log('Message:', message);

    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: normalizedPhone,
    });

    // Update invitation with Twilio message SID
    await supabase
      .from('invitations')
      .update({ 
        twilio_message_sid: result.sid,
        status: result.status === 'queued' ? 'sent' : result.status,
        delivered_at: result.status === 'delivered' ? new Date().toISOString() : null
      })
      .eq('id', invitation.id);

    return { success: true, messageSid: result.sid };
  } catch (error: any) {
    console.error('SMS sending error:', error);
    
    // Update invitation status to failed
    await supabase
      .from('invitations')
      .update({ status: 'failed' })
      .eq('id', invitation.id);

    return { success: false, error: error.message };
  }
}

// Send Email invitation
async function sendEmailInvitation(
  invitation: any,
  eventData: any,
  hostData: any,
  template: any,
  rsvpLink: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!invitation.recipient_email) {
      throw new Error('Email address is required for email invitation');
    }

    const subject = replacePlaceholders(
      template.subject || 'You\'re invited to {{event_name}}',
      eventData,
      hostData,
      rsvpLink,
      invitation.recipient_name
    );

    const htmlMessage = replacePlaceholders(
      template.message_template,
      eventData,
      hostData,
      rsvpLink,
      invitation.recipient_name
    ).replace(/\n/g, '<br>');

    // Create branded HTML email if custom branding is enabled
    let emailHtml = htmlMessage;
    if (template.use_custom_branding && hostData.is_premium) {
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          ${template.logo_url ? `<img src="${template.logo_url}" alt="Logo" style="max-height: 80px; margin-bottom: 20px;">` : ''}
          <div style="background-color: ${template.secondary_color || '#f8f9fa'}; padding: 20px; border-radius: 8px; border-left: 4px solid ${template.primary_color || '#007bff'};">
            ${emailHtml}
          </div>
          <p style="font-size: 12px; color: #666; margin-top: 20px;">
            Powered by YUP.RSVP
          </p>
        </div>
      `;
    }

    console.log('Sending email to:', invitation.recipient_email);
    console.log('Subject:', subject);

    const result = await emailClient.sendMail({
      from: `"${hostData.display_name || 'Event Host'}" <${process.env.EMAIL_USER}>`,
      to: invitation.recipient_email,
      subject: subject,
      html: emailHtml,
      text: htmlMessage.replace(/<br>/g, '\n').replace(/<[^>]*>/g, ''), // Fallback plain text
    });

    // Update invitation with email message ID
    await supabase
      .from('invitations')
      .update({ 
        email_message_id: result.messageId,
        status: 'sent'
      })
      .eq('id', invitation.id);

    return { success: true, messageId: result.messageId };
  } catch (error: any) {
    console.error('Email sending error:', error);
    
    // Update invitation status to failed
    await supabase
      .from('invitations')
      .update({ status: 'failed' })
      .eq('id', invitation.id);

    return { success: false, error: error.message };
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      eventId,
      hostId,
      method,
      recipients,
      customMessage,
      templateId
    }: InvitationData = await request.json();

    // Validate required fields
    if (!eventId || !hostId || !method || !recipients || recipients.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: eventId, hostId, method, recipients' },
        { status: 400 }
      );
    }

    // Validate method
    if (!['sms', 'email'].includes(method)) {
      return NextResponse.json(
        { error: 'Invalid method. Must be "sms" or "email"' },
        { status: 400 }
      );
    }

    console.log('Processing invitation request:', { eventId, hostId, method, recipientCount: recipients.length });

    // Fetch event data
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .eq('host_id', hostId) // Ensure user owns the event
      .single();

    if (eventError || !eventData) {
      return NextResponse.json(
        { error: 'Event not found or you do not have permission to send invitations' },
        { status: 404 }
      );
    }

    // Fetch host data with branding
    const { data: hostData, error: hostError } = await supabase
      .from('users')
      .select(`
        display_name, email, logo_url, brand_primary_color,
        brand_secondary_color, brand_tertiary_color, is_premium,
        custom_yup_text, custom_nope_text, custom_maybe_text
      `)
      .eq('id', hostId)
      .single();

    if (hostError || !hostData) {
      return NextResponse.json(
        { error: 'Host data not found' },
        { status: 404 }
      );
    }

    // Fetch invitation template
    let template;
    if (templateId) {
      const { data: templateData, error: templateError } = await supabase
        .from('invitation_templates')
        .select('*')
        .eq('id', templateId)
        .eq('user_id', hostId)
        .eq('template_type', method)
        .single();

      if (templateError) {
        return NextResponse.json(
          { error: 'Invitation template not found' },
          { status: 404 }
        );
      }
      template = templateData;
    } else {
      // Use default template
      const { data: defaultTemplate, error: defaultError } = await supabase
        .from('invitation_templates')
        .select('*')
        .eq('user_id', hostId)
        .eq('template_type', method)
        .eq('is_default', true)
        .single();

      if (defaultError || !defaultTemplate) {
        // Create a basic default template
        template = {
          message_template: method === 'sms' 
            ? 'Hi! {{host_name}} invited you to "{{event_name}}" on {{event_date}}. RSVP here: {{rsvp_link}}'
            : 'Hi!\n\n{{host_name}} has invited you to {{event_name}}.\n\nDate: {{event_date}}\nTime: {{event_time}}\nLocation: {{event_location}}\n\nPlease RSVP here: {{rsvp_link}}',
          subject: 'Invitation: {{event_name}}',
          use_custom_branding: false
        };
      } else {
        template = defaultTemplate;
      }
    }

    // Create RSVP link - using the invitation token for tracking
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    
    const results = [];
    const errors = [];

    // Process each recipient
    for (const recipient of recipients) {
      try {
        // Validate recipient data based on method
        if (method === 'sms' && !recipient.phone) {
          errors.push(`Missing phone number for recipient: ${recipient.name || 'Unknown'}`);
          continue;
        }
        if (method === 'email' && !recipient.email) {
          errors.push(`Missing email address for recipient: ${recipient.name || 'Unknown'}`);
          continue;
        }

        // Create invitation record
        const { data: invitationData, error: invitationError } = await supabase
          .from('invitations')
          .insert({
            event_id: eventId,
            invited_by: hostId,
            invitation_method: method,
            recipient_phone: method === 'sms' ? recipient.phone : null,
            recipient_email: method === 'email' ? recipient.email : null,
            recipient_name: recipient.name,
            custom_message: customMessage,
            status: 'sent'
          })
          .select()
          .single();

        if (invitationError) {
          errors.push(`Failed to create invitation for ${recipient.name || recipient.phone || recipient.email}: ${invitationError.message}`);
          continue;
        }

        // Create RSVP link with invitation token for tracking
        const rsvpLink = `${baseUrl}/events/${eventData.slug}?inv=${invitationData.invitation_token}`;

        // Send invitation based on method
        let sendResult;
        if (method === 'sms') {
          sendResult = await sendSMSInvitation(
            invitationData,
            eventData,
            hostData,
            customMessage || template.message_template,
            rsvpLink
          );
        } else {
          sendResult = await sendEmailInvitation(
            invitationData,
            eventData,
            hostData,
            template,
            rsvpLink
          );
        }

        results.push({
          recipient: recipient,
          invitation_id: invitationData.id,
          invitation_token: invitationData.invitation_token,
          success: sendResult.success,
          message_id: sendResult.messageSid || sendResult.messageId,
          error: sendResult.error
        });

      } catch (error: any) {
        console.error('Error processing recipient:', error);
        errors.push(`Failed to send to ${recipient.name || recipient.phone || recipient.email}: ${error.message}`);
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length + errors.length;

    return NextResponse.json({
      success: true,
      message: `Invitations processed: ${successCount} sent, ${failureCount} failed`,
      results: results,
      errors: errors,
      summary: {
        total: recipients.length,
        sent: successCount,
        failed: failureCount
      }
    });

  } catch (error: any) {
    console.error('Error in invitation API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve invitation analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const hostId = searchParams.get('hostId');

    if (!eventId || !hostId) {
      return NextResponse.json(
        { error: 'Missing eventId or hostId parameters' },
        { status: 400 }
      );
    }

    // Verify user owns the event
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('id', eventId)
      .eq('host_id', hostId)
      .single();

    if (eventError || !eventData) {
      return NextResponse.json(
        { error: 'Event not found or access denied' },
        { status: 404 }
      );
    }

    // Get invitation analytics
    const { data: analytics, error: analyticsError } = await supabase
      .from('invitation_analytics')
      .select('*')
      .eq('event_id', eventId)
      .order('sent_at', { ascending: false });

    if (analyticsError) {
      return NextResponse.json(
        { error: 'Failed to fetch analytics' },
        { status: 500 }
      );
    }

    // Calculate summary statistics
    const summary = {
      total_sent: analytics?.length || 0,
      sms_sent: analytics?.filter(a => a.invitation_method === 'sms').length || 0,
      email_sent: analytics?.filter(a => a.invitation_method === 'email').length || 0,
      delivered: analytics?.filter(a => a.final_status === 'delivered').length || 0,
      opened: analytics?.filter(a => a.final_status === 'opened').length || 0,
      responded: analytics?.filter(a => a.final_status === 'responded').length || 0,
      failed: analytics?.filter(a => a.final_status === 'failed').length || 0,
    };

    return NextResponse.json({
      success: true,
      analytics: analytics,
      summary: summary
    });

  } catch (error: any) {
    console.error('Error fetching invitation analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 