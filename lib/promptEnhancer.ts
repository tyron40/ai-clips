export function enhancePromptWithImage(userPrompt: string, hasImage: boolean): string {
  if (!hasImage) {
    return userPrompt.trim();
  }

  const prompt = userPrompt.trim();
  const lowerPrompt = prompt.toLowerCase();

  const starterInstruction = 'The exact same person from the starting image';
  const facingRule = 'CRITICAL: The character MUST face directly forward toward the camera at all times, maintaining constant frontal view with face toward viewer, never turning away or showing side profile.';
  const appearanceRule = 'CRITICAL: Maintain the EXACT SAME FACE, identity, and all physical features from the starting image with zero alterations - same person throughout, no face changes.';

  let basePrompt = '';

  if (lowerPrompt.includes('the person') ||
      lowerPrompt.includes('the character') ||
      lowerPrompt.includes('they are') ||
      lowerPrompt.includes('he is') ||
      lowerPrompt.includes('she is')) {
    basePrompt = `${starterInstruction} ${prompt}`;
  } else {
    const characterKeywords = [
      'person', 'character', 'subject', 'figure', 'individual',
      'man', 'woman', 'they', 'them', 'their', 'he', 'she', 'his', 'her'
    ];

    const hasCharacterReference = characterKeywords.some(keyword =>
      lowerPrompt.includes(keyword)
    );

    if (hasCharacterReference) {
      let enhanced = prompt
        .replace(/\b(a person|the person|person)\b/gi, 'the person from the image')
        .replace(/\b(a character|the character|character)\b/gi, 'the person from the image')
        .replace(/\b(a man|the man|man)\b/gi, 'the person from the image')
        .replace(/\b(a woman|the woman|woman)\b/gi, 'the person from the image')
        .replace(/\b(he|she)\b/gi, 'the person from the image')
        .replace(/\b(they|them)\b/gi, 'the person from the image')
        .replace(/\b(their|his|her)\b/gi, 'their');

      basePrompt = `${starterInstruction} ${enhanced}`;
    } else {
      basePrompt = `${starterInstruction} is ${prompt}`;
    }
  }

  const hasTurningAction = lowerPrompt.includes('turn') ||
                           lowerPrompt.includes('look away') ||
                           lowerPrompt.includes('look back') ||
                           lowerPrompt.includes('profile') ||
                           lowerPrompt.includes('look around') ||
                           lowerPrompt.includes('side view');

  if (hasTurningAction) {
    return `${basePrompt}. OVERRIDE: Despite any turning mentioned, ${facingRule} ${appearanceRule}`;
  }

  return `${basePrompt}, with head and face continuously directed straight at camera, frontal view locked. ${facingRule} ${appearanceRule}`;
}

export function optimizeForCharacterAnimation(
  userPrompt: string,
  animationType: 'subtle' | 'moderate' | 'dynamic'
): string {
  const prompt = userPrompt.trim();

  const motionDescriptors = {
    subtle: 'Smooth natural motion with subtle expressions, face always directed straight at camera',
    moderate: 'Natural dynamic movement with head and face locked forward toward viewer, engaged and active',
    dynamic: 'Expressive energetic motion with face continuously facing camera head-on, high energy frontal presence'
  };

  const descriptor = motionDescriptors[animationType];
  const lockRule = 'Character face remains locked forward toward camera, never turning sideways or away';

  if (prompt.toLowerCase().includes('movement') ||
      prompt.toLowerCase().includes('motion') ||
      prompt.toLowerCase().includes('smooth')) {
    return `${prompt}. ${lockRule}. Cinematic camera work, professional quality`;
  }

  return `${prompt}. ${descriptor}. ${lockRule}. Cinematic camera work, professional quality`;
}

export function enhanceForMovieScene(
  userPrompt: string,
  style: string,
  hasCharacter: boolean
): string {
  const styleEnhancements: Record<string, string> = {
    thriller: 'tense atmosphere, dramatic lighting, suspenseful mood, high contrast shadows',
    comedy: 'bright lighting, playful atmosphere, vibrant colors, cheerful mood',
    drama: 'emotional depth, natural lighting, rich colors, intimate framing',
    action: 'dynamic motion, intense energy, dramatic angles, high-impact visuals',
    romance: 'soft lighting, warm tones, dreamy atmosphere, intimate moments',
    horror: 'eerie atmosphere, dark shadows, unsettling mood, mysterious lighting',
    scifi: 'futuristic setting, advanced technology, sleek design, sci-fi atmosphere',
    fantasy: 'magical atmosphere, ethereal lighting, fantastical elements, enchanting mood'
  };

  const enhancement = styleEnhancements[style] || '';
  const characterFocus = hasCharacter
    ? 'The EXACT SAME character from the starting image is the focal point, maintaining their identical face, features, and appearance with face directed toward camera. '
    : '';

  return `${characterFocus}${userPrompt.trim()}. ${enhancement}. Character faces camera throughout. Cinematic ${style} genre, professional film quality, 4K resolution`;
}

