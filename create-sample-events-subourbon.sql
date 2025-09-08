-- Create Sample Events for cheers@subourbon.bar (Subourbon Team)
-- Run this in Supabase SQL Editor

-- First, let's get the user ID for cheers@subourbon.bar
-- This will help us create events and invitations correctly

-- Create some additional host users for events that invited cheers@subourbon.bar
INSERT INTO auth.users (
    id,
    email,
    email_confirmed_at,
    created_at,
    updated_at
) VALUES 
    ('22222222-3333-4444-5555-666666666666', 'events@chicagodistilling.com', NOW(), NOW(), NOW()),
    ('33333333-4444-5555-6666-777777777777', 'host@westlooptastings.com', NOW(), NOW(), NOW()),
    ('44444444-5555-6666-7777-888888888888', 'manager@rooftopchicago.com', NOW(), NOW(), NOW()),
    ('55555555-6666-7777-8888-999999999999', 'coordinator@artinstitutechi.org', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert corresponding users in users table with branding
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
    ('22222222-3333-4444-5555-666666666666', 'chicagodistilling', 'events@chicagodistilling.com', 'Chicago Distilling Co.', true, false, true, '#8B4513', '#F4E4BC', '#2F1B14', 'Count me in!', 'Pass', 'Tentative'),
    ('33333333-4444-5555-6666-777777777777', 'westlooptastings', 'host@westlooptastings.com', 'West Loop Tastings', true, false, true, '#722F37', '#F7F3F0', '#3D1A1D', 'I\'ll be there!', 'Sorry!', 'Maybe'),
    ('44444444-5555-6666-7777-888888888888', 'rooftopchicago', 'manager@rooftopchicago.com', 'Rooftop Chicago', true, false, true, '#1E3A8A', '#E0E7FF', '#1E1B4B', 'Absolutely!', 'Can\'t make it', 'Possibly'),
    ('55555555-6666-7777-8888-999999999999', 'artinstitutechi', 'coordinator@artinstitutechi.org', 'Art Institute of Chicago', false, false, false, '#D97706', '#FEF3C7', '#451A03', 'Yes', 'No', 'Maybe')
ON CONFLICT (id) DO NOTHING;

-- Get the actual user ID for cheers@subourbon.bar
-- We'll use this in a variable for the rest of the script
DO $$
DECLARE
    subourbon_user_id UUID;
BEGIN
    SELECT id INTO subourbon_user_id FROM auth.users WHERE email = 'cheers@subourbon.bar';
    
    IF subourbon_user_id IS NULL THEN
        RAISE NOTICE 'User cheers@subourbon.bar not found. Please ensure the user exists first.';
        RETURN;
    END IF;

    -- ==============================================
    -- COMPLETED EVENTS (2) - hosted by Subourbon
    -- ==============================================
    
    -- 1. Completed Event: Holiday Bourbon Tasting
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
        rsvp_visibility,
        waitlist_enabled
    ) VALUES (
        'Holiday Bourbon Tasting & Pairing',
        'holiday-bourbon-tasting-2024',
        '2024-12-15',
        '19:00:00',
        '22:00:00',
        'Subourbon',
        '121 W Front St, Wheaton, IL 60187',
        'Join us for an exclusive holiday bourbon tasting featuring rare selections paired with artisanal chocolates and seasonal bites. A perfect way to celebrate the season with fellow bourbon enthusiasts.',
        subourbon_user_id,
        'completed',
        true,
        true,
        2,
        25,
        true,
        'public',
        false
    ) ON CONFLICT (slug) DO NOTHING;

    -- 2. Completed Event: New Year's Whiskey Flight
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
        rsvp_visibility,
        waitlist_enabled
    ) VALUES (
        'New Year''s Whiskey Flight Experience',
        'new-years-whiskey-flight-2025',
        '2024-12-31',
        '20:00:00',
        '23:30:00',
        'Subourbon',
        '121 W Front St, Wheaton, IL 60187',
        'Ring in the New Year with a curated whiskey flight featuring selections from around the world. Includes light appetizers and a champagne toast at midnight!',
        subourbon_user_id,
        'completed',
        true,
        true,
        2,
        30,
        true,
        'public',
        false
    ) ON CONFLICT (slug) DO NOTHING;

    -- ==============================================
    -- UPCOMING EVENTS (2) - hosted by Subourbon
    -- ==============================================

    -- 3. Upcoming Event: Spring Whiskey & Cheese Pairing
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
        rsvp_visibility,
        waitlist_enabled
    ) VALUES (
        'Spring Whiskey & Artisan Cheese Pairing',
        'spring-whiskey-cheese-pairing-2025',
        '2025-04-15',
        '18:30:00',
        '21:00:00',
        'Subourbon',
        '121 W Front St, Wheaton, IL 60187',
        'Discover the perfect harmony between premium whiskeys and artisan cheeses. Our sommelier will guide you through five expertly curated pairings showcasing how different flavors complement and enhance each other.',
        subourbon_user_id,
        'open',
        true,
        true,
        2,
        25,
        true,
        'public',
        false
    ) ON CONFLICT (slug) DO NOTHING;

    -- 4. Upcoming Event: Bourbon Education Workshop
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
        rsvp_visibility,
        waitlist_enabled
    ) VALUES (
        'Bourbon 101: Distillation to Glass Workshop',
        'bourbon-101-workshop-2025',
        '2025-05-20',
        '15:00:00',
        '17:30:00',
        'Subourbon',
        '121 W Front St, Wheaton, IL 60187',
        'Learn the art and science of bourbon making in this educational workshop. From grain to glass, discover what makes each bourbon unique. Includes tastings of different mash bills and aging techniques.',
        subourbon_user_id,
        'open',
        true,
        false,
        1,
        20,
        true,
        'public',
        false
    ) ON CONFLICT (slug) DO NOTHING;

    -- ==============================================
    -- EVENTS SUBOURBON WAS INVITED TO (4)
    -- ==============================================

    -- 5. Invited Event: Chicago Distilling Co. Grand Opening
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
        rsvp_visibility,
        waitlist_enabled
    ) VALUES (
        'Chicago Distilling Co. Grand Opening Celebration',
        'chicago-distilling-grand-opening-2025',
        '2025-03-22',
        '17:00:00',
        '21:00:00',
        'Chicago Distilling Co.',
        '2359 N Milwaukee Ave, Chicago, IL 60647',
        'Join us for the grand opening of Chicago''s newest craft distillery! Tour our facility, meet the master distiller, and be among the first to taste our signature spirits. Live music, food trucks, and exclusive opening night specials.',
        '22222222-3333-4444-5555-666666666666',
        'open',
        true,
        true,
        2,
        200,
        true,
        'public',
        false
    ) ON CONFLICT (slug) DO NOTHING;

    -- 6. Invited Event: West Loop Wine & Spirits Expo
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
        rsvp_visibility,
        waitlist_enabled
    ) VALUES (
        'West Loop Wine & Spirits Expo 2025',
        'west-loop-wine-spirits-expo-2025',
        '2025-06-14',
        '12:00:00',
        '18:00:00',
        'Union Station Chicago',
        '225 S Canal St, Chicago, IL 60606',
        'The premier wine and spirits event in Chicago! Sample over 300 wines and spirits from around the world, meet renowned distillers and vintners, and attend educational seminars. Perfect for industry professionals and enthusiasts alike.',
        '33333333-4444-5555-6666-777777777777',
        'open',
        false,
        true,
        2,
        1000,
        true,
        'public',
        true
    ) ON CONFLICT (slug) DO NOTHING;

    -- 7. Invited Event: Rooftop Cocktail Masterclass
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
        rsvp_visibility,
        waitlist_enabled
    ) VALUES (
        'Sunset Cocktail Masterclass on the Rooftop',
        'sunset-cocktail-masterclass-2025',
        '2025-07-18',
        '18:00:00',
        '20:30:00',
        'Rooftop Chicago',
        '111 N State St, Chicago, IL 60602',
        'Learn to craft premium cocktails with stunning city views as your backdrop. Our master mixologist will teach you to create five signature cocktails using top-shelf spirits. Includes all ingredients, tools, and light appetizers.',
        '44444444-5555-6666-7777-888888888888',
        'open',
        true,
        true,
        2,
        40,
        true,
        'private',
        false
    ) ON CONFLICT (slug) DO NOTHING;

    -- 8. Invited Event: Art & Spirits Cultural Evening
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
        rsvp_visibility,
        waitlist_enabled
    ) VALUES (
        'Art & Spirits: A Cultural Evening',
        'art-spirits-cultural-evening-2025',
        '2025-08-10',
        '19:00:00',
        '22:00:00',
        'Art Institute of Chicago',
        '111 S Michigan Ave, Chicago, IL 60603',
        'Experience the intersection of art and craft spirits in this unique cultural event. Private gallery viewing followed by curated spirit tastings inspired by the artwork. Each pour tells a story that complements the visual experience.',
        '55555555-6666-7777-8888-999999999999',
        'open',
        false,
        false,
        1,
        60,
        false,
        'public',
        false
    ) ON CONFLICT (slug) DO NOTHING;

    -- ==============================================
    -- CREATE INVITATIONS FOR SUBOURBON USER
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

    -- Create invitations for the 4 events that invited Subourbon
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
        subourbon_user_id,
        'pending',
        'inv_' || e.slug || '_subourbon_' || EXTRACT(epoch FROM NOW())::text,
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
    -- CREATE SOME SAMPLE RESPONSES
    -- ==============================================

    -- Add some responses to the completed events
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
        subourbon_user_id,
        'yup',
        e.date - INTERVAL '5 days',
        false,
        2
    FROM events e 
    WHERE e.slug IN (
        'holiday-bourbon-tasting-2024',
        'new-years-whiskey-flight-2025'
    )
    ON CONFLICT DO NOTHING;

    -- Add response to one of the upcoming events
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
        subourbon_user_id,
        'yup',
        NOW() - INTERVAL '2 days',
        false,
        1
    FROM events e 
    WHERE e.slug = 'spring-whiskey-cheese-pairing-2025'
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Successfully created sample events for cheers@subourbon.bar!';

