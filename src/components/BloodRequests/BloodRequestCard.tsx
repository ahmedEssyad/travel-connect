'use client';

import { useState, useCallback, memo, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { apiClient } from '@/lib/api-client';
import { formatDistance } from '@/lib/geolocation-utils';
import { useLocation } from '@/contexts/LocationContext';

interface BloodRequestCardProps {
  request: any;
  onResponseUpdate?: () => void;
}

// Simple distance calculation helper
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

function BloodRequestCard({ request, onResponseUpdate }: BloodRequestCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { location } = useLocation();
  const toast = useToast();
  const [helping, setHelping] = useState(false);

  // Calculate distance if user location is available (memoized)
  const distance = useMemo(() => {
    if (!location || !request.hospital?.coordinates) return null;
    return formatDistance(
      calculateDistance(
        location.lat,
        location.lng,
        request.hospital.coordinates.lat,
        request.hospital.coordinates.lng
      )
    );
  }, [location, request.hospital?.coordinates]);

  const handleHelp = useCallback(async () => {
    if (!user) {
      toast.error('Please log in to help');
      return;
    }

    if (!user.bloodType) {
      toast.error('Please update your blood type in your profile first');
      router.push('/profile');
      return;
    }

    setHelping(true);
    try {
      const response = await apiClient.post('/api/blood-requests/respond', {
        requestId: request._id
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Great! Starting chat with the requester...');
        
        // Navigate directly to chat with the auto-created chat
        router.push(`/chat?chatId=${data.chatId}&requestId=${request._id}`);
        
        // Update parent component
        if (onResponseUpdate) {
          onResponseUpdate();
        }
      } else {
        const errorText = await response.text();
        toast.error(errorText || 'Failed to respond to request');
      }
    } catch (error) {
      console.error('Help request error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setHelping(false);
    }
  }, [user, router, toast, request._id, onResponseUpdate]);

  const openChat = useCallback(() => {
    if (!user) {
      toast.error('Please log in to chat');
      return;
    }
    // Create chat ID (sorted alphabetically for consistency)
    const chatId = [user.id, request.requesterId].sort().join('_');
    router.push(`/chat?chatId=${chatId}&requestId=${request._id}`);
  }, [user, router, toast, request.requesterId, request._id]);

  const getUrgencyColor = useCallback((urgency: string) => {
    switch (urgency) {
      case 'critical': return 'var(--danger)';
      case 'urgent': return '#f59e0b';
      case 'standard': return 'var(--primary)';
      default: return 'var(--primary)';
    }
  }, []);

  const getUrgencyIcon = useCallback((urgency: string) => {
    switch (urgency) {
      case 'critical': return '🚨';
      case 'urgent': return '⚠️';
      case 'standard': return '🩸';
      default: return '🩸';
    }
  }, []);

  const isExpired = useMemo(() => new Date(request.deadline) < new Date(), [request.deadline]);
  const isOwnRequest = useMemo(() => user?.id === request.requesterId, [user?.id, request.requesterId]);
  const hasAlreadyResponded = useMemo(() => 
    request.matchedDonors?.some((donor: any) => donor.donorId === user?.id),
    [request.matchedDonors, user?.id]
  );

  return (
    <div className="card" style={{ 
      padding: '1.5rem',
      marginBottom: '1rem',
      border: `2px solid ${getUrgencyColor(request.urgencyLevel)}`,
      borderRadius: '0.75rem',
      background: 'white'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '1rem'
      }}>
        <div>
          <h3 style={{ 
            fontSize: '1.25rem',
            fontWeight: '700',
            color: 'var(--text-primary)',
            margin: '0 0 0.5rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {getUrgencyIcon(request.urgencyLevel)}
            {request.patientInfo.bloodType} Blood Needed
          </h3>
          <div style={{ 
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>👤 {request.patientInfo.name}</span>
            <span>•</span>
            <span style={{ 
              color: getUrgencyColor(request.urgencyLevel),
              fontWeight: '600',
              textTransform: 'uppercase'
            }}>
              {request.urgencyLevel}
            </span>
          </div>
        </div>
        <div style={{ 
          textAlign: 'right',
          fontSize: '0.875rem',
          color: 'var(--text-secondary)'
        }}>
          <div>{request.requiredUnits} unit{request.requiredUnits > 1 ? 's' : ''}</div>
          {distance && (
            <div style={{ color: 'var(--primary)', fontWeight: '500' }}>
              📍 {distance}
            </div>
          )}
        </div>
      </div>

      {/* Hospital Info */}
      <div style={{ 
        marginBottom: '1rem',
        padding: '0.75rem',
        background: 'rgba(59, 130, 246, 0.05)',
        borderRadius: '0.5rem',
        border: '1px solid rgba(59, 130, 246, 0.1)'
      }}>
        <div style={{ 
          fontSize: '0.875rem',
          color: 'var(--text-primary)',
          marginBottom: '0.25rem'
        }}>
          🏥 {request.hospital.name}
        </div>
        <div style={{ 
          fontSize: '0.8rem',
          color: 'var(--text-secondary)'
        }}>
          📍 {request.hospital.address}
        </div>
        {request.hospital.department && (
          <div style={{ 
            fontSize: '0.8rem',
            color: 'var(--text-secondary)'
          }}>
            🏥 {request.hospital.department}
          </div>
        )}
      </div>

      {/* Condition */}
      <div style={{ 
        marginBottom: '1rem',
        fontSize: '0.875rem',
        color: 'var(--text-primary)'
      }}>
        💊 {request.patientInfo.condition}
      </div>

      {/* Deadline */}
      <div style={{ 
        marginBottom: '1.5rem',
        fontSize: '0.875rem',
        color: isExpired ? 'var(--danger)' : 'var(--text-secondary)',
        fontWeight: isExpired ? '600' : '400'
      }}>
        ⏰ Deadline: {new Date(request.deadline).toLocaleString()}
        {isExpired && ' (EXPIRED)'}
      </div>

      {/* Responses */}
      {request.matchedDonors && request.matchedDonors.length > 0 && (
        <div style={{ 
          marginBottom: '1rem',
          fontSize: '0.875rem',
          color: 'var(--success)',
          fontWeight: '500'
        }}>
          ✅ {request.matchedDonors.length} donor{request.matchedDonors.length > 1 ? 's' : ''} responded
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ 
        display: 'flex',
        gap: '0.75rem',
        flexWrap: 'wrap'
      }}>
        {!isOwnRequest && !isExpired && (
          <>
            {!hasAlreadyResponded ? (
              <button
                onClick={handleHelp}
                disabled={helping}
                className="btn"
                style={{
                  background: 'var(--danger)',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: helping ? 'not-allowed' : 'pointer',
                  opacity: helping ? '0.7' : '1',
                  flex: 1,
                  minWidth: '120px'
                }}
              >
                {helping ? '⏳ Helping...' : '🔴 I CAN HELP'}
              </button>
            ) : (
              <button
                onClick={openChat}
                className="btn"
                style={{
                  background: 'var(--success)',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  flex: 1,
                  minWidth: '120px'
                }}
              >
                💬 CHAT WITH REQUESTER
              </button>
            )}
          </>
        )}
        
        {!isOwnRequest && (
          <button
            onClick={openChat}
            className="btn btn-outline"
            style={{
              padding: '0.75rem 1rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              minWidth: '80px'
            }}
          >
            💬 CHAT
          </button>
        )}

        {isOwnRequest && (
          <div style={{ 
            flex: 1,
            textAlign: 'center',
            padding: '0.75rem',
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            color: 'var(--primary)',
            fontWeight: '500'
          }}>
            📝 Your Request
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(BloodRequestCard);