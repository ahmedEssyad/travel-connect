'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import { useSocket } from '@/lib/websocket';
import { useToast } from '@/contexts/ToastContext';
import LocationStatus from '@/components/Common/LocationStatus';

export default function Navigation() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { location } = useLocation();
  const { socket, connected } = useSocket();
  const toast = useToast();
  const [hasNotifications, setHasNotifications] = useState(false);

  // Global notification listener
  useEffect(() => {
    if (socket && user && connected) {
      socket.emit('join', user.id);
      
      socket.on('notification', (notification) => {
        if (notification.type === 'match_request') {
          setHasNotifications(true);
          toast.success(`New connection request from ${notification.fromUserName}!`);
          
          // Show browser notification
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title, {
              body: notification.body,
              icon: '/icon-192x192.png'
            });
          }
        }
      });

      return () => {
        socket.off('notification');
      };
    }
  }, [socket, user, connected, toast]);

  // Clear notifications when visiting messages page
  useEffect(() => {
    if (pathname === '/messages') {
      setHasNotifications(false);
    }
  }, [pathname]);

  const navItems = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/blood-requests', label: 'Requests', icon: '🩸' },
    { href: '/request-blood', label: 'Emergency', icon: '🚨' },
    { href: '/messages', label: 'Messages', icon: '💬', hasNotification: hasNotifications },
    { href: '/profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <nav style={{
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(12px)',
      borderTop: '1px solid var(--border-light)',
      padding: '0.5rem 1rem',
      boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{ 
        maxWidth: '480px', // Optimized for mobile
        margin: '0 auto'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-around',
          alignItems: 'center'
        }}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: '52px', // Ensure adequate touch target
                minHeight: '52px',
                padding: '0.5rem 0.25rem',
                fontSize: '0.75rem',
                fontWeight: '500',
                textDecoration: 'none',
                borderRadius: '0.75rem',
                transition: 'all 0.2s ease',
                color: pathname === item.href ? 'var(--primary)' : 'var(--text-muted)',
                background: pathname === item.href ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
                transform: pathname === item.href ? 'scale(1.05)' : 'scale(1)'
              }}
              onMouseEnter={(e) => {
                if (pathname !== item.href) {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.background = 'var(--surface-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (pathname !== item.href) {
                  e.currentTarget.style.color = 'var(--text-muted)';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {/* Icon */}
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: pathname === item.href 
                  ? 'var(--primary)' 
                  : 'var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.25rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: pathname === item.href ? 'white' : 'var(--text-secondary)',
                transition: 'all 0.2s ease',
                transform: pathname === item.href ? 'scale(1.1)' : 'scale(1)'
              }}>
                {item.icon}
              </div>
              
              {/* Label */}
              <span style={{ 
                lineHeight: '1.2',
                textAlign: 'center',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '48px'
              }}>
                {item.label}
              </span>
              
              {/* Notification Badge */}
              {item.hasNotification && (
                <div style={{
                  position: 'absolute',
                  top: '4px',
                  right: '8px',
                  width: '12px',
                  height: '12px',
                  background: 'var(--danger)',
                  borderRadius: '50%',
                  border: '2px solid white',
                  animation: 'pulse 2s infinite'
                }}></div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}