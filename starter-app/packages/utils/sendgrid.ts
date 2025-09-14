import sgMail from '@sendgrid/mail';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn('SENDGRID_API_KEY not found, email sending will fail');
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  fromEmail?: string;
  fromName?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  fromEmail = process.env.SENDGRID_FROM_EMAIL || 'no-reply@yup.rsvp',
  fromName = process.env.SENDGRID_FROM_NAME || 'Yup.RSVP'
}: SendEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SendGrid API key not configured');
    }

    const msg = {
      to,
      from: {
        email: fromEmail,
        name: fromName
      },
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      // Disable click tracking to avoid SSL certificate issues
      tracking_settings: {
        click_tracking: {
          enable: false
        },
        open_tracking: {
          enable: true // Keep open tracking for analytics
        }
      }
    };

    console.log('Sending email via SendGrid:', {
      to,
      from: `${fromName} <${fromEmail}>`,
      subject
    });

    const [response] = await sgMail.send(msg);

    console.log('SendGrid email sent successfully:', {
      messageId: response.headers['x-message-id'],
      statusCode: response.statusCode
    });

    return {
      success: true,
      messageId: response.headers['x-message-id']
    };

  } catch (error: any) {
    console.error('SendGrid email error:', error);
    
    // Handle SendGrid specific errors
    if (error.response) {
      console.error('SendGrid error response:', error.response.body);
      return {
        success: false,
        error: `SendGrid error: ${error.response.body?.errors?.[0]?.message || error.message}`
      };
    }

    return {
      success: false,
      error: error.message || 'Failed to send email'
    };
  }
}

