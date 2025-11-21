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
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioUrl && videoRef.current && audioRef.current) {
      const video = videoRef.current;
      const audio = audioRef.current;

      const handlePlay = () => {
        if (audio && audioEnabled) {
          audio.currentTime = video.currentTime;
          audio.play().catch(err => console.error('Audio play error:', err));
        }
      };

      const handlePause = () => {
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

      if (video.paused === false && audioEnabled) {
        audio.currentTime = video.currentTime;
        audio.play().catch(err => console.error('Audio play error:', err));
      }

      return () => {
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
        video.removeEventListener('seeked', handleSeeked);
        video.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, [audioUrl, audioEnabled]);

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
        autoPlay
        loop
        muted={!!audioUrl}
        className="video-player"
      >
        Your browser does not support the video tag.
      </video>

      {audioUrl && (
        <audio ref={audioRef} src={audioUrl} loop preload="auto" />
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
