'use client';

import { useState, FormEvent } from 'react';
import { Volume2, Sparkles } from 'lucide-react';
import UploadImage from './UploadImage';
import PromptTemplates from './PromptTemplates';
import { generateAudioFromText } from '@/lib/generateAudio';

interface PromptFormProps {
  onSubmit: (videoId: string, prompt: string, imageUrl?: string, duration?: string, dialogue?: string, audioUrl?: string, voiceStyle?: string) => void;
}

export default function PromptForm({ onSubmit }: PromptFormProps) {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [duration, setDuration] = useState<string>('5s');
  const [dialogue, setDialogue] = useState('');
  const [voiceStyle, setVoiceStyle] = useState('natural');
  const [showAudioOptions, setShowAudioOptions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let audioUrl: string | null = null;

      if (dialogue.trim()) {
        audioUrl = await generateAudioFromText(dialogue, voiceStyle);
      }

      const response = await fetch('/api/luma/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        cache: 'no-store',
        body: JSON.stringify({
          prompt: prompt.trim(),
          imageUrl: imageUrl.trim() || undefined,
          duration,
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
        prompt.trim(),
        imageUrl.trim() || undefined,
        duration,
        dialogue.trim() || undefined,
        audioUrl || undefined,
        voiceStyle
      );
      setPrompt('');
      setImageUrl('');
      setDialogue('');
      setDuration('5s');
      setShowAudioOptions(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PromptTemplates onSelectTemplate={setPrompt} />

      <form onSubmit={handleSubmit} className="prompt-form">
        <div className="form-group">
        <label htmlFor="prompt">Video Prompt *</label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the video you want to create..."
          rows={4}
          disabled={loading}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="imageUrl">Image URL (Optional)</label>
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
        <label>
          <Sparkles size={16} style={{ display: 'inline', marginRight: '8px' }} />
          Add Voiceover (Optional)
        </label>
        <button
          type="button"
          onClick={() => setShowAudioOptions(!showAudioOptions)}
          className="add-image-btn"
          style={{ marginTop: 0 }}
        >
          <Volume2 size={16} />
          {showAudioOptions ? 'Hide Audio Options' : 'Add Audio/Voiceover'}
        </button>
      </div>

      {showAudioOptions && (
        <>
          <div className="form-group">
            <label htmlFor="dialogue">
              <Volume2 size={16} style={{ display: 'inline', marginRight: '8px' }} />
              Dialogue/Narration
            </label>
            <textarea
              id="dialogue"
              value={dialogue}
              onChange={(e) => setDialogue(e.target.value)}
              placeholder="Enter text for voiceover or narration. The audio will play along with your video."
              rows={3}
              disabled={loading}
            />
            <p className="input-hint">Add spoken dialogue or narration to your video</p>
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
        </>
      )}

      <div className="form-group">
        <label htmlFor="duration">Video Duration</label>
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

      <button type="submit" disabled={loading} className="submit-button">
        {loading ? 'Creating...' : 'Generate Video'}
      </button>

      <p className="pro-tip">
        Pro tip: If you don't have an image URL, try text-only first.
      </p>
      </form>
    </>
  );
}
