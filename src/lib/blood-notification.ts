import { Server as SocketServer } from 'socket.io';
import { BloodType, UrgencyLevel, getCompatibleDonors, getUrgencyRadius } from './blood-types';

interface BloodRequest {
  _id: string;
  requesterId: string;
  patientInfo: {
    name: string;
    age: number;
    bloodType: BloodType;
    condition: string;
  };
  hospital: {
    name: string;
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    contactNumber: string;
  };
  urgencyLevel: UrgencyLevel;
  requiredUnits: number;
  deadline: Date;
  description: string;
  status: 'active' | 'fulfilled' | 'expired' | 'cancelled';
  createdAt: Date;
}

interface Donor {
  uid: string;
  name: string;
  phone: string;
  bloodType: BloodType;
  location: {
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  medicalInfo: {
    availableForDonation: boolean;
    lastDonationDate: Date;
  };
  notificationPreferences: {
    sms: boolean;
    push: boolean;
    email: boolean;
    urgencyLevels: UrgencyLevel[];
  };
}

// Socket.IO notification events
export const BLOOD_SOCKET_EVENTS = {
  // Client events
  JOIN_DONOR_ROOM: 'join-donor-room',
  LEAVE_DONOR_ROOM: 'leave-donor-room',
  DONOR_RESPONSE: 'donor-response',
  
  // Server events
  URGENT_BLOOD_REQUEST: 'urgent-blood-request',
  BLOOD_REQUEST_UPDATE: 'blood-request-update',
  DONOR_MATCH_FOUND: 'donor-match-found',
  REQUEST_FULFILLED: 'request-fulfilled',
  REQUEST_EXPIRED: 'request-expired'
} as const;

export class BloodNotificationService {
  private io: SocketServer;
  
  constructor(socketServer: SocketServer) {
    this.io = socketServer;
  }

  // Send urgent blood request to all compatible donors
  async sendUrgentBloodRequest(bloodRequest: BloodRequest, compatibleDonors: Donor[]) {
    const notification = {
      requestId: bloodRequest._id,
      urgency: bloodRequest.urgencyLevel,
      bloodType: bloodRequest.patientInfo.bloodType,
      patientAge: bloodRequest.patientInfo.age,
      condition: bloodRequest.patientInfo.condition,
      hospital: {
        name: bloodRequest.hospital.name,
        address: bloodRequest.hospital.address,
        phone: bloodRequest.hospital.contactNumber
      },
      requiredUnits: bloodRequest.requiredUnits,
      deadline: bloodRequest.deadline,
      description: bloodRequest.description,
      location: bloodRequest.hospital.coordinates,
      createdAt: bloodRequest.createdAt
    };

    // Send to all compatible donors
    compatibleDonors.forEach(donor => {
      this.io.to(`donor-${donor.uid}`).emit(BLOOD_SOCKET_EVENTS.URGENT_BLOOD_REQUEST, notification);
    });

    // Also broadcast to general blood request room for real-time updates
    this.io.to('blood-requests').emit(BLOOD_SOCKET_EVENTS.URGENT_BLOOD_REQUEST, notification);

    console.log(`📢 Urgent blood request sent to ${compatibleDonors.length} compatible donors`);
  }

  // Notify requester when donor responds
  async notifyDonorResponse(requesterId: string, donorInfo: any, response: 'accepted' | 'declined') {
    const notification = {
      donorId: donorInfo.uid,
      donorName: donorInfo.name,
      donorBloodType: donorInfo.bloodType,
      response,
      respondedAt: new Date(),
      message: response === 'accepted' 
        ? `${donorInfo.name} has accepted your blood request!`
        : `${donorInfo.name} cannot donate at this time.`
    };

    this.io.to(`user-${requesterId}`).emit(BLOOD_SOCKET_EVENTS.DONOR_RESPONSE, notification);
  }

