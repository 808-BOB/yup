import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const eventData = await request.json();
    
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

    // Insert the event into Supabase with the correct schema
    const { data: event, error } = await supabase
      .from('events')
      .insert([{
        title: eventData.title,
        description: eventData.description || null,
        date: eventData.date,
        start_time: eventData.startTime,
        end_time: eventData.endTime,
        location: eventData.location,
        address: eventData.address || null,
        image_url: eventData.imageUrl || null,
        host_id: eventData.hostId, // This should be a UUID from auth.users
        status: eventData.status || 'open',
        slug: eventData.slug,
        allow_guest_rsvp: eventData.allowGuestRsvp ?? true,
        allow_plus_one: eventData.allowPlusOne ?? true,
        max_guests_per_rsvp: eventData.maxGuestsPerRsvp || 1,
        capacity: null,
        use_custom_rsvp_text: eventData.useCustomRsvpText ?? false,
        custom_yup_text: eventData.customYesText || null,
        custom_nope_text: eventData.customNoText || null,
        custom_maybe_text: null,
        rsvp_visibility: 'public',
        waitlist_enabled: false
      }])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create event', details: error.message },
        { status: 500 }
      );
    }

    console.log('Event created successfully in Supabase:', event);
    return NextResponse.json({ event }, { status: 201 });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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