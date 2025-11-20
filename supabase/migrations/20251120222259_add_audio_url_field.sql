/*
  # Add audio_url field for talking character audio

  1. Changes
    - Add `audio_url` text field to videos table to store generated speech audio
    - Field is nullable to maintain compatibility with existing video types
  
  2. Notes
    - Used by talking-character generation mode
    - Stores URL to the MP3 audio file generated from dialogue text
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'videos' AND column_name = 'audio_url'
  ) THEN
    ALTER TABLE videos ADD COLUMN audio_url text;
    COMMENT ON COLUMN videos.audio_url IS 'URL to audio file for talking character videos';
  END IF;
END $$;
