-- Setup brand-logos storage bucket for Yup.RSVP branding
-- Run this in your Supabase SQL Editor

-- Create the brand-logos bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'brand-logos',
  'brand-logos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Enable RLS on the objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own brand logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own brand logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own brand logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own brand logos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view brand logos" ON storage.objects;

-- Policy for authenticated users to upload their own brand logos
CREATE POLICY "Users can upload their own brand logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'brand-logos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for users to view their own brand logos
CREATE POLICY "Users can view their own brand logos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'brand-logos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for users to update their own brand logos
CREATE POLICY "Users can update their own brand logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'brand-logos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for users to delete their own brand logos
CREATE POLICY "Users can delete their own brand logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'brand-logos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for public access to view brand logos (since bucket is public)
CREATE POLICY "Public can view brand logos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'brand-logos');

-- Verify the setup
SELECT
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'brand-logos';

-- Check policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%brand%';

-- Test query to see if the bucket is accessible
SELECT COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%brand%';

-- Note: If you get permission errors, you can create the bucket through the Supabase Dashboard:
-- 1. Go to Storage in your Supabase Dashboard
-- 2. Click "Create bucket"
-- 3. Set bucket name to: brand-logos
-- 4. Enable "Public bucket"
-- 5. Set file size limit to: 5MB
-- 6. Add allowed MIME types: image/jpeg, image/png, image/webp, image/svg+xml, image/gif

-- The RLS policies will be automatically managed by Supabase for public buckets
-- with authenticated users having upload permissions to their own folders
