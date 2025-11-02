/*
  # Add video generation modes support

  1. Changes
    - Add `generation_mode` column to videos table
      - Stores the type of generation: 'luma', 'huggingface', 'movie-scene', 'multi-image'
    - Add `style` column for movie scene styles
    - Add `transition` column for multi-image transitions
    - Add `images` JSONB column to store multiple image URLs for multi-image mode
    - Add `metadata` JSONB column for additional generation parameters

  2. Notes
    - Uses IF NOT EXISTS to safely add columns
    - Backwards compatible with existing records (nullable columns)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'videos' AND column_name = 'generation_mode'
  ) THEN
    ALTER TABLE videos ADD COLUMN generation_mode text DEFAULT 'luma';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'videos' AND column_name = 'style'
  ) THEN
    ALTER TABLE videos ADD COLUMN style text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'videos' AND column_name = 'transition'
  ) THEN
    ALTER TABLE videos ADD COLUMN transition text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'videos' AND column_name = 'images'
  ) THEN
    ALTER TABLE videos ADD COLUMN images jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'videos' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE videos ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_videos_generation_mode ON videos(generation_mode);