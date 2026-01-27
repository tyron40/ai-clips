-- # Create Influencer Profiles System
--
-- 1. New Tables
--    - influencer_profiles
--      - id (uuid, primary key)
--      - user_id (uuid, foreign key to auth.users)
--      - name (text) - Influencer name
--      - nickname (text) - Optional nickname
--      - age_range (text) - e.g., "22-26"
--      - ethnicity (text) - Ethnicity description
--      - skin_tone (text) - Skin tone details
--      - hair_style (text) - Hair style description
--      - hair_color (text) - Hair color
--      - eye_color (text) - Eye color
--      - face_shape (text) - Face shape description
--      - body_type (text) - Body type description
--      - style (text) - Fashion style
--      - personality (text) - Personality description
--      - voice_tone (text) - Voice and tone
--      - niche (text) - Content niche
--      - base_image_url (text) - URL to the base reference image
--      - prompt_template (text) - The master prompt template
--      - camera_style (text) - Preferred camera style
--      - created_at (timestamptz)
--      - updated_at (timestamptz)
--
-- 2. Changes to existing tables
--    - Add influencer_profile_id to videos table to link videos to profiles
--
-- 3. Security
--    - Enable RLS on influencer_profiles table
--    - Add policies for authenticated users to manage their own profiles

CREATE TABLE IF NOT EXISTS influencer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  nickname text,
  age_range text,
  ethnicity text,
  skin_tone text,
  hair_style text,
  hair_color text,
  eye_color text,
  face_shape text,
  body_type text,
  style text,
  personality text,
  voice_tone text,
  niche text,
  base_image_url text,
  prompt_template text,
  camera_style text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE influencer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own influencer profiles"
  ON influencer_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own influencer profiles"
  ON influencer_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own influencer profiles"
  ON influencer_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own influencer profiles"
  ON influencer_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add influencer_profile_id to videos table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'videos' AND column_name = 'influencer_profile_id'
  ) THEN
    ALTER TABLE videos ADD COLUMN influencer_profile_id uuid REFERENCES influencer_profiles(id) ON DELETE SET NULL;
  END IF;
END $$;