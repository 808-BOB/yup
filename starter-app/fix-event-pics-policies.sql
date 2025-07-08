-- Fix RLS policies for event-pics bucket
-- Run this in your Supabase SQL Editor to fix the upload permissions

-- Drop existing policies for event-pics bucket
DROP POLICY IF EXISTS "Authenticated users can upload event pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can update event pictures they own" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete event pictures they own" ON storage.objects;
DROP POLICY IF EXISTS "Event pictures are publicly viewable" ON storage.objects;

-- Create new, simpler policies for event-pics bucket
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

-- Verify the policies were created
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%event%'; 