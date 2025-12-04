export const env = {
  LUMA_API_KEY: process.env.LUMA_API_KEY || '',
  REPLICATE_API_TOKEN: process.env.REPLICATE_API_TOKEN || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'AI Video Studio',
};

export function validateEnv() {
  const errors: string[] = [];

  if (!env.LUMA_API_KEY && !env.REPLICATE_API_TOKEN) {
    errors.push('Either LUMA_API_KEY or REPLICATE_API_TOKEN must be set');
  }

  if (!env.NEXT_PUBLIC_SUPABASE_URL) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is not set');
  }

  if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
  }

  return { valid: errors.length === 0, errors };
}

export function getEnvVar(key: string, fallback?: string): string {
  const value = process.env[key];
  if (!value && !fallback) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value || fallback || '';
}
