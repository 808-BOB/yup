-- Complete Subourbon setup - creates user and events
-- This ensures the user exists in both auth.users and users tables

-- ==============================================
-- STEP 1: CREATE SUBOURBON USER IN AUTH.USERS
-- ==============================================

-- Create the auth user for Subourbon (if not exists)
INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    is_sso_user
) VALUES (
    '2c1c2092-6ffb-4855-a0e1-2a9c47533de9',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'cheers@subourbon.bar',
    crypt('temppassword123', gen_salt('bf')),
    NOW(),
    NULL,
    '',
    NULL,
    '',
    NULL,
    '',
    '',
    NULL,
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    false,
    NOW(),
    NOW(),
    NULL,
    NULL,
    '',
    '',
    NULL,
    '',
    0,
    NULL,
    '',
    NULL,
    false
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

-- ==============================================
-- STEP 2: CREATE SUBOURBON USER PROFILE
-- ==============================================

-- Create/update the user profile in users table
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
    '2c1c2092-6ffb-4855-a0e1-2a9c47533de9',
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
    is_pro = EXCLUDED.is_pro,
    brand_primary_color = EXCLUDED.brand_primary_color,
    brand_secondary_color = EXCLUDED.brand_secondary_color,
    brand_tertiary_color = EXCLUDED.brand_tertiary_color,
    custom_yup_text = EXCLUDED.custom_yup_text,
    custom_nope_text = EXCLUDED.custom_nope_text,
    custom_maybe_text = EXCLUDED.custom_maybe_text,
    updated_at = NOW();

-- ==============================================
-- STEP 3: CREATE OTHER HOST USERS
-- ==============================================

-- Create auth users for other hosts
INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    is_sso_user
) VALUES 
    ('22222222-3333-4444-5555-666666666666', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'events@chicagodistilling.com', crypt('temppass', gen_salt('bf')), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, NOW(), NOW(), false),
    ('33333333-4444-5555-6666-777777777777', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'host@westlooptastings.com', crypt('temppass', gen_salt('bf')), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, NOW(), NOW(), false),
    ('44444444-5555-6666-7777-888888888888', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'manager@rooftopchicago.com', crypt('temppass', gen_salt('bf')), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, NOW(), NOW(), false),
    ('55555555-6666-7777-8888-999999999999', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'coordinator@artinstitutechi.org', crypt('temppass', gen_salt('bf')), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, NOW(), NOW(), false)
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
-- STEP 4: CREATE EVENTS
-- ==============================================

-- Subourbon's Events (2 completed, 2 upcoming)
INSERT INTO events (
    title, slug, date, start_time, end_time, location, address, description, host_id, status, allow_guest_rsvp, allow_plus_one, max_guests_per_rsvp, capacity, use_custom_rsvp_text, rsvp_visibility, waitlist_enabled, created_at
) VALUES 
    -- Completed events
    ('Holiday Bourbon Tasting & Pairing', 'subourbon-holiday-bourbon-2024', '2024-12-15', '19:00:00', '22:00:00', 'Subourbon', '121 W Front St, Wheaton, IL 60187', 'Join us for an exclusive holiday bourbon tasting featuring rare selections paired with artisanal chocolates and seasonal bites.', '2c1c2092-6ffb-4855-a0e1-2a9c47533de9', 'completed', true, true, 2, 25, true, 'public', false, '2024-11-01 12:00:00'),
    ('New Year''s Whiskey Flight Experience', 'subourbon-nye-whiskey-2025', '2024-12-31', '20:00:00', '23:30:00', 'Subourbon', '121 W Front St, Wheaton, IL 60187', 'Ring in the New Year with a curated whiskey flight featuring selections from around the world.', '2c1c2092-6ffb-4855-a0e1-2a9c47533de9', 'completed', true, true, 2, 30, true, 'public', false, '2024-11-15 14:00:00'),
    -- Upcoming events
    ('Spring Whiskey & Artisan Cheese Pairing', 'subourbon-spring-pairing-2025', '2025-04-15', '18:30:00', '21:00:00', 'Subourbon', '121 W Front St, Wheaton, IL 60187', 'Discover the perfect harmony between premium whiskeys and artisan cheeses.', '2c1c2092-6ffb-4855-a0e1-2a9c47533de9', 'open', true, true, 2, 25, true, 'public', false, NOW()),
    ('Bourbon 101: Distillation to Glass Workshop', 'subourbon-bourbon-101-2025', '2025-05-20', '15:00:00', '17:30:00', 'Subourbon', '121 W Front St, Wheaton, IL 60187', 'Learn the art and science of bourbon making in this educational workshop.', '2c1c2092-6ffb-4855-a0e1-2a9c47533de9', 'open', true, false, 1, 20, true, 'public', false, NOW()),
    -- Events by other hosts (that invite Subourbon)
    ('Chicago Distilling Co. Grand Opening', 'chicago-distilling-opening-2025', '2025-03-22', '17:00:00', '21:00:00', 'Chicago Distilling Co.', '2359 N Milwaukee Ave, Chicago, IL 60647', 'Join us for the grand opening of Chicago''s newest craft distillery!', '22222222-3333-4444-5555-666666666666', 'open', true, true, 2, 200, true, 'public', false, NOW()),
    ('West Loop Wine & Spirits Expo', 'west-loop-expo-2025', '2025-06-14', '12:00:00', '18:00:00', 'Union Station Chicago', '225 S Canal St, Chicago, IL 60606', 'The premier wine and spirits event in Chicago!', '33333333-4444-5555-6666-777777777777', 'open', false, true, 2, 1000, true, 'public', true, NOW()),
    ('Rooftop Cocktail Masterclass', 'rooftop-cocktail-class-2025', '2025-07-18', '18:00:00', '20:30:00', 'Rooftop Chicago', '111 N State St, Chicago, IL 60602', 'Learn to craft premium cocktails with stunning city views.', '44444444-5555-6666-7777-888888888888', 'open', true, true, 2, 40, true, 'private', false, NOW()),
    ('Art & Spirits Cultural Evening', 'art-spirits-evening-2025', '2025-08-10', '19:00:00', '22:00:00', 'Art Institute of Chicago', '111 S Michigan Ave, Chicago, IL 60603', 'Experience the intersection of art and craft spirits.', '55555555-6666-7777-8888-999999999999', 'open', false, false, 1, 60, false, 'public', false, NOW())
