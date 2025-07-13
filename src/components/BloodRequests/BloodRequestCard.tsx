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
    <div 
      className="card p-4 sm:p-6 mb-4 rounded-lg bg-white"
      style={{ 
        border: `2px solid ${getUrgencyColor(request.urgencyLevel)}`
      }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
      
        <div className="flex-1 min-w-0">
          <h3 className="text-lg md:text-xl font-bold text-primary m-0 mb-2 flex items-center gap-2">
            {getUrgencyIcon(request.urgencyLevel)}
            <span className="truncate">{request.patientInfo.bloodType} Blood Needed</span>
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-sm text-secondary">
            <span>👤 {request.patientInfo.name}</span>
            <span className="hidden sm:inline">•</span>
            <span 
              className="font-semibold uppercase px-2 py-1 rounded text-xs"
              style={{ 
                color: getUrgencyColor(request.urgencyLevel),
                backgroundColor: `${getUrgencyColor(request.urgencyLevel)}20`
              }}
            >
              {request.urgencyLevel}
            </span>
          </div>
        </div>
        <div className="text-right text-sm text-secondary flex-shrink-0">
          <div className="font-medium">{request.requiredUnits} unit{request.requiredUnits > 1 ? 's' : ''}</div>
          {distance && (
            <div className="text-primary font-medium">
              📍 {distance}
            </div>
          )}
        </div>
      </div>

      {/* Hospital Info - Only show if hospital info is provided */}
      {request.hospital?.name && (
        <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-100">
          <div className="text-sm text-primary mb-1">
            🏥 {request.hospital.name}
          </div>
          {request.hospital.address && (
            <div className="text-xs sm:text-sm text-secondary">
              📍 {request.hospital.address}
            </div>
          )}
          {request.hospital.department && (
            <div className="text-xs sm:text-sm text-secondary">
              🏥 {request.hospital.department}
            </div>
          )}
        </div>
      )}

      {/* Condition */}
      <div className="mb-4 text-sm text-primary">
        💊 {request.patientInfo.condition}
      </div>

      {/* Deadline */}
      <div 
        className="mb-6 text-sm"
        style={{ 
          color: isExpired ? 'var(--danger)' : 'var(--text-secondary)',
          fontWeight: isExpired ? '600' : '400'
        }}
      >
        ⏰ Deadline: {new Date(request.deadline).toLocaleString()}
        {isExpired && ' (EXPIRED)'}
      </div>

      {/* Responses */}
      {request.matchedDonors && request.matchedDonors.length > 0 && (
        <div className="mb-4 text-sm font-medium" style={{ color: 'var(--success)' }}>
          ✅ {request.matchedDonors.length} donor{request.matchedDonors.length > 1 ? 's' : ''} responded
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        {!isOwnRequest && !isExpired && (
          <>
            {!hasAlreadyResponded ? (
              <button
                onClick={handleHelp}
                disabled={helping}
                className="btn touch-target flex-1 text-sm font-semibold"
                style={{
                  background: 'var(--danger)',
                  color: 'white',
                  cursor: helping ? 'not-allowed' : 'pointer',
                  opacity: helping ? '0.7' : '1',
                  minWidth: '120px'
                }}
              >
                {helping ? '⏳ Helping...' : '🔴 I CAN HELP'}
              </button>
            ) : (
              <button
                onClick={openChat}
                className="btn touch-target flex-1 text-sm font-semibold"
                style={{
                  background: 'var(--success)',
                  color: 'white',
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
            className="btn btn-outline touch-target flex-1 sm:flex-initial text-sm font-medium"
            style={{ minWidth: '80px' }}
          >
            💬 CHAT
          </button>
        )}

        {isOwnRequest && (
          <div className="flex-1 text-center p-3 bg-blue-50 rounded text-sm font-medium text-primary">
            📝 Your Request
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(BloodRequestCard);