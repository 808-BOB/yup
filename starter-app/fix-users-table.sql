-- Fix Users Table Schema
-- Run this in your Supabase SQL Editor to add missing columns

-- Add missing columns to users table if they don't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS profile_image_url TEXT,
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS brand_theme TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS brand_primary_color TEXT DEFAULT 'hsl(308, 100%, 66%)',
ADD COLUMN IF NOT EXISTS brand_secondary_color TEXT DEFAULT 'hsl(308, 100%, 76%)',
ADD COLUMN IF NOT EXISTS brand_tertiary_color TEXT DEFAULT 'hsl(308, 100%, 86%)',
ADD COLUMN IF NOT EXISTS custom_yup_text TEXT DEFAULT 'Yup',
ADD COLUMN IF NOT EXISTS custom_nope_text TEXT DEFAULT 'Nope',
ADD COLUMN IF NOT EXISTS custom_maybe_text TEXT DEFAULT 'Maybe';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_username_idx ON users(username);
CREATE INDEX IF NOT EXISTS users_is_premium_idx ON users(is_premium);
CREATE INDEX IF NOT EXISTS users_is_pro_idx ON users(is_pro);

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies if they don't exist
DO $$ 
BEGIN
    -- Policy for users to read their own data
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' AND policyname = 'Users can view own profile'
    ) THEN
        CREATE POLICY "Users can view own profile" ON users
            FOR SELECT USING (auth.uid() = id);
    END IF;

    -- Policy for users to update their own data
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' AND policyname = 'Users can update own profile'
    ) THEN
        CREATE POLICY "Users can update own profile" ON users
            FOR UPDATE USING (auth.uid() = id);
    END IF;

    -- Policy for users to insert their own profile (for OAuth)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' AND policyname = 'Users can insert own profile'
    ) THEN
        CREATE POLICY "Users can insert own profile" ON users
            FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
END
$$;

-- Update any existing users to have default values
UPDATE users 
SET 
    display_name = COALESCE(display_name, email, 'User'),
    is_premium = COALESCE(is_premium, FALSE),
    is_admin = COALESCE(is_admin, FALSE),
    is_pro = COALESCE(is_pro, FALSE),
    brand_primary_color = COALESCE(brand_primary_color, 'hsl(308, 100%, 66%)'),
    brand_secondary_color = COALESCE(brand_secondary_color, 'hsl(308, 100%, 76%)'),
    brand_tertiary_color = COALESCE(brand_tertiary_color, 'hsl(308, 100%, 86%)'),
    custom_yup_text = COALESCE(custom_yup_text, 'Yup'),
    custom_nope_text = COALESCE(custom_nope_text, 'Nope'),
    custom_maybe_text = COALESCE(custom_maybe_text, 'Maybe')
WHERE 
    display_name IS NULL 
    OR is_premium IS NULL 
    OR is_admin IS NULL 
    OR is_pro IS NULL
    OR brand_primary_color IS NULL
    OR brand_secondary_color IS NULL
    OR brand_tertiary_color IS NULL
    OR custom_yup_text IS NULL
    OR custom_nope_text IS NULL
    OR custom_maybe_text IS NULL;

-- Show current table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position; 