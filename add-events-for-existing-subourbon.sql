-- Add sample events for the existing Subourbon user
-- User ID: 2c1c2092-6ffb-4855-a0e1-2a9c47533de9
-- Email: cheers@subourbon.bar

-- ==============================================
-- CREATE OTHER HOST USERS FOR INVITING EVENTS
-- ==============================================

-- Create additional host users (if they don't exist)
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
-- CREATE SUBOURBON'S EVENTS (2 COMPLETED, 2 UPCOMING)
-- ==============================================

-- Completed Events (hosted by Subourbon)
INSERT INTO events (
    title, slug, date, start_time, end_time, location, address, description, host_id, status, allow_guest_rsvp, allow_plus_one, max_guests_per_rsvp, capacity, use_custom_rsvp_text, rsvp_visibility, waitlist_enabled, created_at
) VALUES 
    ('Holiday Bourbon Tasting & Pairing', 'subourbon-holiday-bourbon-tasting-2024', '2024-12-15', '19:00:00', '22:00:00', 'Subourbon', '121 W Front St, Wheaton, IL 60187', 'Join us for an exclusive holiday bourbon tasting featuring rare selections paired with artisanal chocolates and seasonal bites. A perfect way to celebrate the season with fellow bourbon enthusiasts.', '2c1c2092-6ffb-4855-a0e1-2a9c47533de9', 'completed', true, true, 2, 25, true, 'public', false, '2024-11-01 12:00:00'),
    ('New Year''s Whiskey Flight Experience', 'subourbon-new-years-whiskey-flight-2025', '2024-12-31', '20:00:00', '23:30:00', 'Subourbon', '121 W Front St, Wheaton, IL 60187', 'Ring in the New Year with a curated whiskey flight featuring selections from around the world. Includes light appetizers and a champagne toast at midnight!', '2c1c2092-6ffb-4855-a0e1-2a9c47533de9', 'completed', true, true, 2, 30, true, 'public', false, '2024-11-15 14:00:00'),
    ('Spring Whiskey & Artisan Cheese Pairing', 'subourbon-spring-whiskey-cheese-pairing-2025', '2025-04-15', '18:30:00', '21:00:00', 'Subourbon', '121 W Front St, Wheaton, IL 60187', 'Discover the perfect harmony between premium whiskeys and artisan cheeses. Our sommelier will guide you through five expertly curated pairings showcasing how different flavors complement and enhance each other.', '2c1c2092-6ffb-4855-a0e1-2a9c47533de9', 'open', true, true, 2, 25, true, 'public', false, NOW()),
    ('Bourbon 101: Distillation to Glass Workshop', 'subourbon-bourbon-101-workshop-2025', '2025-05-20', '15:00:00', '17:30:00', 'Subourbon', '121 W Front St, Wheaton, IL 60187', 'Learn the art and science of bourbon making in this educational workshop. From grain to glass, discover what makes each bourbon unique. Includes tastings of different mash bills and aging techniques.', '2c1c2092-6ffb-4855-a0e1-2a9c47533de9', 'open', true, false, 1, 20, true, 'public', false, NOW())
ON CONFLICT (slug) DO NOTHING;

-- ==============================================
-- CREATE EVENTS BY OTHER HOSTS (THAT WILL INVITE SUBOURBON)
-- ==============================================

-- Events by other hosts (that will invite Subourbon)
INSERT INTO events (
    title, slug, date, start_time, end_time, location, address, description, host_id, status, allow_guest_rsvp, allow_plus_one, max_guests_per_rsvp, capacity, use_custom_rsvp_text, rsvp_visibility, waitlist_enabled, created_at
) VALUES 
    ('Chicago Distilling Co. Grand Opening Celebration', 'chicago-distilling-grand-opening-march-2025', '2025-03-22', '17:00:00', '21:00:00', 'Chicago Distilling Co.', '2359 N Milwaukee Ave, Chicago, IL 60647', 'Join us for the grand opening of Chicago''s newest craft distillery! Tour our facility, meet the master distiller, and be among the first to taste our signature spirits. Live music, food trucks, and exclusive opening night specials.', '22222222-3333-4444-5555-666666666666', 'open', true, true, 2, 200, true, 'public', false, NOW()),
    ('West Loop Wine & Spirits Expo 2025', 'west-loop-wine-spirits-expo-june-2025', '2025-06-14', '12:00:00', '18:00:00', 'Union Station Chicago', '225 S Canal St, Chicago, IL 60606', 'The premier wine and spirits event in Chicago! Sample over 300 wines and spirits from around the world, meet renowned distillers and vintners, and attend educational seminars. Perfect for industry professionals and enthusiasts alike.', '33333333-4444-5555-6666-777777777777', 'open', false, true, 2, 1000, true, 'public', true, NOW()),
    ('Sunset Cocktail Masterclass on the Rooftop', 'rooftop-cocktail-masterclass-july-2025', '2025-07-18', '18:00:00', '20:30:00', 'Rooftop Chicago', '111 N State St, Chicago, IL 60602', 'Learn to craft premium cocktails with stunning city views as your backdrop. Our master mixologist will teach you to create five signature cocktails using top-shelf spirits. Includes all ingredients, tools, and light appetizers.', '44444444-5555-6666-7777-888888888888', 'open', true, true, 2, 40, true, 'private', false, NOW()),
    ('Art & Spirits: A Cultural Evening', 'art-institute-spirits-cultural-evening-2025', '2025-08-10', '19:00:00', '22:00:00', 'Art Institute of Chicago', '111 S Michigan Ave, Chicago, IL 60603', 'Experience the intersection of art and craft spirits in this unique cultural event. Private gallery viewing followed by curated spirit tastings inspired by the artwork. Each pour tells a story that complements the visual experience.', '55555555-6666-7777-8888-999999999999', 'open', false, false, 1, 60, false, 'public', false, NOW())
ON CONFLICT (slug) DO NOTHING;

-- ==============================================
-- CREATE INVITATIONS FOR SUBOURBON
-- ==============================================

-- Create invitations table if it doesn't exist
CREATE TABLE IF NOT EXISTS invitations (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) NOT NULL,
    inviter_id UUID NOT NULL,
    invitee_email TEXT NOT NULL,
    invitee_id UUID,
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
    '2c1c2092-6ffb-4855-a0e1-2a9c47533de9',
    'pending',
    'inv_' || e.slug || '_subourbon_' || e.id,
    NOW() - INTERVAL '1 day'
FROM events e 
WHERE e.slug IN (
    'chicago-distilling-grand-opening-march-2025',
    'west-loop-wine-spirits-expo-june-2025',
    'rooftop-cocktail-masterclass-july-2025',
    'art-institute-spirits-cultural-evening-2025'
)
ON CONFLICT (invitation_token) DO NOTHING;

-- ==============================================
-- CREATE SAMPLE RESPONSES
-- ==============================================

-- Create responses table if it doesn't exist
CREATE TABLE IF NOT EXISTS responses (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) NOT NULL,
    user_id UUID,
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
    '2c1c2092-6ffb-4855-a0e1-2a9c47533de9',
    'yup',
    e.date - INTERVAL '5 days',
    false,
    2,
    'resp_' || e.slug || '_subourbon_' || e.id
FROM events e 
WHERE e.slug IN (
    'subourbon-holiday-bourbon-tasting-2024',
    'subourbon-new-years-whiskey-flight-2025'
)
ON CONFLICT (response_token) DO NOTHING;

-- Add response for one upcoming event
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
    '2c1c2092-6ffb-4855-a0e1-2a9c47533de9',
    'yup',
    NOW() - INTERVAL '2 days',
    false,
    1,
    'resp_' || e.slug || '_subourbon_' || e.id
FROM events e 
WHERE e.slug = 'subourbon-spring-whiskey-cheese-pairing-2025'
ON CONFLICT (response_token) DO NOTHING;

-- ==============================================
-- VERIFICATION QUERIES
-- ==============================================

SELECT '✅ SUCCESS: Events created for Subourbon Team!' as result;

SELECT 'Subourbon''s Events (should show 4):' as category;
SELECT 
    e.id,
    e.title,
    e.slug,
    e.date,
    e.status
FROM events e
WHERE e.host_id = '2c1c2092-6ffb-4855-a0e1-2a9c47533de9'
ORDER BY e.date;

SELECT 'Events Subourbon was invited to (should show 4):' as category;
SELECT 
    e.id,
    e.title,
    e.date,
    host.display_name as host
FROM events e
JOIN users host ON e.host_id = host.id
JOIN invitations i ON i.event_id = e.id
WHERE i.invitee_id = '2c1c2092-6ffb-4855-a0e1-2a9c47533de9'
ORDER BY e.date;

SELECT 'Subourbon''s RSVPs (should show 3):' as category;
SELECT 
    e.title,
    r.response_type,
    r.guest_count
FROM responses r
JOIN events e ON r.event_id = e.id
WHERE r.user_id = '2c1c2092-6ffb-4855-a0e1-2a9c47533de9'
ORDER BY r.created_at;





