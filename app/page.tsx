'use client';

import { useState, useEffect } from 'react';
import PromptForm from '@/components/PromptForm';
import VideoResult from '@/components/VideoResult';
import VideoGallery from '@/components/VideoGallery';
import GenerationModeSelector, { GenerationMode } from '@/components/GenerationModeSelector';
import HuggingFaceForm from '@/components/HuggingFaceForm';
import MovieSceneForm from '@/components/MovieSceneForm';
import MultiImageForm from '@/components/MultiImageForm';
import HuggingPeopleForm from '@/components/HuggingPeopleForm';
import ImageMotionForm from '@/components/ImageMotionForm';
import TalkingCharacterForm from '@/components/TalkingCharacterForm';
import Navigation from '@/components/Navigation';
import VideoGalleryView from '@/components/VideoGalleryView';
import { supabase, VideoRecord } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { History, Plus } from 'lucide-react';

interface VideoState {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  audioUrl?: string;
  error?: string;
  progress?: number;
}

const STORAGE_KEY = 'luma_last_video';

export default function Home() {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'AI Video Studio';
  const { user } = useAuth();
  const [videoState, setVideoState] = useState<VideoState | null>(null);
  const [pollingError, setPollingError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'home' | 'gallery'>('home');
  const [showGallery, setShowGallery] = useState(false);
  const [generationMode, setGenerationMode] = useState<GenerationMode>('luma');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.status === 'completed' && parsed.videoUrl) {
          setVideoState(parsed);
        }
      } catch (err) {
        console.error('Failed to parse saved video state:', err);
      }
    }
  }, []);

  useEffect(() => {
    if (!videoState || videoState.status === 'completed' || videoState.status === 'failed') {
      return;
    }

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/video/status?id=${videoState.id}`);

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Invalid response from server');
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch status');
        }

        const updatedState = {
          id: videoState.id,
          status: data.status,
          videoUrl: data.video_url,
          audioUrl: data.audio_url,
          error: data.error,
        };

        setVideoState(updatedState as VideoState);
        setPollingError(null);

        if (data.status === 'completed' && data.video_url) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedState));

          await supabase
            .from('videos')
            .update({
              status: 'completed',
              video_url: data.video_url,
              audio_url: data.audio_url,
              completed_at: new Date().toISOString()
            })
            .eq('generation_id', videoState.id);
        } else if (data.status === 'failed') {
          await supabase
            .from('videos')
            .update({
              status: 'failed',
              error_message: data.error
            })
            .eq('generation_id', videoState.id);
        }
      } catch (err) {
        setPollingError(err instanceof Error ? err.message : 'Polling failed');
      }
    };

    const interval = setInterval(pollStatus, 4000);
    pollStatus();

    return () => clearInterval(interval);
  }, [videoState?.id, videoState?.status]);

  const handleVideoCreated = async (
    id: string,
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
  ) => {
    setVideoState({
      id,
      status: 'queued',
    });
    setPollingError(null);

    if (user) {
      try {
        await supabase.from('videos').insert({
          user_id: user.id,
          generation_id: id,
          prompt,
          image_url: imageUrl,
          duration: duration || '5s',
          status: 'queued',
          mode: mode || generationMode,
          style,
          transition,
          images: images ? JSON.stringify(images) : undefined,
          motion_type: motionType,
          dialogue,
          audio_url: audioUrl
        });
      } catch (err) {
        console.error('Failed to save video to database:', err);
      }
    }
  };

  const handleReset = () => {
    setVideoState(null);
    setPollingError(null);
    setShowGallery(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleSelectVideo = (video: VideoRecord) => {
    setVideoState({
      id: video.luma_id,
      status: 'completed',
      videoUrl: video.video_url,
      audioUrl: video.audio_url
    });
    setShowGallery(false);
  };

  return (
    <div className="app-wrapper">
      <Navigation onNavigate={setCurrentView} currentView={currentView} />

      <div className="container">
        {currentView === 'gallery' && user ? (
          <VideoGalleryView />
        ) : (
          <>
            <header className="header">
              <div className="header-content">
                <h1>{appName}</h1>
                <p className="subtitle">Create stunning videos with AI - Multiple generation modes</p>
              </div>
              <div className="header-actions">
                {!videoState && (
                  <button
                    onClick={() => setShowGallery(!showGallery)}
                    className="gallery-toggle"
                  >
                    {showGallery ? <Plus size={20} /> : <History size={20} />}
                    {showGallery ? 'New Video' : 'Recent'}
                  </button>
                )}
              </div>
            </header>

            <main className="main">
              {!videoState && !showGallery && (
                <>
                  <GenerationModeSelector
                    selectedMode={generationMode}
                    onSelectMode={setGenerationMode}
                  />

                  <div className="form-section">
                    {generationMode === 'luma' && (
                      <PromptForm
                        onSubmit={(id, prompt, imageUrl, duration, dialogue, audioUrl) =>
                          handleVideoCreated(id, prompt, imageUrl, duration, 'luma', undefined, undefined, undefined, undefined, dialogue, audioUrl)
                        }
                      />
                    )}

                    {generationMode === 'huggingface' && (
                      <HuggingFaceForm
                        onSubmit={(id, imageUrl, prompt, duration) =>
                          handleVideoCreated(id, prompt || 'Animate this image', imageUrl, duration, 'huggingface')
                        }
                      />
                    )}

                    {generationMode === 'movie-scene' && (
                      <MovieSceneForm
                        onSubmit={(id, prompt, style, characterImages) =>
                          handleVideoCreated(id, prompt, characterImages?.[0], '10s', 'movie-scene', style, undefined, characterImages)
                        }
                      />
                    )}

                    {generationMode === 'multi-image' && (
                      <MultiImageForm
                        onSubmit={(id, images, transition) =>
                          handleVideoCreated(id, 'Image sequence video', images[0], '10s', 'multi-image', undefined, transition, images)
                        }
                      />
                    )}

                    {generationMode === 'hugging-people' && (
                      <HuggingPeopleForm
                        onSubmit={(id, image1Url, image2Url) =>
                          handleVideoCreated(id, 'Hugging people video', image1Url, '10s', 'hugging-people', undefined, undefined, [image1Url, image2Url])
                        }
                      />
                    )}

                    {generationMode === 'image-motion' && (
                      <ImageMotionForm
                        onSubmit={(id, imageUrl, motionType) =>
                          handleVideoCreated(id, `Image animation with ${motionType} motion`, imageUrl, '10s', 'image-motion', undefined, undefined, undefined, motionType)
                        }
                      />
                    )}

                    {generationMode === 'talking-character' && (
                      <TalkingCharacterForm
                        onSubmit={(id, prompt, imageUrl, dialogue, audioUrl) =>
                          handleVideoCreated(id, prompt, imageUrl, '5s', 'talking-character', undefined, undefined, undefined, undefined, dialogue, audioUrl)
                        }
                      />
                    )}
                  </div>
                </>
              )}

              {!videoState && showGallery && <VideoGallery onSelectVideo={handleSelectVideo} />}

              {videoState && videoState.status !== 'completed' && (
                <div className="progress-area">
                  <div className="progress-content">
                    <div className="spinner"></div>
                    <h3>
                      {videoState.status === 'queued' ? 'Queued' : 'Processing'}
                    </h3>
                    <p>Your video is being generated. This may take a few minutes...</p>
                    {pollingError && (
                      <p className="error-text">Error: {pollingError}</p>
                    )}
                    <button onClick={handleReset} className="cancel-button">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {videoState?.status === 'failed' && (
                <div className="error-area">
                  <h3>Generation Failed</h3>
                  <p>{videoState.error || 'An unknown error occurred'}</p>
                  <button onClick={handleReset} className="reset-button">
                    Try Again
                  </button>
                </div>
              )}

              {videoState?.status === 'completed' && videoState.videoUrl && (
                <VideoResult videoUrl={videoState.videoUrl} audioUrl={videoState.audioUrl} onReset={handleReset} />
              )}
            </main>

            <footer className="footer">
              <p>Powered by Luma Dream Machine & Hugging Face</p>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
