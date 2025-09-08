import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    + '-' + Date.now().toString().slice(-6);
}

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(uuid: string): boolean {
  return UUID_REGEX.test(uuid);
}

function generateTestUUID(): string {
  // Generate a UUID v4-like string with a timestamp component
  const timestamp = Date.now().toString(16).padStart(12, '0');
  const random = Math.random().toString(16).slice(2, 14).padStart(12, '0');
  return `${timestamp.slice(0, 8)}-${timestamp.slice(8, 12)}-4${random.slice(0, 3)}-${random.slice(3, 7)}-${random.slice(7)}`;
}

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing required environment variables for test endpoint');
      return NextResponse.json(
        { 
          error: "Configuration error", 
          details: "Missing required Supabase environment variables",
          missingVars: {
            supabaseUrl: !supabaseUrl,
            supabaseServiceKey: !supabaseServiceKey
          }
        },
        { status: 500 }
      );
    }

    // Create service role client to bypass RLS for test operations
    const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const body = await request.json();
    const { title, date, location, description, hostId } = body;

    // Validate required fields
    if (!title || !date || !location) {
      return NextResponse.json(
        { error: 'Missing required fields: title, date, location' },
        { status: 400 }
      );
    }

    // Validate or generate host_id
    let validHostId = hostId;
    if (!hostId || !isValidUUID(hostId)) {
      validHostId = crypto.randomUUID();
      console.log('Invalid or missing hostId, generated new UUID:', validHostId);
    }

    // Create test event data
    const eventData = {
      title,
      date,
      location,
      description: description || '',
      host_id: validHostId,
      slug: generateSlug(title),
      status: 'active',
      allow_guest_rsvp: true,
      allow_plus_one: true,
      max_guests_per_rsvp: 3,
      use_custom_rsvp_text: false,
      rsvp_visibility: 'public',
      waitlist_enabled: false,
      start_time: '18:00',
      end_time: '22:00'
    };

    console.log('Creating test event:', eventData);

    // Insert event into database
    const { data: event, error } = await serviceSupabase
      .from('events')
      .insert(eventData)
      .select()
      .single();

    if (error) {
      console.error('Database error creating event:', error);
      return NextResponse.json(
        { error: 'Failed to create event', details: error.message },
        { status: 500 }
      );
    }

    console.log('Test event created successfully:', event);

    // Return the created event with share URL
    const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/events/${event.slug}`;
    
    return NextResponse.json({
      success: true,
      event: {
        ...event,
        shareUrl
      }
    });

  } catch (error) {
    console.error('Error in create test event API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Add runtime configuration to prevent static generation
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Example usage:
// POST /api/test/create-event
// {
//   "title": "Test Birthday Party",
//   "date": "2024-01-20",
//   "location": "123 Party Street",
//   "description": "Come celebrate with us!",
//   "hostId": "2ae16f42-5ece-4b50-a887-5a32046bc861" // Example of valid UUID format
// } 