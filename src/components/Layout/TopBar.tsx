'use client';

import { useAuth } from '@/contexts/AuthContext';
import NotificationBell from '@/components/Notifications/NotificationBell';

export default function TopBar() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-light)',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
    }}>
      <div style={{
        maxWidth: '480px',
        margin: '0 auto',
        padding: '0.75rem 1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* Logo/Title */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span style={{ fontSize: '1.5rem' }}>🩸</span>
          <h1 style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: 'var(--text-primary)',
            margin: 0
          }}>
            mounkidh
          </h1>
        </div>

        {/* Notification Bell */}
        <NotificationBell />
      </div>
    </div>
  );
}