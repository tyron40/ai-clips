interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export async function enhancePromptWithGemini(
  userPrompt: string,
  mode: string,
  hasImage: boolean
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('GEMINI_API_KEY not set, using original prompt');
    return userPrompt;
  }

  try {
    const systemContext = getSystemContextForMode(mode, hasImage);

    const prompt = `${systemContext}

User's original prompt: "${userPrompt}"

Enhance this prompt to be hyper-realistic and cinematic. Return ONLY the enhanced prompt text, no explanations or extra commentary.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 200,
            topP: 0.8,
            topK: 40
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Gemini API error:', error);
      return userPrompt;
    }

    const data: GeminiResponse = await response.json();
    const enhancedPrompt = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!enhancedPrompt) {
      console.warn('No enhanced prompt received from Gemini');
      return userPrompt;
    }

    console.log('Original prompt:', userPrompt);
    console.log('Enhanced prompt:', enhancedPrompt);

    return enhancedPrompt;
  } catch (error) {
    console.error('Error enhancing prompt with Gemini:', error);
    return userPrompt;
  }
}

function getSystemContextForMode(mode: string, hasImage: boolean): string {
  const baseContext = `You are an expert cinematographer and visual effects director specializing in hyper-realistic video generation. Your task is to enhance prompts for AI video generation to achieve maximum realism and cinematic quality.

Key requirements:
- Focus on hyper-realistic details (lighting, textures, physics, natural motion)
- Include cinematic camera work and framing
- Specify realistic environmental details
- Emphasize natural, believable movement
- Add photorealistic quality descriptors`;

  const imageContext = hasImage
    ? '\n- CRITICAL: The starting image contains a specific person/character. They MUST maintain their EXACT SAME face, identity, and appearance throughout. Face must be directed toward camera.'
    : '';

  const modeSpecific: Record<string, string> = {
    'hugging-face': '\n- Character interaction: natural, realistic human embrace with genuine emotion\n- Physical authenticity: realistic body language, weight distribution, natural contact',
    'talking-character': '\n- Facial realism: natural lip-sync, micro-expressions, realistic eye movement\n- Audio-visual sync: perfect synchronization between speech and facial animation',
    'movie-scene': '\n- Cinematic storytelling: dramatic composition, professional lighting setups\n- Genre-appropriate atmosphere and mood\n- Film-quality production values',
    'multi-image': '\n- Seamless transitions: natural flow between images\n- Consistent lighting and perspective across frames\n- Maintain character identity and appearance',
    'image-motion': '\n- Camera realism: natural camera movement, proper depth of field\n- Motion blur and physics: realistic speed and acceleration',
    'text-to-video': '\n- Establish clear scene and setting\n- Define realistic action and movement\n- Specify environmental and atmospheric details'
  };

  return baseContext + imageContext + (modeSpecific[mode] || '');
}

export async function analyzeImageWithGemini(imageUrl: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not set');
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: "Describe this image in detail, focusing on: the person/character (facial features, appearance, clothing), the setting/background, lighting, and overall mood. Be specific and detailed for video generation purposes."
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: imageUrl
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 300,
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini Vision API error: ${await response.text()}`);
    }

    const data: GeminiResponse = await response.json();
    const description = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    return description || '';
  } catch (error) {
    console.error('Error analyzing image with Gemini:', error);
    throw error;
  }
}
