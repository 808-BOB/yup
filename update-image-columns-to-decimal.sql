-- Update image position columns to DECIMAL for better precision
-- This allows for decimal values like 47.4 instead of just integers

ALTER TABLE events 
ALTER COLUMN image_position_x TYPE DECIMAL(5,2),
ALTER COLUMN image_position_y TYPE DECIMAL(5,2);

-- Update existing data to ensure it's properly formatted
UPDATE events 
SET 
  image_position_x = ROUND(image_position_x, 2),
  image_position_y = ROUND(image_position_y, 2)
WHERE image_position_x IS NOT NULL OR image_position_y IS NOT NULL;
