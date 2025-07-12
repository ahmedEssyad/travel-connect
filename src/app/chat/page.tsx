'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { apiClient } from '@/lib/api-client';
import MobileHeader from '@/components/Layout/MobileHeader';
import ChatWindow from '@/components/Chat/ChatWindow';
import DonationConfirmation from '@/components/Donations/DonationConfirmation';

function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const toast = useToast();
  const [requestInfo, setRequestInfo] = useState<any>(null);
  const [otherUserName, setOtherUserName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const chatId = searchParams.get('chatId');
  const requestId = searchParams.get('requestId');
  
  // Debug URL params
  console.log('Chat page params:', { chatId, requestId });

  useEffect(() => {
    if (chatId && requestId) {
      fetchRequestInfo();
    } else if (chatId) {
      setLoading(false);
    }
  }, [chatId, requestId]);

  const fetchRequestInfo = async () => {
    if (!requestId) return;

    try {
      const response = await apiClient.get(`/api/blood-requests/${requestId}`);
      
      if (response.ok) {
        const data = await response.json();
        setRequestInfo({
          patientName: data.patientInfo.name,
          bloodType: data.patientInfo.bloodType,
          hospital: data.hospital.name,
          urgency: data.urgencyLevel
        });

        // Determine other user name based on who's chatting
        if (user?.id === data.requesterId) {
          // Current user is the requester, find the donor
          const donor = data.matchedDonors?.find((d: any) => 
            chatId?.includes(d.donorId)
          );
          setOtherUserName(donor?.donorName || 'Donor');
        } else {
          // Current user is the donor
          setOtherUserName(data.contactInfo.requesterName || 'Requester');
        }
      } else {
        console.error('Failed to fetch request info');
      }
    } catch (error) {
      console.error('Error fetching request info:', error);
      toast.error('Failed to load request information');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'var(--surface)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: '600', color: 'var(--text-muted)' }}>
            Access Restricted
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>Please log in to view this chat.</p>
        </div>
      </div>
    );
  }

  if (!chatId) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'var(--surface)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: '600', color: 'var(--text-muted)' }}>
            Chat Not Found
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Invalid chat ID or chat does not exist.
          </p>
          <button
            onClick={() => router.push('/blood-requests')}
            className="btn btn-primary"
          >
            Back to Blood Requests
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <MobileHeader
        title={`Chat${otherUserName ? ` with ${otherUserName}` : ''}`}
        showBack={true}
        onBack={() => router.push('/blood-requests')}
        rightAction={
          <button
            onClick={() => router.push('/blood-requests')}
            className="btn btn-outline"
            style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
          >
            🩸 Requests
          </button>
        }
      />

      <main style={{ padding: '1rem' }}>
        <div style={{ 
          maxWidth: '800px', 
          margin: '0 auto',
          background: 'white',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          minHeight: '600px'
        }}>
          {loading ? (
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
          ) : (
            <>
              <ChatWindow
                chatId={chatId}
                otherUserName={otherUserName}
                requestInfo={requestInfo}
              />
              
              {/* Donation Confirmation Section */}
              {requestId && (
                <DonationConfirmation
                  requestId={requestId}
                  onConfirmed={() => {
                    // Refresh request info after confirmation
                    fetchRequestInfo();
                  }}
                />
              )}
              
              {/* Show message if no requestId for debugging */}
              {!requestId && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '1rem', 
                  background: '#fef3c7', 
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  color: '#92400e',
                  border: '1px solid #fbbf24'
                }}>
                  💡 <strong>Note:</strong> Donation confirmation is available when you access this chat from a blood request.
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ChatPage() {
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
          <p style={{ color: 'var(--text-secondary)' }}>Loading chat...</p>
        </div>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}