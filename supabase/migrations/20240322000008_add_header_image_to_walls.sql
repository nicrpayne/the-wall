-- Add header_image_url column to walls table
ALTER TABLE walls ADD COLUMN header_image_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN walls.header_image_url IS 'Optional header/banner image URL for wall branding';
