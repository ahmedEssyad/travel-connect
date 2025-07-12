'use client';

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

export interface PhotoUploadResult {
  url: string;
  path: string;
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
 * Uploads a photo to Firebase Storage
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

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2);
    const extension = file.name.split('.').pop();
    const filename = `${timestamp}_${randomString}.${extension}`;
    
    // Create storage path
    const storagePath = `${folder}/${userId}/${filename}`;
    const storageRef = ref(storage, storagePath);

    // Upload file
    const snapshot = await uploadBytes(storageRef, compressedFile);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return {
      url: downloadURL,
      path: storagePath,
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
 * Deletes a photo from Firebase Storage
 */
export async function deletePhoto(path: string): Promise<void> {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Photo deletion error:', error);
    throw new Error('Failed to delete photo');
  }
}

/**
 * Creates a thumbnail URL from a Firebase Storage URL
 */
export function getThumbnailUrl(url: string, size: number = 200): string {
  // This is a simple approach - in production you'd use Firebase Functions or a service
  // For now, we'll return the original URL
  // TODO: Implement actual thumbnail generation
  return url;
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