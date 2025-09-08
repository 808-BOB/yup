-- Simple diagnostic query to check Subourbon user and events
-- Run this to see what's currently in the database

-- 1. Find the Subourbon user
SELECT 'Looking for Subourbon user:' as info;
SELECT 
    id,
    email,
    display_name,
    is_premium,
    created_at
FROM users 
WHERE email = 'cheers@subourbon.bar' 
   OR display_name ILIKE '%subourbon%'
   OR email ILIKE '%subourbon%';

-- 2. Check all events (to see what exists)
SELECT 'All events in database:' as info;
SELECT 
    e.id,
    e.title,
    e.slug,
    e.date,
    e.status,
    e.host_id,
    u.display_name as host_name,
    u.email as host_email
FROM events e
LEFT JOIN users u ON e.host_id = u.id
ORDER BY e.created_at DESC;

-- 3. Check for any events hosted by the Subourbon ID
SELECT 'Events hosted by Subourbon (if any):' as info;
SELECT 
    e.id,
    e.title,
    e.slug,
    e.date,
    e.status
FROM events e
WHERE e.host_id = '2c1c2092-6ffb-4855-a0e1-2a9c47533de9';

-- 4. Check if the auth.users table has the Subourbon user
SELECT 'Checking auth.users for Subourbon:' as info;
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users 
WHERE email = 'cheers@subourbon.bar';

-- 5. Check users table structure to see what fields exist
SELECT 'Users table structure:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;





