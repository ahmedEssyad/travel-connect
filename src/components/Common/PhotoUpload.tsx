'use client';

import { useState, useRef } from 'react';
import { uploadPhoto, uploadMultiplePhotos, validatePhoto, PhotoUploadResult } from '@/lib/gridfs-upload';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

interface PhotoUploadProps {
  folder: 'profiles' | 'trips' | 'requests' | 'items';
  onUpload: (results: PhotoUploadResult[]) => void;
  maxFiles?: number;
  currentPhotos?: string[];
  disabled?: boolean;
  className?: string;
}

export default function PhotoUpload({ 
  folder, 
  onUpload, 
  maxFiles = 1, 
  currentPhotos = [],
  disabled = false,
  className = ''
}: PhotoUploadProps) {
  const { user } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: number]: number }>({});

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    if (!user) {
      toast.error('Please log in to upload photos');
      return;
    }

    // Check file limit
    if (currentPhotos.length + files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} photos allowed`);
      return;
    }

    // Validate all files first
    for (const file of files) {
      const error = validatePhoto(file);
      if (error) {
        toast.error(error);
        return;
      }
    }

    setUploading(true);
    try {
      const results = await uploadMultiplePhotos(
        files,
        folder,
        user.uid,
        (progress, fileIndex) => {
          setUploadProgress(prev => ({
            ...prev,
            [fileIndex]: progress
          }));
        }
      );

      onUpload(results);
      toast.success(`${files.length} photo(s) uploaded successfully!`);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload photos');
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  const handleRemovePhoto = (photoUrl: string) => {
    const updatedPhotos = currentPhotos.filter(url => url !== photoUrl);
    // Note: We're not deleting from storage here for safety
    // In production, you might want to mark for deletion and clean up later
    onUpload(updatedPhotos.map(url => ({ url, fileId: '', metadata: { size: 0, type: '', name: '' } })));
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const canAddMore = currentPhotos.length < maxFiles && !disabled;

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={maxFiles > 1}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={uploading || disabled}
      />

      {/* Current Photos */}
      {currentPhotos.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
            gap: '0.75rem' 
          }}>
            {currentPhotos.map((photoUrl, index) => (
              <div key={index} style={{ position: 'relative' }}>
                <div style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '0.5rem',
                  overflow: 'hidden',
                  border: '1px solid var(--border)',
                  position: 'relative'
                }}>
                  <img
                    src={photoUrl}
                    alt={`Photo ${index + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  {!disabled && (
                    <button
                      onClick={() => handleRemovePhoto(photoUrl)}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'var(--danger)',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Area */}
      {canAddMore && (
        <div>
          <button
            onClick={triggerFileSelect}
            disabled={uploading}
            className="btn btn-outline"
            style={{
              width: '100%',
              padding: '1.5rem',
              border: '2px dashed var(--border)',
              background: 'var(--surface)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
              opacity: uploading ? '0.5' : '1',
              cursor: uploading ? 'not-allowed' : 'pointer'
            }}
          >
            {uploading ? (
              <>
                <div style={{
                  width: '32px',
                  height: '32px',
                  border: '2px solid transparent',
                  borderTop: '2px solid var(--primary)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <span style={{ fontSize: '0.875rem' }}>Uploading...</span>
              </>
            ) : (
              <>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '1.5rem',
                  fontWeight: '600'
                }}>
                  +
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                  {maxFiles === 1 ? 'Upload Photo' : `Upload Photos (${currentPhotos.length}/${maxFiles})`}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  JPG, PNG or WebP • Max 5MB
                </span>
              </>
            )}
          </button>

          {/* Upload Progress */}
          {uploading && Object.keys(uploadProgress).length > 0 && (
            <div style={{ marginTop: '0.75rem' }}>
              {Object.entries(uploadProgress).map(([fileIndex, progress]) => (
                <div key={fileIndex} style={{ marginBottom: '0.5rem' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '0.25rem'
                  }}>
                    <span>File {parseInt(fileIndex) + 1}</span>
                    <span>{progress}%</span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '4px',
                    background: 'var(--border)',
                    borderRadius: '2px',
                    overflow: 'hidden'
                  }}>
                    <div
                      style={{
                        width: `${progress}%`,
                        height: '100%',
                        background: 'var(--primary)',
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Info Text */}
      {maxFiles > 1 && (
        <p style={{ 
          fontSize: '0.75rem', 
          color: 'var(--text-muted)', 
          marginTop: '0.5rem',
          textAlign: 'center'
        }}>
          You can upload up to {maxFiles} photos
        </p>
      )}
    </div>
  );
}