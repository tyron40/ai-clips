export async function generateAudioFromText(
  text: string,
  voiceStyle: string = 'natural'
): Promise<string | null> {
  if (!text || text.trim() === '') {
    return null;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase configuration missing');
    return null;
  }

  try {
    const speechResponse = await fetch(`${supabaseUrl}/functions/v1/generate-speech`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text.trim(),
        voiceStyle: voiceStyle
      }),
    });

    if (!speechResponse.ok) {
      console.error('Failed to generate speech audio');
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
