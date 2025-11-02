export function validateEnv() {
  const errors: string[] = [];

  if (!process.env.LUMA_API_KEY) {
    errors.push('LUMA_API_KEY is not set');
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is not set');
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
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
