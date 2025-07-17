'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiClient } from '@/lib/api-client';
import MobileHeader from '@/components/Layout/MobileHeader';

interface ChatPreview {
  chatId: string;
  otherUserId: string;
  otherUserName: string;
  lastMessage: string;
  lastActivity: string;
  bloodType?: string;
  hospital?: string;
  urgency?: string;
  isActive: boolean;
  requestId?: string; // Add request ID to interface
}

function MessagesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const toast = useToast();
  const { t, isRTL } = useLanguage();
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);

  // Load user's chat conversations
  useEffect(() => {
    if (user) {
      loadChats();
    }
  }, [user]);

  // Check URL params for specific chat and redirect to chat page (only if no existing chats)
  useEffect(() => {
    const chatId = searchParams.get('chatId');
    const requestId = searchParams.get('requestId');
    
    if (chatId && chats.length === 0 && !loadingChats) {
      // Only redirect if we're not showing the messages list
      router.push(`/chat?chatId=${chatId}${requestId ? `&requestId=${requestId}` : ''}`);
    }
  }, [searchParams, router, chats.length, loadingChats]);

  const fetchLastMessage = async (chatId: string) => {
    try {
      const response = await apiClient.get(`/api/messages?chatId=${chatId}`);
      if (response.ok) {
        const messages = await response.json();
        if (messages && messages.length > 0) {
          const lastMsg = messages[messages.length - 1];
          return {
            text: lastMsg.text,
            timestamp: lastMsg.timestamp
          };
        }
      }
    } catch (error) {
      console.error('Error fetching last message for chat:', chatId, error);
    }
    return null;
  };

  const discoverChatsFromMessages = async (bloodRequests: any[]) => {
    try {
      // Get user's chats from actual messages in the database
      const response = await apiClient.get(`/api/messages/user-chats`);
      if (response.ok) {
        const userChats = await response.json();
        
        return userChats.map((chat: any) => {
          // Try to find the corresponding blood request for context
          // Check both requester and donors in blood requests
          let bloodRequest = null;
          let isRequester = false;
          
          for (const req of bloodRequests) {
            // Check if user is the requester (recipient) - they should see ALL chats about their request
            if (req.requesterId === user?.id) {
              bloodRequest = req;
              isRequester = true;
              break;
            }
            // Check if other user is the requester and current user might be a donor
            if (req.requesterId === chat.otherUserId) {
              bloodRequest = req;
              isRequester = false;
              break;
            }
          }
          
          return {
            chatId: chat.chatId,
            otherUserId: chat.otherUserId,
            otherUserName: chat.otherUserName || 'Unknown User',
            lastMessage: chat.lastMessage || t('messages.noMessagesYet'),
            lastActivity: chat.lastActivity || new Date().toISOString(),
            bloodType: bloodRequest?.patientInfo?.bloodType || 'Unknown',
            hospital: bloodRequest?.hospital?.name || 'Unknown Hospital',
            urgency: bloodRequest?.urgencyLevel || 'standard',
            isActive: bloodRequest?.status === 'active' || true, // Default to active for message-based chats
            requestId: bloodRequest?._id || null,
            fromMessages: true // Flag to indicate this chat was discovered from messages
          };
        });
      }
    } catch (error) {
      console.error('Error discovering chats from messages:', error);
    }
    return [];
  };

  const loadChats = async () => {
    try {
      setLoadingChats(true);
      
      // Get blood requests to find user's chats - reduced limit for performance
      const response = await apiClient.get(`/api/blood-requests?limit=50`);
      
      if (response.ok) {
        const data = await response.json();
        const userChats: ChatPreview[] = [];
        
        // Process blood requests to find user's chats
        data.requests?.forEach((request: any) => {
          // Check if user is the requester
          if (request.requesterId === user?.id) {
            // User is requester - look for matched donors
            if (request.matchedDonors && request.matchedDonors.length > 0) {
              request.matchedDonors.forEach((donor: any) => {
                const chatId = [user?.id, donor.donorId].sort().join('_') + '_' + request._id;
                
                // Check if this chat already exists to avoid duplicates
                const existingChat = userChats.find(chat => chat.chatId === chatId);
                if (!existingChat) {
                  userChats.push({
                    chatId,
                    otherUserId: donor.donorId,
                    otherUserName: donor.donorName,
                    lastMessage: t('messages.bloodRequestConnection'),
                    lastActivity: donor.respondedAt || request.createdAt,
                    bloodType: request.patientInfo.bloodType,
                    hospital: request.hospital.name,
                    urgency: request.urgencyLevel,
                    isActive: request.status === 'active',
                    requestId: request._id
                  });
                }
              });
            }
          } else if (request.matchedDonors && request.matchedDonors.length > 0) {
            // Check if user is a matched donor
            const userAsDonor = request.matchedDonors.find((donor: any) => donor.donorId === user?.id);
            if (userAsDonor) {
              const chatId = [user?.id, request.requesterId].sort().join('_') + '_' + request._id;
              
              // Check if this chat already exists to avoid duplicates
              const existingChat = userChats.find(chat => chat.chatId === chatId);
              if (!existingChat) {
                userChats.push({
                  chatId,
                  otherUserId: request.requesterId,
                  otherUserName: request.contactInfo?.requesterName || 'Requester',
                  lastMessage: t('messages.bloodRequestConnection'),
                  lastActivity: userAsDonor.respondedAt || request.createdAt,
                  bloodType: request.patientInfo.bloodType,
                  hospital: request.hospital.name,
                  urgency: request.urgencyLevel,
                  isActive: request.status === 'active',
                  requestId: request._id
                });
              }
            }
          }
        });
        
        // Also discover chats from actual messages (not just matched donors)
        let messageBasedChats: any[] = [];
        try {
          messageBasedChats = await discoverChatsFromMessages(data.requests || []);
        } catch (error) {
          console.error('Failed to discover chats from messages, continuing with blood request chats only:', error);
        }
        
        // Merge chats from both sources, avoiding duplicates
        const allChats = [...userChats];
        messageBasedChats.forEach(msgChat => {
          if (!allChats.find(existingChat => existingChat.chatId === msgChat.chatId)) {
            allChats.push(msgChat);
          }
        });
        
        // The user-chats API already returns last messages, so we don't need individual fetches
        // Just use the data we already have from messageBasedChats, and add basic info for blood request chats
        const chatsWithMessages = allChats.map(chat => {
          // If chat came from messages (has real lastMessage), use it
          if (chat.fromMessages && chat.lastMessage !== t('messages.noMessagesYet')) {
            return chat;
          }
          // Otherwise use fallback
          return {
            ...chat,
            lastMessage: chat.lastMessage || t('messages.noMessagesYet')
          };
        });
        
        // Sort chats by last activity (most recent first)
        chatsWithMessages.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
        
        setChats(chatsWithMessages);
        console.log(`Found ${chatsWithMessages.length} chats for user ${user?.id} (${userChats.length} from blood requests, ${messageBasedChats.length} from messages)`);
      } else {
        const errorText = await response.text();
        console.error('Failed to load chats:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
      toast.error(t('messages.loading'));
    } finally {
      setLoadingChats(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'var(--danger)';
      case 'urgent': return 'var(--warning)';
      case 'standard': return 'var(--primary)';
      default: return 'var(--text-secondary)';
    }
  };

  const handleChatClick = (chat: ChatPreview) => {
    const url = chat.requestId 
      ? `/chat?chatId=${chat.chatId}&requestId=${chat.requestId}`
      : `/chat?chatId=${chat.chatId}`;
    router.push(url);
  };

  if (!user) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'var(--surface)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        direction: isRTL ? 'rtl' : 'ltr'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: '600', color: 'var(--text-muted)' }}>
            {t('auth.accessRestricted')}
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>
            {t('messages.pleaseLoginToViewMessages')}
          </p>
        </div>
      </div>
    );
  }

  if (loading || loadingChats) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'var(--surface)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        direction: isRTL ? 'rtl' : 'ltr'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '2px solid transparent',
            borderTop: '2px solid var(--primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>{t('messages.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--surface)',
      direction: isRTL ? 'rtl' : 'ltr'
    }}>
      <MobileHeader
        title={t('messages.title')}
        subtitle={t('messages.subtitle')}
        rightAction={
          <button
            onClick={() => router.push('/blood-requests')}
            className="btn btn-primary"
            style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
          >
            🩸 {t('messages.findRequests')}
          </button>
        }
      />

      <main className="container p-4 sm:p-6 md:p-8" style={{ paddingTop: '80px' }}>

        {chats.length === 0 ? (
          <div className="card p-6 md:p-8" style={{ textAlign: 'center' }}>
            <div className="text-2xl md:text-3xl" style={{ marginBottom: '1rem' }}>💬</div>
            <h3 className="text-lg md:text-xl" style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
              {t('messages.noChatsYet')}
            </h3>
            <p className="text-sm md:text-base mb-6" style={{ color: 'var(--text-secondary)' }}>
              {t('messages.noChatsDesc')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/blood-requests')}
                className="btn btn-primary"
              >
                🩸 {t('messages.findRequests')}
              </button>
              <button
                onClick={() => router.push('/request-blood')}
                className="btn btn-outline"
              >
                🚨 {t('messages.createRequest')}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:gap-6">
            {chats.map((chat) => (
              <div
                key={chat.chatId}
                className="card p-4 md:p-6"
                style={{
                  cursor: 'pointer',
                  borderLeft: `4px solid ${getUrgencyColor(chat.urgency || 'standard')}`,
                  transition: 'all 0.2s ease'
                }}
                onClick={() => handleChatClick(chat)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(37, 99, 235, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                }}
              >
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-lg md:text-xl">🩸</div>
                      <h4 className="text-base md:text-lg font-semibold text-primary truncate">
                        {t('messages.chatWith')} {chat.otherUserName}
                      </h4>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-secondary">
                        <strong>{t('messages.bloodType')}:</strong> {chat.bloodType}
                      </div>
                      <div className="text-sm text-secondary">
                        <strong>{t('messages.hospital')}:</strong> {chat.hospital}
                      </div>
                      <div className="text-sm text-secondary">
                        <strong>{t('messages.lastActivity')}:</strong> {new Date(chat.lastActivity).toLocaleDateString()}
                      </div>
                      <div className="text-sm bg-surface p-2 rounded italic truncate max-w-full md:max-w-md">
                        "{chat.lastMessage}"
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-row md:flex-col gap-2 md:gap-3 md:text-right">
                    <div
                      className="text-xs font-semibold px-3 py-1 rounded-full inline-block"
                      style={{
                        color: getUrgencyColor(chat.urgency || 'standard'),
                        background: `${getUrgencyColor(chat.urgency || 'standard')}20`,
                      }}
                    >
                      {(chat.urgency || 'standard').toUpperCase()}
                    </div>
                    <div
                      className="text-xs font-semibold px-3 py-1 rounded-full inline-block"
                      style={{
                        color: chat.isActive ? 'var(--success)' : 'var(--text-secondary)',
                        background: chat.isActive ? 'rgba(5, 150, 105, 0.1)' : 'var(--surface)',
                      }}
                    >
                      {chat.isActive ? t('messages.active') : t('messages.inactive')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '2px solid transparent',
            borderTop: '2px solid var(--primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading messages...</p>
        </div>
      </div>
    }>
      <MessagesPageContent />
    </Suspense>
  );
}