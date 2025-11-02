/*
  # Create storage bucket for user images

  1. Storage
    - Create a public bucket called 'images' for storing user-uploaded images
    - Enable public access for uploaded images
  
  2. Security
    - Allow authenticated and anonymous users to upload images
    - Allow public read access to all images
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can upload images"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'images');

CREATE POLICY "Public read access to images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');