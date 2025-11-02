'use client';

import { Wand2, Camera, Film, Sparkles } from 'lucide-react';

interface Template {
  id: string;
  title: string;
  prompt: string;
  icon: any;
  category: string;
}

const templates: Template[] = [
  {
    id: '1',
    title: 'Cinematic Landscape',
    prompt: 'A breathtaking mountain landscape at golden hour with dramatic clouds rolling over peaks',
    icon: Camera,
    category: 'Nature'
  },
  {
    id: '2',
    title: 'Urban Motion',
    prompt: 'A bustling city street with people walking and cars moving through the intersection',
    icon: Film,
    category: 'Urban'
  },
  {
    id: '3',
    title: 'Floating Objects',
    prompt: 'Colorful balloons floating gently upward against a clear blue sky',
    icon: Sparkles,
    category: 'Abstract'
  },
  {
    id: '4',
    title: 'Ocean Waves',
    prompt: 'Ocean waves crashing on a sandy beach with foam and spray',
    icon: Camera,
    category: 'Nature'
  },
  {
    id: '5',
    title: 'Magical Forest',
    prompt: 'A mystical forest with sunbeams filtering through trees and particles floating in the air',
    icon: Wand2,
    category: 'Fantasy'
  },
  {
    id: '6',
    title: 'Product Showcase',
    prompt: 'A sleek modern product rotating slowly on a minimalist white background',
    icon: Film,
    category: 'Commercial'
  }
];

interface PromptTemplatesProps {
  onSelectTemplate: (prompt: string) => void;
}

export default function PromptTemplates({ onSelectTemplate }: PromptTemplatesProps) {
  return (
    <div className="prompt-templates">
      <div className="templates-header">
        <Wand2 size={20} />
        <h3>Prompt Templates</h3>
      </div>

      <div className="templates-grid">
        {templates.map((template) => {
          const Icon = template.icon;
          return (
            <button
              key={template.id}
              className="template-card"
              onClick={() => onSelectTemplate(template.prompt)}
              type="button"
            >
              <div className="template-icon">
                <Icon size={24} />
              </div>
              <div className="template-content">
                <h4 className="template-title">{template.title}</h4>
                <p className="template-category">{template.category}</p>
                <p className="template-prompt">{template.prompt}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
