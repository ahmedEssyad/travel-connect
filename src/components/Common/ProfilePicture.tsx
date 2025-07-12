'use client';

import { useState, useRef } from 'react';
import { uploadPhoto, validatePhoto, PhotoUploadResult } from '@/lib/gridfs-upload';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

interface ProfilePictureProps {
  currentPhoto?: string;
  onUpload: (photoUrl: string) => void;
  disabled?: boolean;
}

export default function ProfilePicture({ 
  currentPhoto, 
  onUpload, 
  disabled = false
}: ProfilePictureProps) {
  const { user } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!user) {
      toast.error('Please log in to upload profile picture');
      return;
    }

    // Validate file
    const error = validatePhoto(file);
    if (error) {
      toast.error(error);
      return;
    }

    setUploading(true);
    try {
      const result = await uploadPhoto(file, 'profiles', user.uid);
      onUpload(result.url);
      toast.success('Profile picture updated successfully!');
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    onUpload('');
    toast.success('Profile picture removed');
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={uploading || disabled}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Profile Picture Display */}
        <div style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          overflow: 'hidden',
          border: '3px solid var(--border)',
          background: currentPhoto ? 'transparent' : 'var(--surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}>
          {currentPhoto ? (
            <>
              <img
                src={currentPhoto}
                alt="Profile"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
              {!disabled && (
                <button
                  onClick={handleRemovePhoto}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'var(--danger)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                >
                  ×
                </button>
              )}
            </>
          ) : (
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.5rem',
              fontWeight: '600'
            }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          )}
        </div>

        {/* Upload Controls */}
        <div style={{ flex: 1 }}>
          <button
            onClick={triggerFileSelect}
            disabled={uploading || disabled}
            className="btn btn-outline"
            style={{
              width: '100%',
              marginBottom: '0.5rem',
              opacity: uploading || disabled ? '0.5' : '1',
              cursor: uploading || disabled ? 'not-allowed' : 'pointer'
            }}
          >
            {uploading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid transparent',
                  borderTop: '2px solid var(--primary)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Uploading...
              </div>
            ) : currentPhoto ? (
              'Change Picture'
            ) : (
              'Upload Picture'
            )}
          </button>
          
          <p style={{ 
            fontSize: '0.75rem', 
            color: 'var(--text-muted)', 
            margin: 0,
            textAlign: 'center'
          }}>
            JPG, PNG or WebP • Max 5MB
          </p>
        </div>
      </div>
    </div>
  );
}