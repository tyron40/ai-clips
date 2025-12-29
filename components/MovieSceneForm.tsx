'use client';

import { useState, FormEvent, ChangeEvent, useRef } from 'react';
import { Clapperboard, Film, Upload, X, UserPlus } from 'lucide-react';
import { uploadImage, validateImageFile } from '@/lib/uploadImage';
import { enhanceForMovieScene } from '@/lib/promptEnhancer';

interface MovieSceneFormProps {
  onSubmit: (jobId: string, prompt: string, style: string, characterImages?: string[]) => void;
}

interface CharacterImage {
  id: string;
  file: File;
  url: string;
  role?: string;
}

const cinematicStyles = [
  {
    id: 'noir',
    name: 'Film Noir',
    description: 'High contrast black and white cinematography',
    prompt: 'Cinematic film noir style with dramatic chiaroscuro lighting, deep shadows, high contrast black and white, venetian blind light patterns, moody atmosphere, classic 1940s cinematography, fog and mist, stark silhouettes'
  },
  {
    id: 'scifi',
    name: 'Sci-Fi',
    description: 'Futuristic cyberpunk aesthetic',
    prompt: 'Cinematic sci-fi scene with neon lights, holographic displays, futuristic technology, cyberpunk city aesthetics, lens flares, advanced visual effects, metallic surfaces, dramatic blue and purple color grading'
  },
  {
    id: 'western',
    name: 'Western',
    description: 'Classic American frontier style',
    prompt: 'Cinematic western with vast desert landscapes, golden hour lighting, dusty atmosphere, wide establishing shots, warm earthy tones, dramatic silhouettes against sunset, rustic textures, Sergio Leone style composition'
  },
  {
    id: 'horror',
    name: 'Horror',
    description: 'Dark and eerie suspense',
    prompt: 'Cinematic horror with unsettling atmosphere, dim lighting with practical sources, heavy shadows, desaturated color palette, grainy texture, dutch angles, slow creeping camera movement, fog and darkness, jump scare setup'
  },
  {
    id: 'romance',
    name: 'Romance',
    description: 'Soft intimate storytelling',
    prompt: 'Cinematic romance with soft diffused lighting, warm golden hour glow, shallow depth of field, dreamy bokeh, pastel color grading, intimate close-ups, elegant camera movement, natural beauty, emotional framing'
  },
  {
    id: 'action',
    name: 'Action',
    description: 'High-energy dynamic sequences',
    prompt: 'Cinematic action with dynamic camera movement, motion blur, dramatic angles, high contrast lighting, intense color grading, fast-paced energy, explosive visuals, wide angle lenses, Michael Bay style, adrenaline-pumping composition'
  },
  {
    id: 'documentary',
    name: 'Documentary',
    description: 'Authentic realistic footage',
    prompt: 'Cinematic documentary style with natural lighting, authentic environments, handheld camera feel, realistic color grading, observational perspective, environmental storytelling, true-to-life atmosphere, unobtrusive cinematography'
  },
  {
    id: 'fantasy',
    name: 'Fantasy',
    description: 'Magical otherworldly scenes',
    prompt: 'Cinematic fantasy with magical lighting, ethereal atmosphere, vibrant saturated colors, particle effects, glowing elements, mythical environments, epic wide shots, Lord of the Rings style grandeur, mystical fog and mist'
  }
];

