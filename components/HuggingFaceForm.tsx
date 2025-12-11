'use client';

import { useState, FormEvent, ChangeEvent, useRef } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { uploadImage, validateImageFile } from '@/lib/uploadImage';

interface HuggingFaceFormProps {
  onSubmit: (jobId: string, imageUrl: string, prompt?: string, duration?: string) => void;
}

export default function HuggingFaceForm({ onSubmit }: HuggingFaceFormProps) {
  const [imageUrl, setImageUrl] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState<'5s' | '9s'>('5s');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setError(null);
    setUploadedFile(file);
    setUploading(true);

    try {
      const url = await uploadImage(file);
      setUploadedImageUrl(url);
      setImageUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
      setUploadedFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setUploadedImageUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const finalImageUrl = uploadedImageUrl || imageUrl.trim();
      if (!finalImageUrl) {
        throw new Error('Please provide an image URL or upload an image');
      }

      const finalPrompt = prompt.trim() || 'Animate this image with smooth, natural motion';

      const response = await fetch('/api/luma/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        cache: 'no-store',
        body: JSON.stringify({
          prompt: finalPrompt,
          imageUrl: finalImageUrl,
          duration
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start image animation');
      }

      onSubmit(data.id, finalImageUrl, prompt.trim() || undefined, duration);
      setImageUrl('');
      setPrompt('');
      setUploadedFile(null);
      setUploadedImageUrl('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="generation-form">
      <div className="form-header">
        <ImageIcon size={24} />
        <h3>Image to Video</h3>
      </div>

      <div className="form-group">
        <label>Upload Image or Provide URL *</label>

        {!uploadedImageUrl && (
          <div className="upload-section">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/heic,image/heif,.heic,.heif"
              onChange={handleFileSelect}
              disabled={loading || uploading}
              className="file-input"
              id="hf-file-upload"
              style={{ display: 'none' }}
            />
            <label htmlFor="hf-file-upload" className="file-upload-label">
              <Upload size={20} />
              {uploading ? 'Uploading...' : 'Choose Image File'}
            </label>
          </div>
        )}

        {uploadedFile && uploadedImageUrl && (
          <div className="uploaded-image-preview">
            <img src={uploadedImageUrl} alt="Uploaded" className="preview-image" />
            <button
              type="button"
              onClick={handleRemoveFile}
              className="remove-preview-btn"
              disabled={loading}
            >
              <X size={16} />
              Remove
            </button>
          </div>
        )}

        {!uploadedImageUrl && (
          <>
            <div className="divider">OR</div>
            <input
              id="hf-image"
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              disabled={loading || uploading}
            />
          </>
        )}
        <p className="input-hint">Upload an image file or provide an image URL</p>
      </div>

      <div className="form-group">
        <label htmlFor="hf-prompt">Motion Prompt (Optional)</label>
        <textarea
          id="hf-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., gentle camera pan to the right, smooth zoom in"
          rows={3}
          disabled={loading}
        />
        <p className="input-hint">Describe the motion or leave empty for auto-animation</p>
      </div>

      <div className="form-group">
        <label htmlFor="duration">Video Duration</label>
        <div className="duration-options">
          <button
            type="button"
            className={`duration-option ${duration === '5s' ? 'active' : ''}`}
            onClick={() => setDuration('5s')}
            disabled={loading}
          >
            5 Seconds
          </button>
          <button
            type="button"
            className={`duration-option ${duration === '9s' ? 'active' : ''}`}
            onClick={() => setDuration('9s')}
            disabled={loading}
          >
            9 Seconds
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <button
        type="submit"
        className="submit-button"
        disabled={loading || uploading || (!imageUrl.trim() && !uploadedImageUrl)}
      >
        {loading ? 'Starting...' : 'Animate Image'}
      </button>
    </form>
  );
}
