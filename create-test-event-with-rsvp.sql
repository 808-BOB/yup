-- Create Test Event with RSVP Response
-- Run this in Supabase SQL Editor

-- First, let's create a test event (using a fake host user)
-- We'll need to get your actual user ID first

-- Create a test host user if needed
INSERT INTO auth.users (
    id,
    email,
    email_confirmed_at,
    created_at,
    updated_at
) VALUES (
    '11111111-2222-3333-4444-555555555555',
    'testhost@example.com',
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert corresponding user in users table
INSERT INTO users (
    id,
    username,
    email,
    display_name,
    is_premium,
    is_admin,
    is_pro,
    brand_primary_color,
    brand_secondary_color,
    brand_tertiary_color,
    custom_yup_text,
    custom_nope_text,
    custom_maybe_text,
    created_at,
    updated_at
) VALUES (
    '11111111-2222-3333-4444-555555555555',
    'testhost',
    'testhost@example.com',
    'Test Host User',
    false,
    false,
    true,
    'hsl(308, 100%, 66%)',
    'hsl(308, 100%, 76%)',
    'hsl(308, 100%, 86%)',
    'Yup',
    'Nope',
    'Maybe',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create the events table if it doesn't exist
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    location TEXT NOT NULL,
    address TEXT,
    description TEXT,
    image_url TEXT,
    host_id UUID REFERENCES auth.users(id) NOT NULL,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    allow_guest_rsvp BOOLEAN DEFAULT true,
    allow_plus_one BOOLEAN DEFAULT false,
    max_guests_per_rsvp INTEGER DEFAULT 1,
    capacity INTEGER,
    use_custom_rsvp_text BOOLEAN DEFAULT false,
    custom_yup_text TEXT DEFAULT 'Yup',
    custom_nope_text TEXT DEFAULT 'Nope',
    custom_maybe_text TEXT DEFAULT 'Maybe',
    rsvp_visibility TEXT DEFAULT 'public',
    waitlist_enabled BOOLEAN DEFAULT false
);

-- Create the responses table if it doesn't exist
CREATE TABLE IF NOT EXISTS responses (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    response_type TEXT NOT NULL CHECK (response_type IN ('yup', 'nope', 'maybe')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_guest BOOLEAN DEFAULT false,
    guest_name TEXT,
    guest_email TEXT,
    guest_count INTEGER DEFAULT 1
);

-- Insert a test event
INSERT INTO events (
    title,
    slug,
    date,
    start_time,
    end_time,
    location,
    address,
    description,
    host_id,
    status,
    allow_guest_rsvp,
    allow_plus_one,
    max_guests_per_rsvp,
    capacity,
    use_custom_rsvp_text,
    custom_yup_text,
    custom_nope_text,
    custom_maybe_text,
    rsvp_visibility,
    waitlist_enabled
) VALUES (
    'Summer BBQ Party 🔥',
    'summer-bbq-party-2025',
    '2025-08-15',
    '18:00:00',
    '22:00:00',
    'Central Park, NYC',
    '123 Park Avenue, New York, NY 10001',
    'Join us for an amazing summer BBQ with great food, music, and friends! Bring your appetite and get ready for a fantastic evening.',
    '11111111-2222-3333-4444-555555555555',
    'active',
    true,
    true,
    2,
    50,
    false,
    'Count me in!',
    'Can''t make it',
    'Maybe',
    'public',
    false
) ON CONFLICT (slug) DO NOTHING;

-- Now let's add your RSVP response to this event
-- First we need to get your actual user ID - replace this with your real user ID
-- You can find this by running: SELECT id FROM auth.users WHERE email = 'your-email@example.com';

-- For now, let's create a response for the first user in the system
INSERT INTO responses (
    event_id,
    user_id,
    response_type,
    created_at,
    is_guest,
    guest_count
) 
SELECT 
    e.id,
    (SELECT id FROM auth.users ORDER BY created_at LIMIT 1), -- Gets the first user (should be you)
    'yup',
    NOW(),
    false,
    1
FROM events e 
WHERE e.slug = 'summer-bbq-party-2025'
ON CONFLICT DO NOTHING;

-- Let's also create another test event for variety
INSERT INTO events (
    title,
    slug,
    date,
    start_time,
    end_time,
    location,
    address,
    description,
    host_id,
    status,
    allow_guest_rsvp,
    allow_plus_one,
    max_guests_per_rsvp,
    rsvp_visibility,
    waitlist_enabled
) VALUES (
    'Tech Meetup: AI & Future',
    'tech-meetup-ai-future-2025',
    '2025-07-20',
    '19:00:00',
    '21:30:00',
    'Tech Hub Downtown',
    '456 Innovation Street, San Francisco, CA 94105',
    'Exploring the latest trends in AI and discussing the future of technology. Great networking opportunity!',
    '11111111-2222-3333-4444-555555555555',
    'active',
    true,
    false,
    1,
    'public',
    false
) ON CONFLICT (slug) DO NOTHING;

-- Verify the data was created
SELECT 'Created Events:' as info;
SELECT 
    id,
    title,
    slug,
    date,
    start_time,
    location,
    host_id,
    status
FROM events 
ORDER BY created_at DESC
LIMIT 5;

SELECT 'Created Responses:' as info;
SELECT 
    r.id,
    r.event_id,
    e.title,
    r.user_id,
    r.response_type,
    r.created_at
FROM responses r
JOIN events e ON r.event_id = e.id
ORDER BY r.created_at DESC
LIMIT 5;

SELECT 'Your User Info:' as info;
SELECT 
    id,
    email,
    display_name,
    is_pro,
    is_premium
FROM users 
ORDER BY created_at 
LIMIT 3; 