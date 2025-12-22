import { NextRequest, NextResponse } from 'next/server';
import { createLumaVideo } from '@/lib/luma';
import { rateLimit, getClientIdentifier } from '@/lib/rateLimit';
import { enhancePromptWithGemini } from '@/lib/gemini';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

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
        {
          status: 500,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        }
      );
    }

    console.log('[LUMA API] API Key check:', {
      hasKey: !!apiKey,
      keyLength: apiKey.length,
      keyPrefix: apiKey.substring(0, 10) + '...',
      keySuffix: '...' + apiKey.substring(apiKey.length - 10)
    });

    const body = await request.json();
    const { prompt, imageUrl, duration, endImageUrl, mode = 'text-to-video' } = body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return NextResponse.json(
        { error: 'Prompt is required and must be a non-empty string.' },
        {
          status: 400,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        }
      );
    }

    console.log('[LUMA API] Enhancing prompt with Gemini...');
    const enhancedPrompt = await enhancePromptWithGemini(
      prompt,
      mode,
      !!imageUrl
    );
    console.log('[LUMA API] Original prompt:', prompt);
    console.log('[LUMA API] Enhanced prompt:', enhancedPrompt);

    const result = await createLumaVideo(apiKey, enhancedPrompt, imageUrl, duration, endImageUrl);

    return NextResponse.json(
      { id: result.id },
      {
        status: 200,
        headers: {
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': new Date(resetTime).toISOString(),
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
  } catch (error) {
    console.error('Error creating Luma video:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      { error: errorMessage },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
  }
}
