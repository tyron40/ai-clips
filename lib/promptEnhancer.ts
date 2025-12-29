export function enhancePromptWithImage(userPrompt: string, hasImage: boolean): string {
  if (!hasImage) {
    return userPrompt.trim();
  }

  const prompt = userPrompt.trim();
  const lowerPrompt = prompt.toLowerCase();

  const starterInstruction = 'The exact same person from the starting image with IDENTICAL face, features, hair, clothing, and appearance';
  const facingRule = 'CRITICAL: The character MUST face directly forward toward the camera at all times, maintaining constant frontal view with face and body toward viewer, never turning away or showing side profile.';
  const appearanceRule = 'CRITICAL: Maintain the EXACT SAME FACE, identity, and all physical features from the starting image with ZERO alterations - same person throughout, no face changes, no appearance modifications.';

  // Detect if this is an activity/scene description
  const activityKeywords = ['walking', 'running', 'dancing', 'sitting', 'standing', 'driving', 'riding', 'playing', 'working', 'shopping', 'eating', 'drinking', 'talking', 'meeting', 'going', 'coming', 'entering', 'leaving', 'with friends', 'with people', 'at the', 'in the', 'downtown', 'outside', 'indoor', 'outdoor'];
  const isActivityScene = activityKeywords.some(keyword => lowerPrompt.includes(keyword));

  const framingRule = isActivityScene
    ? 'COMPLETE SCENE VIEW: Ultra-wide establishing shot showing the ENTIRE environment and activity. Full body from head to toe of all people, complete surroundings including streets, buildings, stores, other people, background details. Pull camera back to show full scope of location and action. Everything in the scene visible: foreground, mid-ground, background. NOT zoomed in - expansive environmental view.'
    : 'CAMERA FRAMING: Wide shot showing full body from head to toe, proper distance to capture entire scene and character, not zoomed in too close, complete view of environment and setting.';

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
    return `${basePrompt}. OVERRIDE: Despite any turning mentioned, ${facingRule} ${appearanceRule} ${framingRule}`;
  }

  return `${basePrompt}, with head and face continuously directed straight at camera, frontal view locked, full body visible. ${facingRule} ${appearanceRule} ${framingRule}`;
}

export function optimizeForCharacterAnimation(
  userPrompt: string,
  animationType: 'subtle' | 'moderate' | 'dynamic'
): string {
  const prompt = userPrompt.trim();
  const lowerPrompt = prompt.toLowerCase();

  const motionDescriptors = {
    subtle: 'Smooth natural motion with subtle expressions, face always directed straight at camera, full body visible',
    moderate: 'Natural dynamic movement with head and face locked forward toward viewer, engaged and active, full body in frame',
    dynamic: 'Expressive energetic motion with face continuously facing camera head-on, high energy frontal presence, complete body visible'
  };

  const descriptor = motionDescriptors[animationType];
  const lockRule = 'Character face and body remains locked forward toward camera, never turning sideways or away';

  // Detect if this is an activity/scene description
  const activityKeywords = ['walking', 'running', 'dancing', 'sitting', 'standing', 'driving', 'riding', 'playing', 'working', 'shopping', 'eating', 'drinking', 'meeting', 'going', 'with friends', 'with people', 'at the', 'in the', 'downtown', 'outside', 'indoor', 'outdoor'];
  const isActivityScene = activityKeywords.some(keyword => lowerPrompt.includes(keyword));

  const framingRule = isActivityScene
    ? 'Ultra-wide establishing shot showing complete environment with full body visible from head to toe, all surroundings and background details included, expansive scene view'
    : 'Wide shot capturing full body from head to toe, not zoomed in too close';

  if (lowerPrompt.includes('movement') ||
      lowerPrompt.includes('motion') ||
      lowerPrompt.includes('smooth')) {
    return `${prompt}. ${lockRule}. ${framingRule}. Cinematic camera work, professional quality`;
  }

  return `${prompt}. ${descriptor}. ${lockRule}. ${framingRule}. Cinematic camera work, professional quality`;
}

export function enhanceForMovieScene(
  userPrompt: string,
  style: string,
  hasCharacter: boolean
): string {
  const styleEnhancements: Record<string, string> = {
    thriller: 'tense atmosphere, dramatic lighting, suspenseful mood, high contrast shadows',
    comedy: 'bright lighting, playful atmosphere, vibrant colors, cheerful mood',
    drama: 'emotional depth, natural lighting, rich colors, establishing shot',
    action: 'dynamic motion, intense energy, wide establishing angles, high-impact visuals',
    romance: 'soft lighting, warm tones, dreamy atmosphere, full scene composition',
    horror: 'eerie atmosphere, dark shadows, unsettling mood, mysterious lighting',
    scifi: 'futuristic setting, advanced technology, sleek design, sci-fi atmosphere',
    fantasy: 'magical atmosphere, ethereal lighting, fantastical elements, enchanting mood'
  };

  const enhancement = styleEnhancements[style] || '';
  const characterFocus = hasCharacter
    ? 'The EXACT SAME character from the starting image with IDENTICAL face, hair, features, clothing, and appearance is the focal point, facing directly toward camera. CRITICAL: Same person, same face, zero alterations. '
    : '';

  const sceneFraming = 'COMPLETE ENVIRONMENTAL VIEW: Ultra-wide cinematic establishing shot capturing the ENTIRE scene, environment, and activity from beginning to end. ' +
    'Show full body of all characters from head to toe, complete surroundings including streets, buildings, background elements, other people, and all environmental details. ' +
    'Proper distance to show the complete action and setting in one continuous view. ' +
    'NOT zoomed in - pull camera back to reveal the full scope of the scene, location, and activity. ' +
    'Everything visible: foreground, mid-ground, and background fully rendered.';

  return `${characterFocus}${userPrompt.trim()}. ${enhancement}. Character faces camera throughout with full body visible in complete environment. ${sceneFraming} Cinematic ${style} genre, professional film quality, 4K resolution, expansive scene composition`;
}