ON CONFLICT (slug) DO NOTHING;

-- ==============================================
-- STEP 5: CREATE INVITATIONS
-- ==============================================

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
    '2c1c2092-6ffb-4855-a0e1-2a9c47533de9',
    'pending',
    'inv_' || e.slug || '_subourbon',
    NOW() - INTERVAL '1 day'
FROM events e 
WHERE e.slug IN (
    'chicago-distilling-opening-2025',
    'west-loop-expo-2025',
    'rooftop-cocktail-class-2025',
    'art-spirits-evening-2025'
)
ON CONFLICT (invitation_token) DO NOTHING;

-- ==============================================
-- STEP 6: CREATE SAMPLE RESPONSES
-- ==============================================

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
    'resp_' || e.slug
FROM events e 
WHERE e.slug IN (
    'subourbon-holiday-bourbon-2024',
    'subourbon-nye-whiskey-2025'
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
    '2c1c2092-6ffb-4855-a0e1-2a9c47533de9',
    'yup',
    NOW() - INTERVAL '2 days',
    false,
    1,
    'resp_' || e.slug
FROM events e 
WHERE e.slug = 'subourbon-spring-pairing-2025'
ON CONFLICT (response_token) DO NOTHING;

-- ==============================================
-- VERIFICATION
-- ==============================================

SELECT '🎉 SUCCESS! Subourbon setup complete!' as result;

SELECT 'Subourbon user created:' as check1;
SELECT 
    id,
    email,
    display_name,
    is_premium,
    is_pro
FROM users 
WHERE id = '2c1c2092-6ffb-4855-a0e1-2a9c47533de9';

SELECT 'Subourbon events (should show 4):' as check2;
SELECT 
    e.id,
    e.title,
    e.date,
    e.status
FROM events e
WHERE e.host_id = '2c1c2092-6ffb-4855-a0e1-2a9c47533de9'
ORDER BY e.date;

SELECT 'Events Subourbon was invited to (should show 4):' as check3;
SELECT 
    e.title,
    e.date,
    host.display_name as host
FROM events e
JOIN users host ON e.host_id = host.id
JOIN invitations i ON i.event_id = e.id
WHERE i.invitee_id = '2c1c2092-6ffb-4855-a0e1-2a9c47533de9'
ORDER BY e.date;

SELECT 'Subourbon RSVPs (should show 3):' as check4;
SELECT 
    e.title,
    r.response_type,
    r.guest_count
FROM responses r
JOIN events e ON r.event_id = e.id
WHERE r.user_id = '2c1c2092-6ffb-4855-a0e1-2a9c47533de9';

SELECT 'All users (should include Subourbon):' as check5;
SELECT 
    id,
    email,
    display_name,
    is_pro,
    is_premium
FROM users 
ORDER BY created_at DESC
LIMIT 10;





