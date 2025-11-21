import { supabase } from './supabase';

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        const maxDimension = 1280;
        let quality = 0.8;

        if (file.size > 5 * 1024 * 1024) {
          quality = 0.7;
        }

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round(height * (maxDimension / width));
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round(width * (maxDimension / height));
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
}

export async function uploadImage(file: File): Promise<string> {
  console.log(`[UPLOAD START] File: ${file.name}, Type: ${file.type}, Size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);

  let uploadFile: Blob | File = file;
  const startTime = Date.now();

  // Skip compression for very small files or if type is problematic
  const shouldCompress = file.size > 500 * 1024 &&
    (file.type === 'image/jpeg' || file.type === 'image/jpg' || file.type === 'image/png');

  if (shouldCompress) {
    try {
      console.log('[COMPRESSION START]');

      const compressionPromise = compressImage(file);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          console.error('[COMPRESSION TIMEOUT] - Taking too long');
          reject(new Error('Compression timeout'));
        }, 15000);
      });

      uploadFile = await Promise.race([compressionPromise, timeoutPromise]);
      const compressionTime = Date.now() - startTime;
      console.log(`[COMPRESSION DONE] ${(file.size / 1024).toFixed(0)}KB -> ${(uploadFile.size / 1024).toFixed(0)}KB in ${compressionTime}ms`);
    } catch (err) {
      console.error('[COMPRESSION FAILED]', err);
      console.log('[FALLBACK] Using original file');
      uploadFile = file;
    }
  } else {
    console.log('[SKIP COMPRESSION] File is small enough or unsupported type');
  }

  const fileExt = 'jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  console.log(`[UPLOAD START] Uploading to Supabase as ${fileName}`);
  const uploadStartTime = Date.now();

  try {
    const uploadPromise = supabase.storage
      .from('images')
      .upload(fileName, uploadFile, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/jpeg'
      });

    const uploadTimeout = new Promise<never>((_, reject) => {
      setTimeout(() => {
        console.error('[UPLOAD TIMEOUT] - Network issue or Supabase problem');
        reject(new Error('Upload timeout - check network connection'));
      }, 45000);
    });

    const { data, error } = await Promise.race([uploadPromise, uploadTimeout]);

    const uploadTime = Date.now() - uploadStartTime;
    console.log(`[UPLOAD DONE] Completed in ${uploadTime}ms`);

    if (error) {
      console.error('[UPLOAD ERROR]', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);

    console.log('[SUCCESS] URL:', publicUrl);
    return publicUrl;
  } catch (err) {
    console.error('[FATAL ERROR]', err);
    throw err instanceof Error ? err : new Error('Upload failed');
  }
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'];
  const maxSize = 10 * 1024 * 1024;

  if (!file.type.startsWith('image/')) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload an image file.'
    };
  }

  if (!validTypes.includes(file.type.toLowerCase()) && !file.type.startsWith('image/')) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload a JPG, PNG, GIF, WebP, or HEIC image.'
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File too large. Maximum size is 10MB.'
    };
  }

  return { valid: true };
}
