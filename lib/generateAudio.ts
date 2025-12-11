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
    const audioUrl = URL.createObjectURL(audioBlob);
    return audioUrl;
  } catch (error) {
    console.error('Error generating audio:', error);
    return null;
  }
}
