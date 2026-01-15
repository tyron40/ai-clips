'use client';

import { useState, useEffect } from 'react';
import { X, Download, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface BatchVideo {
  id: string;
  prompt: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  error?: string;
}

interface BatchVideoResultsProps {
  videos: Array<{ id: string; prompt: string }>;
  onClose: () => void;
}

export default function BatchVideoResults({ videos, onClose }: BatchVideoResultsProps) {
  const [batchVideos, setBatchVideos] = useState<BatchVideo[]>(
    videos.map(v => ({ ...v, status: 'queued' as const }))
  );

  useEffect(() => {
    const intervals = batchVideos.map((video, index) => {
      if (video.status === 'completed' || video.status === 'failed') {
        return null;
      }

      const interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/luma/status?id=${video.id}`);
          const data = await response.json();

          if (response.ok) {
            setBatchVideos(prev => {
              const updated = [...prev];
              updated[index] = {
                ...updated[index],
                status: data.status,
                videoUrl: data.video_url,
                error: data.error,
              };
              return updated;
            });

            if (data.status === 'completed' && data.video_url) {
              await supabase
                .from('videos')
                .update({
                  status: 'completed',
                  video_url: data.video_url,
                  completed_at: new Date().toISOString()
                })
                .eq('luma_id', video.id);
            } else if (data.status === 'failed') {
              await supabase
                .from('videos')
                .update({
                  status: 'failed',
                  error_message: data.error
                })
                .eq('luma_id', video.id);
            }
          }
        } catch (err) {
          console.error(`Failed to poll video ${video.id}:`, err);
        }
      }, 5000);

      return interval;
    });

    return () => {
      intervals.forEach(interval => {
        if (interval) clearInterval(interval);
      });
    };
  }, [batchVideos.map(v => v.id).join(',')]);

  const completedCount = batchVideos.filter(v => v.status === 'completed').length;
  const failedCount = batchVideos.filter(v => v.status === 'failed').length;
  const processingCount = batchVideos.filter(v => v.status === 'processing' || v.status === 'queued').length;

  const downloadVideo = async (videoUrl: string, videoId: string) => {
    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `video-${videoId}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const downloadAll = () => {
    batchVideos.forEach(video => {
      if (video.videoUrl) {
        downloadVideo(video.videoUrl, video.id);
      }
    });
  };

  return (
    <div className="batch-results-overlay">
      <div className="batch-results-container">
        <div className="batch-results-header">
          <div>
            <h2>Batch Generation Progress</h2>
            <p className="batch-stats">
              {completedCount} completed • {processingCount} processing • {failedCount} failed • {batchVideos.length} total
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {completedCount > 0 && (
              <button onClick={downloadAll} className="batch-action-btn">
                <Download size={18} />
                Download All
              </button>
            )}
            <button onClick={onClose} className="batch-close-btn">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="batch-video-grid">
          {batchVideos.map((video, index) => (
            <div key={video.id} className="batch-video-card">
              <div className="batch-video-header">
                <span className="batch-video-number">#{index + 1}</span>
                <div className="batch-video-status">
                  {video.status === 'completed' && <CheckCircle size={16} color="#10b981" />}
                  {video.status === 'failed' && <AlertCircle size={16} color="#ef4444" />}
                  {(video.status === 'processing' || video.status === 'queued') && (
                    <Loader2 size={16} className="spinning" color="#3b82f6" />
                  )}
                  <span className={`status-text status-${video.status}`}>
                    {video.status}
                  </span>
                </div>
              </div>

              {video.videoUrl ? (
                <div className="batch-video-preview">
                  <video
                    src={video.videoUrl}
                    controls
                    playsInline
                    className="batch-video-player"
                  />
                </div>
              ) : (
                <div className="batch-video-placeholder">
                  <Loader2 size={32} className="spinning" />
                  <p>Generating...</p>
                </div>
              )}

              <div className="batch-video-info">
                <p className="batch-video-prompt">{video.prompt}</p>
                {video.error && (
                  <p className="batch-video-error">{video.error}</p>
                )}
                {video.videoUrl && (
                  <button
                    onClick={() => downloadVideo(video.videoUrl!, video.id)}
                    className="batch-download-btn"
                  >
                    <Download size={14} />
                    Download
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .batch-results-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.95);
          z-index: 1000;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          align-items: flex-start;
          justify-content: center;
        }

        .batch-results-container {
          width: 100%;
          max-width: 1600px;
          background: #1a1a1a;
          border-radius: 16px;
          padding: 32px;
          margin: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .batch-results-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #333;
        }

        .batch-results-header h2 {
          margin: 0 0 8px 0;
          font-size: 24px;
          color: #fff;
        }

        .batch-stats {
          color: #888;
          font-size: 14px;
          margin: 0;
        }

        .batch-action-btn, .batch-close-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .batch-action-btn {
          background: #3b82f6;
          color: white;
        }

        .batch-action-btn:hover {
          background: #2563eb;
        }

        .batch-close-btn {
          background: #333;
          color: #fff;
        }

        .batch-close-btn:hover {
          background: #444;
        }

        .batch-video-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 24px;
          max-height: calc(100vh - 200px);
          overflow-y: auto;
          padding: 8px;
        }

        .batch-video-card {
          background: #222;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #333;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .batch-video-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
          border-color: #444;
        }

        .batch-video-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: #2a2a2a;
        }

        .batch-video-number {
          font-weight: 600;
          color: #888;
        }

        .batch-video-status {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .status-text {
          font-size: 12px;
          text-transform: capitalize;
          font-weight: 500;
        }

        .status-completed {
          color: #10b981;
        }

        .status-failed {
          color: #ef4444;
        }

        .status-processing, .status-queued {
          color: #3b82f6;
        }

        .batch-video-preview {
          aspect-ratio: 16/9;
          background: #000;
        }

        .batch-video-player {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .batch-video-placeholder {
          aspect-ratio: 16/9;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #1a1a1a;
          color: #666;
          gap: 12px;
        }

        .batch-video-info {
          padding: 12px;
        }

        .batch-video-prompt {
          font-size: 13px;
          color: #aaa;
          margin: 0;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .batch-video-error {
          font-size: 12px;
          color: #ef4444;
          margin: 8px 0 0 0;
        }

        .batch-download-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          margin-top: 8px;
          transition: background 0.2s;
        }

        .batch-download-btn:hover {
          background: #2563eb;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 1400px) {
          .batch-video-grid {
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          }
        }

        @media (max-width: 768px) {
          .batch-results-overlay {
            padding: 8px;
          }

          .batch-results-container {
            padding: 16px;
          }

          .batch-video-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .batch-results-header {
            flex-direction: column;
            gap: 16px;
          }
        }
      `}</style>
    </div>
  );
}
