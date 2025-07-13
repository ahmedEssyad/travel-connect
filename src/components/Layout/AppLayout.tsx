'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Home/Navigation';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  // Pages that should not show navigation
  const noNavigationPages = ['/login', '/register'];
  
  // Pages that should show navigation (authenticated pages)
  const navigationPages = ['/', '/messages', '/profile', '/blood-requests', '/request-blood', '/settings', '/chat'];
  
  const showNavigation = user && navigationPages.some(page => 
    pathname === page || (page !== '/' && pathname.startsWith(page))
  ) && !noNavigationPages.includes(pathname);

  return (
    <div style={{ 
      minHeight: '100vh',
      paddingBottom: showNavigation ? '80px' : '0',
      position: 'relative'
    }}>
      {children}
      
      {/* Global Bottom Navigation */}
      {showNavigation && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: 'white',
          borderTop: '1px solid var(--border-light)',
          boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.1)'
        }}>
          <Navigation />
        </div>
      )}
    </div>
  );
}