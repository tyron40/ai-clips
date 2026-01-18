const motivationalSceneTypes = [
  'person climbing mountain at sunrise',
  'athlete training intensely',
  'entrepreneur working late at night',
  'person running on beach at dawn',
  'weightlifter pushing limits',
  'business person walking confidently in city',
  'person writing goals in journal',
  'team celebrating achievement',
  'individual meditating peacefully',
  'runner crossing finish line',
  'person standing at mountain peak',
  'boxer training with determination',
  'student studying with focus',
  'person giving motivational speech',
  'athlete preparing for competition',
  'individual working on laptop with determination',
  'person doing morning workout',
  'successful business meeting',
  'person overcoming obstacle course',
  'individual practicing skill repeatedly',
  'mentor guiding student',
  'person visualizing success',
  'athlete recovering and pushing forward',
  'entrepreneur pitching idea',
  'person journaling at sunrise',
  'individual doing pushups',
  'successful presentation',
  'person running uphill',
  'team working together',
  'individual achieving goal'
];

const cinematicStyles = [
  'cinematic slow motion',
  'dramatic lighting',
  'golden hour cinematography',
  'epic wide angle shot',
  'intimate close-up',
  'dynamic tracking shot',
  'inspirational lighting',
  'powerful silhouette',
  'vibrant color grading',
  'moody atmospheric shot'
];

const qualities = [
  'hyperrealistic',
  '8k ultra detailed',
  'photorealistic',
  'professional cinematography',
  'high definition',
  'crystal clear',
  'stunning visuals',
  'masterpiece quality'
];

export function generateMotivationalPrompts(theme: string, count: number): string[] {
  const prompts: string[] = [];
  const usedScenes = new Set<number>();

  for (let i = 0; i < count; i++) {
    let sceneIndex: number;
    do {
      sceneIndex = Math.floor(Math.random() * motivationalSceneTypes.length);
    } while (usedScenes.has(sceneIndex) && usedScenes.size < motivationalSceneTypes.length);

    usedScenes.add(sceneIndex);

    const scene = motivationalSceneTypes[sceneIndex];
    const style = cinematicStyles[i % cinematicStyles.length];
    const quality = qualities[Math.floor(Math.random() * qualities.length)];

    const prompt = `${quality}, ${style} of ${scene}. Theme: ${theme}. Inspirational and powerful, professional video production, no text overlay, realistic human movements, natural environment`;

    prompts.push(prompt);
  }

  return prompts;
}

export function generateVariedMotivationalPrompts(theme: string, count: number): string[] {
  const themes = theme.toLowerCase();
  const prompts: string[] = [];

  const baseScenarios = [
    `hyperrealistic cinematic shot of determined person at sunrise, embodying ${themes}, dramatic lighting, 8k, professional`,
    `photorealistic slow motion of athlete pushing limits, representing ${themes}, golden hour, inspiring`,
    `cinematic wide angle of individual overcoming obstacles, theme of ${themes}, epic lighting, ultra detailed`,
    `hyperrealistic close-up of focused eyes, determination for ${themes}, moody atmospheric, professional cinematography`,
    `photorealistic tracking shot of person climbing towards goal, ${themes} journey, dynamic camera work, 8k`,
    `cinematic silhouette at mountain peak, achievement of ${themes}, stunning sunset, inspirational`,
    `hyperrealistic gym training montage, dedication to ${themes}, high energy, professional lighting`,
    `photorealistic business success moment, ${themes} realized, sleek modern setting, cinematic`,
    `cinematic nature scene with person reflecting, ${themes} mindset, peaceful yet powerful, golden hour`,
    `hyperrealistic urban setting, person walking confidently, ${themes} embodied, professional cinematography`,
    `photorealistic hands writing goals, planning for ${themes}, intimate shot, inspiring lighting`,
    `cinematic group collaboration, team achieving ${themes}, dynamic angles, professional production`,
    `hyperrealistic early morning ritual, dedication to ${themes}, soft dramatic lighting, 8k`,
    `photorealistic breakthrough moment, ${themes} success, emotional cinematic shot, powerful`,
    `cinematic training sequence, mastery of ${themes}, multiple angles, professional quality`,
    `hyperrealistic meditation scene, mental preparation for ${themes}, serene yet powerful, 8k`,
    `photorealistic celebration of achievement, ${themes} accomplished, joyful cinematic moment`,
    `cinematic struggle to success transition, ${themes} journey, powerful storytelling, professional`
  ];

  for (let i = 0; i < count; i++) {
    const promptIndex = i % baseScenarios.length;
    prompts.push(baseScenarios[promptIndex]);
  }

  return prompts;
}
