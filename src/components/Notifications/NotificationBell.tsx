'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { apiClient } from '@/lib/api-client';
import { formatTimeAgo } from '@/lib/notifications';
import useConnectionStatus from '@/hooks/useConnectionStatus';

interface Notification {
  id: string;
  type: 'blood_request' | 'donation_update' | 'chat_message';
  title: string;
  message: string;
  data?: any;
  timestamp: string;
  read: boolean;
  urgent: boolean;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const toast = useToast();
  const { isOnline, connectionSpeed } = useConnectionStatus();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (user && isOnline) {
      loadNotifications();
      
      // Adjust polling interval based on connection speed
      const pollInterval = connectionSpeed === 'slow' ? 60000 : 30000;
      const interval = setInterval(() => {
        if (isOnline) loadNotifications();
      }, pollInterval);
      
      return () => clearInterval(interval);
    }
  }, [user, isOnline, connectionSpeed]);

  const loadNotifications = async () => {
    if (!isOnline) return;
    
    try {
      setLoading(true);
      const response = await apiClient.get('/api/notifications');
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      if (!isOnline) {
        toast.error('No internet connection');
      }
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      console.log('Marking notification as read:', notificationId);
      const response = await apiClient.put(`/api/notifications/${notificationId}/read`);
      
      if (response.ok) {
        console.log('Notification marked as read successfully');
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, read: true } : n
          )
        );
        toast.success('Notification marked as read');
      } else {
        console.error('Failed to mark notification as read:', response.status);
        toast.error('Failed to mark notification as read');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Error marking notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      console.log('Marking all notifications as read:', unreadNotifications.length);
      
      // Mark all unread notifications as read
      const promises = unreadNotifications.map(n => markAsRead(n.id));
      await Promise.all(promises);
      
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Error marking all notifications as read');
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    // Handle different notification types
    switch (notification.type) {
      case 'blood_request':
        if (notification.data?.requestId) {
          window.location.href = `/blood-requests?highlight=${notification.data.requestId}`;
        }
        break;
      case 'chat_message':
        if (notification.data?.chatId) {
          window.location.href = `/chat?chatId=${notification.data.chatId}`;
        }
        break;
      default:
        break;
    }
    
    setShowDropdown(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'blood_request': return '🩸';
      case 'donation_update': return '✅';
      case 'chat_message': return '💬';
      default: return '🔔';
    }
  };

  if (!user) return null;

  return (
    <div style={{ position: 'relative' }}>
      {/* Notification Bell */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          fontSize: '1.5rem',
          cursor: 'pointer',
          padding: '0.5rem'
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              background: 'var(--danger)',
              color: 'white',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '600'
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            width: '320px',
            maxHeight: '400px',
            background: 'white',
            border: '1px solid var(--border)',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 1000,
            overflowY: 'auto'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '1rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>
              Notifications
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    color: 'var(--primary)',
                    fontWeight: '500'
                  }}
                  title="Mark all as read"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setShowDropdown(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.25rem',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  border: '2px solid transparent',
                  borderTop: '2px solid var(--primary)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto'
                }}
              ></div>
            </div>
          )}

          {/* Notifications List */}
          {!loading && notifications.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔔</div>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                No notifications yet
              </p>
            </div>
          )}

          {!loading && notifications.length > 0 && (
            <div>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  style={{
                    padding: '1rem',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    background: notification.read ? 'white' : 'rgba(59, 130, 246, 0.05)',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = notification.read ? 'white' : 'rgba(59, 130, 246, 0.05)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div style={{ fontSize: '1.25rem', flexShrink: 0 }}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                        marginBottom: '0.25rem'
                      }}>
                        {notification.title}
                      </div>
                      <div style={{ 
                        fontSize: '0.8rem', 
                        color: 'var(--text-secondary)',
                        marginBottom: '0.5rem',
                        lineHeight: '1.4'
                      }}>
                        {notification.message}
                      </div>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <span>{formatTimeAgo(new Date(notification.timestamp))}</span>
                        {notification.urgent && (
                          <span style={{ 
                            color: 'var(--danger)',
                            fontWeight: '600'
                          }}>
                            URGENT
                          </span>
                        )}
                        {!notification.read && (
                          <span style={{ 
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: 'var(--primary)'
                          }} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}