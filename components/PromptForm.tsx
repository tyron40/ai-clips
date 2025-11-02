'use client';

import { useState, FormEvent } from 'react';
import UploadImage from './UploadImage';
import PromptTemplates from './PromptTemplates';

interface PromptFormProps {
  onSubmit: (videoId: string, prompt: string, imageUrl?: string, duration?: string) => void;
}

export default function PromptForm({ onSubmit }: PromptFormProps) {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [duration, setDuration] = useState<string>('5s');
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
      const response = await fetch('/api/luma/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          imageUrl: imageUrl.trim() || undefined,
          duration,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create video');
      }

      onSubmit(data.id, prompt.trim(), imageUrl.trim() || undefined, duration);
      setPrompt('');
      setImageUrl('');
      setDuration('5s');
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
