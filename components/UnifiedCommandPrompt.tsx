'use client';

import { useState, FormEvent, useEffect } from 'react';
import { Upload, Image as ImageIcon, Volume2, Sparkles, User } from 'lucide-react';
import UploadImage from './UploadImage';
import { generateAudioFromText } from '@/lib/generateAudio';
import { enhancePromptWithImage, validatePrompt } from '@/lib/promptEnhancer';
import { GenerationMode } from './GenerationModeSelector';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

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
    audioUrl?: string,
    profileId?: string
  ) => void;
}

interface InfluencerProfile {
  id: string;
  name: string;
  base_image_url: string;
  prompt_template: string;
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

export default function UnifiedCommandPrompt({ onSubmit }: UnifiedCommandPromptProps) {
  const { user } = useAuth();
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
  const [profiles, setProfiles] = useState<InfluencerProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [useInfluencer, setUseInfluencer] = useState(false);

  const currentTab = tabs.find(t => t.id === selectedTab) || tabs[0];

  useEffect(() => {
    if (user) {
      loadProfiles();
    }
  }, [user]);

  useEffect(() => {
    if (selectedProfile && profiles.length > 0) {
      const profile = profiles.find(p => p.id === selectedProfile);
      if (profile && profile.base_image_url) {
        setImageUrl(profile.base_image_url);
      }
    }
  }, [selectedProfile, profiles]);

  const loadProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('influencer_profiles')
        .select('id, name, base_image_url, prompt_template')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      console.error('Failed to load profiles:', error);
    }
  };

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
        audioUrl || undefined,
        selectedProfile || undefined
      );

      setPrompt('');
      if (!useInfluencer) {
        setImageUrl('');
      }
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
        {user && profiles.length > 0 && selectedTab === 'luma' && (
          <div className="form-group" style={{
            background: 'linear-gradient(135deg, #fff5eb 0%, #fef3c7 100%)',
            padding: '20px',
            borderRadius: '12px',
            border: '2px solid #fb923c',
            marginBottom: '24px'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '16px',
              fontWeight: '600',
              color: '#9a3412',
              marginBottom: '12px'
            }}>
              <input
                type="checkbox"
                checked={useInfluencer}
                onChange={(e) => {
                  setUseInfluencer(e.target.checked);
                  if (!e.target.checked) {
                    setSelectedProfile('');
                    setImageUrl('');
                  }
                }}
                style={{ width: 'auto', margin: 0, cursor: 'pointer' }}
              />
              <User size={20} />
              Use AI Influencer Character
            </label>

            {useInfluencer && (
              <>
                <select
                  value={selectedProfile}
                  onChange={(e) => setSelectedProfile(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '2px solid #fb923c',
                    fontSize: '15px',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                  disabled={loading}
                >
                  <option value="">Select an influencer character...</option>
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name}
                    </option>
                  ))}
                </select>
                {selectedProfile && (
                  <p style={{
                    marginTop: '12px',
                    fontSize: '14px',
                    color: '#9a3412',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Sparkles size={16} />
                    <strong>Character locked!</strong> The same character will appear consistently in all videos
                  </p>
                )}
              </>
            )}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="prompt">Your Prompt</label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={useInfluencer && selectedProfile ? "Describe what your influencer character is doing (e.g., 'walking in the city', 'working out at gym', 'enjoying coffee')..." : currentTab.placeholder}
            rows={4}
            disabled={loading}
            required
          />
          {useInfluencer && selectedProfile && (
            <p className="input-hint" style={{ color: '#fb923c', marginTop: '8px' }}>
              <Sparkles size={14} style={{ display: 'inline', marginRight: '4px' }} />
              Your selected influencer character will be the main focus of this video
            </p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="imageUrl">
            <ImageIcon size={16} style={{ display: 'inline', marginRight: '8px' }} />
            {selectedTab === 'talking-character' ? 'Character Image (Required)' : useInfluencer ? 'Character Image (Auto-filled)' : 'Primary Image (Optional)'}
          </label>
          <input
            id="imageUrl"
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            disabled={loading || (useInfluencer && selectedProfile !== '')}
            style={useInfluencer && selectedProfile ? { backgroundColor: '#fef3c7' } : {}}
          />
          {!useInfluencer && <UploadImage onUploadComplete={setImageUrl} />}
          {useInfluencer && selectedProfile && (
            <p className="input-hint" style={{ color: '#9a3412' }}>
              Using character image from your selected influencer profile
            </p>
          )}
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

        {error && <div className="error-message">{error}</div>}

        <button type="submit" disabled={loading} className="submit-button">
          {loading ? 'Processing...' : 'Generate Video'}
        </button>
      </form>
    </div>
  );
}
