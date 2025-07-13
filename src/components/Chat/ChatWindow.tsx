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
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);
  const [syncing, setSyncing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMessages = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      else setSyncing(true);
      setError(null);
      
      const response = await apiClient.get(`/api/messages?chatId=${chatId}`);
      
      if (response.ok) {
        const data = await response.json();
        const newMessages = data || [];
        
        // Only update if we have new messages or first load
        if (newMessages.length !== messages.length || lastFetch === 0) {
          setMessages(newMessages);
          setLastFetch(Date.now());
        }
      } else {
        throw new Error(`Failed to fetch messages: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError(error instanceof Error ? error.message : 'Failed to load messages');
      if (showLoading) {
        toast.error('Failed to load messages');
      }
    } finally {
      if (showLoading) setLoading(false);
      else setSyncing(false);
    }
  }, [chatId, toast, messages.length, lastFetch]);

  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) return;
    
    pollIntervalRef.current = setInterval(() => {
      fetchMessages(false); // Don't show loading spinner for polling
    }, 10000); // Poll every 10 seconds (reduced from 3)
  }, [fetchMessages]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const sendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const messageText = newMessage.trim();
    setSending(true);
    setNewMessage(''); // Clear input immediately for better UX
    
    try {
      const response = await apiClient.post('/api/messages', {
        chatId,
        text: messageText
      });

      if (response.ok) {
        const message = await response.json();
        setMessages(prev => [...prev, message]);
        setLastFetch(Date.now()); // Update last fetch time
      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageText); // Restore message on error
      toast.error(error instanceof Error ? error.message : 'Network error. Please try again.');
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
    startPolling();
    
    return () => {
      stopPolling();
    };
  }, [fetchMessages, startPolling, stopPolling]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Stop polling when component unmounts or chat changes
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [chatId, stopPolling]);

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

  if (error && messages.length === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: '400px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
          <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</p>
          <button 
            onClick={() => fetchMessages(true)}
            className="btn btn-primary"
            style={{ fontSize: '0.875rem' }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ maxHeight: '600px' }}>
      {/* Chat Header */}
      {requestInfo && (
        <div className="p-4 md:p-6 mb-4 rounded bg-red-50 border border-red-200">
          
          <div className="flex items-center gap-2 text-sm md:text-base text-primary">
            <span className="text-lg md:text-xl">🩸</span>
            <strong>{requestInfo.bloodType}</strong> blood needed for <strong>{requestInfo.patientName}</strong>
            {syncing && (
              <div style={{
                width: '12px',
                height: '12px',
                border: '1px solid transparent',
                borderTop: '1px solid var(--primary)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginLeft: 'auto'
              }}></div>
            )}
          </div>
          <div className="text-xs md:text-sm text-secondary mt-1">
            🏥 {requestInfo.hospital} • {requestInfo.urgency.toUpperCase()}
          </div>
        </div>
      )}

      {/* Connection Status */}
      {error && messages.length > 0 && (
        <div className="flex items-center gap-2 p-3 mb-4 text-sm bg-red-50 border border-red-200 rounded" style={{ color: 'var(--danger)' }}>
          <span>⚠️</span>
          <span className="flex-1">Connection issues - messages may not update automatically</span>
          <button 
            onClick={() => fetchMessages(false)}
            className="px-2 py-1 text-xs border rounded"
            style={{ 
              borderColor: 'var(--danger)',
              color: 'var(--danger)',
              background: 'transparent'
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 p-4 mb-4 bg-surface rounded overflow-y-auto" style={{ minHeight: '300px' }}>
        {messages.length === 0 ? (
          <div className="text-center text-secondary p-8">
            <div className="text-2xl md:text-3xl mb-4">💬</div>
            <p className="text-sm md:text-base">Start the conversation...</p>
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
      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={sending}
          className="flex-1 input text-base"
        />
        <button
          type="submit"
          disabled={sending || !newMessage.trim()}
          className="btn btn-primary touch-target"
          style={{
            padding: '0.75rem 1rem',
            fontSize: '0.875rem',
            opacity: sending || !newMessage.trim() ? 0.5 : 1,
            minWidth: '60px'
          }}
        >
          {sending ? '⏳' : '📤'}
        </button>
      </form>

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-2 mt-4">
        {quickActions.map((action, index) => (
          <button
            key={index}
            onClick={() => setNewMessage(action.text)}
            className="btn btn-outline flex-1 text-xs sm:text-sm touch-target"
            style={{ 
              padding: '0.5rem 0.75rem'
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