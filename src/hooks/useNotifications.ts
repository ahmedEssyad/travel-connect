import { useEffect, useState } from 'react';
import { messaging } from '@/lib/firebase';
import { getToken, onMessage } from 'firebase/messaging';

export const useNotifications = () => {
  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<string>('default');

  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        const messagingInstance = await messaging();
        if (!messagingInstance) return;

        const permission = await Notification.requestPermission();
        setPermission(permission);

        if (permission === 'granted') {
          const token = await getToken(messagingInstance, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          });
          setToken(token);
          
          onMessage(messagingInstance, (payload) => {
            console.log('Received foreground message:', payload);
            
            if (payload.notification) {
              new Notification(payload.notification.title || 'New Message', {
                body: payload.notification.body,
                icon: '/icon-192x192.png',
              });
            }
          });
        }
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };

    if (typeof window !== 'undefined') {
      initializeNotifications();
    }
  }, []);

  const requestPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  };

  return {
    token,
    permission,
    requestPermission,
    isSupported: typeof window !== 'undefined' && 'Notification' in window,
  };
};