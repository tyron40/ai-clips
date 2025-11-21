import { NextRequest, NextResponse } from 'next/server';
import { fetchLumaStatus } from '@/lib/luma';
import { rateLimit, getClientIdentifier } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request);
    const { allowed, remaining, resetTime } = rateLimit(`${clientId}:status`, {
      maxRequests: 60,
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
      console.error('[LUMA STATUS] LUMA_API_KEY not found in environment variables');
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

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Video ID is required.' },
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

    const status = await fetchLumaStatus(apiKey, id);

    return NextResponse.json(status, {
      status: 200,
      headers: {
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': new Date(resetTime).toISOString(),
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error('Error fetching Luma status:', error);

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