export default function MovieSceneForm({ onSubmit }: MovieSceneFormProps) {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('noir');
  const [duration, setDuration] = useState<'5s' | '9s'>('5s');
  const [characterImages, setCharacterImages] = useState<CharacterImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError(null);
    setUploading(true);

    try {
      const newCharacters: CharacterImage[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const validation = validateImageFile(file);

        if (!validation.valid) {
          throw new Error(validation.error || `Invalid file: ${file.name}`);
        }

        const url = await uploadImage(file);
        newCharacters.push({
          id: `${Date.now()}-${i}`,
          file,
          url,
          role: `Character ${characterImages.length + i + 1}`
        });
      }

      setCharacterImages([...characterImages, ...newCharacters]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload images');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveCharacter = (id: string) => {
    setCharacterImages(characterImages.filter(char => char.id !== id));
  };

  const handleRoleChange = (id: string, role: string) => {
    setCharacterImages(characterImages.map(char =>
      char.id === id ? { ...char, role } : char
    ));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!prompt.trim()) {
        throw new Error('Please describe your scene');
      }

      const style = cinematicStyles.find(s => s.id === selectedStyle);
      const hasCharacter = characterImages.length > 0;

      const enhancedPrompt = enhanceForMovieScene(
        prompt,
        selectedStyle,
        hasCharacter
      );

      const imageUrl = hasCharacter ? characterImages[0].url : undefined;

      const response = await fetch('/api/luma/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        cache: 'no-store',
        body: JSON.stringify({
          prompt: enhancedPrompt,
          imageUrl,
          duration
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create movie scene');
      }

      const allImageUrls = characterImages.map(char => char.url);
      onSubmit(data.id, prompt, selectedStyle, allImageUrls.length > 0 ? allImageUrls : undefined);
      setPrompt('');
      setCharacterImages([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="generation-form">
      <div className="form-header">
        <Clapperboard size={24} />
        <h3>Movie Scene Generator</h3>
      </div>

      <div className="form-group">
        <label htmlFor="scene-prompt">Scene Location & Action *</label>
        <textarea
          id="scene-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="walking through a rain-soaked city alley at night, neon signs reflecting in puddles, investigating a crime scene with dramatic shadows"
          rows={4}
          disabled={loading}
          required
        />
        <p className="input-hint">Describe the complete scene: location, setting, action, and atmosphere</p>
      </div>

      <div className="form-group">
        <label>
          <UserPlus size={16} style={{ display: 'inline', marginRight: '8px' }} />
          Add Characters (Optional)
        </label>
        <p className="input-hint" style={{ marginBottom: '12px' }}>
          Upload photos (even just headshots!) to put yourself or others as FULL BODY characters in the scene.
          The AI will create complete characters with full outfits in the cinematic environment!
        </p>

        <div className="upload-section">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/heic,image/heif,.heic,.heif"
            onChange={handleFileSelect}
            disabled={loading || uploading}
            className="file-input"
            id="character-upload"
            multiple
            style={{ display: 'none' }}
          />
          <label htmlFor="character-upload" className="file-upload-label">
            <Upload size={20} />
            {uploading ? 'Uploading...' : 'Upload Character Images'}
          </label>
        </div>

        {characterImages.length > 0 && (
          <div className="character-list">
            {characterImages.map((character) => (
              <div key={character.id} className="character-item">
                <img src={character.url} alt={character.role} className="character-thumb" />
                <div className="character-info">
                  <input
                    type="text"
                    value={character.role}
                    onChange={(e) => handleRoleChange(character.id, e.target.value)}
                    placeholder="Character role..."
                    className="character-role-input"
                    disabled={loading}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveCharacter(character.id)}
                  className="remove-character-btn"
                  disabled={loading}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="form-group">
        <label>Cinematic Style</label>
        <div className="style-grid">
          {cinematicStyles.map((style) => (
            <button
              key={style.id}
              type="button"
              className={`style-option ${selectedStyle === style.id ? 'style-option-active' : ''}`}
              onClick={() => setSelectedStyle(style.id)}
              disabled={loading}
            >
              <Film size={18} />
              <div>
                <div className="style-name">{style.name}</div>
                <div className="style-desc">{style.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Video Duration</label>
        <div className="duration-options">
          <button
            type="button"
            className={`duration-option ${duration === '5s' ? 'active' : ''}`}
            onClick={() => setDuration('5s')}
            disabled={loading}
          >
            5 Seconds
          </button>
          <button
            type="button"
            className={`duration-option ${duration === '9s' ? 'active' : ''}`}
            onClick={() => setDuration('9s')}
            disabled={loading}
          >
            9 Seconds
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <button
        type="submit"
        className="submit-button"
        disabled={loading || !prompt.trim()}
      >
        {loading ? 'Creating Scene...' : 'Generate Movie Scene'}
      </button>
    </form>
  );
}
