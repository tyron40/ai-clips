'use client';

import { useState, useEffect, useRef } from 'react';
import { Trash2, Play, Calendar, Filter } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Video {
  id: string;
  prompt: string;
  video_url: string;
  audio_url: string | null;
  created_at: string;
  generation_mode: string;
  influencer_profile_id: string | null;
}

interface InfluencerProfile {
  id: string;
  name: string;
}

export default function VideoGalleryView() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [profiles, setProfiles] = useState<InfluencerProfile[]>([]);
  const [selectedProfileFilter, setSelectedProfileFilter] = useState<string>('all');
  const modalVideoRef = useRef<HTMLVideoElement>(null);
  const modalAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (user) {
      loadVideos();
      loadProfiles();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadVideos();
    }
  }, [selectedProfileFilter]);

  const loadProfiles = async () => {
    if (!user) return;

    try {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from('influencer_profiles')
        .select('id, name')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setProfiles(data || []);
    } catch (err) {
      console.error('Failed to load profiles:', err);
    }
  };

  const loadVideos = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      let query = supabase
        .from('videos')
        .select('*')
        .eq('user_id', user.id);

      if (selectedProfileFilter !== 'all') {
        if (selectedProfileFilter === 'none') {
          query = query.is('influencer_profile_id', null);
        } else {
          query = query.eq('influencer_profile_id', selectedProfileFilter);
        }
      }

      const { data, error: fetchError } = await query.order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setVideos(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const deleteVideo = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return;

    try {
      const supabase = createClient();
      const { error: deleteError } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId);

      if (deleteError) throw deleteError;
      setVideos(videos.filter((v) => v.id !== videoId));
      if (selectedVideo?.id === videoId) {
        setSelectedVideo(null);
      }
    } catch (err) {
      alert('Failed to delete video');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="gallery-container">
        <h2>My Video Gallery</h2>
        <div className="gallery-loading">Loading your videos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gallery-container">
        <h2>My Video Gallery</h2>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="gallery-container">
        <h2>My Video Gallery</h2>
        <div className="gallery-empty">
          <Play size={48} />
          <p>No videos yet</p>
          <p className="gallery-empty-hint">Create your first video to see it here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gallery-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h2>My Video Gallery</h2>
          <p className="gallery-subtitle">{videos.length} video{videos.length !== 1 ? 's' : ''} created</p>
        </div>
        {profiles.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={20} style={{ color: '#d97706' }} />
            <select
              value={selectedProfileFilter}
              onChange={(e) => setSelectedProfileFilter(e.target.value)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '2px solid #d97706',
                fontSize: '0.9rem',
                cursor: 'pointer',
                background: 'white',
              }}
            >
              <option value="all">All Videos</option>
              <option value="none">No Influencer</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="gallery-grid">
        {videos.map((video) => (
          <div key={video.id} className="gallery-item">
            <div className="gallery-item-preview" onClick={() => setSelectedVideo(video)}>
              <video src={video.video_url} className="gallery-thumbnail" />
              <div className="gallery-item-overlay">
                <Play size={32} />
              </div>
            </div>

            <div className="gallery-item-info">
              <div className="gallery-item-mode">{video.generation_mode || 'Video'}</div>
              <p className="gallery-item-prompt">{video.prompt.substring(0, 80)}...</p>
              <div className="gallery-item-meta">
                <Calendar size={14} />
                <span>{formatDate(video.created_at)}</span>
              </div>
            </div>

            <div className="gallery-item-actions">
              <a
                href={video.video_url}
                download
                className="gallery-action-button"
                onClick={(e) => e.stopPropagation()}
              >
                Download
              </a>
              <button
                onClick={() => deleteVideo(video.id)}
                className="gallery-action-button gallery-delete-button"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedVideo && (
        <div className="gallery-modal" onClick={() => setSelectedVideo(null)}>
          <div className="gallery-modal-content" onClick={(e) => e.stopPropagation()}>
            <video
              ref={modalVideoRef}
              src={selectedVideo.video_url}
              controls
              autoPlay
              loop
              muted={!!selectedVideo.audio_url}
              className="gallery-modal-video"
              onPlay={() => {
                if (selectedVideo.audio_url && modalAudioRef.current) {
                  modalAudioRef.current.currentTime = modalVideoRef.current?.currentTime || 0;
                  modalAudioRef.current.play().catch(err => console.error('Audio play error:', err));
                }
              }}
              onPause={() => {
                if (modalAudioRef.current) {
                  modalAudioRef.current.pause();
                }
              }}
              onSeeked={() => {
                if (modalAudioRef.current && modalVideoRef.current) {
                  modalAudioRef.current.currentTime = modalVideoRef.current.currentTime;
                }
              }}
            />
            {selectedVideo.audio_url && (
              <audio ref={modalAudioRef} src={selectedVideo.audio_url} loop />
            )}
            <div className="gallery-modal-info">
              <h3>{selectedVideo.generation_mode || 'Video'}</h3>
              <p>{selectedVideo.prompt}</p>
              <span className="gallery-modal-date">{formatDate(selectedVideo.created_at)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
