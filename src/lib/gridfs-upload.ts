'use client';

import { ObjectId } from 'mongodb';

export interface PhotoUploadResult {
  url: string;
  fileId: string;
  metadata: {
    size: number;
    type: string;
    name: string;
  };
}

export interface PhotoUploadOptions {
  maxSize?: number; // in bytes, default 5MB
  allowedTypes?: string[]; // default: ['image/jpeg', 'image/png', 'image/webp']
  quality?: number; // compression quality 0-1, default 0.8
}

const DEFAULT_OPTIONS: Required<PhotoUploadOptions> = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  quality: 0.8
};

/**
 * Validates a file before upload
 */
export function validatePhoto(file: File, options: PhotoUploadOptions = {}): string | null {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (file.size > opts.maxSize) {
    return `File size must be less than ${Math.round(opts.maxSize / 1024 / 1024)}MB`;
  }

  if (!opts.allowedTypes.includes(file.type)) {
    return `File type must be one of: ${opts.allowedTypes.join(', ')}`;
  }

  return null;
}

/**
 * Compresses an image file
 */
export function compressImage(file: File, quality: number = 0.8): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions (max 1200px width)
      const maxWidth = 1200;
      const scale = Math.min(1, maxWidth / img.width);
      
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      // Draw and compress
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob(
        (blob) => {
          const compressedFile = new File([blob!], file.name, {
            type: file.type,
            lastModified: Date.now()
          });
          resolve(compressedFile);
        },
        file.type,
        quality
      );
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Uploads a photo to MongoDB GridFS
 */
export async function uploadPhoto(
  file: File,
  folder: 'profiles' | 'trips' | 'requests' | 'items',
  userId: string,
  options: PhotoUploadOptions = {}
): Promise<PhotoUploadResult> {
  try {
    // Validate file
    const validationError = validatePhoto(file, options);
    if (validationError) {
      throw new Error(validationError);
    }

    // Compress image
    const compressedFile = await compressImage(file, options.quality);

    // Convert file to base64 for upload
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(compressedFile);
    });

    // Upload to GridFS via API
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file: base64,
        folder,
        userId,
        filename: file.name,
        mimeType: file.type
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Upload failed');
    }

    const result = await response.json();
    
    return {
      url: result.url,
      fileId: result.fileId,
      metadata: {
        size: compressedFile.size,
        type: compressedFile.type,
        name: compressedFile.name
      }
    };
  } catch (error) {
    console.error('Photo upload error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to upload photo');
  }
}

/**
 * Deletes a photo from MongoDB GridFS
 */
export async function deletePhoto(fileId: string): Promise<void> {
  try {
    const response = await fetch(`/api/upload/${fileId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to delete photo');
    }
  } catch (error) {
    console.error('Photo deletion error:', error);
    throw new Error('Failed to delete photo');
  }
}

/**
 * Creates a thumbnail URL from a GridFS file ID
 */
export function getThumbnailUrl(fileId: string, size: number = 200): string {
  return `/api/files/${fileId}?thumbnail=${size}`;
}

/**
 * Multiple photo upload with progress tracking
 */
export async function uploadMultiplePhotos(
  files: File[],
  folder: 'profiles' | 'trips' | 'requests' | 'items',
  userId: string,
  onProgress?: (progress: number, fileIndex: number) => void,
  options: PhotoUploadOptions = {}
): Promise<PhotoUploadResult[]> {
  const results: PhotoUploadResult[] = [];
  
  for (let i = 0; i < files.length; i++) {
    try {
      onProgress?.(0, i);
      const result = await uploadPhoto(files[i], folder, userId, options);
      results.push(result);
      onProgress?.(100, i);
    } catch (error) {
      console.error(`Failed to upload file ${i + 1}:`, error);
      throw error;
    }
  }

  return results;
}