// Send invitation email with branding
export async function sendInvitationEmail({
  to,
  toName,
  eventData,
  hostData,
  rsvpLink,
  template
}: {
  to: string;
  toName?: string;
  eventData: any;
  hostData: any;
  rsvpLink: string;
  template: any;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Replace template placeholders
    const subject = replacePlaceholders(
      template.subject || 'You\'re invited to {{event_name}}',
      eventData,
      hostData,
      rsvpLink,
      toName
    );

    let htmlMessage = replacePlaceholders(
      template.message_template,
      eventData,
      hostData,
      rsvpLink,
      toName
    ).replace(/\n/g, '<br>');

    // Custom message functionality removed - using branded template instead

    // Create branded HTML email that matches the event preview
    const primaryColor = hostData.brand_primary_color || '#ec4899';
    const secondaryColor = hostData.brand_secondary_color || '#0a0a14';
    const tertiaryColor = hostData.brand_tertiary_color || '#fafafa';
    const logoUrl = hostData.logo_url;
    
    // Get custom RSVP text (available for Pro and Premium users)
    const yupText = hostData.custom_yup_text || 'YES!';
    const nopeText = hostData.custom_nope_text || 'NO!';
    const maybeText = hostData.custom_maybe_text || "I'll Think About It!";

    // Helper function for text contrast
    const getContrastingTextColor = (bgColor: string) => {
      const hex = bgColor.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance < 0.5 ? '#ffffff' : '#000000';
    };

    // Create email with left/right split layout as requested
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invitation: ${eventData.title}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      </head>
      <body style="margin: 0; padding: 20px; background-color: ${secondaryColor}; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        <div style="max-width: 800px; margin: 0 auto; background-color: ${secondaryColor}; border: 2px solid ${primaryColor}; border-radius: 8px; overflow: hidden;">
          
          <!-- Main Content: Three Section Layout -->
          <table cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse;">
            <!-- TOP ROW: Left and Right Cells -->
            <tr>
              <!-- LEFT CELL: YUP.RSVP Logo + Event Title + Event Image -->
              <td style="width: 50%; padding: 30px; vertical-align: top; background-color: ${secondaryColor}; border-right: 1px solid ${primaryColor}; border-bottom: 1px solid ${primaryColor}; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1);">
                
                                  <!-- YUP.RSVP Header -->
                  <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid ${primaryColor}; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                    <div style="margin-bottom: 15px; display: flex; justify-content: center; align-items: center;">
                      <span style="font-size: 24px; font-weight: 600; color: ${tertiaryColor}; letter-spacing: 1px; text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);">YUP.</span>
                      <span style="font-size: 24px; font-weight: 600; color: ${primaryColor}; letter-spacing: 1px; text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);">RSVP</span>
                    </div>
                    ${logoUrl ? `<div style="display: flex; justify-content: center; align-items: center; height: 80px; width: 100%;"><img src="${logoUrl}" alt="Host Logo" style="max-height: 80px; max-width: 200px; border: 2px solid ${primaryColor}; border-radius: 8px; object-fit: contain; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); display: block; margin: 0 auto;"></div>` : ''}
                  </div>
                
                <!-- Event Title -->
                <div style="display: flex; align-items: center; justify-content: center; margin: 0 auto 25px auto; padding: 20px; border: 2px solid ${primaryColor}; border-radius: 8px; background-color: ${secondaryColor}; width: 280px; min-height: 60px; box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2), 0 3px 8px rgba(0, 0, 0, 0.12);">
                  <h1 style="font-size: 28px; font-weight: 700; color: ${tertiaryColor}; margin: 0; line-height: 1.2; letter-spacing: 1px; text-align: center; width: 100%; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);">
                    ${eventData.title}
                  </h1>
                </div>
                
                <!-- Event Image (if available) -->
                ${eventData.image_url ? `
                  <div style="display: flex; justify-content: center; align-items: center; margin: 0 auto; max-width: 280px;">
                    <img src="${eventData.image_url}" alt="${eventData.title}" style="width: 100%; height: 180px; border-radius: 8px; border: 2px solid ${primaryColor}; object-fit: cover; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), 0 4px 8px rgba(0, 0, 0, 0.15);">
                  </div>
                ` : ''}
                
              </td>
              
              <!-- RIGHT CELL: Host Info + Event Details + Description -->
              <td style="width: 50%; padding: 30px; vertical-align: top; background-color: ${secondaryColor}; border-bottom: 1px solid ${primaryColor}; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1);">
                
                <!-- Host Information -->
                <div style="text-align: center; margin: 0 auto 25px auto; padding: 20px; border: 1px solid ${primaryColor}40; border-radius: 8px; max-width: 250px; box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2), 0 3px 8px rgba(0, 0, 0, 0.12);">
                  <div style="margin-bottom: 12px;">
                    ${hostData.profile_image_url ? `<img src="${hostData.profile_image_url}" alt="${hostData.display_name}" style="width: 70px; height: 70px; border-radius: 50%; border: 3px solid ${primaryColor}; object-fit: cover; display: block; margin: 0 auto; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);">` : `<div style="width: 70px; height: 70px; border-radius: 50%; border: 3px solid ${primaryColor}; background-color: ${primaryColor}; color: ${getContrastingTextColor(primaryColor)}; display: inline-flex; align-items: center; justify-content: center; margin: 0 auto; font-weight: bold; font-size: 28px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);">${(hostData.display_name || hostData.email || 'H').charAt(0).toUpperCase()}</div>`}
                  </div>
                  <h3 style="color: ${primaryColor}; margin: 0 0 6px 0; font-size: 14px; font-weight: 600; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);">Hosted by</h3>
                  <p style="color: ${tertiaryColor}; margin: 0; font-size: 15px; font-weight: 600;">${hostData.display_name || 'Event Host'}</p>
                  <p style="color: ${tertiaryColor}; opacity: 0.8; margin: 4px 0 0 0; font-size: 12px;">${hostData.email}</p>
                </div>
                
                <!-- Event Details -->
                <div style="margin: 0 auto 25px auto; padding: 20px; border: 1px solid ${primaryColor}40; border-radius: 8px; background-color: ${secondaryColor}; max-width: 250px; box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2), 0 3px 8px rgba(0, 0, 0, 0.12);">
                  <div style="margin-bottom: 15px;">
                    <h3 style="color: ${primaryColor}; margin: 0 0 8px 0; font-size: 14px; font-weight: 600; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);">📅 When</h3>
                    <p style="color: ${tertiaryColor}; margin: 0; font-size: 14px; font-weight: 500;">${formatEventDate(eventData.date)}</p>
                    ${eventData.start_time ? `<p style="color: ${tertiaryColor}; margin: 6px 0 0 0; font-size: 14px;">${formatEventTime(eventData.start_time)}${eventData.end_time ? ` - ${formatEventTime(eventData.end_time)}` : ''}</p>` : ''}
                  </div>
                  
                  ${eventData.location ? `
                    <div>
                      <h3 style="color: ${primaryColor}; margin: 0 0 8px 0; font-size: 14px; font-weight: 600; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);">📍 Where</h3>
                      <p style="color: ${tertiaryColor}; margin: 0; font-size: 14px;">${eventData.location}</p>
                    </div>
                  ` : ''}
                </div>

                <!-- Event Description -->
                ${eventData.description ? `
                  <div style="margin: 0 auto; padding: 20px; border: 1px solid ${primaryColor}40; border-radius: 8px; max-width: 250px; box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2), 0 3px 8px rgba(0, 0, 0, 0.12);">
                    <p style="color: ${tertiaryColor}; font-size: 14px; line-height: 1.5; margin: 0; text-align: center;">
                      ${eventData.description}
                    </p>
                  </div>
                ` : ''}
                
              </td>
            </tr>
            
            <!-- BOTTOM ROW: Full Width "You're Invited!" Section -->
            <tr>
              <td colspan="2" style="padding: 30px; text-align: center; background-color: ${secondaryColor}; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1);">
                <div style="background-color: ${secondaryColor}; margin: 0 auto; padding: 30px; border: 2px solid ${primaryColor}; border-radius: 8px; max-width: 400px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25), 0 4px 12px rgba(0, 0, 0, 0.15);">
                  <h2 style="color: ${tertiaryColor}; margin: 0 0 25px 0; font-size: 24px; font-weight: 700; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);">
                    You're Invited!
                  </h2>
                  <a href="${rsvpLink}" style="display: inline-block; background-color: ${primaryColor}; color: ${getContrastingTextColor(primaryColor)}; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 8px 0; letter-spacing: 0.5px; box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25), 0 3px 8px rgba(0, 0, 0, 0.15);">
                    View Event & RSVP
                  </a>
                  <p style="color: ${tertiaryColor}; opacity: 0.8; font-size: 13px; margin: 15px 0 0 0; font-weight: 400;">
                    Click above to view the full event details and respond
                  </p>
                </div>
              </td>
            </tr>
          </table>

          <!-- Powered by Footer -->
          <div style="background-color: ${secondaryColor}; padding: 20px; text-align: center; border-top: 1px solid ${primaryColor};">
            <p style="font-size: 12px; color: ${tertiaryColor}; opacity: 0.7; margin: 0;">
              Powered by <a href="https://yup.rsvp" style="color: ${primaryColor}; text-decoration: none;">YUP.RSVP</a>
            </p>
          </div>
          
        </div>
      </body>
      </html>
    `;

    // Use host's name and verified sender email
    const fromName = hostData.display_name || 'Event Host';
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'no-reply@yup.rsvp';

    return await sendEmail({
      to,
      subject,
      html: emailHtml,
      fromEmail,
      fromName
    });

  } catch (error: any) {
    console.error('Error sending invitation email:', error);
    return {
      success: false,
      error: error.message || 'Failed to send invitation email'
    };
  }
}

// Helper function to replace template placeholders (moved from route)
function replacePlaceholders(
  template: string, 
  eventData: any, 
  hostData: any, 
  rsvpLink: string,
  recipientName?: string
): string {
  return template
    .replace(/\{\{event_name\}\}/g, eventData.title || 'Event')
    .replace(/\{\{event_date\}\}/g, formatEventDate(eventData.date))
    .replace(/\{\{event_time\}\}/g, eventData.start_time || '')
    .replace(/\{\{event_location\}\}/g, eventData.location || '')
    .replace(/\{\{host_name\}\}/g, hostData.display_name || 'Event Host')
    .replace(/\{\{recipient_name\}\}/g, recipientName || 'Guest')
    .replace(/\{\{rsvp_link\}\}/g, rsvpLink);
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

function formatEventTime(timeString: string): string {
  try {
    // Parse time string (assuming HH:MM format)
    const [hours, minutes] = timeString.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  } catch {
    return timeString;
  }
}

// Send RSVP notification email to event host
export async function sendRSVPNotificationEmail({
  hostEmail,
  hostName,
  guestName,
  guestEmail,
  eventName,
  responseType,
  guestCount = 1
}: {
  hostEmail: string;
  hostName: string;
  guestName: string;
  guestEmail?: string;
  eventName: string;
  responseType: "yup" | "nope" | "maybe";
  guestCount: number;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  
  const responseText = responseType === "yup" ? "YES" : responseType === "nope" ? "NO" : "MAYBE";
  const guestText = guestCount > 1 ? ` (bringing ${guestCount - 1} guest${guestCount > 2 ? 's' : ''})` : '';
  const guestEmailText = guestEmail ? ` (${guestEmail})` : '';
  
  const subject = `🎉 New RSVP: ${guestName} responded ${responseText} to "${eventName}"`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🎉 New RSVP Response</h1>
      </div>
      
      <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #333; margin-top: 0;">Response Details</h2>
        <p style="margin: 10px 0;"><strong>Guest:</strong> ${guestName}${guestEmailText}</p>
        <p style="margin: 10px 0;"><strong>Event:</strong> ${eventName}</p>
        <p style="margin: 10px 0;"><strong>Response:</strong> <span style="color: ${responseType === 'yup' ? '#16a34a' : responseType === 'nope' ? '#dc2626' : '#ca8a04'}; font-weight: bold;">${responseText}</span></p>
        ${guestCount > 1 ? `<p style="margin: 10px 0;"><strong>Total Guests:</strong> ${guestCount}</p>` : ''}
      </div>
      
      <div style="text-align: center; margin-top: 30px;">
        <p style="color: #666; font-size: 14px;">
          This is an automated notification from Yup.RSVP
        </p>
      </div>
    </div>
  `;

  const text = `
New RSVP Response

Guest: ${guestName}${guestEmailText}
Event: ${eventName}
Response: ${responseText}${guestText}

This is an automated notification from Yup.RSVP
  `;

  return sendEmail({
    to: hostEmail,
    subject,
    html,
    text
  });
}