export function enhanceForTalkingCharacter(
  userPrompt: string,
  hasDialogue: boolean
): string {
  const prompt = userPrompt.trim();

  if (!hasDialogue) {
    return `${prompt}. The EXACT SAME character from the starting image, maintaining identical face and features, facing directly toward camera with natural facial expressions, professional quality`;
  }

  const dialogueEnhancement = 'The EXACT SAME character from the starting image speaks while facing camera head-on, with natural lip-sync to audio, ' +
    'realistic facial expressions, subtle natural head movements, and authentic emotion. ' +
    'CRITICAL: Same person, same face from image, face directed toward viewer throughout. ';

  if (prompt.toLowerCase().includes('speaking') ||
      prompt.toLowerCase().includes('talking') ||
      prompt.toLowerCase().includes('says')) {
    return `${dialogueEnhancement}${prompt}. Face toward camera. Professional quality, perfect lip synchronization`;
  }

  return `${dialogueEnhancement}${prompt}. Character faces camera while speaking with perfect lip-sync, professional quality`;
}

export function enhanceForMultiImage(
  userPrompt: string,
  imageCount: number,
  transition: string
): string {
  const transitionDescriptors: Record<string, string> = {
    smooth: 'smooth, seamless transition',
    fade: 'gentle fade transition',
    dissolve: 'artistic dissolve transition',
    morph: 'fluid morph transition',
    zoom: 'dynamic zoom transition'
  };

  const descriptor = transitionDescriptors[transition] || 'smooth transition';
  const prompt = userPrompt.trim();

  return `${prompt}. ${descriptor} between ${imageCount} images. CRITICAL: Maintain the EXACT SAME character face and identity across all frames - same person throughout with no face changes. Characters face camera. Professional quality, cinematic composition`;
}

export function enhanceForImageMotion(
  userPrompt: string,
  motionType: string,
  hasCharacter: boolean
): string {
  const motionDescriptors: Record<string, string> = {
    parallax: 'parallax effect with depth and dimension, creating 3D-like movement',
    zoom: 'smooth zoom effect, drawing focus and creating drama',
    pan: 'cinematic pan motion, revealing the scene gradually',
    tilt: 'subtle tilt motion, adding dynamic perspective',
    rotate: 'gentle rotation effect, creating visual interest',
    '3d': '3D camera movement, immersive depth and perspective'
  };

  const descriptor = motionDescriptors[motionType] || 'dynamic camera movement';
  const characterNote = hasCharacter
    ? 'The EXACT SAME character from the starting image remains the focal point, maintaining identical appearance and facing toward camera. '
    : '';

  const prompt = userPrompt.trim();

  return `${characterNote}${prompt}. ${descriptor}, maintaining subject focus with face directed at viewer, professional cinematography, smooth motion`;
}

export function validatePrompt(prompt: string): { valid: boolean; error?: string } {
  const trimmed = prompt.trim();

  if (!trimmed) {
    return { valid: false, error: 'Prompt cannot be empty' };
  }

  if (trimmed.length < 10) {
    return { valid: false, error: 'Prompt is too short. Please provide more detail (at least 10 characters)' };
  }

  if (trimmed.length > 500) {
    return { valid: false, error: 'Prompt is too long. Please keep it under 500 characters' };
  }

  const bannedWords = ['nsfw', 'nude', 'explicit', 'violence', 'gore'];
  const containsBanned = bannedWords.some(word =>
    trimmed.toLowerCase().includes(word)
  );

  if (containsBanned) {
    return { valid: false, error: 'Prompt contains inappropriate content' };
  }

  return { valid: true };
}

export function suggestPromptImprovements(prompt: string, hasImage: boolean): string[] {
  const suggestions: string[] = [];
  const trimmed = prompt.trim().toLowerCase();

  if (hasImage && !trimmed.includes('character') && !trimmed.includes('person')) {
    suggestions.push('Consider explicitly mentioning "the character" or "the person" to ensure they are animated');
  }

  if (!trimmed.includes('cinematic') && !trimmed.includes('professional')) {
    suggestions.push('Add quality descriptors like "cinematic" or "professional" for better results');
  }

  if (!trimmed.includes('lighting') && !trimmed.includes('light')) {
    suggestions.push('Specify lighting (e.g., "dramatic lighting", "soft lighting") for better visuals');
  }

  if (trimmed.split(' ').length < 5) {
    suggestions.push('Add more descriptive details for richer generation');
  }

  if (!trimmed.match(/\b(slow|fast|gentle|dynamic|smooth)\b/)) {
    suggestions.push('Describe the motion pace (e.g., "slow motion", "dynamic movement")');
  }

  return suggestions;
}
