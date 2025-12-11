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
  const [preview, setPreview] = useState<string | null>(null);
  const uploadingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('[MOBILE] File selected:', file.name, file.type, file.size);

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    setUploading(true);
    uploadingRef.current = true;
    setError(null);
    setProgressPercent(0);

    const fileSize = (file.size / 1024 / 1024).toFixed(2);
    const fileSizeKB = (file.size / 1024).toFixed(0);

    if (file.size < 300 * 1024) {
      setUploadProgress('Uploading image...');
    } else {
      setUploadProgress(`Optimizing ${fileSizeKB}KB image...`);
    }

    let progressInterval: NodeJS.Timeout | null = null;

    try {
      progressInterval = setInterval(() => {
        if (uploadingRef.current) {
          setProgressPercent((prev) => {
            if (prev < 85) return prev + 15;
            return prev;
          });
        }
      }, 200);

      if (file.size > 300 * 1024) {
        setTimeout(() => {
          if (uploadingRef.current) {
            setUploadProgress('Compressing and uploading...');
          }
        }, 400);
      }

      console.log('[UPLOAD] Starting upload process...');
      const url = await uploadImage(file);

      if (progressInterval) clearInterval(progressInterval);
      setProgressPercent(100);
      setUploadProgress('✓ Image ready!');
      console.log('[UPLOAD] Success! URL:', url);
      onUploadComplete(url);

      setTimeout(() => {
        setUploadProgress('');
        setProgressPercent(0);
        if (preview) {
          URL.revokeObjectURL(preview);
          setPreview(null);
        }
      }, 1500);

      e.target.value = '';
    } catch (err) {
      if (progressInterval) clearInterval(progressInterval);
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      console.error('[UPLOAD ERROR] Details:', {
        message: errorMessage,
        error: err,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      let userFriendlyMessage = errorMessage;
      if (errorMessage.includes('sign in')) {
        userFriendlyMessage = 'Please sign in to upload images';
      } else if (errorMessage.includes('network')) {
        userFriendlyMessage = 'Network error. Check your connection and try again.';
      } else if (errorMessage.includes('timeout')) {
        userFriendlyMessage = 'Upload timed out. Try a smaller image or check your connection.';
      }

      setError(userFriendlyMessage);
      setProgressPercent(0);
      if (preview) {
        URL.revokeObjectURL(preview);
        setPreview(null);
      }
      e.target.value = '';
    } finally {
      uploadingRef.current = false;
      setUploading(false);
    }
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="upload-image">
      {preview && (
        <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src={preview}
            alt="Preview"
            style={{
              width: '60px',
              height: '60px',
              objectFit: 'cover',
              borderRadius: '8px',
              border: uploading ? '2px solid #3b82f6' : '2px solid #10b981'
            }}
          />
          <span style={{ fontSize: '0.9em', color: uploading ? '#3b82f6' : '#10b981' }}>
            {uploading ? 'Uploading...' : '✓ Uploaded'}
          </span>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/heic,image/heif,.heic,.heif"
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
