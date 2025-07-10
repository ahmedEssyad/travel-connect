'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/lib/websocket';
import { useToast } from '@/contexts/ToastContext';

export default function Navigation() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const toast = useToast();
  const [hasNotifications, setHasNotifications] = useState(false);

  // Global notification listener
  useEffect(() => {
    if (socket && user && connected) {
      socket.emit('join', user.uid);
      
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

  // Clear notifications when visiting matches page
  useEffect(() => {
    if (pathname === '/matches') {
      setHasNotifications(false);
    }
  }, [pathname]);

  const navItems = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/post-trip', label: 'Post Trip', icon: '✈️' },
    { href: '/post-request', label: 'Post Request', icon: '📦' },
    { href: '/matches', label: 'Matches', icon: '🤝', hasNotification: hasNotifications },
    { href: '/messages', label: 'Messages', icon: '💬' },
    { href: '/profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2 shadow-lg">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-around">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center py-2 px-3 text-xs font-medium transition-all duration-200 rounded-lg ${
                pathname === item.href
                  ? 'text-blue-600 bg-blue-50 scale-105'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className={`text-lg mb-1 transition-transform duration-200 ${
                pathname === item.href ? 'scale-110' : ''
              }`}>
                {item.icon}
              </span>
              <span className="leading-tight">{item.label}</span>
              {item.hasNotification && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}