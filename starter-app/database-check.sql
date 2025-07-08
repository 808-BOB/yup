-- Database Diagnostic Script
-- Run this in Supabase SQL Editor to check the current state

-- 1. Check if users table exists and its columns
SELECT 'Users table structure:' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check if username column specifically exists
SELECT 'Username column check:' as info;
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' 
                AND column_name = 'username' 
                AND table_schema = 'public'
        ) 
        THEN 'USERNAME COLUMN EXISTS ✅' 
        ELSE 'USERNAME COLUMN MISSING ❌' 
    END as username_status;

-- 3. Check if trigger function exists
SELECT 'Trigger function check:' as info;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'sync_user_trigger';

-- 4. Check current users in the table
SELECT 'Current users:' as info;
SELECT 
    id,
    email,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' 
                AND column_name = 'username' 
                AND table_schema = 'public'
        ) 
        THEN 'has username column'
        ELSE 'NO username column'
    END as column_status
FROM users 
LIMIT 3;

-- 5. Test if we can add username column manually
SELECT 'Manual column add test:' as info;
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
            AND column_name = 'username' 
            AND table_schema = 'public'
    ) THEN
        ALTER TABLE users ADD COLUMN username TEXT;
        RAISE NOTICE 'Added username column successfully!';
    ELSE
        RAISE NOTICE 'Username column already exists!';
    END IF;
END $$; 