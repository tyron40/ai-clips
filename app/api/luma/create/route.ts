import { NextRequest, NextResponse } from 'next/server';
import { createLumaVideo } from '@/lib/luma';
import { rateLimit, getClientIdentifier } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    console.log('[LUMA API] Environment check:', {
      hasLumaKey: !!process.env.LUMA_API_KEY,
      nodeEnv: process.env.NODE_ENV,
      platform: process.platform,
    });

    const clientId = getClientIdentifier(request);
    const { allowed, remaining, resetTime } = rateLimit(clientId, {
      maxRequests: 5,
      windowMs: 60000,
    });

    if (!allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please try again later.',
          resetTime
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(resetTime).toISOString(),
          }
        }
      );
    }

    const apiKey = process.env.LUMA_API_KEY;

    if (!apiKey) {
      console.error('[LUMA API] LUMA_API_KEY not found in environment variables');
      console.error('[LUMA API] Available env vars:', Object.keys(process.env).filter(k => k.includes('LUMA') || k.includes('NEXT')));
      return NextResponse.json(
        { error: 'Luma AI is not configured. Please add your LUMA_API_KEY to the environment variables in Netlify.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { prompt, imageUrl, duration, endImageUrl } = body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return NextResponse.json(
        { error: 'Prompt is required and must be a non-empty string.' },
        { status: 400 }
      );
    }

    const result = await createLumaVideo(apiKey, prompt, imageUrl, duration, endImageUrl);

    return NextResponse.json(
      { id: result.id },
      {
        status: 200,
        headers: {
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': new Date(resetTime).toISOString(),
        }
      }
    );
  } catch (error) {
    console.error('Error creating Luma video:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
