-- Complete Auth Fix - Run this entire script in Supabase SQL Editor
-- This fixes both the users table schema and the trigger function

-- =====================================
-- STEP 1: Fix Users Table Schema
-- =====================================

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
ADD COLUMN IF NOT EXISTS custom_maybe_text TEXT DEFAULT 'Maybe',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

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
    custom_maybe_text = COALESCE(custom_maybe_text, 'Maybe'),
    created_at = COALESCE(created_at, NOW()),
    updated_at = COALESCE(updated_at, NOW())
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
    OR custom_maybe_text IS NULL
    OR created_at IS NULL
    OR updated_at IS NULL;

-- =====================================
-- STEP 2: Fix Trigger Function
-- =====================================

-- Drop the old trigger first
DROP TRIGGER IF EXISTS sync_user_trigger ON auth.users;

-- Create the updated trigger function with all required columns
CREATE OR REPLACE FUNCTION sync_user_display_name()
RETURNS TRIGGER AS $$
DECLARE
  default_username TEXT;
BEGIN
  -- Generate a default username from email
  default_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'preferred_username',
    split_part(NEW.email, '@', 1)
  );

  -- Insert or update user in users table when auth user is created/updated
  INSERT INTO users (
    id, 
    username,
    email, 
    display_name, 
    phone_number,
    profile_image_url,
    is_premium, 
    is_admin,
    is_pro,
    brand_theme,
    logo_url,
    brand_primary_color,
    brand_secondary_color,
    brand_tertiary_color,
    custom_yup_text,
    custom_nope_text,
    custom_maybe_text,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    default_username,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name', 
      split_part(NEW.email, '@', 1),
      'User'
    ),
    NEW.phone,
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    ),
    false, -- is_premium
    false, -- is_admin
    false, -- is_pro
    NULL,  -- brand_theme
    NULL,  -- logo_url
    'hsl(308, 100%, 66%)',  -- brand_primary_color
    'hsl(308, 100%, 76%)',  -- brand_secondary_color
    'hsl(308, 100%, 86%)',  -- brand_tertiary_color
    'Yup',   -- custom_yup_text
    'Nope',  -- custom_nope_text
    'Maybe', -- custom_maybe_text
    NOW(),   -- created_at
    NOW()    -- updated_at
  )
  ON CONFLICT (id) 
  DO UPDATE SET
    email = EXCLUDED.email,
    display_name = EXCLUDED.display_name,
    phone_number = EXCLUDED.phone_number,
    profile_image_url = EXCLUDED.profile_image_url,
    updated_at = NOW();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the new trigger
CREATE TRIGGER sync_user_trigger
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_display_name();

-- =====================================
-- STEP 3: Verification
-- =====================================

-- Show current table structure
SELECT 'Table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Show recent users
SELECT 'Recent users:' as info;
SELECT 
  u.id,
  u.username,
  u.email,
  u.display_name,
  u.is_premium,
  u.is_pro
FROM users u
LIMIT 5;

-- Test trigger function exists
SELECT 'Trigger function status:' as info;
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'sync_user_trigger'; 