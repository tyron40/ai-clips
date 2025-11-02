# AI Video Studio

A production-ready multi-mode video generation application powered by Luma AI Dream Machine and Hugging Face. Create stunning AI-generated videos with text-to-video, image-to-video, and advanced cinematic modes.

## Features

- **Multiple Generation Modes**
  - Luma Dream Machine text-to-video and image-to-video
  - Hugging Face image animation
  - Movie scene generation with cinematic styles
  - Multi-image sequence videos
  - Hugging people video generation
  - Image motion with various animation types

- **Production Features**
  - Rate limiting on API endpoints
  - Error boundaries and comprehensive error handling
  - SEO optimization with proper metadata
  - Security headers via middleware
  - Persistent video gallery with Supabase
  - Responsive design for all devices
  - Loading states and skeletons

## Prerequisites

- Node.js 18+ and npm
- Luma AI API key
- Supabase account

## Setup

1. Clone the repository
2. Copy `.env.local.example` to `.env` and fill in your credentials:

```bash
cp .env.local.example .env
```

3. Install dependencies:

```bash
npm install
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

Required environment variables:

- `LUMA_API_KEY` - Your Luma AI API key
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `NEXT_PUBLIC_APP_NAME` - Application name (optional)

## Database Setup

The application uses Supabase for video storage and history. Migrations are located in `supabase/migrations/`.

## Deployment

### Netlify

The project is configured for Netlify deployment with the included `netlify.toml`.

1. Push to your repository
2. Connect to Netlify
3. Set environment variables in Netlify dashboard
4. Deploy

### Other Platforms

The application works on any platform supporting Next.js 13+:
- Vercel
- AWS Amplify
- Railway
- Render

## API Rate Limits

- Video creation: 5 requests per minute per IP
- Status checks: 60 requests per minute per IP

## Tech Stack

- Next.js 13 (App Router)
- TypeScript
- Supabase
- Luma AI API
- Tailwind CSS (via custom styles)

## License

MIT
