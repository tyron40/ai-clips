/*
  # Add new generation modes

  1. Changes
    - Add `motion_type` column for image animation motion types
    - Update generation_mode to support 'hugging-people' and 'image-motion'
    - Add index for better query performance

  2. Notes
    - Uses IF NOT EXISTS for safe column addition
    - Backwards compatible with existing records
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'videos' AND column_name = 'motion_type'
  ) THEN
    ALTER TABLE videos ADD COLUMN motion_type text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_videos_motion_type ON videos(motion_type);

COMMENT ON COLUMN videos.generation_mode IS 'Generation mode: luma, huggingface, movie-scene, multi-image, hugging-people, or image-motion';
COMMENT ON COLUMN videos.motion_type IS 'Motion type for image-motion mode: gentle, dynamic, cinematic, zoom, pan, or dramatic';