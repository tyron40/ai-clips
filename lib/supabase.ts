import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface VideoRecord {
  id: string;
  luma_id: string;
  prompt: string;
  image_url?: string;
  duration: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  video_url?: string;
  error_message?: string;
  created_at: string;
  completed_at?: string;
  generation_mode?: 'luma' | 'huggingface' | 'movie-scene' | 'multi-image' | 'hugging-people' | 'image-motion';
  style?: string;
  transition?: string;
  images?: string[];
  motion_type?: string;
  metadata?: Record<string, any>;
}
