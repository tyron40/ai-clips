'use client';

import { useState, FormEvent, ChangeEvent, useRef } from 'react';
import { MessageSquare, Upload, User, Volume2 } from 'lucide-react';
import { uploadImage, validateImageFile } from '@/lib/uploadImage';

interface TalkingCharacterFormProps {
  onSubmit: (jobId: string, prompt: string, imageUrl: string, dialogue: string, audioUrl: string, voiceStyle: string) => void;
}

const voiceStyles = [
  { id: 'natural', name: 'Natural', description: 'Clear and conversational' },
  { id: 'dramatic', name: 'Dramatic', description: 'Expressive and emotional' },
  { id: 'professional', name: 'Professional', description: 'Clear and authoritative' },
  { id: 'friendly', name: 'Friendly', description: 'Warm and approachable' },
];

export default function TalkingCharacterForm({ onSubmit }: TalkingCharacterFormProps) {
  const [characterImage, setCharacterImage] = useState<string | null>(null);
  const [dialogue, setDialogue] = useState('');
  const [voiceStyle, setVoiceStyle] = useState('natural');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid file');
      }

      const url = await uploadImage(file);
      setCharacterImage(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    setCharacterImage(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!characterImage) {
        throw new Error('Please upload a character image');
      }

      if (!dialogue.trim()) {
        throw new Error('Please enter dialogue for the character to say');
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase configuration missing');
      }

      const speechResponse = await fetch(`${supabaseUrl}/functions/v1/generate-speech`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: dialogue,
          voiceStyle: voiceStyle
        }),
      });

      if (!speechResponse.ok) {
        const errorData = await speechResponse.json();
        throw new Error(errorData.error || 'Failed to generate speech audio');
      }

      const audioBlob = await speechResponse.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      const enhancedPrompt = `Create a realistic talking head video. The person in the image is speaking with natural lip-sync movements and facial expressions. ${voiceStyle} voice style. Natural head movements, realistic eye blinks, and subtle facial animations that match the spoken dialogue. Professional lighting, high quality, natural skin tones. The character maintains eye contact and appears engaged while speaking.`;

      const response = await fetch('/api/luma/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          imageUrl: characterImage,
          duration: '5s'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create talking character video');
      }

      onSubmit(data.id, enhancedPrompt, characterImage, dialogue, audioUrl, voiceStyle);
      setDialogue('');
      setCharacterImage(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="generation-form">
      <div className="form-header">
        <MessageSquare size={24} />
        <h3>Talking Character Generator</h3>
      </div>

      <p className="form-description">
        Upload a photo and enter dialogue to create a realistic talking character video with natural lip-sync and facial expressions.
      </p>

      <div className="form-group">
        <label>
          <User size={16} style={{ display: 'inline', marginRight: '8px' }} />
          Character Image *
        </label>
        <p className="input-hint">Upload a clear front-facing photo of the person who will speak</p>

        <div className="upload-section">
          {!characterImage ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleFileSelect}
                disabled={loading || uploading}
                className="file-input"
                id="character-image-upload"
              />
              <label htmlFor="character-image-upload" className="file-upload-label">
                <Upload size={20} />
                {uploading ? 'Uploading...' : 'Upload Character Photo'}
              </label>
            </>
          ) : (
            <div className="uploaded-image-preview">
              <img src={characterImage} alt="Character" className="preview-image" />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="remove-preview-btn"
                disabled={loading}
              >
                Remove Image
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="dialogue">
          <Volume2 size={16} style={{ display: 'inline', marginRight: '8px' }} />
          Dialogue *
        </label>
        <textarea
          id="dialogue"
          value={dialogue}
          onChange={(e) => setDialogue(e.target.value)}
          placeholder="Hello! Welcome to AI Video Studio. I'm so excited to show you what we can create together. This technology is truly amazing!"
          rows={4}
          disabled={loading}
          required
        />
        <p className="input-hint">Enter the text you want the character to say. Keep it under 2-3 sentences for best results.</p>
      </div>

      <div className="form-group">
        <label>Voice Style</label>
        <div className="style-grid">
          {voiceStyles.map((style) => (
            <button
              key={style.id}
              type="button"
              className={`style-option ${voiceStyle === style.id ? 'style-option-active' : ''}`}
              onClick={() => setVoiceStyle(style.id)}
              disabled={loading}
            >
              <div>
                <div className="style-name">{style.name}</div>
                <div className="style-desc">{style.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <button
        type="submit"
        className="submit-button"
        disabled={loading || !characterImage || !dialogue.trim()}
      >
        {loading ? 'Creating Talking Character...' : 'Generate Talking Video'}
      </button>
    </form>
  );
}
