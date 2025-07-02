-- Manual Storage Bucket Creation Script
-- Copy and paste this into your Supabase SQL Editor to create the buckets

-- Create profile-pics bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-pics',
  'profile-pics',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Create event-pics bucket  
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-pics',
  'event-pics', 
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies for profile-pics bucket
CREATE POLICY "Anyone can view profile pictures" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-pics');

CREATE POLICY "Users can upload their own profile picture" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-pics' 
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can update their own profile picture" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profile-pics' 
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can delete their own profile picture" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profile-pics' 
    AND auth.uid() IS NOT NULL
  );

-- Create policies for event-pics bucket
CREATE POLICY "Anyone can view event pictures" ON storage.objects
  FOR SELECT USING (bucket_id = 'event-pics');

CREATE POLICY "Authenticated users can upload event pictures" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'event-pics' 
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Authenticated users can update event pictures" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'event-pics' 
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Authenticated users can delete event pictures" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'event-pics' 
    AND auth.uid() IS NOT NULL
  );

-- Verify the buckets were created
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id IN ('profile-pics', 'event-pics'); 