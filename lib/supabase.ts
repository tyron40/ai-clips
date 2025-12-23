import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTIwMDAsImV4cCI6MTk2MDc2ODAwMH0.placeholder';

let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'ai-video-studio-auth',
      },
      global: {
        headers: {
          'x-client-info': 'ai-video-studio',
        },
      },
    });
  }
  return supabaseInstance;
}

export const supabase = getSupabaseClient();

export function createClient() {
  return getSupabaseClient();
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
