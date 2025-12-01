'use client';

import { useState, FormEvent } from 'react';
import { Volume2, Sparkles, Wand2 } from 'lucide-react';
import UploadImage from './UploadImage';
import PromptTemplates from './PromptTemplates';
import { generateAudioFromText } from '@/lib/generateAudio';
import { enhancePromptWithImage, validatePrompt, optimizeForCharacterAnimation } from '@/lib/promptEnhancer';

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
  const [autoEnhance, setAutoEnhance] = useState(true);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const validation = validatePrompt(prompt);
    if (!validation.valid) {
      setError(validation.error || 'Invalid prompt');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let audioUrl: string | null = null;

      if (dialogue.trim()) {
        audioUrl = await generateAudioFromText(dialogue, voiceStyle);
      }

      let finalPrompt = prompt.trim();
      if (autoEnhance && imageUrl.trim()) {
        finalPrompt = enhancePromptWithImage(finalPrompt, true);
        finalPrompt = optimizeForCharacterAnimation(finalPrompt, 'moderate');
        console.log('[PROMPT ENHANCED]', { original: prompt, enhanced: finalPrompt });
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
        <label htmlFor="prompt">
          Video Prompt *
          {imageUrl && (
            <span style={{ marginLeft: '8px', fontSize: '0.9em', color: '#10b981' }}>
              <Wand2 size={14} style={{ display: 'inline', marginRight: '4px' }} />
              Character Mode Active
            </span>
          )}
        </label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={imageUrl ? "Describe what the character should do (e.g., 'walking confidently', 'looking at camera with a smile')..." : "Describe the video you want to create..."}
          rows={4}
          disabled={loading}
          required
        />
        {imageUrl && autoEnhance && (
          <p className="input-hint" style={{ color: '#10b981', marginTop: '8px' }}>
            ✨ Auto-Enhancement Active: Your prompt will be optimized to animate the character naturally
          </p>
        )}
      </div>

      {imageUrl && (
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="autoEnhance"
              checked={autoEnhance}
              onChange={(e) => setAutoEnhance(e.target.checked)}
              disabled={loading}
              style={{ width: 'auto', margin: 0 }}
            />
            <Wand2 size={16} />
            Smart Character Animation Enhancement
          </label>
          <p className="input-hint">
            Automatically optimizes your prompt to ensure the character is animated naturally as the main focus
          </p>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="imageUrl">Character Image (Optional)</label>
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
        {imageUrl ? (
          <>🎭 <strong>Character Mode:</strong> Your image will be animated as the main character. The AI will maintain their appearance throughout the video.</>
        ) : (
          <>💡 <strong>Pro tip:</strong> Upload a character image to create videos featuring that specific person!</>
        )}
      </p>
      </form>
    </>
  );
}
