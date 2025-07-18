'use client';

import { useRouter } from 'next/navigation';
import NotificationBell from '@/components/Notifications/NotificationBell';
import useConnectionStatus from '@/hooks/useConnectionStatus';

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  className?: string;
}

export default function MobileHeader({ 
  title, 
  subtitle, 
  showBack = true, 
  rightAction,
  onBack,
  className = '' 
}: MobileHeaderProps) {
  const router = useRouter();
  const { isOnline, connectionSpeed } = useConnectionStatus();
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <header 
      className={className}
      style={{ 
        background: 'rgba(255, 255, 255, 0.95)', 
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--border-light)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000
      }}
    >
      <div 
        className="container flex-between" 
        style={{ 
          height: '64px',
          padding: '0 1rem'
        }}
      >
        {/* Left Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
          {showBack && (
            <button
              onClick={handleBack}
              style={{
                minWidth: '44px', // Touch target minimum
                minHeight: '44px',
                borderRadius: '0.5rem',
                border: '1px solid var(--border)',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: '1.125rem',
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--surface-hover)';
                e.currentTarget.style.borderColor = 'var(--primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
              aria-label="Go back"
            >
              ←
            </button>
          )}
          
          <div style={{ flex: 1, minWidth: 0 }}> {/* minWidth: 0 allows text truncation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '32px', // Slightly smaller for mobile
                height: '32px',
                borderRadius: '0.5rem',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <span style={{ 
                  color: 'white', 
                  fontSize: '1rem', 
                  fontWeight: '700' 
                }}>
                  {title.charAt(0).toUpperCase()}
                </span>
              </div>
              
              <div style={{ minWidth: 0, flex: 1 }}>
                <h1 
                  className="text-gradient" 
                  style={{ 
                    fontSize: '1.125rem', // Slightly smaller for mobile
                    fontWeight: '600',
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {title}
                </h1>
                {subtitle && (
                  <p style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginLeft: '0.75rem',
          flexShrink: 0,
          gap: '0.5rem'
        }}>
          {/* Connection Status Indicator */}
          {!isOnline && (
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#ef4444',
              animation: 'pulse 2s infinite'
            }} title="Offline" />
          )}
          {isOnline && connectionSpeed === 'slow' && (
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#f59e0b',
              animation: 'pulse 2s infinite'
            }} title="Slow connection" />
          )}
          
          <NotificationBell />
          {rightAction && rightAction}
        </div>
      </div>
    </header>
  );
}