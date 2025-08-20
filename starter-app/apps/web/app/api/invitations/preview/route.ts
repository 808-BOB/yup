import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

export async function POST(request: NextRequest) {
  try {
    const { eventId, hostId } = await request.json();

    if (!eventId || !hostId) {
      return NextResponse.json(
        { error: 'Missing required fields: eventId, hostId' },
        { status: 400 }
      );
    }

    // Fetch event data
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .eq('host_id', hostId)
      .single();

    if (eventError || !eventData) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Fetch host data with branding and images
    const { data: hostData, error: hostError } = await supabase
      .from('users')
      .select(`
        display_name, email, profile_image_url, logo_url, 
        brand_primary_color, brand_secondary_color, brand_tertiary_color, 
        is_premium, custom_yup_text, custom_nope_text, custom_maybe_text
      `)
      .eq('id', hostId)
      .single();

    if (hostError || !hostData) {
      return NextResponse.json(
        { error: 'Host data not found' },
        { status: 404 }
      );
    }

    // Generate preview HTML using the same logic as the email template
    const primaryColor = hostData.brand_primary_color || '#ec4899';
    const secondaryColor = hostData.brand_secondary_color || '#0a0a14';
    const tertiaryColor = hostData.brand_tertiary_color || '#fafafa';
    const logoUrl = hostData.logo_url;

    const getContrastingTextColor = (bgColor: string) => {
      const hex = bgColor.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance < 0.5 ? '#ffffff' : '#000000';
    };

    const formatEventDate = (dateString: string) => {
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
    };

    const previewHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Preview: ${eventData.title}</title>
      </head>
      <body style="margin: 0; padding: 20px; background-color: ${secondaryColor}; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: ${secondaryColor}; border: 2px solid ${primaryColor}; border-radius: 8px; overflow: hidden;">
          
          <!-- Header with full branding -->
          <div style="background-color: ${secondaryColor}; padding: 30px 20px; text-align: center; border-bottom: 2px solid ${primaryColor};">
            <div style="margin-bottom: 15px;">
              <span style="font-size: 28px; font-weight: bold; color: ${tertiaryColor}; letter-spacing: 1px;">YUP.</span>
              <span style="font-size: 28px; font-weight: bold; color: ${primaryColor}; letter-spacing: 1px;">RSVP</span>
            </div>
            ${logoUrl ? `<img src="${logoUrl}" alt="Event Logo" style="max-height: 60px; display: block; margin: 0 auto;">` : ''}
          </div>

          <!-- Event Content -->
          <div style="background-color: ${secondaryColor}; padding: 40px 30px; color: ${tertiaryColor};">
            
            <!-- Event Title -->
            <div style="text-align: center; margin-bottom: 30px; padding: 30px; border: 2px solid ${primaryColor}; border-radius: 8px; background-color: ${secondaryColor};">
              <h1 style="font-size: 42px; font-weight: bold; color: ${tertiaryColor}; margin: 0; line-height: 1.1; letter-spacing: 2px;">
                ${eventData.title}
              </h1>
            </div>
            
            <!-- Event Image (if available) -->
            ${eventData.image_url ? `
              <div style="text-align: center; margin-bottom: 30px;">
                <img src="${eventData.image_url}" alt="${eventData.title}" style="max-width: 100%; height: auto; border-radius: 8px; border: 2px solid ${primaryColor};">
              </div>
            ` : ''}

            <!-- Horizontal Layout: Host + Event Details -->
            <div style="margin-bottom: 40px;">
              <table cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <!-- Host Information -->
                  <td style="width: 50%; padding: 20px; vertical-align: top; background-color: ${secondaryColor}; border: 1px solid ${primaryColor}40; border-radius: 8px 0 0 8px;">
                    <div style="text-align: center; margin-bottom: 15px;">
                      ${hostData.profile_image_url ? `<img src="${hostData.profile_image_url}" alt="${hostData.display_name}" style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid ${primaryColor}; object-fit: cover; display: block; margin: 0 auto;">` : `<div style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid ${primaryColor}; background-color: ${primaryColor}; color: ${getContrastingTextColor(primaryColor)}; display: flex; align-items: center; justify-content: center; margin: 0 auto; font-weight: bold; font-size: 32px;">${(hostData.display_name || hostData.email || 'H').charAt(0).toUpperCase()}</div>`}
                    </div>
                    <h3 style="color: ${primaryColor}; margin: 0 0 8px 0; font-size: 18px; font-weight: bold; text-align: center;">Hosted by</h3>
                    <p style="color: ${tertiaryColor}; margin: 0; font-size: 16px; font-weight: 600; text-align: center;">${hostData.display_name || 'Event Host'}</p>
                    <p style="color: ${tertiaryColor}; opacity: 0.8; margin: 5px 0 0 0; font-size: 14px; text-align: center;">${hostData.email}</p>
                  </td>
                  
                  <!-- Event Details -->
                  <td style="width: 50%; padding: 20px; vertical-align: top; background-color: ${secondaryColor}; border: 1px solid ${primaryColor}40; border-left: none; border-radius: 0 8px 8px 0;">
                    <div style="text-align: left;">
                      <div style="margin-bottom: 20px;">
                        <h3 style="color: ${primaryColor}; margin: 0 0 10px 0; font-size: 18px; font-weight: bold;">📅 When</h3>
                        <p style="color: ${tertiaryColor}; margin: 0; font-size: 16px; font-weight: 500;">${formatEventDate(eventData.date)}</p>
                        ${eventData.start_time ? `<p style="color: ${tertiaryColor}; margin: 8px 0 0 0; font-size: 16px;">${eventData.start_time}${eventData.end_time ? ` - ${eventData.end_time}` : ''}</p>` : ''}
                      </div>
                      
                      ${eventData.location ? `
                        <div style="margin-bottom: 20px;">
                          <h3 style="color: ${primaryColor}; margin: 0 0 10px 0; font-size: 18px; font-weight: bold;">📍 Where</h3>
                          <p style="color: ${tertiaryColor}; margin: 0; font-size: 16px;">${eventData.location}</p>
                        </div>
                      ` : ''}
                    </div>
                  </td>
                </tr>
              </table>
            </div>

            ${eventData.description ? `
              <div style="margin-bottom: 40px; background-color: ${secondaryColor}; padding: 25px; border: 1px solid ${primaryColor}40; border-radius: 8px;">
                <p style="color: ${tertiaryColor}; font-size: 16px; line-height: 1.6; margin: 0; text-align: center;">
                  ${eventData.description}
                </p>
              </div>
            ` : ''}

            <!-- Call to Action -->
            <div style="text-align: center; margin-top: 40px; background-color: ${secondaryColor}; padding: 30px; border: 2px solid ${primaryColor}; border-radius: 8px;">
              <h2 style="color: ${tertiaryColor}; margin: 0 0 20px 0; font-size: 24px; font-weight: bold;">
                You're Invited!
              </h2>
              <a href="#" style="display: inline-block; background-color: ${primaryColor}; color: ${getContrastingTextColor(primaryColor)}; padding: 18px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; margin: 10px 0;">
                View Event & RSVP
              </a>
              <p style="color: ${tertiaryColor}; opacity: 0.8; font-size: 14px; margin: 15px 0 0 0;">
                Click above to view the full event details and respond
              </p>
            </div>

          </div>
        </div>
      </body>
      </html>
    `;

    return NextResponse.json({ 
      success: true, 
      html: previewHtml 
    });

  } catch (error: any) {
    console.error('Error generating email preview:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate preview' },
      { status: 500 }
    );
  }
}
