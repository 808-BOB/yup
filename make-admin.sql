-- SQL script to make bob@bobdavidson.com an admin user
-- Run this in your Supabase SQL editor

UPDATE users 
SET is_admin = true 
WHERE email = 'bob@bobdavidson.com';

-- Verify the update
SELECT id, email, display_name, is_admin, created_at 
FROM users 
WHERE email = 'bob@bobdavidson.com'; 