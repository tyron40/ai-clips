'use client';

import { useState, FormEvent, ChangeEvent, useRef } from 'react';
import { Users, Upload, X } from 'lucide-react';
import { uploadImage, validateImageFile } from '@/lib/uploadImage';

interface HuggingPeopleFormProps {
  onSubmit: (jobId: string, image1Url: string, image2Url: string) => void;
}

interface ImageState {
  url: string;
  file: File | null;
  uploading: boolean;
}

export default function HuggingPeopleForm({ onSubmit }: HuggingPeopleFormProps) {
  const [image1, setImage1] = useState<ImageState>({ url: '', file: null, uploading: false });
  const [image2, setImage2] = useState<ImageState>({ url: '', file: null, uploading: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (imageNum: 1 | 2, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setError(null);
    const setState = imageNum === 1 ? setImage1 : setImage2;
    setState({ url: '', file, uploading: true });

    try {
      const url = await uploadImage(file);
      setState({ url, file, uploading: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
      setState({ url: '', file: null, uploading: false });
    }
  };

  const handleRemoveImage = (imageNum: 1 | 2) => {
    const setState = imageNum === 1 ? setImage1 : setImage2;
    const ref = imageNum === 1 ? fileInputRef1 : fileInputRef2;
    setState({ url: '', file: null, uploading: false });
    if (ref.current) {
      ref.current.value = '';
    }
  };

  const handleUrlChange = (imageNum: 1 | 2, value: string) => {
    const setState = imageNum === 1 ? setImage1 : setImage2;
    setState(prev => ({ ...prev, url: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!image1.url.trim() || !image2.url.trim()) {
        throw new Error('Please provide both images');
      }

      const response = await fetch('/api/luma/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Two people hugging each other warmly, arms wrapped around each other in a close embrace. Emotional, heartfelt moment of connection.',
          imageUrl: image1.url.trim(),
          endImageUrl: image2.url.trim(),
          duration: '5s'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create hugging video');
      }

      onSubmit(data.id, image1.url.trim(), image2.url.trim());
      setImage1({ url: '', file: null, uploading: false });
      setImage2({ url: '', file: null, uploading: false });
      if (fileInputRef1.current) fileInputRef1.current.value = '';
      if (fileInputRef2.current) fileInputRef2.current.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const renderImageInput = (imageNum: 1 | 2, imageState: ImageState, ref: React.RefObject<HTMLInputElement>) => (
    <div className="form-group">
      <label>Person {imageNum} Image *</label>

      {!imageState.url && (
        <div className="upload-section">
          <input
            ref={ref}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            onChange={(e) => handleFileSelect(imageNum, e)}
            disabled={loading || imageState.uploading}
            className="file-input"
            id={`hugging-person-${imageNum}`}
            style={{ display: 'none' }}
          />
          <label htmlFor={`hugging-person-${imageNum}`} className="file-upload-label">
            <Upload size={20} />
            {imageState.uploading ? 'Uploading...' : `Upload Person ${imageNum}`}
          </label>
        </div>
      )}

      {imageState.url && (
        <div className="uploaded-image-preview">
          <img src={imageState.url} alt={`Person ${imageNum}`} className="preview-image" />
          <button
            type="button"
            onClick={() => handleRemoveImage(imageNum)}
            className="remove-preview-btn"
            disabled={loading}
          >
            <X size={16} />
            Remove
          </button>
        </div>
      )}

      {!imageState.url && (
        <>
          <div className="divider">OR</div>
          <input
            type="text"
            value={imageState.url}
            onChange={(e) => handleUrlChange(imageNum, e.target.value)}
            placeholder={`Person ${imageNum} image URL`}
            disabled={loading || imageState.uploading}
          />
        </>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="generation-form">
      <div className="form-header">
        <Users size={24} />
        <h3>Hugging People Video</h3>
      </div>

      <p className="form-description">
        Upload or provide URLs for two images of people. AI will create a heartwarming video of them hugging.
      </p>

      {renderImageInput(1, image1, fileInputRef1)}
      {renderImageInput(2, image2, fileInputRef2)}

      {error && <div className="error-message">{error}</div>}

      <button
        type="submit"
        className="submit-button"
        disabled={loading || image1.uploading || image2.uploading || !image1.url.trim() || !image2.url.trim()}
      >
        {loading ? 'Creating Hugging Video...' : 'Generate Hugging Video'}
      </button>
    </form>
  );
}
