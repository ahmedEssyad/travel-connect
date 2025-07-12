'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { apiClient } from '@/lib/api-client';

interface PasswordSetupProps {
  onComplete?: () => void;
}

export default function PasswordSetup({ onComplete }: PasswordSetupProps) {
  const { user } = useAuth();
  const toast = useToast();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/api/auth/set-password', {
        password
      });

      if (response.ok) {
        toast.success('Password set successfully! You can now login without SMS.');
        if (onComplete) {
          await onComplete();
        }
      } else {
        const error = await response.text();
        toast.error(error || 'Failed to set password');
      }
    } catch (error) {
      console.error('Password setup error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="card" style={{ 
      maxWidth: '400px', 
      width: '100%', 
      padding: '2rem',
      textAlign: 'center',
      margin: '0 auto'
    }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ 
          fontSize: '1.5rem', 
          fontWeight: '600', 
          color: 'var(--text-primary)',
          marginBottom: '0.5rem'
        }}>
          Set Your Password
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Avoid SMS costs by setting a password for faster login
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ 
            display: 'block', 
            fontSize: '0.875rem', 
            fontWeight: '500',
            marginBottom: '0.5rem',
            color: 'var(--text-primary)',
            textAlign: 'left'
          }}>
            New Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={{
                width: '100%',
                padding: '0.75rem',
                paddingRight: '2.5rem',
                fontSize: '1rem',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem'
              }}
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                fontSize: '0.875rem',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ 
            display: 'block', 
            fontSize: '0.875rem', 
            fontWeight: '500',
            marginBottom: '0.5rem',
            color: 'var(--text-primary)',
            textAlign: 'left'
          }}>
            Confirm Password
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '1rem',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem'
            }}
            required
            disabled={loading}
          />
          {password && confirmPassword && password !== confirmPassword && (
            <div style={{ 
              fontSize: '0.75rem', 
              color: 'var(--danger)',
              marginTop: '0.5rem',
              textAlign: 'left'
            }}>
              Passwords do not match
            </div>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem' }}
          disabled={loading || !password || !confirmPassword || password !== confirmPassword}
        >
          {loading ? 'Setting Password...' : 'Set Password'}
        </button>

        <button
          type="button"
          onClick={onComplete}
          className="btn btn-outline"
          style={{ width: '100%', padding: '0.75rem' }}
          disabled={loading}
        >
          Skip for Now
        </button>
      </form>

      <div style={{ 
        marginTop: '1.5rem', 
        fontSize: '0.75rem', 
        color: 'var(--text-muted)',
        textAlign: 'center'
      }}>
        💡 With a password, you won't need SMS verification every time you login
      </div>
    </div>
  );
}