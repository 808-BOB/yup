import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendInvitationEmail } from '@/utils/sendgrid';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

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

// SendGrid is now handled in the sendgrid utility

interface InvitationData {
  eventId: number;
  hostId: string;
  method: 'email'; // Only support email now
  recipients: Array<{
    email: string;
    name?: string;
  }>;
  customMessage?: string;
  templateId?: number;
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

// Send Email invitation
// Email sending is now handled by SendGrid utility

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
    if (method !== 'email') {
      return NextResponse.json(
        { error: 'Invalid method. Only "email" is supported' },
        { status: 400 }
      );
    }

    console.log('Processing invitation request:', { eventId, hostId, recipientCount: recipients.length });

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

    // Fetch host data with branding and profile image
    const { data: hostData, error: hostError } = await supabase
      .from('users')
      .select(`
        display_name, email, profile_image_url, logo_url, brand_primary_color,
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
        .eq('template_type', 'email') // Only email templates
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
        .eq('template_type', 'email') // Only email templates
        .eq('is_default', true)
        .single();

      if (defaultError || !defaultTemplate) {
        // Create a basic default template
        template = {
          message_template: 'Hi!\n\n{{host_name}} has invited you to {{event_name}}.\n\nDate: {{event_date}}\nTime: {{event_time}}\nLocation: {{event_location}}\n\nPlease RSVP here: {{rsvp_link}}',
          subject: 'Invitation: {{event_name}}',
          use_custom_branding: false
        };
      } else {
        template = defaultTemplate;
      }
    }

    // Create RSVP link - using the invitation token for tracking
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yup.rsvp';
    
    const results = [];
    const errors = [];

    // Process each recipient
    for (const recipient of recipients) {
      try {
        // Validate recipient data based on method
        if (!recipient.email) {
          errors.push(`Missing email address for recipient: ${recipient.name || 'Unknown'}`);
          continue;
        }

        // Create invitation record
        const { data: invitationData, error: invitationError } = await supabase
          .from('invitations')
          .insert({
            event_id: eventId,
            invited_by: hostId,
            invitation_method: 'email',
            recipient_email: recipient.email,
            recipient_name: recipient.name,
            custom_message: customMessage,
            status: 'sent'
          })
          .select()
          .single();

        if (invitationError) {
          errors.push(`Failed to create invitation for ${recipient.name || recipient.email}: ${invitationError.message}`);
          continue;
        }

        // Create RSVP link with invitation token for tracking
        const rsvpLink = `${baseUrl}/events/${eventData.slug}?inv=${invitationData.invitation_token}`;

        // Send invitation based on method using SendGrid
        const sendResult = await sendInvitationEmail({
          to: recipient.email,
          toName: recipient.name,
          eventData,
          hostData,
          rsvpLink,
          template
        });

        // Update invitation with email message ID if successful
        if (sendResult.success && sendResult.messageId) {
          await supabase
            .from('invitations')
            .update({ 
              email_message_id: sendResult.messageId,
              sent_at: new Date().toISOString()
            })
            .eq('id', invitationData.id);
        } else if (!sendResult.success) {
          // Update invitation status to failed
          await supabase
            .from('invitations')
            .update({ status: 'failed' })
            .eq('id', invitationData.id);
        }

        results.push({
          recipient: recipient,
          invitation_id: invitationData.id,
          invitation_token: invitationData.invitation_token,
          success: sendResult.success,
          message_id: sendResult.messageId,
          error: sendResult.error
        });

      } catch (error: any) {
        console.error('Error processing recipient:', error);
        errors.push(`Failed to send to ${recipient.name || recipient.email}: ${error.message}`);
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