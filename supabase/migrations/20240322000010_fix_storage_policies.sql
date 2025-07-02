-- Fix storage policies to allow bucket listing and proper access

-- First, ensure the images bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
DROP POLICY IF EXISTS "Allow bucket listing" ON storage.buckets;

-- Allow listing buckets (this was missing!)
CREATE POLICY "Allow bucket listing"
ON storage.buckets FOR SELECT
USING (true);

-- Allow public read access to objects in images bucket
CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

-- Allow anonymous uploads to images bucket
CREATE POLICY "Allow anonymous uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'images');

-- Allow authenticated uploads to images bucket
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

-- Allow updates for authenticated users (for potential future features)
CREATE POLICY "Allow authenticated updates"
ON storage.objects FOR UPDATE
USING (bucket_id = 'images' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

-- Allow deletes for authenticated users (for admin features)
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
USING (bucket_id = 'images' AND auth.role() = 'authenticated');
