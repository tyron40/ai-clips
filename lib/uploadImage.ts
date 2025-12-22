import { supabase } from './supabase';

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      const maxDimension = 1280;
      let quality = 0.8;

      if (file.size > 5 * 1024 * 1024) {
        quality = 0.7;
        const ratio = maxDimension / Math.max(width, height);
        if (ratio < 1) {
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
      } else if (file.size > 3 * 1024 * 1024) {
        quality = 0.75;
        if (Math.max(width, height) > maxDimension) {
          const ratio = maxDimension / Math.max(width, height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { alpha: false });

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

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
}

export async function uploadImage(file: File): Promise<string> {
  console.log(`[UPLOAD START] File: ${file.name}, Type: ${file.type}, Size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
  console.log('[SUPABASE CHECK] Client initialized:', !!supabase);

  const { data: { session } } = await supabase.auth.getSession();
  console.log('[AUTH CHECK] Session exists:', !!session);

  if (!session) {
    throw new Error('Please sign in to upload images');
  }

  let uploadFile: Blob | File = file;
  let finalContentType = file.type || 'image/jpeg';
  let fileExt = 'jpg';
  const startTime = Date.now();

  if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
    console.log('[HEIC/HEIF DETECTED] Uploading without compression');
    finalContentType = 'image/heic';
    fileExt = 'heic';
  } else if (file.type === 'image/png') {
    fileExt = 'png';
    finalContentType = 'image/png';
  } else if (file.type === 'image/gif') {
    fileExt = 'gif';
    finalContentType = 'image/gif';
  } else if (file.type === 'image/webp') {
    fileExt = 'webp';
    finalContentType = 'image/webp';
  }

  const shouldCompress = file.size > 3 * 1024 * 1024 &&
    (file.type === 'image/jpeg' || file.type === 'image/jpg' || file.type === 'image/png' || file.type === 'image/webp');

  if (shouldCompress) {
    try {
      console.log('[COMPRESSION START] Optimizing large image...');

      const compressionPromise = compressImage(file);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          console.error('[COMPRESSION TIMEOUT] Using original file');
          reject(new Error('Compression timeout'));
        }, 1500);
      });

      uploadFile = await Promise.race([compressionPromise, timeoutPromise]);
      const compressionTime = Date.now() - startTime;
      const originalKB = (file.size / 1024).toFixed(0);
      const compressedKB = (uploadFile.size / 1024).toFixed(0);
      const savings = ((1 - uploadFile.size / file.size) * 100).toFixed(0);
      console.log(`[COMPRESSION SUCCESS] ${originalKB}KB → ${compressedKB}KB (${savings}% smaller) in ${compressionTime}ms`);
      fileExt = 'jpg';
      finalContentType = 'image/jpeg';
    } catch (err) {
      console.warn('[COMPRESSION SKIPPED]', err instanceof Error ? err.message : 'Unknown error');
      console.log('[USING ORIGINAL] Uploading without compression');
      uploadFile = file;
    }
  } else {
    console.log('[FAST UPLOAD] Skipping compression for optimized file size');
  }

  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  console.log(`[UPLOAD START] Uploading to Supabase as ${fileName} with type ${finalContentType}`);
  const uploadStartTime = Date.now();

  try {
    console.log('[SUPABASE] Starting upload to bucket "images"');
    console.log('[UPLOAD CONFIG]', {
      fileName,
      fileSize: uploadFile.size,
      contentType: finalContentType,
      bucketName: 'images'
    });

    const { data, error } = await supabase.storage
      .from('images')
      .upload(fileName, uploadFile, {
        cacheControl: '31536000',
        upsert: false,
        contentType: finalContentType
      });

    console.log('[SUPABASE] Upload response:', {
      hasData: !!data,
      hasError: !!error,
      errorMessage: error?.message,
      errorDetails: error
    });

    const uploadTime = Date.now() - uploadStartTime;
    console.log(`[UPLOAD DONE] Completed in ${uploadTime}ms`);

    if (error) {
      console.error('[UPLOAD ERROR] Full error:', JSON.stringify(error));

      if (error.message.includes('Invalid API key')) {
        throw new Error('Storage configuration error. Please check your Supabase setup.');
      }
      if (error.message.includes('Bucket not found')) {
        throw new Error('Storage bucket not found. Please contact support.');
      }
      if (error.message.includes('not authenticated')) {
        throw new Error('Please sign in to upload images.');
      }

      throw new Error(`Upload failed: ${error.message}`);
    }

    if (!data) {
      console.error('[UPLOAD ERROR] No data returned from Supabase');
      throw new Error('Upload failed: No data returned from storage');
    }

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);

    console.log('[SUCCESS] Public URL generated:', publicUrl);

    console.log('[SUCCESS] Upload complete, image ready at:', publicUrl);

    return publicUrl;
  } catch (err) {
    console.error('[FATAL ERROR]', err);
    console.error('[ERROR STACK]', err instanceof Error ? err.stack : 'No stack trace');
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
