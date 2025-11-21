# AI Video Studio

A production-ready multi-mode video generation application powered by Luma AI Dream Machine. Create stunning AI-generated videos with text-to-video, image-to-video, voiceovers, and advanced cinematic modes.

## Features

### Video Generation Modes
- **Luma Dream Machine** - Professional text-to-video and image-to-video with 5s or 9s durations
- **Hugging Face Animation** - Animate static images with AI-powered motion
- **Movie Scene Generator** - Create cinematic scenes with various styles (thriller, comedy, drama, etc.)
- **Multi-Image Sequences** - Seamless transitions between multiple images
- **Hugging People Videos** - Generate warm, emotional human interaction videos
- **Image Motion** - Apply various motion effects (parallax, zoom, pan, etc.)
- **Talking Characters** - Create speaking character videos with lip-sync

### Audio & Voiceover
- **Text-to-Speech** - Generate natural voiceovers with OpenAI TTS
- **Multiple Voice Styles** - Natural, dramatic, professional, and friendly voices
- **Audio Sync** - Automatic audio-video synchronization

### User Features
- **Authentication** - Secure user authentication with Supabase Auth
- **Video Gallery** - Personal video history with preview thumbnails
- **Image Upload** - Drag-and-drop or file picker with automatic compression
- **Template Library** - Quick-start templates for common video types

### Production Features
- **Rate Limiting** - Intelligent rate limiting on API endpoints
- **Error Handling** - Comprehensive error boundaries and user feedback
- **Mobile Optimized** - Full mobile support with proper caching headers
- **Security** - RLS policies, CORS headers, and security middleware
- **SEO Optimized** - Proper metadata, sitemap, and robots.txt
- **Database Persistence** - All videos saved to Supabase with user ownership

## Prerequisites

- Node.js 18+ and npm
- Luma AI API key ([Get one here](https://lumalabs.ai))
- OpenAI API key ([Get one here](https://platform.openai.com))
- Supabase account ([Create one here](https://supabase.com))

## Quick Start

1. **Clone and Install**
```bash
git clone <your-repo>
cd ai-video-studio
npm install
```

2. **Configure Environment**
```bash
cp .env.local.example .env
```

Edit `.env` with your credentials:
```env
LUMA_API_KEY=your-luma-api-key
OPENAI_API_KEY=your-openai-api-key
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_APP_NAME=AI Video Studio
```

3. **Setup Database**

The Supabase migrations are in `supabase/migrations/`. They will be automatically applied when you deploy to Netlify with the Supabase integration.

For local development, run:
```bash
npx supabase link --project-ref your-project-ref
npx supabase db push
```

4. **Run Development Server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment

### Netlify (Recommended)

The project includes full Netlify configuration in `netlify.toml`.

1. **Push to Repository**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Connect to Netlify**
   - Go to [Netlify](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your Git repository

3. **Configure Environment Variables**

In Netlify dashboard → Site settings → Environment variables, add:
- `LUMA_API_KEY`
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_NAME`

4. **Deploy**

Netlify will automatically build and deploy. The build includes:
- Next.js build with `@netlify/plugin-nextjs`
- Netlify Functions for audio generation
- Automatic HTTPS and CDN

### Other Platforms

The application works on any platform supporting Next.js 13 App Router:

**Vercel:**
```bash
vercel --prod
```

**Docker:**
```bash
docker build -t ai-video-studio .
docker run -p 3000:3000 ai-video-studio
```

## API Rate Limits

Default rate limits (configurable in `lib/rateLimit.ts`):
- Video creation: 5 requests per minute per user
- Status checks: 60 requests per minute per user

## Database Schema

### Tables

**profiles**
- User profile information
- Linked to Supabase Auth users
- RLS enabled for user privacy

**videos**
- Video generation records
- Stores prompt, status, URLs, metadata
- User-owned with RLS policies

**Storage Buckets**
- `images` - User-uploaded images for video generation

## Security Features

- **Row Level Security (RLS)** - All database tables protected
- **Authentication** - Required for video generation and gallery
- **API Rate Limiting** - Prevents abuse
- **CORS Headers** - Proper cross-origin configuration
- **Security Middleware** - CSP, XSS protection, frame denial
- **Input Validation** - All user inputs sanitized
- **Environment Variables** - Secrets never exposed to client

## Mobile Support

The app is fully optimized for mobile with:
- Responsive design with proper breakpoints
- Touch-optimized UI elements
- Mobile-specific cache headers to prevent stale data
- Proper viewport configuration
- Native file picker integration

## Troubleshooting

### "Luma AI is not configured" Error

**On Desktop:** Check that `LUMA_API_KEY` is set in your environment variables.

**On Mobile:** If it works on desktop but not mobile:
1. Clear browser cache (Settings → Safari → Clear History and Website Data)
2. Hard refresh the page
3. Check Netlify deployment logs for environment variable issues

### Video Generation Stuck

- Check Netlify Function logs for errors
- Verify API keys are correctly set
- Check rate limits haven't been exceeded

### Image Upload Fails

- Ensure Supabase Storage bucket `images` exists and is public
- Check file size (max 10MB)
- Verify supported format (JPG, PNG, GIF, WebP, HEIC)

## Tech Stack

- **Framework:** Next.js 13 (App Router)
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage
- **Hosting:** Netlify
- **AI APIs:** Luma AI, OpenAI
- **Styling:** Custom CSS with CSS Variables

## Project Structure

```
├── app/
│   ├── api/luma/          # Luma AI API routes
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx           # Main application page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── *Form.tsx         # Video generation forms
├── contexts/             # React contexts (Auth)
├── lib/                  # Utility libraries
│   ├── supabase.ts      # Supabase client
│   ├── luma.ts          # Luma API wrapper
│   └── rateLimit.ts     # Rate limiting logic
├── supabase/
│   ├── migrations/      # Database migrations
│   └── functions/       # Edge functions
├── netlify/
│   └── functions/       # Netlify serverless functions
└── public/              # Static assets
```

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to your fork
5. Open a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Open a GitHub issue
- Check existing issues for solutions
- Review Netlify deployment logs for errors

## Acknowledgments

- [Luma AI](https://lumalabs.ai) for the Dream Machine API
- [Supabase](https://supabase.com) for backend infrastructure
- [OpenAI](https://openai.com) for text-to-speech
- [Next.js](https://nextjs.org) team for the amazing framework
