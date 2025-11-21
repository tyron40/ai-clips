# Troubleshooting Guide

## Common Issues and Solutions

### 1. "Unexpected token '<', "<!DOCTYPE"... is not valid JSON"

**Cause**: This happens when a Netlify function returns HTML (usually a 404 page) instead of JSON.

**Common Scenarios**:
- Running locally without Netlify Dev CLI
- Netlify function not deployed
- Missing environment variables in Netlify

**Solutions**:

#### For Local Development:
Use Netlify Dev to run functions locally:
```bash
netlify dev
```

This will run both Next.js and Netlify functions together.

#### For Production:
1. Ensure Netlify functions are deployed (check deploy logs)
2. Verify environment variables are set in Netlify dashboard
3. Check function logs in Netlify dashboard for errors

### 2. Speech Generation Not Working

**Symptoms**:
- "Speech generation service unavailable" error
- No audio plays with talking character videos

**Solutions**:

1. **Check OPENAI_API_KEY**:
   - Go to Netlify dashboard → Site settings → Environment variables
   - Ensure `OPENAI_API_KEY` is set with a valid OpenAI API key
   - Redeploy after adding the key

2. **Verify Function Deployment**:
   - Check deploy logs for `generate-speech` function
   - Should see "1 new function" in deploy summary

3. **Test Function Directly**:
   ```bash
   curl -X POST https://your-site.netlify.app/.netlify/functions/generate-speech \
     -H "Content-Type: application/json" \
     -d '{"text": "Hello world", "voiceStyle": "natural"}'
   ```

### 3. Image Upload Taking Too Long

**Solution**: Already optimized! Images over 1MB are automatically compressed before upload.

**If still slow**:
1. Check your internet connection
2. Verify Supabase storage bucket is accessible
3. Try a smaller test image first
4. Check browser console for specific errors

### 4. Video Generation Fails

**Common Causes**:

1. **Missing LUMA_API_KEY**:
   - Add to Netlify environment variables
   - Redeploy site

2. **Rate Limiting**:
   - Default: 5 requests per minute
   - Wait 60 seconds and try again
   - Check response for rate limit message

3. **Invalid Prompt**:
   - Ensure prompt is not empty
   - Keep prompts descriptive but reasonable length
   - Avoid special characters that might break processing

### 5. Authentication Issues

**Symptoms**:
- Can't sign in or sign up
- "User already exists" error
- Session not persisting

**Solutions**:

1. **Check Supabase Configuration**:
   - Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
   - Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
   - Check Supabase project is active

2. **Email Already Exists**:
   - Use password reset instead of signup
   - Or use a different email

3. **Session Issues**:
   - Clear browser cookies/localStorage
   - Check if email confirmation is enabled (should be disabled)

### 6. Videos Not Saving to Account

**Symptoms**:
- Videos generate but don't appear in "My Videos"
- "My Videos" page is empty

**Solutions**:

1. **Ensure You're Signed In**:
   - Check if user email shows in navigation
   - Sign in before generating videos

2. **Check Database**:
   - Verify RLS policies are enabled
   - Check Supabase dashboard for video records

3. **Browser Console**:
   - Look for database errors
   - Check if `user_id` is being saved with videos

### 7. Videos Not Playing

**Solutions**:

1. **Check Video URL**:
   - Verify video completed generation
   - Check if URL is accessible in browser

2. **Browser Compatibility**:
   - Use Chrome, Firefox, Safari, or Edge
   - Update browser to latest version

3. **Audio Sync Issues**:
   - Audio should automatically sync with video
   - Check browser console for audio errors
   - Ensure audio URL was generated

## Development vs Production

### Local Development (npm run dev):
- Netlify functions won't work (404)
- Use `netlify dev` instead for full stack
- Database and auth work normally

### Production (Netlify):
- All features work
- Must set environment variables
- Check deploy logs for errors

## Checking Logs

### Netlify Function Logs:
1. Go to Netlify dashboard
2. Click on your site
3. Go to "Functions" tab
4. Click on function name
5. View logs for errors

### Browser Console:
1. Press F12 or right-click → Inspect
2. Go to "Console" tab
3. Look for red errors
4. Check "Network" tab for failed requests

### Supabase Logs:
1. Go to Supabase dashboard
2. Click on your project
3. Go to "Logs" section
4. Filter by "Postgres" or "Auth"

## Getting Help

If you're still stuck:

1. **Check Console Errors**: Most errors show detailed messages in browser console
2. **Review Environment Variables**: Ensure all required variables are set
3. **Test Individual Features**: Isolate which feature is failing
4. **Check Network Tab**: See which API calls are failing
5. **Review Deploy Logs**: Check Netlify deploy logs for build errors

## Quick Checklist

Before deploying to production:

- [ ] All environment variables set in Netlify
- [ ] `LUMA_API_KEY` is valid
- [ ] `OPENAI_API_KEY` is valid
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is correct
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
- [ ] Supabase migrations applied
- [ ] RLS policies enabled on all tables
- [ ] Site builds without errors
- [ ] Netlify functions deployed successfully
