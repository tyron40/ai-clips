export interface BatchVariation {
  id: string;
  prompt: string;
  variation: number;
}

const motivationalThemes = [
  'Sunrise over mountains with inspirational journey',
  'Person achieving fitness goals with determination',
  'Entrepreneur working late with ambition',
  'Student studying with focus and dedication',
  'Athlete training with persistence',
  'Team collaborating with synergy',
  'Artist creating with passion',
  'Teacher inspiring with wisdom',
  'Parent nurturing with love',
  'Friend supporting with loyalty',
  'Leader guiding with vision',
  'Innovator building with creativity',
  'Volunteer helping with compassion',
  'Mentor coaching with patience',
  'Graduate celebrating achievement',
];

const landscapes = [
  'majestic mountain peaks at golden hour',
  'serene ocean waves at sunset',
  'vibrant city skyline at night',
  'peaceful forest path in morning light',
  'dramatic desert landscape with storm clouds',
  'tranquil lake reflection at dawn',
  'rolling green hills under blue sky',
  'powerful waterfall in rainforest',
  'snow-covered alpine valley',
  'colorful autumn forest pathway',
];

const actions = [
  'walking confidently forward',
  'reaching towards the sky',
  'running with determination',
  'standing triumphantly',
  'climbing upward',
  'jumping with joy',
  'dancing freely',
  'working intensely',
  'meditating peacefully',
  'celebrating success',
];

const timeOfDay = [
  'during golden hour',
  'at sunrise',
  'at sunset',
  'in soft morning light',
  'under dramatic clouds',
  'in cinematic lighting',
  'with warm backlight',
  'in blue hour glow',
];

export function generateBatchVariations(
  basePrompt: string,
  count: number,
  category?: 'motivational' | 'landscape' | 'action' | 'auto'
): BatchVariation[] {
  const variations: BatchVariation[] = [];
  const actualCategory = category || detectCategory(basePrompt);

  for (let i = 0; i < count; i++) {
    let variationPrompt = '';

    if (actualCategory === 'motivational') {
      variationPrompt = motivationalThemes[i % motivationalThemes.length];

      const landscape = landscapes[i % landscapes.length];
      const action = actions[i % actions.length];
      const time = timeOfDay[i % timeOfDay.length];

      variationPrompt += `, ${landscape}, ${action} ${time}`;
    } else if (actualCategory === 'landscape') {
      const landscape = landscapes[i % landscapes.length];
      const time = timeOfDay[i % timeOfDay.length];

      variationPrompt = `${landscape} ${time}, cinematic camera movement, sweeping aerial view`;
    } else if (actualCategory === 'action') {
      const action = actions[i % actions.length];
      const time = timeOfDay[i % timeOfDay.length];

      variationPrompt = `Person ${action} ${time}, ${basePrompt}, dynamic camera angle`;
    } else {
      variationPrompt = generateAutoVariation(basePrompt, i);
    }

    variations.push({
      id: `batch-${Date.now()}-${i}`,
      prompt: variationPrompt,
      variation: i + 1,
    });
  }

  return variations;
}

function detectCategory(prompt: string): 'motivational' | 'landscape' | 'action' | 'auto' {
  const lowerPrompt = prompt.toLowerCase();

  if (
    lowerPrompt.includes('motivational') ||
    lowerPrompt.includes('inspiration') ||
    lowerPrompt.includes('success') ||
    lowerPrompt.includes('achievement')
  ) {
    return 'motivational';
  }

  if (
    lowerPrompt.includes('landscape') ||
    lowerPrompt.includes('nature') ||
    lowerPrompt.includes('scenery') ||
    lowerPrompt.includes('mountain') ||
    lowerPrompt.includes('ocean') ||
    lowerPrompt.includes('forest')
  ) {
    return 'landscape';
  }

  if (
    lowerPrompt.includes('action') ||
    lowerPrompt.includes('person') ||
    lowerPrompt.includes('character') ||
    lowerPrompt.includes('walking') ||
    lowerPrompt.includes('running')
  ) {
    return 'action';
  }

  return 'auto';
}

function generateAutoVariation(basePrompt: string, index: number): string {
  const variations = [
    `${basePrompt}, cinematic wide shot`,
    `${basePrompt}, dramatic close-up`,
    `${basePrompt}, slow motion movement`,
    `${basePrompt}, dynamic camera angle`,
    `${basePrompt}, aerial perspective`,
    `${basePrompt}, golden hour lighting`,
    `${basePrompt}, moody atmosphere`,
    `${basePrompt}, vibrant colors`,
    `${basePrompt}, soft focus background`,
    `${basePrompt}, high contrast lighting`,
  ];

  return variations[index % variations.length];
}
