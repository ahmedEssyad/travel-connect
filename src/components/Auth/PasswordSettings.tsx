'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { apiClient } from '@/lib/api-client';

interface PasswordSettingsProps {
  onClose?: () => void;
}

export default function PasswordSettings({ onClose }: PasswordSettingsProps) {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  
  const [mode, setMode] = useState<'set' | 'change'>(!user?.hasPassword ? 'set' : 'change');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'set') {
        // Set password for first time
        const response = await apiClient.post('/api/auth/set-password', {
          password: newPassword
        });

        if (response.ok) {
          toast.success('Password set successfully! You can now login without SMS.');
          await refreshUser();
          onClose?.();
        } else {
          const error = await response.text();
          toast.error(error || 'Failed to set password');
        }
      } else {
        // Change existing password
        const response = await apiClient.post('/api/auth/change-password', {
          currentPassword,
          newPassword
        });

        if (response.ok) {
          toast.success('Password changed successfully!');
          await refreshUser();
          onClose?.();
        } else {
          const error = await response.text();
          toast.error(error || 'Failed to change password');
        }
      }
    } catch (error) {
      console.error('Password operation error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePassword = async () => {
    if (!confirm('Are you sure you want to remove your password? You will need SMS verification for every login.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/api/auth/remove-password', {
        currentPassword
      });

      if (response.ok) {
        toast.success('Password removed successfully. You will now use SMS for login.');
        await refreshUser();
        onClose?.();
      } else {
        const error = await response.text();
        toast.error(error || 'Failed to remove password');
      }
    } catch (error) {
      console.error('Password removal error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div style={{ 
      maxWidth: '500px', 
      width: '100%', 
      margin: '0 auto'
    }}>
      <div className="card" style={{ 
        padding: '2rem',
        background: 'white',
        borderRadius: '1rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '600', 
            color: 'var(--text-primary)',
            marginBottom: '0.5rem'
          }}>
            {mode === 'set' ? 'Set Password' : 'Change Password'}
          </h2>
          <p style={{ 
            color: 'var(--text-secondary)', 
            fontSize: '0.875rem',
            lineHeight: '1.5'
          }}>
            {mode === 'set' ? 
              'Set a password to avoid SMS verification costs and login faster.' :
              'Change your current password to keep your account secure.'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'change' && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: '500',
                marginBottom: '0.5rem',
                color: 'var(--text-primary)'
              }}>
                Current Password
              </label>
              <input
                type={showPasswords ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  fontSize: '1rem',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  transition: 'border-color 0.2s ease'
                }}
                required
                disabled={loading}
              />
            </div>
          )}

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: '500',
              marginBottom: '0.5rem',
              color: 'var(--text-primary)'
            }}>
              {mode === 'set' ? 'New Password' : 'New Password'}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPasswords ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  paddingRight: '3rem',
                  fontSize: '1rem',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  transition: 'border-color 0.2s ease'
                }}
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: '0.25rem'
                }}
              >
                {showPasswords ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: '500',
              marginBottom: '0.5rem',
              color: 'var(--text-primary)'
            }}>
              Confirm New Password
            </label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              style={{
                width: '100%',
                padding: '0.875rem',
                fontSize: '1rem',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                transition: 'border-color 0.2s ease'
              }}
              required
              disabled={loading}
            />
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <div style={{ 
                fontSize: '0.75rem', 
                color: 'var(--danger)',
                marginTop: '0.5rem'
              }}>
                Passwords do not match
              </div>
            )}
          </div>

          <div style={{ 
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '0.5rem',
            padding: '0.75rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ 
              fontSize: '0.75rem', 
              color: 'var(--primary)',
              fontWeight: '500',
              marginBottom: '0.25rem'
            }}>
              Password Requirements:
            </div>
            <ul style={{ 
              fontSize: '0.75rem', 
              color: 'var(--text-secondary)',
              margin: 0,
              paddingLeft: '1rem',
              lineHeight: '1.4'
            }}>
              <li>At least 6 characters long</li>
              <li>Use a combination of letters and numbers</li>
              <li>Keep it secure and don't share it</li>
            </ul>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              style={{ 
                flex: 1,
                padding: '0.875rem 1.5rem'
              }}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ 
                flex: 1,
                padding: '0.875rem 1.5rem',
                fontSize: '1rem',
                fontWeight: '600'
              }}
              disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword || (mode === 'change' && !currentPassword)}
            >
              {loading ? 'Saving...' : (mode === 'set' ? 'Set Password' : 'Change Password')}
            </button>
          </div>
        </form>

        {mode === 'change' && (
          <div style={{ 
            textAlign: 'center',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-light)'
          }}>
            <button
              type="button"
              onClick={handleRemovePassword}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--danger)',
                fontSize: '0.875rem',
                textDecoration: 'underline',
                cursor: 'pointer'
              }}
              disabled={loading}
            >
              Remove Password (Use SMS Only)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}