export async function generateAudioFromText(
  text: string,
  voiceStyle: string = 'natural'
): Promise<string | null> {
  if (!text || text.trim() === '') {
    return null;
  }

  try {
    const speechResponse = await fetch('/.netlify/functions/generate-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text.trim(),
        voiceStyle: voiceStyle
      }),
    });

    if (!speechResponse.ok) {
      const contentType = speechResponse.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        console.error('Speech generation service unavailable (Netlify function not deployed or running locally)');
      } else {
        console.error('Failed to generate speech audio');
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
