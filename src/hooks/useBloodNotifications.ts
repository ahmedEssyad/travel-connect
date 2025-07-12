'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '@/lib/websocket';
import { useToast } from '@/contexts/ToastContext';
import { BLOOD_SOCKET_EVENTS } from '@/lib/blood-notification';
import { BloodType, UrgencyLevel } from '@/lib/blood-types';

interface BloodRequest {
  requestId: string;
  urgency: UrgencyLevel;
  bloodType: BloodType;
  patientAge: number;
  condition: string;
  hospital: {
    name: string;
    address: string;
    phone: string;
  };
  requiredUnits: number;
  deadline: Date;
  description: string;
  location: {
    lat: number;
    lng: number;
  };
  createdAt: Date;
}

interface DonorResponse {
  donorId: string;
  donorName: string;
  donorBloodType: BloodType;
  response: 'accepted' | 'declined';
  respondedAt: Date;
  message: string;
}

export function useBloodNotifications() {
  const { socket, connected } = useSocket();
  const [activeRequests, setActiveRequests] = useState<BloodRequest[]>([]);
  const [donorResponses, setDonorResponses] = useState<DonorResponse[]>([]);
  
  // Safely get toast context
  let toast: any = null;
  try {
    toast = useToast();
  } catch (error) {
    console.warn('Toast context not available:', error);
  }

  useEffect(() => {
    if (!socket || !connected) return;

    // Listen for urgent blood requests
    socket.on(BLOOD_SOCKET_EVENTS.URGENT_BLOOD_REQUEST, (request: BloodRequest) => {
      console.log('🩸 Urgent blood request received:', request);
      
      // Add to active requests
      setActiveRequests(prev => [request, ...prev]);
      
      // Show toast notification
      const urgencyEmoji = request.urgency === 'critical' ? 'CRITICAL' : request.urgency === 'urgent' ? 'URGENT' : 'STANDARD';
      if (toast) {
        toast.error(
          `${urgencyEmoji} BLOOD REQUEST: ${request.bloodType} needed at ${request.hospital.name} - Patient: ${request.condition}`,
          {
            duration: request.urgency === 'critical' ? 15000 : 10000, // Longer for critical
          }
        );
      }

      // Play notification sound for critical requests
      if (request.urgency === 'critical') {
        try {
          const audio = new Audio('/sounds/emergency-alert.mp3');
          audio.play().catch(e => console.log('Could not play notification sound'));
        } catch (e) {
          console.log('Audio not supported');
        }
      }
    });

    // Listen for donor responses
    socket.on(BLOOD_SOCKET_EVENTS.DONOR_RESPONSE, (response: DonorResponse) => {
      console.log('👥 Donor response received:', response);
      
      setDonorResponses(prev => [response, ...prev]);
      
      if (toast) {
        if (response.response === 'accepted') {
          toast.success(
            `${response.donorName} accepted your blood request!`,
            { duration: 8000 }
          );
        } else {
          toast.info(
            `${response.donorName} cannot donate at this time.`,
            { duration: 5000 }
          );
        }
      }
    });

    // Listen for request updates
    socket.on(BLOOD_SOCKET_EVENTS.BLOOD_REQUEST_UPDATE, (update: any) => {
      console.log('📊 Blood request update:', update);
      
      // Remove from active requests if fulfilled or expired
      if (update.status === 'fulfilled' || update.status === 'expired') {
        setActiveRequests(prev => prev.filter(req => req.requestId !== update.requestId));
      }
      
      if (toast) {
        if (update.status === 'fulfilled') {
          toast.success(`Blood request fulfilled at ${update.hospital}!`);
        } else if (update.status === 'expired') {
          toast.warning(`Blood request expired at ${update.hospital}`);
        }
      }
    });

    // Listen for emergency broadcasts
    socket.on('emergency-broadcast', (broadcast: any) => {
      console.log('📢 Emergency broadcast:', broadcast);
      
      if (toast) {
        toast.warning(
          `EMERGENCY BROADCAST: ${broadcast.message}`,
          {
            duration: 12000,
          }
        );
      }
    });

    return () => {
      socket.off(BLOOD_SOCKET_EVENTS.URGENT_BLOOD_REQUEST);
      socket.off(BLOOD_SOCKET_EVENTS.DONOR_RESPONSE);
      socket.off(BLOOD_SOCKET_EVENTS.BLOOD_REQUEST_UPDATE);
      socket.off('emergency-broadcast');
    };
  }, [socket, connected, toast]);

  // Join donor room when connected
  useEffect(() => {
    if (socket && connected) {
      // Join general blood requests room
      socket.emit('join-room', 'blood-requests');
      
      // Join donor-specific room (if user is a donor)
      // This would be based on user's donor status
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (user.bloodType && user.isDonor) {
            socket.emit(BLOOD_SOCKET_EVENTS.JOIN_DONOR_ROOM, {
              donorId: user.uid,
              bloodType: user.bloodType
            });
          }
        } catch (e) {
          console.log('Error parsing user data');
        }
      }
    }
  }, [socket, connected]);

  // Function to respond to blood request
  const respondToBloodRequest = (requestId: string, response: 'accepted' | 'declined') => {
    if (socket && connected) {
      socket.emit(BLOOD_SOCKET_EVENTS.DONOR_RESPONSE, {
        requestId,
        response,
        respondedAt: new Date()
      });
    }
  };

  // Function to clear old requests
  const clearOldRequests = () => {
    const now = new Date();
    setActiveRequests(prev => prev.filter(req => 
      new Date(req.deadline) > now
    ));
  };

  return {
    activeRequests,
    donorResponses,
    respondToBloodRequest,
    clearOldRequests
  };
}