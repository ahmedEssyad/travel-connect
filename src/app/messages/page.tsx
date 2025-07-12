'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
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
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);

  // Load user's chat conversations
  useEffect(() => {
    if (user) {
      loadChats();
    }
  }, [user]);

  // Check URL params for specific chat and redirect to chat page
  useEffect(() => {
    const chatId = searchParams.get('chatId');
    const requestId = searchParams.get('requestId');
    
    if (chatId) {
      // Redirect to the new chat page
      router.push(`/chat?chatId=${chatId}${requestId ? `&requestId=${requestId}` : ''}`);
    }
  }, [searchParams, router]);

  const loadChats = async () => {
    try {
      setLoadingChats(true);
      
      // Get ALL blood requests to find user's chats (not just active ones)
      const response = await apiClient.get(`/api/blood-requests?limit=100`);
      
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
                const chatId = [user?.id, donor.donorId].sort().join('_');
                
                // Check if this chat already exists to avoid duplicates
                const existingChat = userChats.find(chat => chat.chatId === chatId);
                if (!existingChat) {
                  userChats.push({
                    chatId,
                    otherUserId: donor.donorId,
                    otherUserName: donor.donorName,
                    lastMessage: 'Blood request connection',
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
              const chatId = [user?.id, request.requesterId].sort().join('_');
              
              // Check if this chat already exists to avoid duplicates
              const existingChat = userChats.find(chat => chat.chatId === chatId);
              if (!existingChat) {
                userChats.push({
                  chatId,
                  otherUserId: request.requesterId,
                  otherUserName: request.contactInfo?.requesterName || 'Requester',
                  lastMessage: 'Blood request connection',
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
        
        // Sort chats by last activity (most recent first)
        userChats.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
        
        setChats(userChats);
        console.log(`Found ${userChats.length} chats for user ${user?.id}`);
      } else {
        const errorText = await response.text();
        console.error('Failed to load chats:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
      toast.error('Failed to load chats');
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
      <div style={{ minHeight: '100vh', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: '600', color: 'var(--text-muted)' }}>
            Access Restricted
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>
            Please log in to view your messages.
          </p>
        </div>
      </div>
    );
  }

  if (loading || loadingChats) {
    return (
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
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <MobileHeader
        title="Messages"
        rightAction={
          <button
            onClick={() => router.push('/blood-requests')}
            className="btn btn-primary"
            style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
          >
            🩸 Find Requests
          </button>
        }
      />

      <main className="container" style={{ padding: '1rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            Your Blood Request Chats
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Direct communication with donors and requesters
          </p>
        </div>

        {chats.length === 0 ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              No Chats Yet
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              When you help with blood requests, you'll be able to chat here
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => router.push('/blood-requests')}
                className="btn btn-primary"
              >
                🩸 Find Requests
              </button>
              <button
                onClick={() => router.push('/request-blood')}
                className="btn btn-outline"
              >
                🚨 Create Request
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {chats.map((chat) => (
              <div
                key={chat.chatId}
                className="card"
                style={{
                  padding: '1.5rem',
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <div style={{ fontSize: '1.5rem' }}>🩸</div>
                      <h4 style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                        Chat with {chat.otherUserName}
                      </h4>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      <strong>Blood Type:</strong> {chat.bloodType}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      <strong>Hospital:</strong> {chat.hospital}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      <strong>Connected:</strong> {new Date(chat.lastActivity).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: getUrgencyColor(chat.urgency || 'standard'),
                      background: `${getUrgencyColor(chat.urgency || 'standard')}20`,
                      padding: '0.25rem 0.75rem',
                      borderRadius: '1rem',
                      marginBottom: '0.5rem'
                    }}>
                      {(chat.urgency || 'standard').toUpperCase()}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: chat.isActive ? 'var(--success)' : 'var(--text-secondary)',
                      background: chat.isActive ? 'rgba(5, 150, 105, 0.1)' : 'var(--surface)',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '1rem'
                    }}>
                      {chat.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </div>
                  </div>
                </div>
                
                <div style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  background: 'var(--surface)',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  fontStyle: 'italic'
                }}>
                  💬 Tap to open chat
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