-- Add comprehensive branding fields to users table
-- Run this in your Supabase SQL editor

-- Add new branding columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS brand_primary_color TEXT,
ADD COLUMN IF NOT EXISTS brand_secondary_color TEXT,
ADD COLUMN IF NOT EXISTS brand_tertiary_color TEXT,
ADD COLUMN IF NOT EXISTS custom_yup_text TEXT DEFAULT 'Yup',
ADD COLUMN IF NOT EXISTS custom_nope_text TEXT DEFAULT 'Nope',
ADD COLUMN IF NOT EXISTS custom_maybe_text TEXT DEFAULT 'Maybe';

-- Update existing users to have default values
UPDATE users
SET
  brand_primary_color = COALESCE(brand_primary_color, 'hsl(308, 100%, 66%)'),
  brand_secondary_color = COALESCE(brand_secondary_color, 'hsl(308, 100%, 76%)'),
  brand_tertiary_color = COALESCE(brand_tertiary_color, 'hsl(308, 100%, 86%)'),
  custom_yup_text = COALESCE(custom_yup_text, 'Yup'),
  custom_nope_text = COALESCE(custom_nope_text, 'Nope'),
  custom_maybe_text = COALESCE(custom_maybe_text, 'Maybe')
WHERE
  brand_primary_color IS NULL
  OR brand_secondary_color IS NULL
  OR brand_tertiary_color IS NULL
  OR custom_yup_text IS NULL
  OR custom_nope_text IS NULL
  OR custom_maybe_text IS NULL;

-- Create storage bucket for logos if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'brand-logos',
  'brand-logos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
) ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for brand-logos bucket
CREATE POLICY "Users can upload their own brand logo" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'brand-logos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own brand logo" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'brand-logos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own brand logo" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'brand-logos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Brand logos are publicly viewable" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'brand-logos');
