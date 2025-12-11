import { supabase } from './supabase';

export async function generateAudioFromText(
  text: string,
  voiceStyle: string = 'natural'
): Promise<string | null> {
  if (!text || text.trim() === '') {
    return null;
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase configuration missing');
      return null;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('Please sign in to generate audio');
      return null;
    }

    console.log('[Audio Generation] Generating speech for text:', text.substring(0, 50) + '...');
    const apiUrl = `${supabaseUrl}/functions/v1/generate-speech`;

    const speechResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text.trim(),
        voiceStyle: voiceStyle
      }),
    });

    if (!speechResponse.ok) {
      const contentType = speechResponse.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          const errorData = await speechResponse.json();
          console.error('Speech generation error:', errorData.error);
        } catch (e) {
          console.error('Failed to generate speech audio');
        }
      } else {
        console.error('Speech generation service unavailable');
      }
      return null;
    }

    const audioBlob = await speechResponse.blob();
    console.log('[Audio Generation] Audio blob received, size:', audioBlob.size);

    const fileName = `audio-${Date.now()}-${Math.random().toString(36).substring(7)}.mp3`;
    console.log('[Audio Upload] Uploading to Supabase storage:', fileName);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload(fileName, audioBlob, {
        cacheControl: '31536000',
        upsert: false,
        contentType: 'audio/mpeg'
      });

    if (uploadError) {
      console.error('[Audio Upload] Upload failed:', uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);

    console.log('[Audio Upload] Audio uploaded successfully:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Error generating audio:', error);
    return null;
  }
}
