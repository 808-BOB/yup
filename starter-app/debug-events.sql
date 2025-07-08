-- Debug Events Query
-- Run this in Supabase SQL Editor to check events and user relationships

-- 1. Check if events table exists and its structure
SELECT 'Events table structure:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check all events in the database
SELECT 'All events in database:' as info;
SELECT 
    id,
    title,
    slug,
    host_id,
    created_at
FROM events
ORDER BY created_at DESC;

-- 3. Check all users in database
SELECT 'All users in database:' as info;
SELECT 
    id,
    email,
    username,
    display_name,
    created_at
FROM users
ORDER BY created_at DESC;

-- 4. Check events with user details
SELECT 'Events with user details:' as info;
SELECT 
    e.id as event_id,
    e.title,
    e.slug,
    e.host_id,
    u.email as host_email,
    u.display_name as host_name
FROM events e
LEFT JOIN users u ON e.host_id = u.id
ORDER BY e.created_at DESC;

-- 5. Check if host_id matches user id format (should be UUIDs)
SELECT 'UUID format check:' as info;
SELECT 
    'Events' as table_name,
    host_id,
    length(host_id::text) as id_length,
    CASE 
        WHEN host_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
        THEN 'Valid UUID' 
        ELSE 'Invalid UUID' 
    END as uuid_status
FROM events
UNION ALL
SELECT 
    'Users' as table_name,
    id,
    length(id::text) as id_length,
    CASE 
        WHEN id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
        THEN 'Valid UUID' 
        ELSE 'Invalid UUID' 
    END as uuid_status
FROM users; 