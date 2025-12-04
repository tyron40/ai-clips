import { NextRequest, NextResponse } from 'next/server';
import { createReplicateClient, replicateModels } from '@/lib/replicate';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

interface VideoGenerationRequest {
  prompt: string;
  imageUrl?: string;
  duration?: string;
  aspectRatio?: string;
  mode?: string;
  keyframes?: {
    frame0?: { type: string; url: string };
    frame1?: { type: string; url: string };
  };
  loop?: boolean;
  dialogue?: string;
  voiceStyle?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: VideoGenerationRequest = await request.json();
    const {
      prompt,
      imageUrl,
      duration = '5s',
      aspectRatio = '16:9',
      mode = 'text_to_video',
      keyframes,
      loop = false,
      dialogue,
      voiceStyle,
    } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const replicate = createReplicateClient();
    const supabase = createSupabaseClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const authHeader = request.headers.get('authorization');
    let userId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    let videoGenerationId: string;
    let audioUrl: string | undefined;

    if (mode === 'movie_scene' && imageUrl) {
      console.log('Starting InstantID + IP-Adapter + Pika pipeline');

      console.log('Step 1: Extract face identity with InstantID');
      const instantIdPrediction = await replicate.createPrediction(replicateModels.instantId, {
        input: {
          image: imageUrl,
          prompt: prompt,
          negative_prompt: 'blurry, low quality, distorted face, bad anatomy',
        },
      });

      const instantIdResult = await replicate.waitForPrediction(instantIdPrediction.id);

      if (instantIdResult.status !== 'succeeded' || !instantIdResult.output) {
        throw new Error('InstantID face extraction failed');
      }

      console.log('Step 2: Generate character in scene with IP-Adapter FaceID');
      const ipAdapterPrediction = await replicate.createPrediction(replicateModels.ipAdapterFaceId, {
        input: {
          face_image: imageUrl,
          prompt: prompt,
          negative_prompt: 'blurry, low quality, distorted, bad anatomy, disfigured',
          num_samples: 1,
          num_inference_steps: 30,
          guidance_scale: 4.5,
        },
      });

      const ipAdapterResult = await replicate.waitForPrediction(ipAdapterPrediction.id);

      if (ipAdapterResult.status !== 'succeeded' || !ipAdapterResult.output) {
        throw new Error('IP-Adapter FaceID scene generation failed');
      }

      const sceneImageUrl = Array.isArray(ipAdapterResult.output)
        ? ipAdapterResult.output[0]
        : ipAdapterResult.output;

      console.log('Step 3: Animate scene with Pika');
      const pikaPrediction = await replicate.createPrediction(replicateModels.pika, {
        input: {
          image: sceneImageUrl,
          prompt: prompt,
          motion: 4,
          guidance_scale: 12,
          num_inference_steps: 25,
          frames_per_second: 24,
        },
      });

      videoGenerationId = pikaPrediction.id;

    } else if (mode === 'talking_character' && imageUrl && dialogue) {
      console.log('Generating speech first for talking character');

      const speechApiUrl = `${env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-speech`;
      const speechResponse = await fetch(speechApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: dialogue,
          voiceStyle: voiceStyle || 'natural',
        }),
      });

      if (speechResponse.ok) {
        const audioBlob = await speechResponse.blob();
        const audioFile = new File([audioBlob], 'speech.mp3', { type: 'audio/mpeg' });

        const audioPath = `audio/${Date.now()}-${Math.random().toString(36).substring(7)}.mp3`;
        const { data: audioData, error: audioError } = await supabase.storage
          .from('images')
          .upload(audioPath, audioFile, {
            contentType: 'audio/mpeg',
            upsert: false,
          });

        if (!audioError && audioData) {
          const { data: publicUrl } = supabase.storage
            .from('images')
            .getPublicUrl(audioPath);
          audioUrl = publicUrl.publicUrl;
        }
      }

      console.log('Animating character with Pika');
      const pikaPrediction = await replicate.createPrediction(replicateModels.pika, {
        input: {
          image: imageUrl,
          prompt: `${prompt}, talking, speaking, mouth moving naturally, expressive face`,
          motion: 3,
          guidance_scale: 12,
          num_inference_steps: 25,
          frames_per_second: 24,
        },
      });

      videoGenerationId = pikaPrediction.id;

    } else if (imageUrl) {
      console.log('Image to video with Pika');
      const pikaPrediction = await replicate.createPrediction(replicateModels.pika, {
        input: {
          image: imageUrl,
          prompt: prompt,
          motion: 4,
          guidance_scale: 12,
          num_inference_steps: 25,
          frames_per_second: 24,
        },
      });

      videoGenerationId = pikaPrediction.id;

    } else {
      console.log('Text to video with Pika');
      const pikaPrediction = await replicate.createPrediction(replicateModels.pika, {
        input: {
          prompt: prompt,
          motion: 4,
          guidance_scale: 12,
          num_inference_steps: 25,
          frames_per_second: 24,
        },
      });

      videoGenerationId = pikaPrediction.id;
    }

    const { data: videoData, error: dbError } = await supabase
      .from('videos')
      .insert({
        generation_id: videoGenerationId,
        user_id: userId,
        prompt,
        status: 'processing',
        mode: mode,
        image_url: imageUrl,
        audio_url: audioUrl,
        dialogue: dialogue,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to save video record');
    }

    return NextResponse.json({
      id: videoGenerationId,
      status: 'processing',
      message: 'Video generation started',
    });

  } catch (error) {
    console.error('Error creating video:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create video',
      },
      { status: 500 }
    );
  }
}
