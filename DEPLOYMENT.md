# Deployment Checklist

## Pre-Deployment

- [ ] All environment variables are set in deployment platform
- [ ] Supabase database is configured and migrations are applied
- [ ] Luma API key is valid and has sufficient credits
- [ ] Update `NEXT_PUBLIC_SITE_URL` in environment variables to production URL
- [ ] Update sitemap.ts and robots.txt with production domain
- [ ] Test all generation modes locally
- [ ] Run `npm run build` successfully
- [ ] Run `npm run typecheck` successfully

## Environment Variables (Production)

```
LUMA_API_KEY=your_production_luma_api_key
NEXT_PUBLIC_APP_NAME=AI Video Studio
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## Post-Deployment

- [ ] Test all generation modes on production
- [ ] Verify rate limiting is working
- [ ] Check error handling and logging
- [ ] Test video gallery functionality
- [ ] Verify SEO metadata is correct
- [ ] Test on mobile devices
- [ ] Monitor API usage and costs
- [ ] Set up error monitoring (optional: Sentry)
- [ ] Set up analytics (optional: Google Analytics, Plausible)

## Performance Optimization

- [ ] Enable CDN for static assets
- [ ] Configure proper caching headers
- [ ] Monitor API response times
- [ ] Set up database indexes if needed
- [ ] Monitor Supabase usage

## Security

- [x] Rate limiting enabled
- [x] Security headers configured
- [x] Environment variables secured
- [x] RLS policies enabled on database
- [ ] Regular dependency updates
- [ ] API key rotation schedule

## Monitoring

- [ ] Set up uptime monitoring
- [ ] Configure error tracking
- [ ] Monitor API rate limits
- [ ] Track video generation success rates
- [ ] Monitor database storage usage
