-- Simple Database Fix Script
-- Run this step by step in Supabase SQL Editor

-- STEP 1: Drop the problematic trigger first
DROP TRIGGER IF EXISTS sync_user_trigger ON auth.users;

-- STEP 2: Add the missing username column (this might fail if it exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;

-- STEP 3: Add other missing columns just in case
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT FALSE;

-- STEP 4: Create a SIMPLE trigger function that only inserts basic data
CREATE OR REPLACE FUNCTION sync_user_display_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Just insert the basic user data without trying to be fancy
  INSERT INTO users (
    id, 
    email,
    username
  ) VALUES (
    NEW.id,
    NEW.email,
    split_part(NEW.email, '@', 1)  -- Simple username from email
  )
  ON CONFLICT (id) 
  DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 5: Recreate the trigger
CREATE TRIGGER sync_user_trigger
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_display_name();

-- STEP 6: Verify everything worked
SELECT 'Verification:' as status;
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'username')
    THEN 'SUCCESS: username column exists ✅'
    ELSE 'FAILED: username column missing ❌'
  END as result; 