export function enhanceForTalkingCharacter(
  userPrompt: string,
  hasDialogue: boolean
): string {
  const prompt = userPrompt.trim();

  const framingRule = 'CAMERA FRAMING: Medium to close-up shot focusing on face and upper body, mouth clearly visible for lip-sync, face prominent and detailed, proper framing for talking head presentation.';

  if (!hasDialogue) {
    return `${prompt}. The EXACT SAME character from the starting image with IDENTICAL face, hair, and features, facing directly toward camera with natural facial expressions. ${framingRule} Professional quality`;
  }

  const lipSyncRule = 'PERFECT LIP-SYNC: Mouth movements MUST match audio precisely and naturally, realistic jaw and lip articulation, accurate phoneme formation, natural speaking rhythm, micro-expressions while talking.';

  const dialogueEnhancement = 'The EXACT SAME character from the starting image with IDENTICAL face, hair, features, and appearance speaks while facing camera head-on. ' +
    'CRITICAL REQUIREMENTS: Same person with ZERO alterations from uploaded image. Mouth opens and closes in PERFECT synchronization with spoken dialogue. ' +
    'Natural lip movements for each word, realistic jaw articulation, authentic facial expressions while speaking, subtle head movements, genuine emotion in delivery. ' +
    'Face and mouth clearly visible throughout for optimal lip-sync visibility. ';

  if (prompt.toLowerCase().includes('speaking') ||
      prompt.toLowerCase().includes('talking') ||
      prompt.toLowerCase().includes('says')) {
    return `${dialogueEnhancement}${lipSyncRule} ${prompt}. Face toward camera with mouth movements perfectly synchronized. ${framingRule} Professional quality, flawless lip synchronization`;
  }

  return `${dialogueEnhancement}${lipSyncRule} ${prompt}. Character faces camera while speaking with mouth perfectly synchronized to audio. ${framingRule} Professional quality, precise lip-sync`;
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

  const framingRule = 'CAMERA FRAMING: Wide shot showing full body and complete scene, proper distance to capture entire environment, not zoomed in too close, complete view throughout all transitions.';

  return `${prompt}. ${descriptor} between ${imageCount} images. CRITICAL: Maintain the EXACT SAME character face, hair, features, and identity with IDENTICAL appearance across all frames - same person throughout with ZERO face or appearance changes. Characters face camera with full body visible. ${framingRule} Professional quality, cinematic composition`;
}

export function enhanceForImageMotion(
  userPrompt: string,
  motionType: string,
  hasCharacter: boolean
): string {
  const motionDescriptors: Record<string, string> = {
    parallax: 'parallax effect with depth and dimension, creating 3D-like movement',
    zoom: 'smooth zoom effect starting wide to show full scene, drawing focus and creating drama',
    pan: 'cinematic pan motion, revealing the complete scene gradually',
    tilt: 'subtle tilt motion, adding dynamic perspective while maintaining full view',
    rotate: 'gentle rotation effect, creating visual interest while showing entire scene',
    '3d': '3D camera movement, immersive depth and perspective with wide framing'
  };

  const descriptor = motionDescriptors[motionType] || 'dynamic camera movement';
  const characterNote = hasCharacter
    ? 'The EXACT SAME character from the starting image with IDENTICAL face, hair, features, clothing, and appearance remains the focal point, facing directly toward camera. CRITICAL: Same person with ZERO alterations. '
    : '';

  const prompt = userPrompt.trim();
  const lowerPrompt = prompt.toLowerCase();

  // Detect if this is an activity/scene description
  const activityKeywords = ['walking', 'running', 'dancing', 'sitting', 'standing', 'driving', 'riding', 'playing', 'working', 'shopping', 'eating', 'drinking', 'meeting', 'going', 'with friends', 'with people', 'at the', 'in the', 'downtown', 'outside', 'indoor', 'outdoor'];
  const isActivityScene = activityKeywords.some(keyword => lowerPrompt.includes(keyword));

  const framingRule = isActivityScene
    ? 'COMPLETE SCENE VIEW: Ultra-wide establishing shot capturing the ENTIRE environment and activity. Full body from head to toe of all people, complete surroundings including streets, buildings, background details. Pull camera back to show full scope of location. Everything visible: foreground, mid-ground, background. NOT zoomed in - expansive environmental view.'
    : 'CAMERA FRAMING: Wide shot capturing full body from head to toe and complete environment, proper distance to show entire scene, not zoomed in too close, full view of setting and character.';

  return `${characterNote}${prompt}. ${descriptor}, maintaining subject focus with face and body directed at viewer, full body visible throughout. ${framingRule} Professional cinematography, smooth motion`;
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
