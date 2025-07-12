'use client';

import { useRouter } from 'next/navigation';
import NotificationBell from '@/components/Notifications/NotificationBell';

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  className?: string;
}

export default function MobileHeader({ 
  title, 
  subtitle, 
  showBack = true, 
  rightAction,
  className = '' 
}: MobileHeaderProps) {
  const router = useRouter();

  return (
    <header 
      className={className}
      style={{ 
        background: 'white', 
        borderBottom: '1px solid var(--border-light)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}
    >
      <div 
        className="container flex-between" 
        style={{ 
          height: '56px', // Reduced from 64px for mobile
          padding: '0 1rem'
        }}
      >
        {/* Left Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
          {showBack && (
            <button
              onClick={() => router.back()}
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
          <NotificationBell />
          {rightAction && rightAction}
        </div>
      </div>
    </header>
  );
}