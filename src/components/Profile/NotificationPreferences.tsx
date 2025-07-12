'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { apiClient } from '@/lib/api-client';

interface NotificationPreferencesProps {
  user: any;
  onUpdate?: () => void;
}

export default function NotificationPreferences({ user, onUpdate }: NotificationPreferencesProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    sms: false,
    push: true,
    email: false,
    urgencyLevels: ['critical', 'urgent'] as string[]
  });

  // Load current preferences
  useEffect(() => {
    if (user?.notificationPreferences) {
      setPreferences({
        sms: user.notificationPreferences.sms || false,
        push: user.notificationPreferences.push || true,
        email: user.notificationPreferences.email || false,
        urgencyLevels: user.notificationPreferences.urgencyLevels || ['critical', 'urgent']
      });
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await apiClient.put('/api/auth/profile', {
        notificationPreferences: preferences
      });
      
      if (response.ok) {
        toast.success('Notification preferences updated!');
        onUpdate?.();
      } else {
        const error = await response.text();
        toast.error(error || 'Failed to update preferences');
      }
    } catch (error) {
      console.error('Notification preferences update error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleUrgencyLevel = (level: string) => {
    setPreferences(prev => ({
      ...prev,
      urgencyLevels: prev.urgencyLevels.includes(level)
        ? prev.urgencyLevels.filter(l => l !== level)
        : [...prev.urgencyLevels, level]
    }));
  };

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.75rem',
        marginBottom: '1.5rem'
      }}>
        <span style={{ fontSize: '1.5rem' }}>📱</span>
        <div>
          <h3 style={{ 
            fontSize: '1.125rem', 
            fontWeight: '600',
            color: 'var(--text-primary)',
            margin: '0'
          }}>
            Notification Preferences
          </h3>
          <p style={{ 
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            margin: '0'
          }}>
            Choose how you want to receive blood request notifications
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Notification Types */}
        <div>
          <h4 style={{ 
            fontSize: '0.875rem', 
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: '1rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Notification Methods
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* SMS Notifications */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem',
              background: preferences.sms ? 'rgba(34, 197, 94, 0.1)' : 'rgba(107, 114, 128, 0.1)',
              borderRadius: '0.75rem',
              border: `1px solid ${preferences.sms ? 'rgba(34, 197, 94, 0.2)' : 'rgba(107, 114, 128, 0.2)'}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.25rem' }}>📱</span>
                <div>
                  <div style={{ 
                    fontWeight: '500',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}>
                    SMS Notifications
                  </div>
                  <div style={{ 
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)'
                  }}>
                    Get instant SMS alerts for urgent blood requests
                  </div>
                </div>
              </div>
              <label style={{ 
                position: 'relative',
                display: 'inline-block',
                width: '48px',
                height: '24px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={preferences.sms}
                  onChange={(e) => setPreferences(prev => ({ ...prev, sms: e.target.checked }))}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: preferences.sms ? 'var(--success)' : '#ccc',
                  borderRadius: '24px',
                  transition: '0.3s',
                  ...(preferences.sms ? {} : {}),
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '',
                    height: '18px',
                    width: '18px',
                    left: preferences.sms ? '27px' : '3px',
                    bottom: '3px',
                    background: 'white',
                    borderRadius: '50%',
                    transition: '0.3s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }} />
                </span>
              </label>
            </div>

            {/* Push Notifications */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem',
              background: preferences.push ? 'rgba(59, 130, 246, 0.1)' : 'rgba(107, 114, 128, 0.1)',
              borderRadius: '0.75rem',
              border: `1px solid ${preferences.push ? 'rgba(59, 130, 246, 0.2)' : 'rgba(107, 114, 128, 0.2)'}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.25rem' }}>🔔</span>
                <div>
                  <div style={{ 
                    fontWeight: '500',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}>
                    In-App Notifications
                  </div>
                  <div style={{ 
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)'
                  }}>
                    Show notifications when using the app
                  </div>
                </div>
              </div>
              <label style={{ 
                position: 'relative',
                display: 'inline-block',
                width: '48px',
                height: '24px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={preferences.push}
                  onChange={(e) => setPreferences(prev => ({ ...prev, push: e.target.checked }))}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: preferences.push ? 'var(--primary)' : '#ccc',
                  borderRadius: '24px',
                  transition: '0.3s'
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '',
                    height: '18px',
                    width: '18px',
                    left: preferences.push ? '27px' : '3px',
                    bottom: '3px',
                    background: 'white',
                    borderRadius: '50%',
                    transition: '0.3s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }} />
                </span>
              </label>
            </div>

            {/* Email Notifications */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem',
              background: preferences.email ? 'rgba(168, 85, 247, 0.1)' : 'rgba(107, 114, 128, 0.1)',
              borderRadius: '0.75rem',
              border: `1px solid ${preferences.email ? 'rgba(168, 85, 247, 0.2)' : 'rgba(107, 114, 128, 0.2)'}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.25rem' }}>📧</span>
                <div>
                  <div style={{ 
                    fontWeight: '500',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}>
                    Email Notifications
                  </div>
                  <div style={{ 
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)'
                  }}>
                    Receive summaries and updates via email
                  </div>
                </div>
              </div>
              <label style={{ 
                position: 'relative',
                display: 'inline-block',
                width: '48px',
                height: '24px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={preferences.email}
                  onChange={(e) => setPreferences(prev => ({ ...prev, email: e.target.checked }))}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: preferences.email ? '#8b5cf6' : '#ccc',
                  borderRadius: '24px',
                  transition: '0.3s'
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '',
                    height: '18px',
                    width: '18px',
                    left: preferences.email ? '27px' : '3px',
                    bottom: '3px',
                    background: 'white',
                    borderRadius: '50%',
                    transition: '0.3s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }} />
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Urgency Levels */}
        <div>
          <h4 style={{ 
            fontSize: '0.875rem', 
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: '1rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Urgency Levels
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              { level: 'critical', label: 'Critical', emoji: '🚨', color: 'var(--danger)' },
              { level: 'urgent', label: 'Urgent', emoji: '⚠️', color: '#f59e0b' },
              { level: 'standard', label: 'Standard', emoji: '🩸', color: 'var(--primary)' }
            ].map(({ level, label, emoji, color }) => (
              <label key={level} style={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                background: preferences.urgencyLevels.includes(level) 
                  ? `${color}15` 
                  : 'transparent',
                border: `1px solid ${preferences.urgencyLevels.includes(level) 
                  ? `${color}40` 
                  : 'transparent'}`,
                transition: 'all 0.2s'
              }}>
                <input
                  type="checkbox"
                  checked={preferences.urgencyLevels.includes(level)}
                  onChange={() => toggleUrgencyLevel(level)}
                  style={{ 
                    width: '18px', 
                    height: '18px', 
                    accentColor: color,
                    cursor: 'pointer'
                  }}
                />
                <span style={{ fontSize: '1.25rem' }}>{emoji}</span>
                <div>
                  <div style={{ 
                    fontWeight: '500',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}>
                    {label} Requests
                  </div>
                  <div style={{ 
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)'
                  }}>
                    {level === 'critical' && 'Life-threatening emergencies only'}
                    {level === 'urgent' && 'Important but not life-threatening'}
                    {level === 'standard' && 'Regular blood donation requests'}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* SMS Cost Warning */}
        {preferences.sms && (
          <div style={{ 
            padding: '1rem',
            background: 'rgba(245, 158, 11, 0.1)',
            borderRadius: '0.75rem',
            border: '1px solid rgba(245, 158, 11, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>💰</span>
              <span style={{ fontWeight: '600', color: '#f59e0b' }}>
                SMS Cost Notice
              </span>
            </div>
            <p style={{ 
              fontSize: '0.875rem', 
              color: 'var(--text-secondary)',
              margin: '0'
            }}>
              SMS notifications may incur charges. Consider setting a password to reduce login costs.
            </p>
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={loading}
          className="btn btn-primary"
          style={{ 
            width: '100%',
            padding: '0.75rem',
            fontSize: '1rem',
            fontWeight: '600'
          }}
        >
          {loading ? 'Saving...' : 'Save Notification Preferences'}
        </button>
      </div>
    </div>
  );
}