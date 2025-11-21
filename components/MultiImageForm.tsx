'use client';

import { useState, FormEvent, ChangeEvent, useRef } from 'react';
import { Images, Plus, X, Upload } from 'lucide-react';
import { uploadImage, validateImageFile } from '@/lib/uploadImage';

interface MultiImageFormProps {
  onSubmit: (jobId: string, images: string[], transition: string) => void;
}

const transitionStyles = [
  { id: 'smooth', name: 'Smooth Blend', description: 'Seamless morphing between images' },
  { id: 'fade', name: 'Fade Transition', description: 'Classic crossfade effect' },
  { id: 'zoom', name: 'Zoom & Pan', description: 'Dynamic camera movement' },
  { id: 'warp', name: 'Warp Morph', description: 'Fluid warping transformation' }
];

interface ImageEntry {
  url: string;
  file: File | null;
  uploading: boolean;
}

export default function MultiImageForm({ onSubmit }: MultiImageFormProps) {
  const [images, setImages] = useState<ImageEntry[]>([
    { url: '', file: null, uploading: false },
    { url: '', file: null, uploading: false }
  ]);
  const [transition, setTransition] = useState('smooth');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const addImageField = () => {
    if (images.length < 5) {
      setImages([...images, { url: '', file: null, uploading: false }]);
    }
  };

  const removeImageField = (index: number) => {
    if (images.length > 2) {
      setImages(images.filter((_, i) => i !== index));
      fileInputRefs.current = fileInputRefs.current.filter((_, i) => i !== index);
    }
  };

  const updateImageUrl = (index: number, value: string) => {
    const newImages = [...images];
    newImages[index] = { ...newImages[index], url: value };
    setImages(newImages);
  };

  const handleFileSelect = async (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setError(null);
    const newImages = [...images];
    newImages[index] = { ...newImages[index], file, uploading: true };
    setImages(newImages);

    try {
      const url = await uploadImage(file);
      const updatedImages = [...images];
      updatedImages[index] = { url, file, uploading: false };
      setImages(updatedImages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
      const resetImages = [...images];
      resetImages[index] = { url: '', file: null, uploading: false };
      setImages(resetImages);
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...images];
    newImages[index] = { url: '', file: null, uploading: false };
    setImages(newImages);
    if (fileInputRefs.current[index]) {
      fileInputRefs.current[index]!.value = '';
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const validImages = images.filter(img => img.url.trim()).map(img => img.url);

      if (validImages.length < 2) {
        throw new Error('Please provide at least 2 images');
      }

      const transitionStyle = transitionStyles.find(t => t.id === transition);
      const prompt = `Create a smooth video sequence transitioning between multiple images with ${transitionStyle?.name.toLowerCase()} effect. ${transitionStyle?.description}. Professional, cinematic quality.`;

      const response = await fetch('/api/luma/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          imageUrl: validImages[0],
          duration: '10s'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create video sequence');
      }

      onSubmit(data.id, validImages, transition);
      setImages([
        { url: '', file: null, uploading: false },
        { url: '', file: null, uploading: false }
      ]);
      fileInputRefs.current.forEach(ref => {
        if (ref) ref.value = '';
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="generation-form">
      <div className="form-header">
        <Images size={24} />
        <h3>Image Sequence to Video</h3>
      </div>

      <div className="form-group">
        <label>Upload Images or Provide URLs (2-5 images)</label>
        <div className="image-list">
          {images.map((image, index) => (
            <div key={index} className="multi-image-entry">
              {!image.url && (
                <div className="image-upload-section">
                  <input
                    ref={el => fileInputRefs.current[index] = el}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={(e) => handleFileSelect(index, e)}
                    disabled={loading || image.uploading}
                    className="file-input"
                    id={`multi-image-${index}`}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor={`multi-image-${index}`} className="file-upload-label-small">
                    <Upload size={16} />
                    {image.uploading ? 'Uploading...' : `Image ${index + 1}`}
                  </label>
                  <div className="divider-small">or</div>
                  <input
                    type="text"
                    value={image.url}
                    onChange={(e) => updateImageUrl(index, e.target.value)}
                    placeholder={`Image ${index + 1} URL`}
                    disabled={loading || image.uploading}
                    className="url-input-small"
                  />
                </div>
              )}

              {image.url && (
                <div className="multi-image-preview">
                  <img src={image.url} alt={`Image ${index + 1}`} className="preview-thumb" />
                  <span className="image-label">Image {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="remove-preview-btn-small"
                    disabled={loading}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {images.length > 2 && (
                <button
                  type="button"
                  className="remove-field-btn"
                  onClick={() => removeImageField(index)}
                  disabled={loading}
                  title="Remove this slot"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>

        {images.length < 5 && (
          <button
            type="button"
            className="add-image-btn"
            onClick={addImageField}
            disabled={loading}
          >
            <Plus size={16} />
            Add Another Image
          </button>
        )}
      </div>

      <div className="form-group">
        <label>Transition Style</label>
        <div className="transition-options">
          {transitionStyles.map((style) => (
            <button
              key={style.id}
              type="button"
              className={`transition-option ${transition === style.id ? 'transition-option-active' : ''}`}
              onClick={() => setTransition(style.id)}
              disabled={loading}
            >
              <div className="transition-name">{style.name}</div>
              <div className="transition-desc">{style.description}</div>
            </button>
          ))}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <button
        type="submit"
        className="submit-button"
        disabled={loading || images.filter(img => img.url.trim()).length < 2 || images.some(img => img.uploading)}
      >
        {loading ? 'Creating Sequence...' : 'Generate Video Sequence'}
      </button>
    </form>
  );
}
