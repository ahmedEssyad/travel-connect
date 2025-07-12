'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { apiClient } from '@/lib/api-client';

export default function PasswordWelcome() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  
  const [step, setStep] = useState<'welcome' | 'password'>('welcome');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSetPassword = async (e: React.FormEvent) => {
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
        await refreshUser();
        router.push('/');
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

  const handleSkip = () => {
    router.push('/');
  };

  if (!user) {
    return null;
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
      padding: '1rem'
    }}>
      <div className="card" style={{ 
        maxWidth: '500px', 
        width: '100%', 
        padding: '2.5rem',
        textAlign: 'center',
        background: 'white',
        borderRadius: '1rem',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}>
        {step === 'welcome' ? (
          <>
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ 
                fontSize: '4rem', 
                marginBottom: '1rem',
                background: 'linear-gradient(135deg, var(--danger) 0%, var(--primary) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                🩸
              </div>
              <h1 style={{ 
                fontSize: '2rem', 
                fontWeight: '700', 
                color: 'var(--text-primary)',
                marginBottom: '1rem'
              }}>
                Welcome to BloodConnect!
              </h1>
              <p style={{ 
                color: 'var(--text-secondary)',
                fontSize: '1.125rem',
                lineHeight: '1.6',
                marginBottom: '2rem'
              }}>
                Hi <strong>{user.name}</strong>! You're all set to save lives and connect with donors in your community.
              </p>
            </div>

            <div style={{ 
              background: 'rgba(34, 197, 94, 0.1)',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              marginBottom: '2rem',
              border: '1px solid rgba(34, 197, 94, 0.2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '1.5rem' }}>💡</span>
                <h3 style={{ 
                  fontSize: '1.125rem', 
                  fontWeight: '600',
                  color: 'var(--success)',
                  margin: 0
                }}>
                  Save SMS Costs
                </h3>
              </div>
              <p style={{ 
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                lineHeight: '1.5',
                margin: 0
              }}>
                Set up a password to avoid SMS verification costs on every login. This will make your experience faster and more convenient.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setStep('password')}
                className="btn btn-primary"
                style={{ 
                  flex: 1,
                  padding: '0.875rem 1.5rem',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
              >
                Set Password
              </button>
              <button
                onClick={handleSkip}
                className="btn btn-outline"
                style={{ 
                  flex: 1,
                  padding: '0.875rem 1.5rem',
                  fontSize: '1rem'
                }}
              >
                Skip for Now
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ 
                fontSize: '3rem', 
                marginBottom: '1rem'
              }}>
                🔐
              </div>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '600', 
                color: 'var(--text-primary)',
                marginBottom: '0.5rem'
              }}>
                Set Your Password
              </h2>
              <p style={{ 
                color: 'var(--text-secondary)', 
                fontSize: '0.875rem',
                lineHeight: '1.5'
              }}>
                Choose a secure password for faster login without SMS costs
              </p>
            </div>

            <form onSubmit={handleSetPassword}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: '500',
                  marginBottom: '0.5rem',
                  color: 'var(--text-primary)',
                  textAlign: 'left'
                }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
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
                    onClick={() => setShowPassword(!showPassword)}
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
                    padding: '0.875rem',
                    fontSize: '1rem',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    transition: 'border-color 0.2s ease'
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

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setStep('welcome')}
                  className="btn btn-outline"
                  style={{ 
                    flex: 1,
                    padding: '0.875rem 1.5rem'
                  }}
                  disabled={loading}
                >
                  Back
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
                  disabled={loading || !password || !confirmPassword || password !== confirmPassword}
                >
                  {loading ? 'Setting Password...' : 'Set Password'}
                </button>
              </div>
            </form>
          </>
        )}

        <div style={{ 
          marginTop: '2rem', 
          fontSize: '0.75rem', 
          color: 'var(--text-muted)',
          textAlign: 'center'
        }}>
          🔒 Your password is encrypted and stored securely
        </div>
      </div>
    </div>
  );
}