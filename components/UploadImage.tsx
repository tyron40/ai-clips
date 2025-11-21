'use client';

import { useState, useRef } from 'react';
import { uploadImage, validateImageFile } from '@/lib/uploadImage';
import { Upload, X, Loader as Loader2 } from 'lucide-react';

interface UploadImageProps {
  onUploadComplete: (url: string) => void;
}

export default function UploadImage({ onUploadComplete }: UploadImageProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const uploadingRef = useRef(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('[MOBILE] File selected:', file.name, file.type, file.size);

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setUploading(true);
    uploadingRef.current = true;
    setError(null);
    setProgressPercent(0);

    const fileSize = (file.size / 1024 / 1024).toFixed(2);
    setUploadProgress(`Processing ${fileSize}MB image...`);

    let progressInterval: NodeJS.Timeout | null = null;

    try {
      progressInterval = setInterval(() => {
        if (uploadingRef.current) {
          setProgressPercent((prev) => {
            if (prev < 90) return prev + 10;
            return prev;
          });
        }
      }, 300);

      if (file.size > 500 * 1024) {
        setTimeout(() => {
          if (uploadingRef.current) {
            setUploadProgress('Optimizing for faster upload...');
          }
        }, 500);

        setTimeout(() => {
          if (uploadingRef.current) {
            setUploadProgress('Uploading to server...');
          }
        }, 1500);
      }

      console.log('[UPLOAD] Starting upload process...');
      const url = await uploadImage(file);

      if (progressInterval) clearInterval(progressInterval);
      setProgressPercent(100);
      setUploadProgress('Upload complete!');
      console.log('[UPLOAD] Success! URL:', url);
      onUploadComplete(url);

      e.target.value = '';
    } catch (err) {
      if (progressInterval) clearInterval(progressInterval);
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      console.error('[MOBILE] Upload error:', errorMessage, err);
      setError(`Upload failed: ${errorMessage}`);
      setProgressPercent(0);
      e.target.value = '';
    } finally {
      uploadingRef.current = false;
      setUploading(false);
      setTimeout(() => {
        setUploadProgress('');
        setProgressPercent(0);
      }, 2000);
    }
  };

  const handleButtonClick = () => {
    const input = document.getElementById('image-upload') as HTMLInputElement;
    if (input) {
      input.click();
    }
  };

  return (
    <div className="upload-image">
      <input
        id="image-upload"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
        className="file-input"
        style={{ display: 'none' }}
      />
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={uploading}
        className={`file-upload-label ${uploading ? 'uploading' : ''}`}
      >
        {uploading ? <Loader2 size={20} className="spin" /> : <Upload size={20} />}
        {uploading ? 'Uploading...' : 'Choose from Photos'}
      </button>
      {uploadProgress && (
        <div className="upload-progress-container">
          <p className="upload-progress">{uploadProgress}</p>
          {progressPercent > 0 && (
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
        </div>
      )}
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
