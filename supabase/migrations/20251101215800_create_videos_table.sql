/*
  # Create videos table for storing generation history

  1. New Tables
    - `videos`
      - `id` (uuid, primary key) - Unique identifier for each video record
      - `luma_id` (text, not null) - The ID from Luma API for tracking generation status
      - `prompt` (text, not null) - The prompt used to generate the video
      - `image_url` (text, nullable) - Optional image URL used as keyframe
      - `duration` (text, not null) - Video duration (5s, 9s, or 10s)
      - `status` (text, not null) - Generation status (queued, processing, completed, failed)
      - `video_url` (text, nullable) - URL to the generated video (when completed)
      - `error_message` (text, nullable) - Error message if generation failed
      - `created_at` (timestamptz, default now()) - When the video generation was initiated
      - `completed_at` (timestamptz, nullable) - When the video generation completed

  2. Security
    - Enable RLS on `videos` table
    - Public can insert new video records
    - Public can read all video records
    - Public can update video records (for status updates)
*/

CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  luma_id text NOT NULL,
  prompt text NOT NULL,
  image_url text,
  duration text NOT NULL DEFAULT '5s',
  status text NOT NULL DEFAULT 'queued',
  video_url text,
  error_message text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert videos"
  ON videos
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read videos"
  ON videos
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can update videos"
  ON videos
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_luma_id ON videos(luma_id);