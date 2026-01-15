'use client';

import { useState, FormEvent } from 'react';
import { Upload, Image as ImageIcon, Volume2, Sparkles, Copy } from 'lucide-react';
import UploadImage from './UploadImage';
import { generateAudioFromText } from '@/lib/generateAudio';
import { enhancePromptWithImage, validatePrompt } from '@/lib/promptEnhancer';
import { generateBatchVariations } from '@/lib/batchGenerator';
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
  onBatchSubmit?: (videos: Array<{ id: string; prompt: string }>) => void;
}

interface TabOption {
  id: GenerationMode;
  label: string;
  example: string;
  placeholder: string;
}

const tabs: TabOption[] = [
  {
    id: 'luma',
    label: 'Text to Video',
    example: 'A beautiful sunset over mountains with birds flying',
    placeholder: 'Describe the video you want to create...'
  },
  {
    id: 'image-motion',
    label: 'Image Animation',
    example: 'Animate this image with a zoom motion',
    placeholder: 'Describe how you want your image to be animated...'
  },
  {
    id: 'talking-character',
    label: 'Talking Character',
    example: 'Create a talking character that explains AI',
    placeholder: 'Describe what you want the character to say or do...'
  },
  {
    id: 'movie-scene',
    label: 'Cinematic Scene',
    example: 'A noir detective walking in the rain',
    placeholder: 'Describe your cinematic scene...'
  },
  {
    id: 'hugging-people',
    label: 'Hugging Video',
    example: 'Make these two people hug each other',
    placeholder: 'Describe the hugging scene...'
  }
];

