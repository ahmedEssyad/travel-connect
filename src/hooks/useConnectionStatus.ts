'use client';

import { useState, useEffect } from 'react';

export default function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionSpeed, setConnectionSpeed] = useState<'fast' | 'slow' | 'offline'>('fast');

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      if (!navigator.onLine) {
        setConnectionSpeed('offline');
      }
    };

    const testConnectionSpeed = async () => {
      if (!navigator.onLine) {
        setConnectionSpeed('offline');
        return;
      }

      try {
        const start = Date.now();
        await fetch('/api/ping', { 
          method: 'HEAD',
          cache: 'no-cache',
          signal: AbortSignal.timeout(5000)
        });
        const duration = Date.now() - start;
        
        setConnectionSpeed(duration > 2000 ? 'slow' : 'fast');
      } catch {
        setConnectionSpeed('slow');
      }
    };

    updateOnlineStatus();
    testConnectionSpeed();

    const interval = setInterval(testConnectionSpeed, 30000);

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  return { isOnline, connectionSpeed };
}