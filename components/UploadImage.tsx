'use client';

import { useState } from 'react';
import { uploadImage, validateImageFile } from '@/lib/uploadImage';
import { Upload, X } from 'lucide-react';

interface UploadImageProps {
  onUploadComplete: (url: string) => void;
}

export default function UploadImage({ onUploadComplete }: UploadImageProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    try {
      const url = await uploadImage(file);
      onUploadComplete(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
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
      <label htmlFor="image-upload" className="file-upload-label">
        <Upload size={20} />
        {uploading ? 'Uploading...' : 'Upload Image'}
      </label>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
