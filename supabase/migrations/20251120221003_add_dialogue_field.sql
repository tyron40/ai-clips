/*
  # Add dialogue field for talking character videos

  1. Changes
    - Add `dialogue` text field to videos table to store character speech
    - Field is nullable to maintain compatibility with existing video types
  
  2. Notes
    - Used by talking-character generation mode
    - Stores the text that characters speak in lip-sync videos
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'videos' AND column_name = 'dialogue'
  ) THEN
    ALTER TABLE videos ADD COLUMN dialogue text;
    COMMENT ON COLUMN videos.dialogue IS 'Dialogue text for talking character videos';
  END IF;
END $$;
