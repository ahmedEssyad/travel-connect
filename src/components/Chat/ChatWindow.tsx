'use client';

import { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { apiClient } from '@/lib/api-client';

interface Message {
  _id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: string;
  createdAt: string;
}

interface ChatWindowProps {
  chatId: string;
  otherUserName?: string;
  requestInfo?: {
    patientName: string;
    bloodType: string;
    hospital: string;
    urgency: string;
  };
}

function ChatWindow({ chatId, otherUserName, requestInfo }: ChatWindowProps) {
  const { user } = useAuth();
  const toast = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/messages?chatId=${chatId}`);
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data || []);
      } else {
        console.error('Failed to fetch messages');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [chatId, toast]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const sendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await apiClient.post('/api/messages', {
        chatId,
        text: newMessage.trim()
      });

      if (response.ok) {
        const message = await response.json();
        setMessages(prev => [...prev, message]);
        setNewMessage('');
      } else {
        const error = await response.text();
        toast.error(error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setSending(false);
    }
  }, [chatId, newMessage, sending, toast]);

  const formatMessageTime = useCallback((timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }, []);

  const isOwnMessage = useCallback((senderId: string) => {
    return senderId === user?.id;
  }, [user?.id]);

  const getMessageSenderName = useCallback((senderId: string) => {
    if (senderId === 'system') return 'System';
    if (senderId === user?.id) return 'You';
    return otherUserName || 'Other User';
  }, [user?.id, otherUserName]);

  // Memoize quick action handlers
  const quickActions = useMemo(() => [
    {
      text: 'When would be a good time to meet at the hospital?',
      label: '🏥 Schedule Meeting'
    },
    {
      text: 'I\'m here at the hospital. Where should I go?',
      label: '📍 I\'m Here'
    },
    {
      text: 'The donation is complete. Thank you!',
      label: '✅ Done'
    }
  ], []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: '400px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '2px solid transparent',
            borderTop: '2px solid var(--primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      maxHeight: '600px'
    }}>
      {/* Chat Header */}
      {requestInfo && (
        <div style={{ 
          padding: '1rem',
          background: 'rgba(239, 68, 68, 0.1)',
          borderRadius: '0.5rem',
          marginBottom: '1rem',
          border: '1px solid rgba(239, 68, 68, 0.2)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            fontSize: '0.875rem',
            color: 'var(--text-primary)'
          }}>
            <span style={{ fontSize: '1.25rem' }}>🩸</span>
            <strong>{requestInfo.bloodType}</strong> blood needed for <strong>{requestInfo.patientName}</strong>
          </div>
          <div style={{ 
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            marginTop: '0.25rem'
          }}>
            🏥 {requestInfo.hospital} • {requestInfo.urgency.toUpperCase()}
          </div>
        </div>
      )}

      {/* Messages */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto',
        padding: '1rem',
        background: 'var(--surface)',
        borderRadius: '0.5rem',
        marginBottom: '1rem',
        minHeight: '300px'
      }}>
        {messages.length === 0 ? (
          <div style={{ 
            textAlign: 'center',
            color: 'var(--text-secondary)',
            padding: '2rem'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>💬</div>
            <p>Start the conversation...</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.map((message) => (
              <div
                key={message._id}
                style={{
                  display: 'flex',
                  justifyContent: message.senderId === 'system' ? 'center' : 
                    isOwnMessage(message.senderId) ? 'flex-end' : 'flex-start'
                }}
              >
                <div
                  style={{
                    maxWidth: '70%',
                    padding: '0.75rem 1rem',
                    borderRadius: '1rem',
                    background: message.senderId === 'system' ? 'rgba(59, 130, 246, 0.1)' :
                      isOwnMessage(message.senderId) ? 'var(--primary)' : 'white',
                    color: message.senderId === 'system' ? 'var(--primary)' :
                      isOwnMessage(message.senderId) ? 'white' : 'var(--text-primary)',
                    border: message.senderId === 'system' ? '1px solid rgba(59, 130, 246, 0.2)' :
                      isOwnMessage(message.senderId) ? 'none' : '1px solid var(--border)',
                    fontSize: '0.875rem',
                    fontWeight: message.senderId === 'system' ? '500' : '400'
                  }}
                >
                  {message.senderId !== 'system' && !isOwnMessage(message.senderId) && (
                    <div style={{ 
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      marginBottom: '0.25rem',
                      color: 'var(--text-secondary)'
                    }}>
                      {getMessageSenderName(message.senderId)}
                    </div>
                  )}
                  <div>{message.text}</div>
                  <div style={{ 
                    fontSize: '0.7rem',
                    marginTop: '0.25rem',
                    opacity: 0.7
                  }}>
                    {formatMessageTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <form onSubmit={sendMessage} style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={sending}
          style={{
            flex: 1,
            padding: '0.75rem',
            border: '1px solid var(--border)',
            borderRadius: '0.5rem',
            fontSize: '0.875rem'
          }}
        />
        <button
          type="submit"
          disabled={sending || !newMessage.trim()}
          className="btn btn-primary"
          style={{
            padding: '0.75rem 1rem',
            fontSize: '0.875rem',
            opacity: sending || !newMessage.trim() ? 0.5 : 1
          }}
        >
          {sending ? '⏳' : '📤'}
        </button>
      </form>

      {/* Quick Actions */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem',
        marginTop: '1rem',
        flexWrap: 'wrap'
      }}>
        {quickActions.map((action, index) => (
          <button
            key={index}
            onClick={() => setNewMessage(action.text)}
            className="btn btn-outline"
            style={{ 
              fontSize: '0.75rem',
              padding: '0.5rem 0.75rem',
              flex: 1
            }}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default memo(ChatWindow);