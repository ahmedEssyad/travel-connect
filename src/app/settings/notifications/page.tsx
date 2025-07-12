'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import NotificationPreferences from '@/components/Profile/NotificationPreferences';

export default function NotificationSettingsPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  if (!user) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--surface)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: '600', color: 'var(--text-muted)' }}>
            Access Restricted
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>Please log in to access notification settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--surface)',
      padding: '1rem'
    }}>
      <div style={{ 
        maxWidth: '600px', 
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <button
            onClick={() => router.back()}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '0.5rem',
              color: 'var(--text-primary)'
            }}
          >
            ←
          </button>
          <div>
            <h1 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '700',
              color: 'var(--text-primary)',
              margin: '0'
            }}>
              Notification Settings
            </h1>
            <p style={{ 
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              margin: '0'
            }}>
              Manage how you receive blood request alerts
            </p>
          </div>
        </div>

        <NotificationPreferences 
          user={user} 
          onUpdate={refreshUser}
        />

        {/* Additional Info */}
        <div className="card" style={{ 
          padding: '1.5rem',
          marginTop: '1.5rem'
        }}>
          <h3 style={{ 
            fontSize: '1rem', 
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: '1rem'
          }}>
            How Notifications Work
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.25rem' }}>🚨</span>
              <div>
                <div style={{ fontWeight: '500', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                  Critical Requests
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Life-threatening emergencies where immediate blood is needed
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.25rem' }}>⚠️</span>
              <div>
                <div style={{ fontWeight: '500', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                  Urgent Requests
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Important requests that need blood within 24-48 hours
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.25rem' }}>🩸</span>
              <div>
                <div style={{ fontWeight: '500', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                  Standard Requests
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Regular blood donation requests for planned procedures
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Notice */}
        <div style={{ 
          marginTop: '1.5rem',
          padding: '1rem',
          background: 'rgba(107, 114, 128, 0.1)',
          borderRadius: '0.75rem',
          border: '1px solid rgba(107, 114, 128, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🔒</span>
            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
              Privacy & Security
            </span>
          </div>
          <p style={{ 
            fontSize: '0.875rem', 
            color: 'var(--text-secondary)',
            margin: '0'
          }}>
            Your notification preferences are private. We only send notifications when blood requests match your blood type and you're eligible to donate. You can change these settings anytime.
          </p>
        </div>
      </div>
    </div>
  );
}