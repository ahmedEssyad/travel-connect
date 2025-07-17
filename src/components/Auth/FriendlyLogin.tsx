'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { apiClient } from '@/lib/api-client';

export default function FriendlyLogin() {
  const router = useRouter();
  const { login } = useAuth();
  const toast = useToast();
  
  const [step, setStep] = useState<'welcome' | 'phone' | 'password' | 'code'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const formatPhoneInput = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) {
      return '+222 ' + digits;
    } else if (digits.length <= 7) {
      return '+222 ' + digits.slice(3, 7);
    } else {
      return '+222 ' + digits.slice(3, 7) + ' ' + digits.slice(7, 11);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    if (cleanPhone.length < 11) {
      toast.error('Please enter a valid Mauritanian phone number');
      return;
    }

    setLoading(true);
    try {
      const checkResponse = await apiClient.get(`/api/auth/check-user?phoneNumber=${encodeURIComponent('+' + cleanPhone)}`);
      
      if (checkResponse.ok) {
        const userData = await checkResponse.json();
        if (userData.exists && userData.hasPassword) {
          setHasPassword(true);
          setStep('password');
        } else {
          const response = await apiClient.post('/api/auth/send-code', {
            phoneNumber: '+' + cleanPhone
          });

          if (response.ok) {
            setCodeSent(true);
            setStep('code');
            toast.success('Verification code sent to your phone');
          } else {
            const error = await response.text();
            toast.error(error || 'Failed to send verification code');
          }
        }
      } else {
        const response = await apiClient.post('/api/auth/send-code', {
          phoneNumber: '+' + cleanPhone
        });

        if (response.ok) {
          setCodeSent(true);
          setStep('code');
          toast.success('Verification code sent to your phone');
        } else {
          const error = await response.text();
          toast.error(error || 'Failed to send verification code');
        }
      }
    } catch (error) {
      console.error('Phone verification error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !password) return;

    setLoading(true);
    try {
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const response = await apiClient.post('/api/auth/login', {
        phoneNumber: '+' + cleanPhone,
        password: password
      });

      if (response.ok) {
        const data = await response.json();
        
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        await login(data.user, data.token);
        
        toast.success('Welcome back!');
        
        if (data.user.isProfileComplete) {
          router.push('/');
        } else {
          router.push('/welcome');
        }
      } else {
        const error = await response.text();
        toast.error(error || 'Invalid password');
      }
    } catch (error) {
      console.error('Password login error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || verificationCode.length !== 6) return;

    if (isPasswordReset) {
      if (!newPassword || !confirmNewPassword) {
        toast.error('Please enter and confirm your new password');
        return;
      }
      if (newPassword !== confirmNewPassword) {
        toast.error('Passwords do not match');
        return;
      }
      if (newPassword.length < 6) {
        toast.error('Password must be at least 6 characters long');
        return;
      }
    }

    setLoading(true);
    try {
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      
      if (isPasswordReset) {
        const response = await apiClient.post('/api/auth/reset-password', {
          phoneNumber: '+' + cleanPhone,
          code: verificationCode,
          newPassword: newPassword
        });

        if (response.ok) {
          toast.success('Password reset successfully! Please login with your new password.');
          setStep('phone');
          setIsPasswordReset(false);
          setVerificationCode('');
          setNewPassword('');
          setConfirmNewPassword('');
          setPhoneNumber('');
        } else {
          const error = await response.text();
          toast.error(error || 'Failed to reset password');
        }
      } else {
        const response = await apiClient.post('/api/auth/verify-code', {
          phoneNumber: '+' + cleanPhone,
          code: verificationCode
        });

        if (response.ok) {
          const data = await response.json();
          
          localStorage.setItem('authToken', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          
          await login(data.user, data.token);
          
          toast.success('Welcome to mounkidh!');
          
          if (data.user.isProfileComplete) {
            router.push('/');
          } else {
            router.push('/welcome');
          }
        } else {
          const error = await response.text();
          toast.error(error || 'Invalid verification code');
        }
      }
    } catch (error) {
      console.error('Code verification error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #DC2626 0%, #EF4444 50%, #F87171 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      {step === 'welcome' ? (
        // Welcome Screen
        <div style={{ 
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '2rem',
          color: 'white',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{
            fontSize: '5rem',
            marginBottom: '2rem',
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
            animation: 'pulse 2s infinite'
          }}>
            🩸
          </div>
          
          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: '800', 
            marginBottom: '1rem',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            background: 'linear-gradient(45deg, #ffffff, #fecaca)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            mounkidh
          </h1>
          
          <p style={{ 
            fontSize: '1.25rem',
            marginBottom: '3rem',
            opacity: 0.9,
            fontWeight: '500',
            textShadow: '0 1px 2px rgba(0,0,0,0.2)',
            maxWidth: '600px',
            lineHeight: '1.6'
          }}>
            Join thousands of life-savers across Mauritania. Every donation matters, every moment counts.
          </p>

          {/* Features */}
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginBottom: '3rem',
            maxWidth: '800px',
            width: '100%'
          }}>
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '1rem',
              padding: '1.5rem',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🚨</div>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Emergency Requests</h3>
              <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>Create and respond to urgent blood requests</p>
            </div>
            
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '1rem',
              padding: '1.5rem',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏥</div>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Hospital Network</h3>
              <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>Connected with hospitals across Mauritania</p>
            </div>
            
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '1rem',
              padding: '1.5rem',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Real-time Chat</h3>
              <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>Direct communication with donors</p>
            </div>
          </div>

          <button
            onClick={() => setStep('phone')}
            style={{
              background: 'white',
              color: '#DC2626',
              border: 'none',
              borderRadius: '2rem',
              padding: '1rem 3rem',
              fontSize: '1.125rem',
              fontWeight: '600',
              cursor: 'pointer',
              transform: 'translateY(0)',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
              minWidth: '200px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)';
            }}
          >
            Get Started
          </button>

          <p style={{ 
            fontSize: '0.875rem',
            marginTop: '2rem',
            opacity: 0.7
          }}>
            Already have an account? Just enter your phone number above
          </p>
        </div>
      ) : (
        // Login Forms
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          position: 'relative',
          zIndex: 1
        }}>
          <div className="card" style={{ 
            maxWidth: '420px', 
            width: '100%', 
            padding: '2.5rem',
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '1.5rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            {/* Back to Welcome Button */}
            <button
              onClick={() => setStep('welcome')}
              style={{
                position: 'absolute',
                top: '1rem',
                left: '1rem',
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: '0.5rem'
              }}
            >
              ←
            </button>

            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🩸</div>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '600', 
                color: 'var(--text-primary)',
                marginBottom: '0.5rem'
              }}>
                {step === 'phone' ? 'Login to mounkidh' : 
                 step === 'password' ? 'Enter Password' : 
                 isPasswordReset ? 'Reset Password' : 'Verify Phone'}
              </h2>
              <p style={{ 
                color: 'var(--text-secondary)',
                fontSize: '0.875rem'
              }}>
                {step === 'phone' ? 'Enter your phone number to access your account' : 
                 step === 'password' ? 'Welcome back! Enter your password' : 
                 isPasswordReset ? 'Enter code and new password' : 'Enter the 6-digit code'}
              </p>
            </div>

            {/* Forms */}
            {step === 'phone' && (
              <form onSubmit={handlePhoneSubmit}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(formatPhoneInput(e.target.value))}
                    placeholder="+222 XXXX XXXX"
                    style={{
                      width: '100%',
                      padding: '1rem',
                      fontSize: '1.125rem',
                      border: '2px solid var(--border)',
                      borderRadius: '0.75rem',
                      textAlign: 'center',
                      letterSpacing: '0.1em',
                      transition: 'border-color 0.3s ease'
                    }}
                    required
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ 
                    width: '100%', 
                    padding: '1rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    borderRadius: '0.75rem',
                    marginBottom: '1rem'
                  }}
                  disabled={loading || phoneNumber.length < 13}
                >
                  {loading ? 'Checking...' : 'Continue'}
                </button>

                <div style={{ textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setStep('welcome')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      fontSize: '0.875rem',
                      textDecoration: 'underline',
                      cursor: 'pointer'
                    }}
                  >
                    New to mounkidh? Learn more
                  </button>
                </div>
              </form>
            )}

            {step === 'password' && (
              <form onSubmit={handlePasswordSubmit}>
                <div style={{ 
                  background: 'rgba(34, 197, 94, 0.1)',
                  padding: '0.75rem',
                  borderRadius: '0.75rem',
                  marginBottom: '1.5rem',
                  border: '1px solid rgba(34, 197, 94, 0.2)'
                }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--success)', fontWeight: '500' }}>
                    💡 Password login - no SMS costs!
                  </span>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    style={{
                      width: '100%',
                      padding: '1rem',
                      fontSize: '1rem',
                      border: '2px solid var(--border)',
                      borderRadius: '0.75rem'
                    }}
                    required
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ 
                    width: '100%', 
                    padding: '1rem',
                    marginBottom: '1rem',
                    borderRadius: '0.75rem'
                  }}
                  disabled={loading || !password}
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setStep('phone')}
                    className="btn btn-outline"
                    style={{ flex: 1, padding: '0.75rem' }}
                    disabled={loading}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setLoading(true);
                      try {
                        const cleanPhone = phoneNumber.replace(/\D/g, '');
                        const response = await apiClient.post('/api/auth/send-code', {
                          phoneNumber: '+' + cleanPhone
                        });

                        if (response.ok) {
                          setIsPasswordReset(true);
                          setStep('code');
                          setCodeSent(true);
                          toast.success('Reset code sent to your phone');
                        } else {
                          const error = await response.text();
                          toast.error(error || 'Failed to send reset code');
                        }
                      } catch (error) {
                        console.error('Password reset error:', error);
                        toast.error('Network error. Please try again.');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="btn btn-outline"
                    style={{ flex: 1, padding: '0.75rem' }}
                    disabled={loading}
                  >
                    Reset
                  </button>
                </div>
              </form>
            )}

            {step === 'code' && (
              <form onSubmit={handleCodeSubmit}>
                <div style={{ 
                  background: 'rgba(59, 130, 246, 0.1)',
                  padding: '0.75rem',
                  borderRadius: '0.75rem',
                  marginBottom: '1.5rem',
                  border: '1px solid rgba(59, 130, 246, 0.2)'
                }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--primary)', fontWeight: '500' }}>
                    📱 Code sent to {phoneNumber}
                  </span>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    style={{
                      width: '100%',
                      padding: '1rem',
                      fontSize: '1.5rem',
                      border: '2px solid var(--border)',
                      borderRadius: '0.75rem',
                      textAlign: 'center',
                      letterSpacing: '0.5em'
                    }}
                    maxLength={6}
                    required
                    disabled={loading}
                  />
                </div>

                {isPasswordReset && (
                  <>
                    <div style={{ marginBottom: '1rem' }}>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New password"
                        style={{
                          width: '100%',
                          padding: '1rem',
                          fontSize: '1rem',
                          border: '2px solid var(--border)',
                          borderRadius: '0.75rem'
                        }}
                        required
                        disabled={loading}
                      />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                      <input
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Confirm new password"
                        style={{
                          width: '100%',
                          padding: '1rem',
                          fontSize: '1rem',
                          border: '2px solid var(--border)',
                          borderRadius: '0.75rem'
                        }}
                        required
                        disabled={loading}
                      />
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ 
                    width: '100%', 
                    padding: '1rem',
                    marginBottom: '1rem',
                    borderRadius: '0.75rem'
                  }}
                  disabled={loading || verificationCode.length !== 6 || (isPasswordReset && (!newPassword || !confirmNewPassword || newPassword !== confirmNewPassword))}
                >
                  {loading ? (isPasswordReset ? 'Resetting...' : 'Verifying...') : (isPasswordReset ? 'Reset Password' : 'Verify')}
                </button>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setStep('phone')}
                    className="btn btn-outline"
                    style={{ flex: 1, padding: '0.75rem' }}
                    disabled={loading}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setLoading(true);
                      try {
                        const cleanPhone = phoneNumber.replace(/\D/g, '');
                        const response = await apiClient.post('/api/auth/send-code', {
                          phoneNumber: '+' + cleanPhone
                        });

                        if (response.ok) {
                          toast.success('New code sent');
                          setVerificationCode('');
                        } else {
                          const error = await response.text();
                          toast.error(error || 'Failed to resend code');
                        }
                      } catch (error) {
                        console.error('Resend code error:', error);
                        toast.error('Network error. Please try again.');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="btn btn-outline"
                    style={{ flex: 1, padding: '0.75rem' }}
                    disabled={loading}
                  >
                    Resend
                  </button>
                </div>
              </form>
            )}

            {/* Development Helper */}
            {process.env.NODE_ENV === 'development' && step === 'code' && !isPasswordReset && (
              <div style={{ 
                marginTop: '2rem',
                padding: '1rem',
                background: 'rgba(168, 85, 247, 0.1)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: 'var(--text-muted)'
              }}>
                💻 Dev mode: Use code <strong>123456</strong> for testing
              </div>
            )}
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}