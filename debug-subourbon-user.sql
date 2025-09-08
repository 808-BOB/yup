-- Debug script to check Subourbon user and troubleshoot event creation
-- Run this in Supabase SQL Editor to diagnose the issue

-- 1. Check if the user exists in auth.users
SELECT 'Checking auth.users for cheers@subourbon.bar:' as info;
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users 
WHERE email = 'cheers@subourbon.bar';

-- 2. Check if the user exists in users table
SELECT 'Checking users table for cheers@subourbon.bar:' as info;
SELECT 
    id,
    username,
    email,
    display_name,
    is_premium,
    created_at
FROM users 
WHERE email = 'cheers@subourbon.bar';

-- 3. Check all events in the system
SELECT 'All events in the system:' as info;
SELECT 
    id,
    title,
    slug,
    date,
    status,
    host_id
FROM events 
ORDER BY created_at DESC
LIMIT 10;

-- 4. Check events with their hosts
SELECT 'Events with host information:' as info;
SELECT 
    e.id,
    e.title,
    e.slug,
    e.date,
    e.status,
    u.email as host_email,
    u.display_name as host_name
FROM events e
LEFT JOIN users u ON e.host_id = u.id
ORDER BY e.created_at DESC
LIMIT 10;

-- 5. Check if any of the new events were created (by slug)
SELECT 'Checking for newly created events by slug:' as info;
SELECT 
    id,
    title,
    slug,
    date,
    status,
    host_id
FROM events 
WHERE slug IN (
    'holiday-bourbon-tasting-2024',
    'new-years-whiskey-flight-2025',
    'spring-whiskey-cheese-pairing-2025',
    'bourbon-101-workshop-2025',
    'chicago-distilling-grand-opening-2025',
    'west-loop-wine-spirits-expo-2025',
    'sunset-cocktail-masterclass-2025',
    'art-spirits-cultural-evening-2025'
);

-- 6. Check invitations table
SELECT 'Checking invitations:' as info;
SELECT 
    i.id,
    i.event_id,
    i.invitee_email,
    i.status,
    e.title as event_title
FROM invitations i
LEFT JOIN events e ON i.event_id = e.id
WHERE i.invitee_email = 'cheers@subourbon.bar'
ORDER BY i.created_at DESC;

-- 7. If user doesn't exist, show how to create it
DO $$
DECLARE
    user_exists BOOLEAN := false;
BEGIN
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'cheers@subourbon.bar') INTO user_exists;
    
    IF NOT user_exists THEN
        RAISE NOTICE 'USER NOT FOUND! The user cheers@subourbon.bar does not exist in auth.users.';
        RAISE NOTICE 'You need to create this user first. Here is how:';
        RAISE NOTICE '';
        RAISE NOTICE '-- First, create the auth user:';
        RAISE NOTICE 'INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at)';
        RAISE NOTICE 'VALUES (''aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'', ''cheers@subourbon.bar'', NOW(), NOW(), NOW());';
        RAISE NOTICE '';
        RAISE NOTICE '-- Then create the user profile:';
        RAISE NOTICE 'INSERT INTO users (id, username, email, display_name, is_premium, brand_primary_color, custom_yup_text, custom_nope_text, custom_maybe_text)';
        RAISE NOTICE 'VALUES (''aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'', ''subourbon'', ''cheers@subourbon.bar'', ''Subourbon Team'', true, ''#B8860B'', ''I''''m In!'', ''Sorry!'', ''Maybe'');';
    ELSE
        RAISE NOTICE 'User cheers@subourbon.bar exists! The issue might be elsewhere.';
    END IF;
END $$;





