import { NextRequest, NextResponse } from 'next/server';
import { createReplicateClient } from '@/lib/replicate';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Generation ID is required' },
        { status: 400 }
      );
    }

    const replicate = createReplicateClient();
    const prediction = await replicate.getPrediction(id);

    const supabase = createSupabaseClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    if (prediction.status === 'succeeded') {
      const videoUrl = Array.isArray(prediction.output)
        ? prediction.output[0]
        : prediction.output;

      await supabase
        .from('videos')
        .update({
          status: 'completed',
          video_url: videoUrl,
        })
        .eq('generation_id', id);

      const { data: videoData } = await supabase
        .from('videos')
        .select('*')
        .eq('generation_id', id)
        .single();

      return NextResponse.json({
        id,
        status: 'completed',
        video_url: videoUrl,
        audio_url: videoData?.audio_url,
      });

    } else if (prediction.status === 'failed') {
      await supabase
        .from('videos')
        .update({
          status: 'failed',
          error: prediction.error || 'Video generation failed',
        })
        .eq('generation_id', id);

      return NextResponse.json({
        id,
        status: 'failed',
        error: prediction.error || 'Video generation failed',
      });

    } else if (prediction.status === 'canceled') {
      await supabase
        .from('videos')
        .update({
          status: 'failed',
          error: 'Video generation was canceled',
        })
        .eq('generation_id', id);

      return NextResponse.json({
        id,
        status: 'failed',
        error: 'Video generation was canceled',
      });

    } else {
      return NextResponse.json({
        id,
        status: 'processing',
        message: 'Video is being generated',
      });
    }

  } catch (error) {
    console.error('Error checking video status:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to check video status',
      },
      { status: 500 }
    );
  }
}
