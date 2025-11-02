/*
  # Create images storage bucket

  1. Storage
    - Create public bucket named 'images' for storing uploaded images
    - Allow public access for reading images
    - Allow anyone to upload images
    - Set file size limit to 10MB
    - Allow image file types: jpg, jpeg, png, gif, webp

  2. Security
    - Public bucket for easy access to generated image URLs
    - Anyone can upload (insert)
    - Anyone can read (select)
*/

DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'images',
    'images',
    true,
    10485760,
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  )
  ON CONFLICT (id) DO NOTHING;
END $$;

DROP POLICY IF EXISTS "Anyone can upload images" ON storage.objects;
CREATE POLICY "Anyone can upload images"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'images');

DROP POLICY IF EXISTS "Anyone can read images" ON storage.objects;
CREATE POLICY "Anyone can read images"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'images');

DROP POLICY IF EXISTS "Anyone can update their images" ON storage.objects;
CREATE POLICY "Anyone can update their images"
  ON storage.objects
  FOR UPDATE
  TO anon, authenticated
  USING (bucket_id = 'images')
  WITH CHECK (bucket_id = 'images');

DROP POLICY IF EXISTS "Anyone can delete images" ON storage.objects;
CREATE POLICY "Anyone can delete images"
  ON storage.objects
  FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'images');