  // Notify when request status changes
  async notifyRequestUpdate(bloodRequest: BloodRequest, updateType: 'fulfilled' | 'expired' | 'cancelled') {
    const notification = {
      requestId: bloodRequest._id,
      status: updateType,
      bloodType: bloodRequest.patientInfo.bloodType,
      hospital: bloodRequest.hospital.name,
      updatedAt: new Date()
    };

    // Notify the requester
    this.io.to(`user-${bloodRequest.requesterId}`).emit(BLOOD_SOCKET_EVENTS.BLOOD_REQUEST_UPDATE, notification);

    // Broadcast to blood requests room
    this.io.to('blood-requests').emit(BLOOD_SOCKET_EVENTS.BLOOD_REQUEST_UPDATE, notification);

    // Emit specific event based on update type
    switch (updateType) {
      case 'fulfilled':
        this.io.to('blood-requests').emit(BLOOD_SOCKET_EVENTS.REQUEST_FULFILLED, notification);
        break;
      case 'expired':
        this.io.to('blood-requests').emit(BLOOD_SOCKET_EVENTS.REQUEST_EXPIRED, notification);
        break;
    }
  }

  // Send SMS notification (integration with Twilio)
  async sendSMSNotification(donor: Donor, bloodRequest: BloodRequest) {
    const message = `🩸 ${bloodRequest.urgencyLevel.toUpperCase()}: ${bloodRequest.patientInfo.bloodType} blood needed at ${bloodRequest.hospital.name}. Patient: ${bloodRequest.patientInfo.condition}. Reply YES to help or open app for details.`;

    // This would integrate with Twilio API
    console.log(`📱 SMS sent to ${donor.phone}: ${message}`);
    
    // You would implement actual SMS sending here:
    // await this.smsService.send(donor.phone, message);
  }

  // Real-time donor tracking
  async trackDonorLocation(donorId: string, coordinates: { lat: number; lng: number }) {
    this.io.to(`donor-${donorId}`).emit('location-update', {
      donorId,
      coordinates,
      timestamp: new Date()
    });
  }

  // Emergency broadcast to all active donors
  async sendEmergencyBroadcast(message: string, targetBloodTypes?: BloodType[]) {
    const notification = {
      type: 'emergency',
      message,
      targetBloodTypes,
      timestamp: new Date()
    };

    if (targetBloodTypes) {
      // Send to specific blood types
      targetBloodTypes.forEach(bloodType => {
        this.io.to(`blood-type-${bloodType}`).emit('emergency-broadcast', notification);
      });
    } else {
      // Send to all donors
      this.io.to('all-donors').emit('emergency-broadcast', notification);
    }
  }
}

// Helper function to calculate distance between two points
export function calculateDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Find compatible donors within radius
export async function findCompatibleDonors(bloodRequest: BloodRequest, allDonors: Donor[]): Promise<Donor[]> {
  const compatibleBloodTypes = getCompatibleDonors(bloodRequest.patientInfo.bloodType);
  const radiusKm = getUrgencyRadius(bloodRequest.urgencyLevel);
  const minDaysSinceLastDonation = 56; // 8 weeks minimum

  return allDonors.filter(donor => {
    // Check blood type compatibility
    if (!compatibleBloodTypes.includes(donor.bloodType)) {
      return false;
    }

    // Check availability
    if (!donor.medicalInfo.availableForDonation) {
      return false;
    }

    // Check last donation date
    const daysSinceLastDonation = Math.floor(
      (Date.now() - new Date(donor.medicalInfo.lastDonationDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLastDonation < minDaysSinceLastDonation) {
      return false;
    }

    // Check notification preferences
    if (!donor.notificationPreferences.urgencyLevels.includes(bloodRequest.urgencyLevel)) {
      return false;
    }

    // Check geographic distance
    const distance = calculateDistance(
      bloodRequest.hospital.coordinates.lat,
      bloodRequest.hospital.coordinates.lng,
      donor.location.coordinates.lat,
      donor.location.coordinates.lng
    );

    return distance <= radiusKm;
  });
}