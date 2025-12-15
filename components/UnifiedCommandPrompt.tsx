'use client';

import { useState, FormEvent } from 'react';
import { Terminal, Upload, Image as ImageIcon, Volume2, Sparkles } from 'lucide-react';
import UploadImage from './UploadImage';
import { generateAudioFromText } from '@/lib/generateAudio';
import { enhancePromptWithImage, validatePrompt } from '@/lib/promptEnhancer';
import { GenerationMode } from './GenerationModeSelector';

interface UnifiedCommandPromptProps {
  onSubmit: (
    videoId: string,
    prompt: string,
    imageUrl?: string,
    duration?: string,
    mode?: GenerationMode,
    style?: string,
    transition?: string,
    images?: string[],
    motionType?: string,
    dialogue?: string,
    audioUrl?: string
  ) => void;
}

export default function UnifiedCommandPrompt({ onSubmit }: UnifiedCommandPromptProps) {
  const [command, setCommand] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [secondImageUrl, setSecondImageUrl] = useState('');
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [duration, setDuration] = useState<string>('5s');
  const [dialogue, setDialogue] = useState('');
  const [voiceStyle, setVoiceStyle] = useState('natural');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const detectMode = (cmd: string): { mode: GenerationMode; style?: string; transition?: string; motionType?: string } => {
    const lower = cmd.toLowerCase();

    if (lower.includes('talk') || lower.includes('speak') || lower.includes('say') || lower.includes('lip sync')) {
      return { mode: 'talking-character' };
    }
    if (lower.includes('hug') || lower.includes('embrace')) {
      return { mode: 'hugging-people' };
    }
    if (lower.includes('sequence') || lower.includes('slideshow') || lower.includes('blend')) {
      const transition = lower.includes('dissolve') ? 'dissolve' : lower.includes('wipe') ? 'wipe' : 'fade';
      return { mode: 'multi-image', transition };
    }
    if (lower.includes('cinema') || lower.includes('movie') || lower.includes('film') || lower.includes('scene')) {
      let style = 'cinematic';
      if (lower.includes('noir')) style = 'noir';
      else if (lower.includes('sci-fi') || lower.includes('scifi')) style = 'sci-fi';
      else if (lower.includes('horror')) style = 'horror';
      else if (lower.includes('romance')) style = 'romance';
      else if (lower.includes('action')) style = 'action';
      return { mode: 'movie-scene', style };
    }
    if (lower.includes('motion') || lower.includes('move') || lower.includes('animate')) {
      let motionType = 'natural';
      if (lower.includes('zoom')) motionType = 'zoom';
      else if (lower.includes('pan')) motionType = 'pan';
      else if (lower.includes('tilt')) motionType = 'tilt';
      else if (lower.includes('rotate')) motionType = 'rotate';
      else if (lower.includes('dolly')) motionType = 'dolly';
      return { mode: 'image-motion', motionType };
    }
    if (imageUrl && (lower.includes('animate') || lower.includes('from image'))) {
      return { mode: 'huggingface' };
    }

    return { mode: 'luma' };
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const validation = validatePrompt(command);
    if (!validation.valid) {
      setError(validation.error || 'Invalid prompt');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const detection = detectMode(command);
      const mode = detection.mode;

      let audioUrl: string | null = null;
      if (dialogue.trim()) {
        audioUrl = await generateAudioFromText(dialogue, voiceStyle);
      }

      let finalPrompt = command.trim();
      if (imageUrl && mode === 'luma') {
        finalPrompt = enhancePromptWithImage(finalPrompt, true);
      }

      let images: string[] = [];
      if (mode === 'hugging-people' && imageUrl && secondImageUrl) {
        images = [imageUrl, secondImageUrl];
      } else if (mode === 'multi-image' && additionalImages.length > 0) {
        images = [imageUrl, ...additionalImages].filter(Boolean);
      } else if (mode === 'movie-scene' && additionalImages.length > 0) {
        images = additionalImages;
      }

      const response = await fetch('/api/luma/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        cache: 'no-store',
        body: JSON.stringify({
          prompt: finalPrompt,
          imageUrl: imageUrl.trim() || undefined,
          duration,
          mode,
        }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response from server. Please check your configuration.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create video');
      }

      onSubmit(
        data.id,
        finalPrompt,
        imageUrl.trim() || undefined,
        duration,
        mode,
        detection.style,
        detection.transition,
        images.length > 0 ? images : undefined,
        detection.motionType,
        dialogue.trim() || undefined,
        audioUrl || undefined
      );

      setCommand('');
      setImageUrl('');
      setSecondImageUrl('');
      setAdditionalImages([]);
      setDialogue('');
      setDuration('5s');
      setShowAdvanced(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addImageSlot = () => {
    setAdditionalImages([...additionalImages, '']);
  };

  const updateImageSlot = (index: number, url: string) => {
    const updated = [...additionalImages];
    updated[index] = url;
    setAdditionalImages(updated);
  };

  const removeImageSlot = (index: number) => {
    setAdditionalImages(additionalImages.filter((_, i) => i !== index));
  };

  return (
    <div className="unified-prompt">
      <div className="command-header">
        <Terminal size={24} />
        <div>
          <h2>AI Video Command Prompt</h2>
          <p>Describe what you want to create. The system will automatically detect the best mode.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="prompt-form">
        <div className="form-group">
          <label htmlFor="command">
            <Terminal size={16} style={{ display: 'inline', marginRight: '8px' }} />
            Command Prompt
          </label>
          <textarea
            id="command"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Examples:&#10;• Create a cinematic noir scene of a detective walking down a rainy street&#10;• Animate this image with a slow zoom motion&#10;• Make these two people hug each other&#10;• Create a talking character that says hello&#10;• Blend multiple images into a slideshow with dissolve transitions"
            rows={4}
            disabled={loading}
            required
            style={{ fontFamily: 'monospace' }}
          />
          <p className="input-hint">
            💡 <strong>Smart Detection:</strong> Keywords like "cinematic", "animate", "hug", "talk", "motion", "slideshow" will auto-select the best generation mode
          </p>
        </div>

        <div className="form-group">
          <label htmlFor="imageUrl">
            <ImageIcon size={16} style={{ display: 'inline', marginRight: '8px' }} />
            Primary Image (Optional)
          </label>
          <input
            id="imageUrl"
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            disabled={loading}
          />
          <UploadImage onUploadComplete={setImageUrl} />
        </div>

        <div className="form-group">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="add-image-btn"
          >
            <Sparkles size={16} />
            {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
          </button>
        </div>

        {showAdvanced && (
          <>
            <div className="form-group">
              <label htmlFor="secondImage">
                <ImageIcon size={16} style={{ display: 'inline', marginRight: '8px' }} />
                Second Image (For hugging mode)
              </label>
              <input
                id="secondImage"
                type="text"
                value={secondImageUrl}
                onChange={(e) => setSecondImageUrl(e.target.value)}
                placeholder="https://example.com/person2.jpg"
                disabled={loading}
              />
              <UploadImage onUploadComplete={setSecondImageUrl} />
            </div>

            {additionalImages.map((img, idx) => (
              <div key={idx} className="form-group">
                <label>
                  <ImageIcon size={16} style={{ display: 'inline', marginRight: '8px' }} />
                  Additional Image {idx + 1}
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={img}
                    onChange={(e) => updateImageSlot(idx, e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    disabled={loading}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => removeImageSlot(idx)}
                    className="cancel-button"
                    style={{ padding: '8px 16px', height: 'auto' }}
                  >
                    Remove
                  </button>
                </div>
                <UploadImage onUploadComplete={(url) => updateImageSlot(idx, url)} />
              </div>
            ))}

            <button
              type="button"
              onClick={addImageSlot}
              className="add-image-btn"
              disabled={loading}
            >
              <Upload size={16} />
              Add More Images
            </button>

            <div className="form-group">
              <label htmlFor="dialogue">
                <Volume2 size={16} style={{ display: 'inline', marginRight: '8px' }} />
                Dialogue/Narration (Optional)
              </label>
              <textarea
                id="dialogue"
                value={dialogue}
                onChange={(e) => setDialogue(e.target.value)}
                placeholder="Enter text for voiceover or narration"
                rows={3}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Voice Style</label>
              <div className="duration-options">
                <button
                  type="button"
                  className={`duration-option ${voiceStyle === 'natural' ? 'active' : ''}`}
                  onClick={() => setVoiceStyle('natural')}
                  disabled={loading}
                >
                  Natural
                </button>
                <button
                  type="button"
                  className={`duration-option ${voiceStyle === 'dramatic' ? 'active' : ''}`}
                  onClick={() => setVoiceStyle('dramatic')}
                  disabled={loading}
                >
                  Dramatic
                </button>
                <button
                  type="button"
                  className={`duration-option ${voiceStyle === 'professional' ? 'active' : ''}`}
                  onClick={() => setVoiceStyle('professional')}
                  disabled={loading}
                >
                  Professional
                </button>
                <button
                  type="button"
                  className={`duration-option ${voiceStyle === 'friendly' ? 'active' : ''}`}
                  onClick={() => setVoiceStyle('friendly')}
                  disabled={loading}
                >
                  Friendly
                </button>
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
          </>
        )}

        {error && <div className="error-message">{error}</div>}

        <button type="submit" disabled={loading} className="submit-button">
          {loading ? 'Processing...' : 'Generate Video'}
        </button>
      </form>

      <div className="command-examples">
        <h3>Example Commands:</h3>
        <ul>
          <li><strong>Text to Video:</strong> "A beautiful sunset over mountains with birds flying"</li>
          <li><strong>Image Animation:</strong> "Animate this image with a zoom motion"</li>
          <li><strong>Talking Character:</strong> "Create a talking character that explains AI"</li>
          <li><strong>Cinematic Scene:</strong> "A noir detective walking in the rain"</li>
          <li><strong>Hugging Video:</strong> "Make these two people hug each other"</li>
          <li><strong>Image Sequence:</strong> "Create a slideshow with dissolve transitions"</li>
        </ul>
      </div>
    </div>
  );
}
