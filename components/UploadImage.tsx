'use client';

import { useState } from 'react';
import { uploadImage, validateImageFile } from '@/lib/uploadImage';
import { Upload, X, Loader2 } from 'lucide-react';

interface UploadImageProps {
  onUploadComplete: (url: string) => void;
}

export default function UploadImage({ onUploadComplete }: UploadImageProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setUploading(true);
    setError(null);

    const fileSize = (file.size / 1024 / 1024).toFixed(2);
    setUploadProgress(`Preparing ${fileSize}MB image...`);

    try {
      if (file.size > 1024 * 1024) {
        setUploadProgress('Compressing image...');
      }

      const url = await uploadImage(file);
      setUploadProgress('Upload complete!');
      onUploadComplete(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(''), 2000);
    }
  };

  return (
    <div className="upload-image">
      <input
        id="image-upload"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        disabled={uploading}
        className="file-input"
      />
      <label htmlFor="image-upload" className={`file-upload-label ${uploading ? 'uploading' : ''}`}>
        {uploading ? <Loader2 size={20} className="spin" /> : <Upload size={20} />}
        {uploading ? 'Uploading...' : 'Upload Image'}
      </label>
      {uploadProgress && <p className="upload-progress">{uploadProgress}</p>}
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
