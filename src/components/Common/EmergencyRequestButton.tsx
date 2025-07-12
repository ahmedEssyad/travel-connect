'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useSocket } from '@/lib/websocket';
import { UrgencyLevel, URGENCY_LEVELS } from '@/lib/blood-types';

interface EmergencyRequestButtonProps {
  onRequestCreated?: () => void;
}

export default function EmergencyRequestButton({ onRequestCreated }: EmergencyRequestButtonProps) {
  const { user } = useAuth();
  const toast = useToast();
  const { socket } = useSocket();
  const [isCreating, setIsCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleEmergencyRequest = () => {
    if (!user) {
      toast.error('Please log in to create an emergency request');
      return;
    }
    setShowForm(true);
  };

  const createEmergencyRequest = async (urgency: UrgencyLevel) => {
    setIsCreating(true);
    try {
      // This would create the actual blood request
      const emergencyRequest = {
        requesterId: user.uid,
        urgencyLevel: urgency,
        patientInfo: {
          bloodType: user.bloodType, // Assuming user has bloodType
          condition: 'Emergency blood needed',
          age: user.age || 0,
          name: user.name
        },
        hospital: {
          name: 'Emergency Location',
          address: user.location || 'Current Location',
          coordinates: {
            lat: 0, // Would get from user's location
            lng: 0
          },
          contactNumber: user.phone || ''
        },
        requiredUnits: 1,
        deadline: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
        description: 'Emergency blood request',
        status: 'active',
        createdAt: new Date()
      };

      // Send via Socket.IO for real-time notification
      if (socket) {
        socket.emit('emergency-blood-request', emergencyRequest);
      }

      // Also save to database via API
      const response = await fetch('/api/blood-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emergencyRequest)
      });

      if (response.ok) {
        toast.success('Emergency blood request sent! Compatible donors are being notified.');
        setShowForm(false);
        onRequestCreated?.();
      } else {
        throw new Error('Failed to create emergency request');
      }
    } catch (error) {
      toast.error('Failed to send emergency request. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  if (showForm) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}>
        <div className="card" style={{
          maxWidth: '400px',
          width: '100%',
          padding: '2rem',
          background: 'white',
          textAlign: 'center'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--danger)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            color: 'white',
            fontSize: '2rem'
          }}>
            🩸
          </div>
          
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: 'var(--danger)',
            marginBottom: '1rem'
          }}>
            Emergency Blood Request
          </h2>
          
          <p style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            marginBottom: '1.5rem'
          }}>
            Select urgency level. Compatible donors will be notified immediately.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <button
              onClick={() => createEmergencyRequest(URGENCY_LEVELS.CRITICAL)}
              disabled={isCreating}
              style={{
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '2px solid var(--danger)',
                background: 'var(--danger)',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: isCreating ? 'not-allowed' : 'pointer',
                opacity: isCreating ? '0.5' : '1'
              }}
            >
              🚨 CRITICAL - Life Threatening
            </button>
            
            <button
              onClick={() => createEmergencyRequest(URGENCY_LEVELS.URGENT)}
              disabled={isCreating}
              style={{
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '2px solid var(--warning)',
                background: 'var(--warning)',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: isCreating ? 'not-allowed' : 'pointer',
                opacity: isCreating ? '0.5' : '1'
              }}
            >
              ⚠️ URGENT - Surgery/Treatment
            </button>
            
            <button
              onClick={() => createEmergencyRequest(URGENCY_LEVELS.STANDARD)}
              disabled={isCreating}
              style={{
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '2px solid var(--primary)',
                background: 'var(--primary)',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: isCreating ? 'not-allowed' : 'pointer',
                opacity: isCreating ? '0.5' : '1'
              }}
            >
              📋 STANDARD - Planned Procedure
            </button>
          </div>

          <button
            onClick={() => setShowForm(false)}
            disabled={isCreating}
            className="btn btn-outline"
            style={{ width: '100%' }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleEmergencyRequest}
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--danger) 0%, #dc2626 100%)',
        border: 'none',
        boxShadow: '0 8px 16px rgba(220, 38, 38, 0.3)',
        color: 'white',
        fontSize: '1.5rem',
        cursor: 'pointer',
        zIndex: 100,
        transition: 'all 0.2s ease',
        animation: 'pulse 2s infinite'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)';
        e.currentTarget.style.boxShadow = '0 12px 24px rgba(220, 38, 38, 0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 8px 16px rgba(220, 38, 38, 0.3)';
      }}
    >
      🆘
      <style jsx>{`
        @keyframes pulse {
          0% { box-shadow: 0 8px 16px rgba(220, 38, 38, 0.3); }
          50% { box-shadow: 0 8px 16px rgba(220, 38, 38, 0.6); }
          100% { box-shadow: 0 8px 16px rgba(220, 38, 38, 0.3); }
        }
      `}</style>
    </button>
  );
}