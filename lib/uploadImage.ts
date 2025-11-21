import { supabase } from './supabase';

async function compressImage(file: File, maxWidth: number = 1920, maxHeight: number = 1920, quality: number = 0.85): Promise<Blob> {
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

        if (width > height) {
          if (width > maxWidth) {
            height = height * (maxWidth / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = width * (maxHeight / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

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
  let uploadFile: Blob | File = file;

  if (file.size > 1024 * 1024) {
    try {
      console.log('Compressing large image...');
      uploadFile = await compressImage(file);
      console.log(`Compressed from ${(file.size / 1024 / 1024).toFixed(2)}MB to ${(uploadFile.size / 1024 / 1024).toFixed(2)}MB`);
    } catch (err) {
      console.warn('Compression failed, uploading original:', err);
      uploadFile = file;
    }
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = fileName;

  const { data, error } = await supabase.storage
    .from('images')
    .upload(filePath, uploadFile, {
      cacheControl: '3600',
      upsert: false,
      contentType: 'image/jpeg'
    });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('images')
    .getPublicUrl(filePath);

  return publicUrl;
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
