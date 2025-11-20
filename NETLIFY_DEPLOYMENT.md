# Netlify Deployment Guide

This project is configured to deploy on Netlify.

## Prerequisites

1. A Netlify account
2. Luma AI API key
3. OpenAI API key (for text-to-speech voiceovers)
4. Supabase project set up with the required tables and storage buckets

## Environment Variables

Before deploying, you **MUST** set up the following environment variables in your Netlify project settings:

### Required Variables

- `LUMA_API_KEY`: Your Luma AI API key
- `OPENAI_API_KEY`: Your OpenAI API key (for voiceover generation)
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### Optional Variables

- `NEXT_PUBLIC_APP_NAME`: The name of your application (default: "AI Video Studio")

## How to Add Environment Variables in Netlify

1. Go to your Netlify dashboard
2. Select your site
3. Navigate to **Site configuration** → **Environment variables**
4. Click **Add a variable**
5. For each variable:
   - Select "Add a single variable"
   - Enter the **Key** (e.g., `LUMA_API_KEY`)
   - Enter the **Value** (your actual API key)
   - Select scopes: **"Builds, Functions, and Deploy Previews"** or **"All scopes"**
   - Click **Create variable**

**IMPORTANT**: After adding all environment variables, you must trigger a new deploy for them to take effect.

## Deployment Steps

### First Time Setup

1. **Connect Repository to Netlify**
   - Log in to Netlify
   - Click "Add new site" → "Import an existing project"
   - Choose your Git provider (GitHub, GitLab, etc.)
   - Select your repository

2. **Configure Build Settings** (should auto-detect from netlify.toml)
   - Build command: `npm run build`
   - Publish directory: `.next`

3. **Add Environment Variables** (see section above)
   - Add all 4 required variables
   - Double-check spelling and values

4. **Deploy**
   - Click "Deploy site"
   - Wait for build to complete

### Subsequent Deploys

Netlify will automatically deploy when you push to your main branch. To manually trigger a deploy:
- Go to **Deploys** tab
- Click **Trigger deploy** → **Deploy site**

## Troubleshooting Build Errors

### Error: "Missing Supabase environment variables"

**Solution:**
1. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in Netlify
2. Make sure the variable names are **exactly** as shown (case-sensitive)
3. Ensure you selected the correct scopes when adding variables
4. Click **Trigger deploy** → **Clear cache and deploy site**

### Error: "Command failed with exit code 1"

**Solution:**
1. Check that all environment variables are added
2. Look at the detailed build logs in Netlify for the specific error
3. Ensure your `.env` file is not committed to Git (it should be in `.gitignore`)
4. Try a clean deploy: **Trigger deploy** → **Clear cache and deploy site**

### Error: Build succeeds but site doesn't work

**Solution:**
1. Open browser console to see errors
2. Verify environment variables are available to the client (must start with `NEXT_PUBLIC_`)
3. Check Supabase connection in production
4. Ensure Supabase Edge Function is deployed

## Post-Deployment Testing

After successful deployment, test these features:

1. ✅ **Text to Video** - Generate a simple video from text prompt
2. ✅ **Image to Video** - Upload an image and animate it
3. ✅ **Movie Scene** - Create a cinematic scene
4. ✅ **Talking Character** - Create a video with voiceover
5. ✅ **Gallery** - View previously generated videos
6. ✅ **Audio Playback** - Verify audio plays with videos

## Supabase Configuration

Make sure your Supabase project has:

1. **Database Tables** (created via migrations)
   - `videos` table with all required columns

2. **Storage Buckets**
   - `images` bucket (public access for uploaded images)

3. **Edge Functions**
   - `generate-speech` function deployed
   - OpenAI API key configured in Supabase secrets

4. **Row Level Security (RLS)**
   - Policies configured for public read/write access
   - Or adjust based on your authentication needs

## Getting Your API Keys

### Luma AI API Key
1. Go to [Luma Labs](https://lumalabs.ai/)
2. Sign up or log in
3. Navigate to API settings
4. Generate an API key

### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Go to API Keys section
4. Create new secret key
5. Copy the key (you won't be able to see it again)

### Supabase Credentials
1. Go to your [Supabase dashboard](https://app.supabase.com/)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** (for `NEXT_PUBLIC_SUPABASE_URL`)
   - **anon public** key (for `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

## Need Help?

If you continue to experience issues:
1. Check the detailed build logs in Netlify
2. Verify all environment variables one more time
3. Try deploying a simpler version first
4. Contact Netlify support if the issue persists

## Success! 🎉

Once deployed successfully:
- Your site will have a Netlify URL (e.g., `your-site.netlify.app`)
- You can add a custom domain in Netlify settings
- Automatic HTTPS is enabled
- Deploys happen automatically on Git push
