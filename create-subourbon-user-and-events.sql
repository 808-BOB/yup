-- Create Subourbon user and sample events
-- This script first creates the user, then creates the events
-- Run this in Supabase SQL Editor

-- ==============================================
-- STEP 1: CREATE SUBOURBON USER
-- ==============================================

-- Create the auth user for Subourbon
INSERT INTO auth.users (
    id,
    email,
    email_confirmed_at,
    created_at,
    updated_at,
    aud,
    role
) VALUES (
    'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    'cheers@subourbon.bar',
    NOW(),
    NOW(),
    NOW(),
    'authenticated',
    'authenticated'
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

-- Create the user profile
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
    'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    'subourbon',
    'cheers@subourbon.bar',
    'Subourbon Team',
    true,
    false,
    true,
    '#B8860B', -- Dark goldenrod (bourbon color)
    '#F5F5DC', -- Beige
    '#8B4513', -- Saddle brown
    'I''m In!',
    'Sorry!',
    'Maybe',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    is_premium = EXCLUDED.is_premium,
    brand_primary_color = EXCLUDED.brand_primary_color,
    brand_secondary_color = EXCLUDED.brand_secondary_color,
    brand_tertiary_color = EXCLUDED.brand_tertiary_color,
    custom_yup_text = EXCLUDED.custom_yup_text,
    custom_nope_text = EXCLUDED.custom_nope_text,
    custom_maybe_text = EXCLUDED.custom_maybe_text,
    updated_at = NOW();

-- ==============================================
-- STEP 2: CREATE OTHER HOST USERS
-- ==============================================

-- Create additional host users for events that invited Subourbon
INSERT INTO auth.users (
    id,
    email,
    email_confirmed_at,
    created_at,
    updated_at,
    aud,
    role
) VALUES 
    ('22222222-3333-4444-5555-666666666666', 'events@chicagodistilling.com', NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
    ('33333333-4444-5555-6666-777777777777', 'host@westlooptastings.com', NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
    ('44444444-5555-6666-7777-888888888888', 'manager@rooftopchicago.com', NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
    ('55555555-6666-7777-8888-999999999999', 'coordinator@artinstitutechi.org', NOW(), NOW(), NOW(), 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- Create their user profiles
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
) VALUES 
    ('22222222-3333-4444-5555-666666666666', 'chicagodistilling', 'events@chicagodistilling.com', 'Chicago Distilling Co.', true, false, true, '#8B4513', '#F4E4BC', '#2F1B14', 'Count me in!', 'Pass', 'Tentative', NOW(), NOW()),
    ('33333333-4444-5555-6666-777777777777', 'westlooptastings', 'host@westlooptastings.com', 'West Loop Tastings', true, false, true, '#722F37', '#F7F3F0', '#3D1A1D', 'I''ll be there!', 'Sorry!', 'Maybe', NOW(), NOW()),
    ('44444444-5555-6666-7777-888888888888', 'rooftopchicago', 'manager@rooftopchicago.com', 'Rooftop Chicago', true, false, true, '#1E3A8A', '#E0E7FF', '#1E1B4B', 'Absolutely!', 'Can''t make it', 'Possibly', NOW(), NOW()),
    ('55555555-6666-7777-8888-999999999999', 'artinstitutechi', 'coordinator@artinstitutechi.org', 'Art Institute of Chicago', false, false, false, '#D97706', '#FEF3C7', '#451A03', 'Yes', 'No', 'Maybe', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ==============================================
-- STEP 3: CREATE EVENTS
-- ==============================================

-- Completed Events (hosted by Subourbon)
INSERT INTO events (
    title, slug, date, start_time, end_time, location, address, description, host_id, status, allow_guest_rsvp, allow_plus_one, max_guests_per_rsvp, capacity, use_custom_rsvp_text, rsvp_visibility, waitlist_enabled
) VALUES 
    ('Holiday Bourbon Tasting & Pairing', 'holiday-bourbon-tasting-2024', '2024-12-15', '19:00:00', '22:00:00', 'Subourbon', '121 W Front St, Wheaton, IL 60187', 'Join us for an exclusive holiday bourbon tasting featuring rare selections paired with artisanal chocolates and seasonal bites.', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'completed', true, true, 2, 25, true, 'public', false),
    ('New Year''s Whiskey Flight Experience', 'new-years-whiskey-flight-2025', '2024-12-31', '20:00:00', '23:30:00', 'Subourbon', '121 W Front St, Wheaton, IL 60187', 'Ring in the New Year with a curated whiskey flight featuring selections from around the world.', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'completed', true, true, 2, 30, true, 'public', false)
ON CONFLICT (slug) DO NOTHING;

-- Upcoming Events (hosted by Subourbon)  
INSERT INTO events (
    title, slug, date, start_time, end_time, location, address, description, host_id, status, allow_guest_rsvp, allow_plus_one, max_guests_per_rsvp, capacity, use_custom_rsvp_text, rsvp_visibility, waitlist_enabled
) VALUES 
    ('Spring Whiskey & Artisan Cheese Pairing', 'spring-whiskey-cheese-pairing-2025', '2025-04-15', '18:30:00', '21:00:00', 'Subourbon', '121 W Front St, Wheaton, IL 60187', 'Discover the perfect harmony between premium whiskeys and artisan cheeses.', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'open', true, true, 2, 25, true, 'public', false),
    ('Bourbon 101: Distillation to Glass Workshop', 'bourbon-101-workshop-2025', '2025-05-20', '15:00:00', '17:30:00', 'Subourbon', '121 W Front St, Wheaton, IL 60187', 'Learn the art and science of bourbon making in this educational workshop.', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'open', true, false, 1, 20, true, 'public', false)
ON CONFLICT (slug) DO NOTHING;

-- Events by other hosts (that will invite Subourbon)
INSERT INTO events (
    title, slug, date, start_time, end_time, location, address, description, host_id, status, allow_guest_rsvp, allow_plus_one, max_guests_per_rsvp, capacity, use_custom_rsvp_text, rsvp_visibility, waitlist_enabled
) VALUES 
    ('Chicago Distilling Co. Grand Opening Celebration', 'chicago-distilling-grand-opening-2025', '2025-03-22', '17:00:00', '21:00:00', 'Chicago Distilling Co.', '2359 N Milwaukee Ave, Chicago, IL 60647', 'Join us for the grand opening of Chicago''s newest craft distillery!', '22222222-3333-4444-5555-666666666666', 'open', true, true, 2, 200, true, 'public', false),
    ('West Loop Wine & Spirits Expo 2025', 'west-loop-wine-spirits-expo-2025', '2025-06-14', '12:00:00', '18:00:00', 'Union Station Chicago', '225 S Canal St, Chicago, IL 60606', 'The premier wine and spirits event in Chicago!', '33333333-4444-5555-6666-777777777777', 'open', false, true, 2, 1000, true, 'public', true),
    ('Sunset Cocktail Masterclass on the Rooftop', 'sunset-cocktail-masterclass-2025', '2025-07-18', '18:00:00', '20:30:00', 'Rooftop Chicago', '111 N State St, Chicago, IL 60602', 'Learn to craft premium cocktails with stunning city views.', '44444444-5555-6666-7777-888888888888', 'open', true, true, 2, 40, true, 'private', false),
    ('Art & Spirits: A Cultural Evening', 'art-spirits-cultural-evening-2025', '2025-08-10', '19:00:00', '22:00:00', 'Art Institute of Chicago', '111 S Michigan Ave, Chicago, IL 60603', 'Experience the intersection of art and craft spirits.', '55555555-6666-7777-8888-999999999999', 'open', false, false, 1, 60, false, 'public', false)
ON CONFLICT (slug) DO NOTHING;

-- ==============================================
-- STEP 4: CREATE INVITATIONS
-- ==============================================

-- Create invitations table if it doesn't exist
CREATE TABLE IF NOT EXISTS invitations (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) NOT NULL,
    inviter_id UUID REFERENCES auth.users(id) NOT NULL,
    invitee_email TEXT NOT NULL,
    invitee_id UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    invitation_token TEXT UNIQUE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invitations for Subourbon
INSERT INTO invitations (
    event_id,
    inviter_id,
    invitee_email,
    invitee_id,
    status,
    invitation_token,
    sent_at
) 
SELECT 
    e.id,
    e.host_id,
    'cheers@subourbon.bar',
    'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    'pending',
    'inv_' || e.slug || '_subourbon',
    NOW() - INTERVAL '1 day'
FROM events e 
WHERE e.slug IN (
    'chicago-distilling-grand-opening-2025',
    'west-loop-wine-spirits-expo-2025',
    'sunset-cocktail-masterclass-2025',
    'art-spirits-cultural-evening-2025'
)
ON CONFLICT (invitation_token) DO NOTHING;

-- ==============================================
-- STEP 5: CREATE SAMPLE RESPONSES
-- ==============================================

-- Create responses table if it doesn't exist
CREATE TABLE IF NOT EXISTS responses (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    response_type TEXT NOT NULL CHECK (response_type IN ('yup', 'nope', 'maybe')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_guest BOOLEAN DEFAULT false,
    guest_name TEXT,
    guest_email TEXT,
    guest_count INTEGER DEFAULT 1,
    response_token TEXT UNIQUE
);

-- Add responses for completed events
INSERT INTO responses (
    event_id,
    user_id,
    response_type,
    created_at,
    is_guest,
    guest_count,
    response_token
) 
SELECT 
    e.id,
    'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    'yup',
    e.date - INTERVAL '5 days',
    false,
    2,
    'resp_' || e.slug || '_subourbon'
FROM events e 
WHERE e.slug IN (
    'holiday-bourbon-tasting-2024',
    'new-years-whiskey-flight-2025'
)
ON CONFLICT (response_token) DO NOTHING;

-- Add response for upcoming event
INSERT INTO responses (
    event_id,
    user_id,
    response_type,
    created_at,
    is_guest,
    guest_count,
    response_token
) 
SELECT 
    e.id,
    'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    'yup',
    NOW() - INTERVAL '2 days',
    false,
    1,
    'resp_' || e.slug || '_subourbon'
FROM events e 
WHERE e.slug = 'spring-whiskey-cheese-pairing-2025'
ON CONFLICT (response_token) DO NOTHING;

-- ==============================================
-- VERIFICATION
-- ==============================================

SELECT '✅ VERIFICATION: Events created successfully!' as result;

SELECT 'Subourbon''s Events:' as category;
SELECT 
    e.title,
    e.slug,
    e.date,
    e.status
FROM events e
WHERE e.host_id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
ORDER BY e.date;

SELECT 'Events Subourbon was invited to:' as category;
SELECT 
    e.title,
    e.date,
    host.display_name as host
FROM events e
JOIN users host ON e.host_id = host.id
JOIN invitations i ON i.event_id = e.id
WHERE i.invitee_id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
ORDER BY e.date;

SELECT 'Subourbon''s RSVPs:' as category;
SELECT 
    e.title,
    r.response_type,
    r.guest_count
FROM responses r
JOIN events e ON r.event_id = e.id
WHERE r.user_id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
ORDER BY r.created_at;





