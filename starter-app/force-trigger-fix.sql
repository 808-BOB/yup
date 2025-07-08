-- FORCE TRIGGER FIX - Run this in Supabase SQL Editor
-- This completely drops and recreates everything to fix caching issues

-- STEP 1: Drop everything completely
DROP TRIGGER IF EXISTS sync_user_trigger ON auth.users CASCADE;
DROP FUNCTION IF EXISTS sync_user_display_name() CASCADE;

-- STEP 2: Wait a moment for Supabase to clear cache
SELECT pg_sleep(1);

-- STEP 3: Create a completely new, simple trigger function
CREATE OR REPLACE FUNCTION create_user_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Simple insert with only basic fields
  INSERT INTO public.users (
    id, 
    email
  ) VALUES (
    NEW.id,
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 4: Create the new trigger with a different name
CREATE TRIGGER user_signup_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_on_signup();

-- STEP 5: Test the trigger exists
SELECT 'SUCCESS: New trigger created!' as status
WHERE EXISTS (
  SELECT 1 FROM information_schema.triggers 
  WHERE trigger_name = 'user_signup_trigger'
);

-- STEP 6: Show current trigger status
SELECT 
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers 
WHERE trigger_name IN ('user_signup_trigger', 'sync_user_trigger');

-- STEP 7: Manually update existing users to have username
UPDATE public.users 
SET username = split_part(email, '@', 1)
WHERE username IS NULL 
  AND email IS NOT NULL; 