'use client';

import { Film, Image as ImageIcon, Sparkles, Clapperboard, Users, Wand2, MessageSquare } from 'lucide-react';

export type GenerationMode = 'luma' | 'huggingface' | 'movie-scene' | 'multi-image' | 'hugging-people' | 'image-motion' | 'talking-character';

interface ModeOption {
  id: GenerationMode;
  title: string;
  description: string;
  icon: any;
  badge?: string;
}

const modes: ModeOption[] = [
  {
    id: 'luma',
    title: 'Text to Video',
    description: 'Generate videos from text prompts with Luma AI',
    icon: Film,
  },
  {
    id: 'huggingface',
    title: 'Image to Video',
    description: 'Animate any image with AI motion',
    icon: ImageIcon,
  },
  {
    id: 'talking-character',
    title: 'Talking Character',
    description: 'Create realistic talking videos with lip-sync',
    icon: MessageSquare,
    badge: 'New'
  },
  {
    id: 'movie-scene',
    title: 'Movie Scene',
    description: 'Create cinematic scenes with professional styles',
    icon: Clapperboard,
    badge: 'Popular'
  },
  {
    id: 'multi-image',
    title: 'Image Sequence',
    description: 'Blend multiple images into a video',
    icon: Sparkles,
  },
  {
    id: 'hugging-people',
    title: 'Hugging People',
    description: 'Create heartwarming hugging videos from two images',
    icon: Users,
  },
  {
    id: 'image-motion',
    title: 'Image Animation',
    description: 'Put any image in natural motion',
    icon: Wand2,
    badge: 'Popular'
  }
];

interface GenerationModeSelectorProps {
  selectedMode: GenerationMode;
  onSelectMode: (mode: GenerationMode) => void;
}

export default function GenerationModeSelector({ selectedMode, onSelectMode }: GenerationModeSelectorProps) {
  return (
    <div className="mode-selector">
      <h2 className="mode-selector-title">Choose Generation Mode</h2>
      <div className="mode-grid">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isSelected = selectedMode === mode.id;

          return (
            <button
              key={mode.id}
              className={`mode-card ${isSelected ? 'mode-card-active' : ''}`}
              onClick={() => onSelectMode(mode.id)}
              type="button"
            >
              {mode.badge && (
                <div className="mode-badge">{mode.badge}</div>
              )}
              <div className="mode-icon">
                <Icon size={32} />
              </div>
              <h3 className="mode-title">{mode.title}</h3>
              <p className="mode-description">{mode.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
