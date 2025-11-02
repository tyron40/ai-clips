# API Key Usage - Direct from .env File

This application reads API keys **directly from your `.env` file** without any backend server.

## How It Works

### 1. Supabase Client (Frontend & Backend)
**File:** `lib/supabase.ts`

```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

- Uses `NEXT_PUBLIC_SUPABASE_URL` from `.env`
- Uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` from `.env`
- The `NEXT_PUBLIC_` prefix makes these available in the browser

### 2. Luma API (Server-Side Only)
**File:** `app/api/luma/create/route.ts`

```typescript
const apiKey = process.env.LUMA_API_KEY;
```

**File:** `app/api/luma/status/route.ts`

```typescript
const apiKey = process.env.LUMA_API_KEY;
```

- Uses `LUMA_API_KEY` directly from `.env`
- This is a server-side environment variable (no `NEXT_PUBLIC_` prefix)
- Never exposed to the browser - stays secure on the server

## Your .env File

```
LUMA_API_KEY=luma-13a08a8e-a110-426d-8e02-41353291d6b7-b58a64ec-ff40-4933-b8b7-14d19041b53a
NEXT_PUBLIC_APP_NAME=Luma T2V Starter
NEXT_PUBLIC_SUPABASE_URL=https://xwiherizskjdihdzdrlp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## No Backend Server Required

- ✅ All API keys are read from `.env` at runtime
- ✅ Next.js API routes act as your backend (server-side code)
- ✅ Luma API key is never sent to the browser
- ✅ Supabase keys are standard public keys (protected by RLS policies)
- ✅ No separate tRPC or backend server needed

## Security

1. **Luma API Key** - Server-side only, never exposed to browser
2. **Supabase Keys** - Public anon key is safe to expose (protected by Row Level Security)
3. **Rate Limiting** - Built into API routes to prevent abuse

## How Frontend Calls Luma API

```typescript
// Frontend calls your Next.js API route
const response = await fetch('/api/luma/create', {
  method: 'POST',
  body: JSON.stringify({ prompt, imageUrl })
});

// Your API route (/app/api/luma/create/route.ts) then:
// 1. Reads LUMA_API_KEY from process.env
// 2. Calls Luma API with the key
// 3. Returns result to frontend
```

This keeps your Luma API key secure on the server!
