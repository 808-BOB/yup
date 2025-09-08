-- Add image settings columns to events table
-- This migration adds the missing image positioning and scaling columns

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS image_scale INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS image_position_x INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS image_position_y INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS image_fit TEXT DEFAULT 'contain' CHECK (image_fit IN ('contain', 'cover'));

-- Add comments for documentation
COMMENT ON COLUMN events.image_scale IS 'Image scale percentage (10-200)';
COMMENT ON COLUMN events.image_position_x IS 'Image horizontal position percentage (0-100)';
COMMENT ON COLUMN events.image_position_y IS 'Image vertical position percentage (0-100)';
COMMENT ON COLUMN events.image_fit IS 'Image fit mode: contain or cover';

-- Verify the columns were added
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name IN ('image_scale', 'image_position_x', 'image_position_y', 'image_fit')
ORDER BY column_name;
