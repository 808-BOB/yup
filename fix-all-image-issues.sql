-- Comprehensive fix for all image-related database issues
-- Run this in your Supabase SQL editor

-- 1. Update position columns to support decimal values
ALTER TABLE events 
ALTER COLUMN image_position_x TYPE DECIMAL(5,2),
ALTER COLUMN image_position_y TYPE DECIMAL(5,2);

-- 2. Ensure all image columns have proper defaults
ALTER TABLE events 
ALTER COLUMN image_scale SET DEFAULT 100,
ALTER COLUMN image_position_x SET DEFAULT 50.00,
ALTER COLUMN image_position_y SET DEFAULT 50.00,
ALTER COLUMN image_fit SET DEFAULT 'contain';

-- 3. Update existing data to ensure proper formatting
UPDATE events 
SET 
  image_position_x = ROUND(COALESCE(image_position_x, 50), 2),
  image_position_y = ROUND(COALESCE(image_position_y, 50), 2),
  image_scale = COALESCE(image_scale, 100),
  image_fit = COALESCE(image_fit, 'contain')
WHERE image_url IS NOT NULL;

-- 4. Add constraints to ensure valid ranges
ALTER TABLE events 
ADD CONSTRAINT check_image_scale_range CHECK (image_scale >= 10 AND image_scale <= 200),
ADD CONSTRAINT check_image_position_x_range CHECK (image_position_x >= 0 AND image_position_x <= 100),
ADD CONSTRAINT check_image_position_y_range CHECK (image_position_y >= 0 AND image_position_y <= 100),
ADD CONSTRAINT check_image_fit_valid CHECK (image_fit IN ('contain', 'cover', 'fill', 'none', 'scale-down'));

-- 5. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_events_image_settings ON events(image_scale, image_position_x, image_position_y, image_fit) WHERE image_url IS NOT NULL;
