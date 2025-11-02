'use client';

import { useState } from 'react';
import { Download, RotateCcw, Share2, Check } from 'lucide-react';

interface VideoResultProps {
  videoUrl: string;
  onReset: () => void;
}

export default function VideoResult({ videoUrl, onReset }: VideoResultProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(videoUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="video-result">
      <div className="result-header">
        <h2>Your Video is Ready!</h2>
        <div className="result-badge">Completed</div>
      </div>

      <video
        src={videoUrl}
        controls
        autoPlay
        loop
        className="video-player"
      >
        Your browser does not support the video tag.
      </video>

      <div className="video-actions">
        <a
          href={videoUrl}
          download
          className="action-button download-button"
        >
          <Download size={20} />
          Download
        </a>
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
