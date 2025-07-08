-- Sync Display Names from Auth Users to Users Table
-- This script updates the users table display_name with proper names from auth.users metadata

-- First, let's see what we're working with
-- SELECT id, email, display_name FROM users LIMIT 5;
-- SELECT id, email, raw_user_meta_data->>'display_name' as auth_display_name FROM auth.users LIMIT 5;

-- Update users table with display names from auth.users metadata
UPDATE users 
SET display_name = COALESCE(
  au.raw_user_meta_data->>'display_name',
  au.raw_user_meta_data->>'full_name', 
  au.raw_user_meta_data->>'name',
  split_part(au.email, '@', 1),
  'User'
)
FROM auth.users au
WHERE users.id = au.id
  AND au.raw_user_meta_data IS NOT NULL;

-- Create a function to sync user data from auth.users
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
    custom_maybe_text
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
    NULL,  -- brand_primary_color
    NULL,  -- brand_secondary_color
    NULL,  -- brand_tertiary_color
    NULL,  -- custom_yup_text
    NULL,  -- custom_nope_text
    NULL   -- custom_maybe_text
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

-- Create trigger to automatically sync when auth users are created/updated
DROP TRIGGER IF EXISTS sync_user_trigger ON auth.users;
CREATE TRIGGER sync_user_trigger
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_display_name();

-- Verify the results
SELECT 
  u.id,
  u.email,
  u.display_name as users_display_name,
  au.raw_user_meta_data->>'display_name' as auth_display_name
FROM users u
JOIN auth.users au ON u.id = au.id
ORDER BY au.created_at DESC
LIMIT 10; 