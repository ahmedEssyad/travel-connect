import { useEffect, useState } from 'react';
import { useSocket } from '@/lib/websocket';
import { useAuth } from '@/contexts/AuthContext';

export const useNotifications = () => {
  const [permission, setPermission] = useState<string>('default');
  const [notifications, setNotifications] = useState<any[]>([]);
  const { socket, connected } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        if (typeof window !== 'undefined' && 'Notification' in window) {
          const permission = await Notification.requestPermission();
          setPermission(permission);
        }
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };

    initializeNotifications();
  }, []);

  useEffect(() => {
    if (socket && user && connected) {
      // Join user's notification room
      socket.emit('join', user.id);

      // Listen for notifications
      socket.on('notification', (notification) => {
        console.log('Received notification:', notification);
        
        setNotifications(prev => [...prev, notification]);
        
        // Show browser notification if permission granted
        if (permission === 'granted') {
          new Notification(notification.title || 'TravelConnect', {
            body: notification.body,
            icon: '/icon-192x192.png',
          });
        }
      });

      return () => {
        socket.off('notification');
      };
    }
  }, [socket, user, connected, permission]);

  const requestPermission = async () => {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const permission = await Notification.requestPermission();
        setPermission(permission);
        return permission;
      }
      return 'denied';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  };

  const sendNotification = (userId: string, notification: any) => {
    if (socket && connected) {
      socket.emit('notification', { userId, notification });
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return {
    permission,
    notifications,
    requestPermission,
    sendNotification,
    clearNotifications,
    isSupported: typeof window !== 'undefined' && 'Notification' in window,
    connected,
  };
};