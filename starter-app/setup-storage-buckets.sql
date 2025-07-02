-- Create storage buckets for image uploads
-- Run this in your Supabase SQL editor

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

-- Set up RLS policies for profile-pics bucket
CREATE POLICY "Users can upload their own profile picture" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-pics' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own profile picture" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'profile-pics' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own profile picture" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'profile-pics' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Profile pictures are publicly viewable" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'profile-pics');

-- Set up RLS policies for event-pics bucket
CREATE POLICY "Authenticated users can upload event pictures" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'event-pics' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update event pictures they own" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'event-pics' 
    AND auth.role() = 'authenticated'
    -- Additional check would be to verify they own the event with this ID
  );

CREATE POLICY "Users can delete event pictures they own" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'event-pics' 
    AND auth.role() = 'authenticated'
    -- Additional check would be to verify they own the event with this ID
  );

CREATE POLICY "Event pictures are publicly viewable" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'event-pics'); 