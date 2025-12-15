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
    <div className="w-full max-w-5xl mx-auto mb-8">
      <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50 rounded-3xl p-8 shadow-xl border border-blue-100">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-3 px-5 py-2 bg-blue-500 text-white rounded-full mb-3 shadow-md">
            <Wand2 size={20} className="animate-pulse" />
            <h3 className="font-bold text-lg">Quick Start Templates</h3>
          </div>
          <p className="text-gray-600 text-sm">Click any template to get started instantly</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => {
            const Icon = template.icon;
            return (
              <button
                key={template.id}
                className="group relative bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-white border-2 border-gray-200 hover:border-blue-400 rounded-2xl p-5 transition-all duration-300 transform hover:scale-105 hover:shadow-xl text-left"
                onClick={() => onSelectTemplate(template.prompt)}
                type="button"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                    <Icon size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-800 text-base">{template.title}</h4>
                    </div>
                    <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full mb-2">
                      {template.category}
                    </span>
                    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                      {template.prompt}
                    </p>
                  </div>
                </div>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">→</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
