'use client';

import { useState, useRef, useEffect } from 'react';
import { Download, RotateCcw, Share2, Check, Volume2, VolumeX } from 'lucide-react';

interface VideoResultProps {
  videoUrl: string;
  audioUrl?: string;
  onReset: () => void;
}

export default function VideoResult({ videoUrl, audioUrl, onReset }: VideoResultProps) {
  const [copied, setCopied] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [audioReady, setAudioReady] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    console.log('VideoResult rendered with audioUrl:', audioUrl);
  }, [audioUrl]);

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      const audio = audioRef.current;

      const handleCanPlay = () => {
        console.log('Audio can play, ready to sync');
        setAudioReady(true);
      };

      const handleError = (e: Event) => {
        console.error('Audio loading error:', e);
      };

      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('error', handleError);
      audio.load();

      return () => {
        audio.removeEventListener('canplay', handleCanPlay);
        audio.removeEventListener('error', handleError);
      };
    }
  }, [audioUrl]);

  useEffect(() => {
    if (audioUrl && audioReady && videoRef.current && audioRef.current) {
      const video = videoRef.current;
      const audio = audioRef.current;

      const handlePlay = async () => {
        console.log('Video playing, starting audio');
        setUserInteracted(true);
        if (audio && audioEnabled) {
          audio.currentTime = video.currentTime;
          try {
            await audio.play();
            console.log('Audio started successfully');
          } catch (err) {
            console.error('Audio play error:', err);
          }
        }
      };

      const handlePause = () => {
        console.log('Video paused, pausing audio');
        if (audio) {
          audio.pause();
        }
      };

      const handleSeeked = () => {
        if (audio && video) {
          audio.currentTime = video.currentTime;
        }
      };

      const handleTimeUpdate = () => {
        if (audio && video && Math.abs(audio.currentTime - video.currentTime) > 0.3) {
          audio.currentTime = video.currentTime;
        }
      };

      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);
      video.addEventListener('seeked', handleSeeked);
      video.addEventListener('timeupdate', handleTimeUpdate);

      if (!video.paused && audioEnabled && userInteracted) {
        audio.currentTime = video.currentTime;
        audio.play().catch(err => console.error('Initial audio play error:', err));
      }

      return () => {
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
        video.removeEventListener('seeked', handleSeeked);
        video.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, [audioUrl, audioEnabled, audioReady, userInteracted]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(videoUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
    if (audioRef.current) {
      if (audioEnabled) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  return (
    <div className="video-result">
      <div className="result-header">
        <h2>Your Video is Ready!</h2>
        <div className="result-badge">Completed</div>
      </div>

      <video
        ref={videoRef}
        src={videoUrl}
        controls
        loop
        muted={!!audioUrl}
        playsInline
        preload="auto"
        className="video-player"
        style={{ maxWidth: '100%', height: 'auto' }}
      >
        Your browser does not support the video tag.
      </video>

      {audioUrl && (
        <>
          <audio ref={audioRef} src={audioUrl} loop preload="auto" />
          {!userInteracted && (
            <div style={{
              padding: '12px',
              marginTop: '12px',
              backgroundColor: '#3b82f6',
              color: 'white',
              borderRadius: '8px',
              textAlign: 'center',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              🔊 Click the play button to start video with audio
            </div>
          )}
        </>
      )}

      <div className="video-actions">
        <a
          href={videoUrl}
          download
          className="action-button download-button"
        >
          <Download size={20} />
          Download
        </a>
        {audioUrl && (
          <button onClick={toggleAudio} className="action-button share-button">
            {audioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            {audioEnabled ? 'Mute Audio' : 'Enable Audio'}
          </button>
        )}
        <button onClick={handleShare} className="action-button share-button">
          {copied ? <Check size={20} /> : <Share2 size={20} />}
          {copied ? 'Copied!' : 'Share Link'}
        </button>
        <button onClick={onReset} className="action-button reset-button">
          <RotateCcw size={20} />
          Create New
        </button>
      </div>
    </div>
  );
}
