# Netlify Deployment Setup

This guide explains how to deploy your AI Video Studio to Netlify with all APIs running on the Netlify backend.

## Architecture

All API calls are now routed through Netlify:
- **Luma AI APIs**: `/api/luma/create` and `/api/luma/status` (Next.js API routes)
- **Speech Generation**: `/.netlify/functions/generate-speech` (Netlify Function)
- **Database**: Supabase for user auth and video storage
- **File Storage**: Supabase Storage for images

## Environment Variables

You need to set these in Netlify:

### Required for Core Functionality
1. `LUMA_API_KEY` - Your Luma AI API key
2. `OPENAI_API_KEY` - Your OpenAI API key (for text-to-speech)

### Required for Database & Auth
3. `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
4. `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

### Optional
5. `NEXT_PUBLIC_APP_NAME` - App name (default: "AI Video Studio")
6. `NEXT_PUBLIC_SITE_URL` - Your deployed site URL

## Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Add Netlify functions and authentication"
git push origin main
```

### 2. Connect to Netlify
1. Go to [Netlify](https://app.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect your GitHub repository
4. Netlify will auto-detect Next.js settings

### 3. Configure Build Settings
Build settings should be auto-detected, but verify:
- **Build command**: `npm run build`
- **Publish directory**: `.next`
- **Functions directory**: `netlify/functions`

### 4. Set Environment Variables
In Netlify dashboard → Site settings → Environment variables, add:

```
LUMA_API_KEY=your-luma-api-key
OPENAI_API_KEY=your-openai-api-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_APP_NAME=AI Video Studio
```

### 5. Deploy
Click "Deploy site" - Netlify will:
1. Install dependencies
2. Build your Next.js app
3. Deploy Netlify functions
4. Deploy the site

## Local Development

For local development, make sure your `.env` file has all the required variables:

```bash
LUMA_API_KEY=your-luma-api-key
OPENAI_API_KEY=your-openai-api-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_APP_NAME=AI Video Studio
```

To test Netlify functions locally, use:
```bash
netlify dev
```

This will run your Next.js app and Netlify functions together.

## API Endpoints

### Next.js API Routes (automatically work with Netlify)
- `POST /api/luma/create` - Create video generation job
- `GET /api/luma/status?id=<job_id>` - Check video generation status

### Netlify Functions
- `POST /.netlify/functions/generate-speech` - Generate speech from text
  - Body: `{ text: string, voiceStyle: 'natural' | 'dramatic' | 'professional' | 'friendly' }`
  - Returns: MP3 audio file

## Features

### Authentication
- Email/password authentication via Supabase
- User profiles automatically created on signup
- Session management with AuthContext

### Video Storage
- All videos saved to authenticated user accounts
- View all your creations in "My Videos"
- Delete videos you no longer need

### Audio Generation
- Text-to-speech powered by OpenAI
- Multiple voice styles available
- Audio syncs automatically with video

## Troubleshooting

### Functions Not Working
1. Check environment variables are set in Netlify
2. Verify `netlify.toml` has the functions directory configured
3. Check function logs in Netlify dashboard

### Audio Not Playing
1. Ensure `OPENAI_API_KEY` is set in Netlify environment variables
2. Check browser console for errors
3. Verify the audio blob is being created (check Network tab)

### Authentication Issues
1. Verify Supabase environment variables are correct
2. Check that RLS policies are enabled on your tables
3. Ensure the migration was applied successfully

## Support

If you encounter issues:
1. Check Netlify function logs
2. Check browser console for errors
3. Verify all environment variables are set correctly
4. Test APIs using the Network tab in browser DevTools
