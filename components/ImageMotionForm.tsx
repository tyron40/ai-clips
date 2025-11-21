'use client';

import { useState, FormEvent, ChangeEvent, useRef } from 'react';
import { Wand2, Upload, X } from 'lucide-react';
import { uploadImage, validateImageFile } from '@/lib/uploadImage';

interface ImageMotionFormProps {
  onSubmit: (jobId: string, imageUrl: string, motionType: string) => void;
}

const motionTypes = [
  { id: 'gentle', name: 'Gentle Motion', description: 'Subtle, natural movements' },
  { id: 'dynamic', name: 'Dynamic', description: 'Energetic and lively motion' },
  { id: 'cinematic', name: 'Cinematic', description: 'Professional camera movements' },
  { id: 'zoom', name: 'Zoom Effect', description: 'Smooth zoom in or out' },
  { id: 'pan', name: 'Pan Motion', description: 'Horizontal or vertical camera pan' },
  { id: 'dramatic', name: 'Dramatic', description: 'Bold, attention-grabbing movements' }
];

export default function ImageMotionForm({ onSubmit }: ImageMotionFormProps) {
  const [imageUrl, setImageUrl] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [motionType, setMotionType] = useState('gentle');
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

      const motion = motionTypes.find(m => m.id === motionType);
      const prompt = `Animate this image with ${motion?.name.toLowerCase()} style. ${motion?.description}. Natural, smooth, and professional animation.`;

      const response = await fetch('/api/luma/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          imageUrl: finalImageUrl,
          duration: '5s'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to animate image');
      }

      onSubmit(data.id, finalImageUrl, motionType);
      setImageUrl('');
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
        <Wand2 size={24} />
        <h3>Image Animation</h3>
      </div>

      <p className="form-description">
        Upload an image and add natural motion to bring it to life with AI animation.
      </p>

      <div className="form-group">
        <label>Image to Animate *</label>

        {!uploadedImageUrl && (
          <div className="upload-section">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleFileSelect}
              disabled={loading || uploading}
              className="file-input"
              id="motion-file-upload"
              style={{ display: 'none' }}
            />
            <label htmlFor="motion-file-upload" className="file-upload-label">
              <Upload size={20} />
              {uploading ? 'Uploading...' : 'Upload Image'}
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
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              disabled={loading || uploading}
            />
          </>
        )}
      </div>

      <div className="form-group">
        <label>Motion Type</label>
        <div className="motion-type-grid">
          {motionTypes.map((motion) => (
            <button
              key={motion.id}
              type="button"
              className={`motion-type-option ${motionType === motion.id ? 'motion-type-active' : ''}`}
              onClick={() => setMotionType(motion.id)}
              disabled={loading}
            >
              <div className="motion-name">{motion.name}</div>
              <div className="motion-desc">{motion.description}</div>
            </button>
          ))}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <button
        type="submit"
        className="submit-button"
        disabled={loading || uploading || (!imageUrl.trim() && !uploadedImageUrl)}
      >
        {loading ? 'Animating...' : 'Animate Image'}
      </button>
    </form>
  );
}
