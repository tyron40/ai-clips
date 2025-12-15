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
    title: 'Confident Smile',
    prompt: 'smiling confidently at the camera',
    icon: Camera,
    category: 'Character'
  },
  {
    id: '2',
    title: 'Wave Hello',
    prompt: 'waving hello to the camera',
    icon: Film,
    category: 'Character'
  },
  {
    id: '3',
    title: 'Happy Expression',
    prompt: 'laughing joyfully while looking at the camera',
    icon: Sparkles,
    category: 'Character'
  },
  {
    id: '4',
    title: 'Subtle Nod',
    prompt: 'nodding gently while maintaining eye contact',
    icon: Wand2,
    category: 'Character'
  },
  {
    id: '5',
    title: 'Landscape Scene',
    prompt: 'A breathtaking mountain landscape at golden hour with dramatic clouds rolling over peaks',
    icon: Camera,
    category: 'Nature'
  },
  {
    id: '6',
    title: 'Ocean Waves',
    prompt: 'Ocean waves crashing on a sandy beach with foam and spray',
    icon: Camera,
    category: 'Nature'
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