export default function UnifiedCommandPrompt({ onSubmit, onBatchSubmit }: UnifiedCommandPromptProps) {
  const [selectedTab, setSelectedTab] = useState<GenerationMode>('luma');
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [secondImageUrl, setSecondImageUrl] = useState('');
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [duration, setDuration] = useState<string>('5s');
  const [dialogue, setDialogue] = useState('');
  const [voiceStyle, setVoiceStyle] = useState('natural');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [batchCount, setBatchCount] = useState(10);

  const currentTab = tabs.find(t => t.id === selectedTab) || tabs[0];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const validation = validatePrompt(prompt);
    if (!validation.valid) {
      setError(validation.error || 'Invalid prompt');
      return;
    }

    if (selectedTab === 'talking-character') {
      if (!imageUrl.trim()) {
        setError('Character image is required for talking character mode');
        return;
      }
      if (!dialogue.trim()) {
        setError('Dialogue text is required for talking character mode');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      if (batchMode && batchCount > 1 && selectedTab === 'luma' && !imageUrl && !dialogue && onBatchSubmit) {
        await handleBatchSubmit();
      } else {
        await handleSingleSubmit();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSingleSubmit = async () => {
    let audioUrl: string | null = null;
    if (dialogue.trim()) {
      audioUrl = await generateAudioFromText(dialogue, voiceStyle);
      if (!audioUrl && selectedTab === 'talking-character') {
        throw new Error('Failed to generate voice audio. Please try again.');
      }
    }

    let finalPrompt = prompt.trim();
    if (imageUrl && selectedTab === 'luma') {
      finalPrompt = enhancePromptWithImage(finalPrompt, true);
    }

    let images: string[] = [];
    let style: string | undefined;
    let transition: string | undefined;
    let motionType: string | undefined;

    if (selectedTab === 'hugging-people' && imageUrl && secondImageUrl) {
      images = [imageUrl, secondImageUrl];
    } else if (selectedTab === 'multi-image' && additionalImages.length > 0) {
      images = [imageUrl, ...additionalImages].filter(Boolean);
    } else if (selectedTab === 'movie-scene') {
      style = 'cinematic';
      if (additionalImages.length > 0) {
        images = additionalImages;
      }
    } else if (selectedTab === 'image-motion') {
      motionType = 'natural';
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
        mode: selectedTab,
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
      selectedTab,
      style,
      transition,
      images.length > 0 ? images : undefined,
      motionType,
      dialogue.trim() || undefined,
      audioUrl || undefined
    );

    setPrompt('');
    setImageUrl('');
    setSecondImageUrl('');
    setAdditionalImages([]);
    setDialogue('');
    setDuration('5s');
    setShowAdvanced(false);
    setBatchMode(false);
  };

  const handleBatchSubmit = async () => {
    if (!onBatchSubmit) return;

    const variations = generateBatchVariations(prompt.trim(), batchCount);
    const results: Array<{ id: string; prompt: string }> = [];

    const batchPromises = variations.map(async (variation) => {
      try {
        const response = await fetch('/api/luma/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
          cache: 'no-store',
          body: JSON.stringify({
            prompt: variation.prompt,
            duration,
            mode: 'luma',
          }),
        });

        const data = await response.json();

        if (response.ok) {
          results.push({ id: data.id, prompt: variation.prompt });
        }
      } catch (err) {
        console.error(`Failed to create variation ${variation.variation}:`, err);
      }
    });

    await Promise.all(batchPromises);

    if (results.length === 0) {
      throw new Error('Failed to create any videos in the batch');
    }

    onBatchSubmit(results);

    setPrompt('');
    setBatchMode(false);
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
      <div className="tabs-container">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tab ${selectedTab === tab.id ? 'tab-active' : ''}`}
            onClick={() => setSelectedTab(tab.id)}
          >
            <div className="tab-label">{tab.label}</div>
            <div className="tab-example">{tab.example}</div>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="prompt-form">
        <div className="form-group">
          <label htmlFor="prompt">Your Prompt</label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={currentTab.placeholder}
            rows={4}
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="imageUrl">
            <ImageIcon size={16} style={{ display: 'inline', marginRight: '8px' }} />
            {selectedTab === 'talking-character' ? 'Character Image (Required)' : 'Primary Image (Optional)'}
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

        {selectedTab === 'talking-character' && (
          <>
            <div className="form-group">
              <label htmlFor="dialogue">
                <Volume2 size={16} style={{ display: 'inline', marginRight: '8px' }} />
                What Should The Character Say? (Required)
              </label>
              <textarea
                id="dialogue"
                value={dialogue}
                onChange={(e) => setDialogue(e.target.value)}
                placeholder="Enter the dialogue or script for your character to speak..."
                rows={3}
                disabled={loading}
                required={selectedTab === 'talking-character'}
              />
              <p className="input-hint">The character will speak these words with realistic voice and lip-sync</p>
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

        {selectedTab !== 'talking-character' && (
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
        )}

        {showAdvanced && selectedTab !== 'talking-character' && (
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
          </>
        )}

        {selectedTab !== 'talking-character' && (
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
        )}

        {selectedTab === 'luma' && !imageUrl && !dialogue && (
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="batchMode"
                checked={batchMode}
                onChange={(e) => setBatchMode(e.target.checked)}
                disabled={loading}
                style={{ width: 'auto', margin: 0 }}
              />
              <Copy size={16} />
              Batch Generation Mode
            </label>
            <p className="input-hint">
              Generate multiple unique video variations at once (up to 50 videos)
            </p>

            {batchMode && (
              <div style={{ marginTop: '12px' }}>
                <label htmlFor="batchCount">Number of Videos</label>
                <input
                  id="batchCount"
                  type="number"
                  min="1"
                  max="50"
                  value={batchCount}
                  onChange={(e) => setBatchCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
                  disabled={loading}
                  style={{ marginTop: '8px' }}
                />
                <p className="input-hint" style={{ marginTop: '8px' }}>
                  Generate {batchCount} unique variations based on your prompt
                </p>
              </div>
            )}
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        <button type="submit" disabled={loading} className="submit-button">
          {loading ? (batchMode ? `Creating ${batchCount} Videos...` : 'Processing...') : (batchMode ? `Generate ${batchCount} Videos` : 'Generate Video')}
        </button>
      </form>
    </div>
  );
}
