'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { apiClient } from '@/lib/api-client';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/lib/i18n';

export default function PhoneLogin() {
  const router = useRouter();
  const { login } = useAuth();
  const toast = useToast();
  const { language } = useLanguage();
  const t = (key: string) => getTranslation(language, key);
  
  const [step, setStep] = useState<'phone' | 'password' | 'code'>('phone');
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
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Format as +222 XXXX XXXX
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

    // Clean phone number (remove formatting)
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    if (cleanPhone.length < 11) {
      toast.error(t('auth.phoneInvalid'));
      return;
    }

    setLoading(true);
    try {
      // First check if user exists and has password
      const checkResponse = await apiClient.get(`/api/auth/check-user?phoneNumber=${encodeURIComponent('+' + cleanPhone)}`);
      
      if (checkResponse.ok) {
        const userData = await checkResponse.json();
        if (userData.exists && userData.hasPassword) {
          setHasPassword(true);
          setStep('password');
        } else {
          // User doesn't exist or has no password, send SMS
          const response = await apiClient.post('/api/auth/send-code', {
            phoneNumber: '+' + cleanPhone
          });

          if (response.ok) {
            setCodeSent(true);
            setStep('code');
            toast.success(t('auth.codeSent'));
          } else {
            const error = await response.text();
            toast.error(error || t('auth.loginFailed'));
          }
        }
      } else {
        // If check fails, fallback to SMS
        const response = await apiClient.post('/api/auth/send-code', {
          phoneNumber: '+' + cleanPhone
        });

        if (response.ok) {
          setCodeSent(true);
          setStep('code');
          toast.success(t('auth.codeSent'));
        } else {
          const error = await response.text();
          toast.error(error || t('auth.loginFailed'));
        }
      }
    } catch (error) {
      console.error('Phone verification error:', error);
      toast.error(t('toast.networkError'));
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
        
        // Store token and user data
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Update auth context
        await login(data.user, data.token);
        
        toast.success('Login successful!');
        
        // Redirect based on profile completeness
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
      toast.error(t('toast.networkError'));
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || verificationCode.length !== 6) return;

    // If this is password reset, validate password fields
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
        // Password reset flow
        const response = await apiClient.post('/api/auth/reset-password', {
          phoneNumber: '+' + cleanPhone,
          code: verificationCode,
          newPassword: newPassword
        });

        if (response.ok) {
          toast.success('Password reset successfully! Please login with your new password.');
          // Reset form and go back to phone step
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
        // Regular login flow
        const response = await apiClient.post('/api/auth/verify-code', {
          phoneNumber: '+' + cleanPhone,
          code: verificationCode
        });

        if (response.ok) {
          const data = await response.json();
          
          // Store token and user data
          localStorage.setItem('authToken', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          
          // Update auth context
          await login(data.user, data.token);
          
          toast.success(t('auth.loginSuccess'));
          
          // Redirect based on profile completeness
          if (data.user.isProfileComplete) {
            router.push('/');
          } else {
            // Show welcome screen for new users
            router.push('/welcome');
          }
        } else {
          const error = await response.text();
          toast.error(error || t('auth.invalidCode'));
        }
      }
    } catch (error) {
      console.error('Code verification error:', error);
      toast.error(t('toast.networkError'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const response = await apiClient.post('/api/auth/send-code', {
        phoneNumber: '+' + cleanPhone
      });

      if (response.ok) {
        toast.success(t('auth.codeSent'));
        setVerificationCode('');
      } else {
        const error = await response.text();
        toast.error(error || t('auth.loginFailed'));
      }
    } catch (error) {
      console.error('Resend code error:', error);
      toast.error(t('toast.networkError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, var(--danger) 0%, #B91C1C 100%)',
      padding: '1rem'
    }}>
      <div className="card" style={{ 
        maxWidth: '400px', 
        width: '100%', 
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: '700', 
            color: 'var(--danger)',
            marginBottom: '0.5rem'
          }}>
            🩸 mounkidh
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {step === 'phone' ? 'Enter your phone number to continue' : 
             step === 'password' ? 'Enter your password' : 
             isPasswordReset ? 'Enter code and set new password' : 'Enter verification code'}
          </p>
          {step === 'password' && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              background: 'rgba(34, 197, 94, 0.1)',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              color: 'var(--success)',
              fontWeight: '500'
            }}>
              <span>🔐</span>
              <span>No SMS costs with password login</span>
            </div>
          )}
          {step === 'code' && !isPasswordReset && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              background: 'rgba(251, 191, 36, 0.1)',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              color: 'var(--warning)',
              fontWeight: '500'
            }}>
              <span>📱</span>
              <span>SMS verification in progress</span>
            </div>
          )}
        </div>

        {step === 'phone' ? (
          <form onSubmit={handlePhoneSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: '500',
                marginBottom: '0.5rem',
                color: 'var(--text-primary)'
              }}>
                {t('auth.phone')}
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(formatPhoneInput(e.target.value))}
                placeholder="+222 XXXX XXXX"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '1rem',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  textAlign: 'center',
                  letterSpacing: '0.1em'
                }}
                required
                disabled={loading}
              />
              <div style={{ 
                fontSize: '0.75rem', 
                color: 'var(--text-muted)',
                marginTop: '0.5rem'
              }}>
                We'll send you a verification code via SMS
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem' }}
              disabled={loading || phoneNumber.length < 13}
            >
              {loading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </form>
        ) : step === 'password' ? (
          <form onSubmit={handlePasswordSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: '500',
                marginBottom: '0.5rem',
                color: 'var(--text-primary)'
              }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
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
              <div style={{ 
                fontSize: '0.75rem', 
                color: 'var(--text-muted)',
                marginTop: '0.5rem'
              }}>
                Password for {phoneNumber}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem' }}
              disabled={loading || !password}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="btn btn-outline"
                style={{ flex: 1 }}
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
                      setCodeSent(true);
                      setStep('code');
                      toast.success(t('auth.codeSent'));
                    } else {
                      const error = await response.text();
                      toast.error(error || t('auth.loginFailed'));
                    }
                  } catch (error) {
                    console.error('SMS fallback error:', error);
                    toast.error(t('toast.networkError'));
                  } finally {
                    setLoading(false);
                  }
                }}
                className="btn btn-outline"
                style={{ flex: 1 }}
                disabled={loading}
              >
                Use SMS
              </button>
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
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
                    toast.error(t('toast.networkError'));
                  } finally {
                    setLoading(false);
                  }
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '0.875rem',
                  textDecoration: 'underline',
                  cursor: 'pointer'
                }}
              >
                Forgot Password? Reset with SMS
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCodeSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: '500',
                marginBottom: '0.5rem',
                color: 'var(--text-primary)'
              }}>
                Verification Code
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '1.5rem',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  textAlign: 'center',
                  letterSpacing: '0.5em'
                }}
                maxLength={6}
                required
                disabled={loading}
              />
              <div style={{ 
                fontSize: '0.75rem', 
                color: 'var(--text-muted)',
                marginTop: '0.5rem'
              }}>
                Code sent to {phoneNumber}
              </div>
            </div>

            {isPasswordReset && (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: '500',
                    marginBottom: '0.5rem',
                    color: 'var(--text-primary)'
                  }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
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
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Confirm new password"
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
                  {newPassword && confirmNewPassword && newPassword !== confirmNewPassword && (
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: 'var(--danger)',
                      marginTop: '0.5rem'
                    }}>
                      Passwords do not match
                    </div>
                  )}
                </div>
              </>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem' }}
              disabled={loading || verificationCode.length !== 6 || (isPasswordReset && (!newPassword || !confirmNewPassword || newPassword !== confirmNewPassword))}
            >
              {loading ? (isPasswordReset ? t('common.loading') : t('common.loading')) : (isPasswordReset ? t('auth.resetPassword') : t('auth.verifyCode'))}
            </button>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="btn btn-outline"
                style={{ flex: 1 }}
                disabled={loading}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleResendCode}
                className="btn btn-outline"
                style={{ flex: 1 }}
                disabled={loading}
              >
                Resend Code
              </button>
            </div>
          </form>
        )}

        <div style={{ 
          marginTop: '2rem', 
          fontSize: '0.75rem', 
          color: 'var(--text-muted)',
          textAlign: 'center'
        }}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </div>
      </div>
    </div>
  );
}