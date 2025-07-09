import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { insertEventSchema } from '@/utils/validators/event';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const eventData = await request.json();

    // Validate event data
    const validatedData = insertEventSchema.parse(eventData);

    // Check for environment variables (support multiple naming conventions)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_API_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables:', {
        supabaseUrl: !!supabaseUrl,
        supabaseServiceKey: !!supabaseServiceKey,
        availableEnvs: Object.keys(process.env).filter(k => k.includes('SUPABASE'))
      });
      return NextResponse.json(
        { 
          error: 'Supabase not configured', 
          details: 'Please set Supabase environment variables' 
        },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check user's plan and enforce limits
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        is_premium, 
        is_pro,
        logo_url,
        brand_primary_color,
        brand_secondary_color,
        brand_tertiary_color,
        custom_yup_text,
        custom_nope_text,
        custom_maybe_text
      `)
      .eq('id', eventData.hostId)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      return NextResponse.json(
        { error: 'Failed to verify user plan' },
        { status: 500 }
      );
    }

    // Check if user is on free plan (not pro or premium)
    const isFreeUser = !userData.is_premium && !userData.is_pro;

    if (isFreeUser) {
      // Count existing events for this user
      const { count: eventCount, error: countError } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('host_id', eventData.hostId);

      if (countError) {
        console.error('Error counting user events:', countError);
        return NextResponse.json(
          { error: 'Failed to check event limit' },
          { status: 500 }
        );
      }

      // Enforce 3-event limit for free users
      if (eventCount !== null && eventCount >= 3) {
        return NextResponse.json(
          { 
            error: 'Event limit reached', 
            details: 'Free accounts are limited to 3 events. Upgrade to Pro or Premium for unlimited events.',
            currentCount: eventCount,
            limit: 3,
            upgradeRequired: true
          },
          { status: 403 }
        );
      }
    }

    // Add host branding if user is premium
    if (userData.is_premium) {
      validatedData.hostBranding = {
        logoUrl: userData.logo_url || null,
        brandTheme: {
          primary: userData.brand_primary_color || null,
          secondary: userData.brand_secondary_color || null,
          tertiary: userData.brand_tertiary_color || null,
        },
        customRSVPText: {
          yup: userData.custom_yup_text || null,
          nope: userData.custom_nope_text || null,
          maybe: userData.custom_maybe_text || null,
        }
      };
    }

    // Build insert payload dynamically – include only columns that the current
    // Supabase schema supports. This prevents 500 errors when new fields have
    // not yet been migrated in prod/staging databases.

    const baseInsert: Record<string, unknown> = {
      title: validatedData.title,
      date: validatedData.date,
      start_time: validatedData.startTime,
      end_time: validatedData.endTime,
      location: validatedData.location,
      description: validatedData.description,
      host_id: validatedData.hostId,
      status: validatedData.status,
      slug: validatedData.slug,
    };

    // Optional/basic fields that *usually* exist
    if (validatedData.address) baseInsert.address = validatedData.address;
    if (validatedData.imageUrl) baseInsert.image_url = validatedData.imageUrl;

    // RSVP-related columns – add only if values are provided *and* the column
    // is expected to exist. The try/catch around the insert will retry without
    // them if Supabase says the column is unknown.
    if (validatedData.allowGuestRsvp !== undefined) {
      baseInsert.allow_guest_rsvp = validatedData.allowGuestRsvp;
      // For events that allow guest RSVPs, also enable public RSVP access
      baseInsert.public_rsvp_enabled = validatedData.allowGuestRsvp;
    }
    if (validatedData.allowPlusOne !== undefined) baseInsert.allow_plus_one = validatedData.allowPlusOne;
    if (validatedData.maxGuestsPerRsvp !== undefined) baseInsert.max_guests_per_rsvp = validatedData.maxGuestsPerRsvp;
    if (validatedData.customYesText) baseInsert.custom_yes_text = validatedData.customYesText;
    if (validatedData.customNoText) baseInsert.custom_no_text = validatedData.customNoText;
    if (validatedData.useCustomRsvpText !== undefined) baseInsert.use_custom_rsvp_text = validatedData.useCustomRsvpText;

    if (validatedData.hostBranding) {
      baseInsert.host_branding = validatedData.hostBranding;
    }

    // First insert attempt – try with the full payload.
    let { data: event, error: insertError } = await supabase
      .from('events')
      .insert([baseInsert])
      .select()
      .single();

    // If we get a “column does not exist” error, strip the offending column(s)
    // and retry once so that at least the core event is created.
    if (insertError && insertError.message?.includes('column')) {
      console.warn('Supabase column error – retrying without optional fields:', insertError.message);

      const safeInsert = { ...baseInsert };
      // Supabase may format unknown-column errors as either:
      //   "column \"xyz\" of relation ..."  (double quotes)
      //   "Could not find the 'xyz' column of ..." (single quotes)
      // Match either style so we can strip it.
      const colRegex = /["']([a-zA-Z0-9_]+)["'].*column|column.*["']([a-zA-Z0-9_]+)["']/gi;
      let match;
      // eslint-disable-next-line no-cond-assign
      while ((match = colRegex.exec(insertError.message)) !== null) {
        const col = match[1] || match[2];
        delete (safeInsert as any)[col];
      }

      ({ data: event, error: insertError } = await supabase
        .from('events')
        .insert([safeInsert])
        .select()
        .single());
    }

    if (insertError) {
      console.error('Error creating event:', insertError);
      return NextResponse.json(
        { error: 'Failed to create event' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error('Error in POST /api/events:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hostId = searchParams.get('hostId');
    
    // Check for environment variables (support multiple naming conventions)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_API_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { 
          error: 'Supabase not configured', 
          details: 'Please set Supabase environment variables' 
        },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from('events')
      .select('id, title, slug, date, start_time, end_time, location, description, image_url, host_id, created_at');

    if (hostId) {
      query = query.eq('host_id', hostId);
    }

    const { data: events, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch events', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ events }, { status: 200 });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 