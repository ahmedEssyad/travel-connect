'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiClient } from '@/lib/api-client';
import BloodTypeSelector from '@/components/Profile/BloodTypeSelector';
import PasswordSetup from '@/components/Auth/PasswordSetup';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();
  const toast = useToast();
  const { t, isRTL } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<boolean | 'password'>(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bloodType: '',
    medicalInfo: {
      weight: 0,
      age: 0,
      availableForDonation: false,
      isDonor: false,
      medicalConditions: []
    },
    emergencyContacts: []
  });

  // Load user data when component mounts
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        bloodType: user.bloodType || '',
        medicalInfo: {
          weight: user.medicalInfo?.weight || 0,
          age: user.medicalInfo?.age || 0,
          availableForDonation: user.medicalInfo?.availableForDonation || false,
          isDonor: user.medicalInfo?.isDonor || false,
          medicalConditions: user.medicalInfo?.medicalConditions || []
        },
        emergencyContacts: user.emergencyContacts || []
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    if (!formData.name.trim()) {
      toast.error(t('profile.nameRequired'));
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.put('/api/auth/profile', formData);
      
      if (response.ok) {
        await refreshUser();
        setEditing(false);
        toast.success(t('profile.profileUpdatedSuccessfully'));
      } else {
        const error = await response.text();
        toast.error(error || t('profile.failedToUpdateProfile'));
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(t('profile.networkError'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        bloodType: user.bloodType || '',
        medicalInfo: {
          weight: user.medicalInfo?.weight || 0,
          age: user.medicalInfo?.age || 0,
          availableForDonation: user.medicalInfo?.availableForDonation || false,
          isDonor: user.medicalInfo?.isDonor || false,
          medicalConditions: user.medicalInfo?.medicalConditions || []
        },
        emergencyContacts: user.emergencyContacts || []
      });
    }
    setEditing(false);
  };

  if (!user) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--surface)',
        direction: isRTL ? 'rtl' : 'ltr'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: '600', color: 'var(--text-muted)' }}>
            {t('auth.accessRestricted')}
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>{t('profile.pleaseLoginToViewProfile')}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--surface)',
      padding: '1rem',
      direction: isRTL ? 'rtl' : 'ltr'
    }}>
      <div style={{ 
        maxWidth: '600px', 
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <h1 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '700',
            color: 'var(--text-primary)',
            margin: '0'
          }}>
            {t('profile.title')}
          </h1>
          <button
            onClick={logout}
            className="btn btn-outline"
            style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
          >
            {t('profile.logout')}
          </button>
        </div>

        {/* Profile Card */}
        <div className="card" style={{ 
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          {/* Profile Header */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'var(--danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.5rem',
              fontWeight: '600'
            }}>
              {user.name ? user.name.charAt(0).toUpperCase() : '?'}
            </div>
            <div>
              <h2 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '600',
                color: 'var(--text-primary)',
                margin: '0 0 0.25rem 0'
              }}>
                {user.name || t('profile.completeYourProfile')}
              </h2>
              <p style={{ 
                color: 'var(--text-secondary)',
                margin: '0',
                fontSize: '0.875rem'
              }}>
                {user.phoneNumber}
              </p>
            </div>
          </div>

          {!editing ? (
            // Display Mode
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Basic Info */}
                <div>
                  <h3 style={{ 
                    fontSize: '1rem', 
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '1rem'
                  }}>
                    {t('profile.basicInformation')}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: '500',
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        {t('profile.name')}
                      </label>
                      <div style={{ 
                        fontSize: '1rem',
                        color: 'var(--text-primary)',
                        fontWeight: '500'
                      }}>
                        {user.name || t('profile.notSet')}
                      </div>
                    </div>
                    <div>
                      <label style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: '500',
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        {t('profile.bloodType')}
                      </label>
                      <div style={{ 
                        fontSize: '1rem',
                        color: user.bloodType ? 'var(--danger)' : 'var(--text-muted)',
                        fontWeight: '600'
                      }}>
                        {user.bloodType || t('profile.notSet')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Medical Info */}
                {user.medicalInfo && (user.medicalInfo.age || user.medicalInfo.weight || user.medicalInfo.isDonor) && (
                  <div>
                    <h3 style={{ 
                      fontSize: '1rem', 
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                      marginBottom: '1rem'
                    }}>
                      {t('profile.medicalInformation')}
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: '500',
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          {t('profile.age')}
                        </label>
                        <div style={{ 
                          fontSize: '1rem',
                          color: 'var(--text-primary)',
                          fontWeight: '500'
                        }}>
                          {user.medicalInfo.age || t('profile.notSet')}
                        </div>
                      </div>
                      <div>
                        <label style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: '500',
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          {t('profile.weight')}
                        </label>
                        <div style={{ 
                          fontSize: '1rem',
                          color: 'var(--text-primary)',
                          fontWeight: '500'
                        }}>
                          {user.medicalInfo.weight ? `${user.medicalInfo.weight} kg` : t('profile.notSet')}
                        </div>
                      </div>
                    </div>
                    {user.medicalInfo.isDonor && (
                      <div style={{ 
                        marginTop: '1rem',
                        padding: '0.75rem',
                        background: 'rgba(34, 197, 94, 0.1)',
                        borderRadius: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <span style={{ fontSize: '1.25rem' }}>🩸</span>
                        <span style={{ 
                          color: 'var(--success)',
                          fontWeight: '500'
                        }}>
                          {t('profile.bloodDonor')}
                          {user.medicalInfo.availableForDonation && ` • ${t('profile.currentlyAvailable')}`}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Notification Settings Quick Access */}
                <div>
                  <h3 style={{ 
                    fontSize: '1rem', 
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '1rem'
                  }}>
                    {t('profile.notifications')}
                  </h3>
                  <div style={{ 
                    padding: '0.75rem',
                    background: user.notificationPreferences?.sms ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '0.5rem',
                    border: `1px solid ${user.notificationPreferences?.sms ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.25rem' }}>
                        {user.notificationPreferences?.sms ? '📱' : '🔕'}
                      </span>
                      <div>
                        <div style={{ 
                          fontWeight: '500',
                          color: 'var(--text-primary)',
                          fontSize: '0.9rem'
                        }}>
                          {t('profile.smsNotifications')}
                        </div>
                        <div style={{ 
                          fontSize: '0.8rem',
                          color: user.notificationPreferences?.sms ? 'var(--success)' : 'var(--danger)'
                        }}>
                          {user.notificationPreferences?.sms ? t('profile.enabled') : t('profile.disabled')} • 
                          {user.notificationPreferences?.urgencyLevels?.length || 0} {t('profile.urgencyLevels')}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => router.push('/settings/notifications')}
                      style={{
                        background: 'none',
                        border: '1px solid var(--border)',
                        borderRadius: '0.375rem',
                        padding: '0.375rem 0.75rem',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        color: 'var(--text-primary)'
                      }}
                    >
                      {t('profile.manage')}
                    </button>
                  </div>
                </div>

                {/* Emergency Contacts */}
                {user.emergencyContacts && user.emergencyContacts.length > 0 && (
                  <div>
                    <h3 style={{ 
                      fontSize: '1rem', 
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                      marginBottom: '1rem'
                    }}>
                      {t('profile.emergencyContacts')}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {user.emergencyContacts.map((contact, index) => (
                        <div key={index} style={{ 
                          padding: '0.75rem',
                          background: 'rgba(239, 68, 68, 0.05)',
                          borderRadius: '0.5rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div>
                            <div style={{ 
                              fontWeight: '500',
                              color: 'var(--text-primary)'
                            }}>
                              {contact.name}
                            </div>
                            <div style={{ 
                              fontSize: '0.875rem',
                              color: 'var(--text-secondary)'
                            }}>
                              {contact.relationship} • {contact.phone}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setEditing(true)}
                className="btn btn-primary"
                style={{ 
                  width: '100%',
                  marginTop: '2rem',
                  padding: '0.75rem'
                }}
              >
                {t('profile.editProfile')}
              </button>

              {/* Password Setup */}
              {!user.hasPassword && (
                <div style={{ 
                  marginTop: '1.5rem', 
                  padding: '1rem',
                  background: 'rgba(34, 197, 94, 0.1)',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(34, 197, 94, 0.2)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>💡</span>
                    <span style={{ fontWeight: '600', color: 'var(--success)' }}>
                      {t('profile.setPasswordToSaveCosts')}
                    </span>
                  </div>
                  <p style={{ 
                    fontSize: '0.875rem', 
                    color: 'var(--text-secondary)',
                    marginBottom: '1rem'
                  }}>
                    {t('profile.setPasswordDesc')}
                  </p>
                  <button
                    onClick={() => setEditing('password')}
                    className="btn btn-success"
                    style={{ 
                      width: '100%',
                      padding: '0.75rem',
                      background: 'var(--success)',
                      color: 'white'
                    }}
                  >
                    {t('profile.setPassword')}
                  </button>
                </div>
              )}
            </div>
          ) : editing === 'password' ? (
            // Password Setup Mode
            <PasswordSetup 
              onComplete={async () => {
                setEditing(false);
                await refreshUser();
              }}
            />
          ) : (
            // Edit Mode
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Basic Info */}
                <div>
                  <h3 style={{ 
                    fontSize: '1rem', 
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '1rem'
                  }}>
                    {t('profile.basicInformation')}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ 
                        display: 'block',
                        fontSize: '0.875rem', 
                        fontWeight: '500',
                        color: 'var(--text-primary)',
                        marginBottom: '0.5rem'
                      }}>
                        {t('profile.name')} *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder={t('profile.enterYourFullName')}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid var(--border)',
                          borderRadius: '0.5rem',
                          fontSize: '1rem'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ 
                        display: 'block',
                        fontSize: '0.875rem', 
                        fontWeight: '500',
                        color: 'var(--text-primary)',
                        marginBottom: '0.5rem'
                      }}>
                        {t('profile.emailOptional')}
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder={t('profile.enterYourEmail')}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid var(--border)',
                          borderRadius: '0.5rem',
                          fontSize: '1rem'
                        }}
                      />
                    </div>
                    <div>
                      <BloodTypeSelector
                        value={formData.bloodType}
                        onChange={(bloodType) => setFormData(prev => ({ ...prev, bloodType }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Medical Info */}
                <div>
                  <h3 style={{ 
                    fontSize: '1rem', 
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '1rem'
                  }}>
                    Medical Information
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ 
                        display: 'block',
                        fontSize: '0.875rem', 
                        fontWeight: '500',
                        color: 'var(--text-primary)',
                        marginBottom: '0.5rem'
                      }}>
                        Age
                      </label>
                      <input
                        type="number"
                        value={formData.medicalInfo.age || ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          medicalInfo: { ...prev.medicalInfo, age: parseInt(e.target.value) || 0 }
                        }))}
                        placeholder="25"
                        min="16"
                        max="65"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid var(--border)',
                          borderRadius: '0.5rem',
                          fontSize: '1rem'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ 
                        display: 'block',
                        fontSize: '0.875rem', 
                        fontWeight: '500',
                        color: 'var(--text-primary)',
                        marginBottom: '0.5rem'
                      }}>
                        {t('profile.weightKg')}
                      </label>
                      <input
                        type="number"
                        value={formData.medicalInfo.weight || ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          medicalInfo: { ...prev.medicalInfo, weight: parseInt(e.target.value) || 0 }
                        }))}
                        placeholder="70"
                        min="50"
                        max="200"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid var(--border)',
                          borderRadius: '0.5rem',
                          fontSize: '1rem'
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: 'var(--text-primary)',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={formData.medicalInfo.isDonor}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          medicalInfo: { ...prev.medicalInfo, isDonor: e.target.checked }
                        }))}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--danger)' }}
                      />
                      {t('profile.wantToBeBloodDonor')}
                    </label>
                    {formData.medicalInfo.isDonor && (
                      <label style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: 'var(--success)',
                        cursor: 'pointer',
                        marginLeft: '1.5rem'
                      }}>
                        <input
                          type="checkbox"
                          checked={formData.medicalInfo.availableForDonation}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            medicalInfo: { ...prev.medicalInfo, availableForDonation: e.target.checked }
                          }))}
                          style={{ width: '18px', height: '18px', accentColor: 'var(--success)' }}
                        />
                        {t('profile.currentlyAvailableForDonation')}
                      </label>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                gap: '1rem',
                marginTop: '2rem'
              }}>
                <button
                  onClick={handleCancel}
                  className="btn btn-outline"
                  style={{ 
                    flex: 1,
                    padding: '0.75rem'
                  }}
                  disabled={loading}
                >
                  {t('profile.cancel')}
                </button>
                <button
                  onClick={handleSave}
                  className="btn btn-primary"
                  style={{ 
                    flex: 1,
                    padding: '0.75rem'
                  }}
                  disabled={loading}
                >
                  {loading ? t('profile.saving') : t('profile.save')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ 
            fontSize: '1.125rem', 
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: '1rem'
          }}>
            {t('profile.settings')}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              onClick={() => router.push('/settings/notifications')}
              className="btn btn-outline"
              style={{ 
                width: '100%',
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                justifyContent: 'flex-start'
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>📱</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: '500' }}>{t('profile.notificationSettings')}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {user.notificationPreferences?.sms ? t('profile.smsEnabledManageAlerts') : t('profile.smsDisabledManageAlerts')}
                </div>
              </div>
            </button>
            <button
              onClick={() => router.push('/settings/auth')}
              className="btn btn-outline"
              style={{ 
                width: '100%',
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                justifyContent: 'flex-start'
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>🔐</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: '500' }}>{t('profile.authenticationSettings')}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {user.hasPassword ? t('profile.passwordAndSms') : t('profile.smsOnlySetPassword')}
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <button
            onClick={() => router.push('/blood-requests')}
            className="btn btn-outline"
            style={{ 
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>🩸</span>
            <span>{t('profile.bloodRequests')}</span>
          </button>
          <button
            onClick={() => router.push('/request-blood')}
            className="btn btn-danger"
            style={{ 
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'var(--danger)',
              color: 'white'
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>🚨</span>
            <span>{t('profile.emergencyRequest')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}