END $$;

-- ==============================================
-- VERIFICATION QUERIES
-- ==============================================

-- Verify the events were created
SELECT 'Events hosted by Subourbon:' as info;
SELECT 
    e.id,
    e.title,
    e.slug,
    e.date,
    e.status,
    u.display_name as host_name
FROM events e
JOIN users u ON e.host_id = u.id
WHERE u.email = 'cheers@subourbon.bar'
ORDER BY e.date DESC;

SELECT 'Events Subourbon was invited to:' as info;
SELECT 
    e.id,
    e.title,
    e.slug,
    e.date,
    e.status,
    host.display_name as host_name,
    i.status as invitation_status
FROM events e
JOIN users host ON e.host_id = host.id
JOIN invitations i ON i.event_id = e.id
JOIN users invitee ON i.invitee_id = invitee.id
WHERE invitee.email = 'cheers@subourbon.bar'
ORDER BY e.date;

SELECT 'Subourbon''s RSVP responses:' as info;
SELECT 
    e.title,
    r.response_type,
    r.guest_count,
    r.created_at as response_date
FROM responses r
JOIN events e ON r.event_id = e.id
JOIN users u ON r.user_id = u.id
WHERE u.email = 'cheers@subourbon.bar'
ORDER BY r.created_at DESC;





