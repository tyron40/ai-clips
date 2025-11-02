'use client';

import { useState, useEffect } from 'react';
import { supabase, VideoRecord } from '@/lib/supabase';
import { Play, Calendar, Clock, Image } from 'lucide-react';

interface VideoGalleryProps {
  onSelectVideo: (video: VideoRecord) => void;
}

export default function VideoGallery({ onSelectVideo }: VideoGalleryProps) {
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(12);

      if (error) throw error;
      setVideos(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="gallery-loading">
        <div className="spinner"></div>
        <p>Loading your videos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gallery-error">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="gallery-empty">
        <Play size={48} />
        <h3>No videos yet</h3>
        <p>Create your first AI-generated video to see it here</p>
      </div>
    );
  }

  return (
    <div className="video-gallery">
      <div className="gallery-header">
        <h2>Recent Creations</h2>
        <p className="gallery-subtitle">{videos.length} video{videos.length !== 1 ? 's' : ''} generated</p>
      </div>

      <div className="gallery-grid">
        {videos.map((video) => (
          <div
            key={video.id}
            className="gallery-item"
            onClick={() => onSelectVideo(video)}
          >
            <div className="gallery-item-video">
              {video.video_url && (
                <video
                  src={video.video_url}
                  className="gallery-thumbnail"
                  muted
                  playsInline
                  onMouseEnter={(e) => e.currentTarget.play()}
                  onMouseLeave={(e) => {
                    e.currentTarget.pause();
                    e.currentTarget.currentTime = 0;
                  }}
                />
              )}
              <div className="gallery-item-overlay">
                <Play size={32} />
              </div>
            </div>

            <div className="gallery-item-info">
              <p className="gallery-item-prompt">{video.prompt}</p>
              <div className="gallery-item-meta">
                <span className="meta-item">
                  <Clock size={14} />
                  {video.duration}
                </span>
                {video.image_url && (
                  <span className="meta-item">
                    <Image size={14} />
                    Image
                  </span>
                )}
                <span className="meta-item">
                  <Calendar size={14} />
                  {new Date(video.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
