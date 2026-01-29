'use client';

import { useState, useEffect } from 'react';
import UnifiedCommandPrompt from '@/components/UnifiedCommandPrompt';
import VideoResult from '@/components/VideoResult';
import VideoGallery from '@/components/VideoGallery';
import { GenerationMode } from '@/components/GenerationModeSelector';
import Navigation from '@/components/Navigation';
import VideoGalleryView from '@/components/VideoGalleryView';
import InfluencerLibrary from '@/components/InfluencerLibrary';
import TemplatePromptBuilder from '@/components/TemplatePromptBuilder';
import BatchContentGenerator from '@/components/BatchContentGenerator';
import { supabase, VideoRecord } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { History, Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const [currentView, setCurrentView] = useState<'home' | 'gallery' | 'influencers'>('home');
  const [showGallery, setShowGallery] = useState(false);

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
        const response = await fetch(`/api/luma/status?id=${videoState.id}`);

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
          audioUrl: videoState.audioUrl,
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
              completed_at: new Date().toISOString()
            })
            .eq('luma_id', videoState.id);
        } else if (data.status === 'failed') {
          await supabase
            .from('videos')
            .update({
              status: 'failed',
              error_message: data.error
            })
            .eq('luma_id', videoState.id);
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
    audioUrl?: string,
    profileId?: string
  ) => {
    setVideoState({
      id,
      status: 'queued',
      audioUrl,
    });
    setPollingError(null);

    if (user) {
      try {
        await supabase.from('videos').insert({
          user_id: user.id,
          luma_id: id,
          prompt,
          image_url: imageUrl,
          duration: duration || '5s',
          status: 'queued',
          generation_mode: mode || 'luma',
          style,
          transition,
          images: images ? JSON.stringify(images) : undefined,
          motion_type: motionType,
          dialogue,
          audio_url: audioUrl,
          influencer_profile_id: profileId
        });
      } catch (err) {
        console.error('Failed to save video to database:', err);
      }
    }
  };

  const handleInfluencerVideoGenerated = async (
    videoId: string,
    prompt: string,
    imageUrl?: string,
    profileId?: string
  ) => {
    await handleVideoCreated(videoId, prompt, imageUrl, '5s', 'luma', undefined, undefined, undefined, undefined, undefined, undefined, profileId);
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
        ) : currentView === 'influencers' && user ? (
          <div className="influencer-page">
            <Tabs defaultValue="library" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="library">My Influencers</TabsTrigger>
                <TabsTrigger value="builder">Prompt Builder</TabsTrigger>
                <TabsTrigger value="batch">Batch Generator</TabsTrigger>
              </TabsList>
              <TabsContent value="library">
                <InfluencerLibrary />
              </TabsContent>
              <TabsContent value="builder">
                <TemplatePromptBuilder onVideoGenerated={handleInfluencerVideoGenerated} />
              </TabsContent>
              <TabsContent value="batch">
                <BatchContentGenerator />
              </TabsContent>
            </Tabs>
          </div>
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
                <UnifiedCommandPrompt onSubmit={handleVideoCreated} />
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
