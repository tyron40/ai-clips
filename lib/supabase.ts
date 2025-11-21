import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTIwMDAsImV4cCI6MTk2MDc2ODAwMH0.placeholder';

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'x-client-info': 'ai-video-studio',
    },
  },
});

export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

export interface VideoRecord {
  id: string;
  luma_id: string;
  prompt: string;
  image_url?: string;
  duration: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  video_url?: string;
  audio_url?: string;
  error_message?: string;
  created_at: string;
  completed_at?: string;
  generation_mode?: 'luma' | 'huggingface' | 'movie-scene' | 'multi-image' | 'hugging-people' | 'image-motion' | 'talking-character';
  style?: string;
  transition?: string;
  images?: string[];
  motion_type?: string;
  dialogue?: string;
  metadata?: Record<string, any>;
}
