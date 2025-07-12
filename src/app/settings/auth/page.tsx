'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import MobileHeader from '@/components/Layout/MobileHeader';
import PasswordSettings from '@/components/Auth/PasswordSettings';

export default function AuthSettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showPasswordSettings, setShowPasswordSettings] = useState(false);

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: '600', color: 'var(--text-muted)' }}>Access Restricted</div>
          <p style={{ color: 'var(--text-secondary)' }}>Please log in to access authentication settings.</p>
        </div>
      </div>
    );
  }

  if (showPasswordSettings) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
        <MobileHeader 
          title="Password Settings" 
          showBack={true}
        />
        <main style={{ padding: '2rem 1rem' }}>
          <PasswordSettings onClose={() => setShowPasswordSettings(false)} />
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <MobileHeader 
        title="Authentication Settings" 
        showBack={true}
      />

      <main className="container" style={{ padding: '2rem 1rem' }}>
        {/* Current Status */}
        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h2 style={{ 
            fontSize: '1.25rem', 
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: '1rem'
          }}>
            Current Authentication Method
          </h2>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem',
            padding: '1rem',
            background: user.hasPassword ? 'rgba(34, 197, 94, 0.1)' : 'rgba(251, 191, 36, 0.1)',
            borderRadius: '0.5rem',
            border: `1px solid ${user.hasPassword ? 'rgba(34, 197, 94, 0.2)' : 'rgba(251, 191, 36, 0.2)'}`
          }}>
            <div style={{ fontSize: '2rem' }}>
              {user.hasPassword ? '🔐' : '📱'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ 
                fontWeight: '600',
                color: user.hasPassword ? 'var(--success)' : 'var(--warning)',
                marginBottom: '0.25rem'
              }}>
                {user.hasPassword ? 'Password + Phone' : 'Phone Only (SMS)'}
              </div>
              <div style={{ 
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                lineHeight: '1.4'
              }}>
                {user.hasPassword ? 
                  'You can login with password or SMS verification' :
                  'You use SMS verification for every login'
                }
              </div>
            </div>
          </div>

          <div style={{ 
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            marginTop: '1rem',
            padding: '0.75rem',
            background: 'var(--surface)',
            borderRadius: '0.5rem'
          }}>
            <strong>Phone Number:</strong> {user.phoneNumber}
          </div>
        </div>

        {/* Password Management */}
        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ 
            fontSize: '1.125rem', 
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: '1rem'
          }}>
            Password Management
          </h3>

          {!user.hasPassword ? (
            <div>
              <div style={{ 
                background: 'rgba(34, 197, 94, 0.1)',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '1rem',
                border: '1px solid rgba(34, 197, 94, 0.2)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>💡</span>
                  <span style={{ fontWeight: '600', color: 'var(--success)' }}>
                    Save SMS Costs
                  </span>
                </div>
                <p style={{ 
                  fontSize: '0.875rem', 
                  color: 'var(--text-secondary)',
                  margin: 0,
                  lineHeight: '1.4'
                }}>
                  Set up a password to avoid SMS verification costs on every login. This will make your login faster and more convenient.
                </p>
              </div>
              
              <button
                onClick={() => setShowPasswordSettings(true)}
                className="btn btn-primary"
                style={{ 
                  width: '100%',
                  padding: '0.875rem',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
              >
                Set Password
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem',
                padding: '0.75rem',
                background: 'rgba(34, 197, 94, 0.1)',
                borderRadius: '0.5rem'
              }}>
                <span style={{ fontSize: '1.25rem' }}>✅</span>
                <span style={{ color: 'var(--success)', fontWeight: '500' }}>
                  Password is set - you can login without SMS
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setShowPasswordSettings(true)}
                  className="btn btn-outline"
                  style={{ 
                    flex: 1,
                    padding: '0.75rem'
                  }}
                >
                  Change Password
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Security Tips */}
        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ 
            fontSize: '1.125rem', 
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: '1rem'
          }}>
            Security Tips
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.25rem' }}>🔒</span>
              <div>
                <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                  Use a strong password
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Mix letters, numbers, and special characters
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.25rem' }}>🔐</span>
              <div>
                <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                  Keep your password private
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Never share your password with anyone
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.25rem' }}>📱</span>
              <div>
                <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                  SMS backup is always available
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  You can always use SMS verification if needed
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.25rem' }}>🔄</span>
              <div>
                <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                  Change password regularly
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Update your password every few months
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ 
            fontSize: '1.125rem', 
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: '1rem'
          }}>
            Account Actions
          </h3>

          <button
            onClick={logout}
            className="btn btn-danger"
            style={{ 
              width: '100%',
              padding: '0.875rem',
              fontSize: '1rem',
              fontWeight: '600',
              background: 'var(--danger)',
              color: 'white'
            }}
          >
            Logout
          </button>
        </div>
      </main>
    </div>
  );
}