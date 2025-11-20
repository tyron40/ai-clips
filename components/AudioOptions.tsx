'use client';

import { Volume2, Sparkles } from 'lucide-react';

interface AudioOptionsProps {
  dialogue: string;
  setDialogue: (value: string) => void;
  voiceStyle: string;
  setVoiceStyle: (value: string) => void;
  showAudioOptions: boolean;
  setShowAudioOptions: (value: boolean) => void;
  loading: boolean;
}

export default function AudioOptions({
  dialogue,
  setDialogue,
  voiceStyle,
  setVoiceStyle,
  showAudioOptions,
  setShowAudioOptions,
  loading
}: AudioOptionsProps) {
  return (
    <>
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
    </>
  );
}
