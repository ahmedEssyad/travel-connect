import { canDonateToPatient } from './blood-types';
import { calculateDistance } from './geolocation';

export interface NotificationData {
  id: string;
  type: 'blood_request' | 'donation_update' | 'chat_message';
  title: string;
  message: string;
  data?: any;
  timestamp: Date;
  read: boolean;
  urgent: boolean;
}

export interface EligibilityCheck {
  isEligible: boolean;
  reasons: string[];
  bloodTypeMatch: boolean;
  distanceMatch: boolean;
  availabilityMatch: boolean;
}

/**
 * Check if user is eligible to donate for a blood request
 */
export function checkDonationEligibility(
  user: any,
  bloodRequest: any,
  maxDistance: number = 50 // km
): EligibilityCheck {
  const reasons: string[] = [];
  let isEligible = true;

  // Check blood type compatibility
  const bloodTypeMatch = user.bloodType && 
    canDonateToPatient(user.bloodType, bloodRequest.patientInfo.bloodType);
  
  if (!bloodTypeMatch) {
    reasons.push(`Your blood type ${user.bloodType || 'unknown'} is not compatible with ${bloodRequest.patientInfo.bloodType}`);
    isEligible = false;
  }

  // Check distance (if user has location)
  let distanceMatch = true;
  if (user.location && bloodRequest.hospital.coordinates) {
    const distance = calculateDistance(
      user.location.lat,
      user.location.lng,
      bloodRequest.hospital.coordinates.lat,
      bloodRequest.hospital.coordinates.lng
    );
    
    distanceMatch = distance <= maxDistance;
    if (!distanceMatch) {
      reasons.push(`Hospital is ${distance.toFixed(1)}km away (max ${maxDistance}km)`);
      isEligible = false;
    }
  }

  // Check availability (if user has set availability)
  const availabilityMatch = user.medicalInfo?.availableForDonation !== false;
  if (!availabilityMatch) {
    reasons.push('You have marked yourself as unavailable for donation');
    isEligible = false;
  }

  // Check if user already responded
  const alreadyResponded = bloodRequest.matchedDonors?.some(
    (donor: any) => donor.donorId === user.id
  );
  if (alreadyResponded) {
    reasons.push('You have already responded to this request');
    isEligible = false;
  }

  // Check if it's user's own request
  if (bloodRequest.requesterId === user.id) {
    reasons.push('This is your own blood request');
    isEligible = false;
  }

  return {
    isEligible,
    reasons,
    bloodTypeMatch,
    distanceMatch,
    availabilityMatch
  };
}

/**
 * Create notification for eligible donors
 */
export function createBloodRequestNotification(
  bloodRequest: any,
  urgentOnly: boolean = false
): NotificationData {
  const isUrgent = bloodRequest.urgencyLevel === 'critical';
  
  if (urgentOnly && !isUrgent) {
    return null;
  }

  const urgencyEmoji = {
    critical: '🚨',
    urgent: '⚠️',
    standard: '🩸'
  }[bloodRequest.urgencyLevel];

  return {
    id: `blood_request_${bloodRequest._id}`,
    type: 'blood_request',
    title: `${urgencyEmoji} ${bloodRequest.patientInfo.bloodType} Blood Needed`,
    message: `${bloodRequest.patientInfo.name} needs ${bloodRequest.patientInfo.bloodType} blood at ${bloodRequest.hospital.name}. Can you help?`,
    data: {
      requestId: bloodRequest._id,
      bloodType: bloodRequest.patientInfo.bloodType,
      hospital: bloodRequest.hospital.name,
      urgency: bloodRequest.urgencyLevel,
      deadline: bloodRequest.deadline
    },
    timestamp: new Date(),
    read: false,
    urgent: isUrgent
  };
}

/**
 * Send SMS notification (client-safe wrapper)
 */
export async function sendSMSNotification(
  phoneNumber: string,
  message: string,
  urgent: boolean = false
): Promise<boolean> {
  // Only execute on server-side
  if (typeof window !== 'undefined') {
    console.warn('sendSMSNotification called on client-side, skipping');
    return false;
  }

  try {
    // Use the dedicated SMS service
    const { sendSMS } = await import('./sms-service');
    const result = await sendSMS(phoneNumber, message);
    
    console.log(`SMS result for ${phoneNumber}:`, result.success ? 'success' : result.error);
    return result.success;
  } catch (error) {
    console.error('SMS notification failed:', error);
    return false;
  }
}

/**
 * Send push notification
 */
export async function sendPushNotification(
  userId: string,
  notification: NotificationData
): Promise<boolean> {
  try {
    const response = await fetch('/api/notifications/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        urgent: notification.urgent
      })
    });

    return response.ok;
  } catch (error) {
    console.error('Push notification failed:', error);
    return false;
  }
}

/**
 * Create SMS message for blood request
 */
export function createSMSMessage(bloodRequest: any): string {
  const urgencyText = bloodRequest.urgencyLevel === 'critical' ? 'URGENT' : 
                     bloodRequest.urgencyLevel === 'urgent' ? 'Urgent' : '';
  
  return `${urgencyText} BloodConnect: ${bloodRequest.patientInfo.bloodType} blood needed for ${bloodRequest.patientInfo.name} at ${bloodRequest.hospital.name}. Can you help? Open app to respond.`;
}

/**
 * Get user's notification preferences
 */
export function shouldNotifyUser(user: any, bloodRequest: any): {
  sms: boolean;
  push: boolean;
  inApp: boolean;
} {
  const preferences = user.notificationPreferences || {
    sms: true,
    push: true,
    email: false,
    urgencyLevels: ['critical', 'urgent', 'standard']
  };

  const shouldNotify = preferences.urgencyLevels.includes(bloodRequest.urgencyLevel);

  return {
    sms: shouldNotify && preferences.sms,
    push: shouldNotify && preferences.push,
    inApp: shouldNotify // Always show in-app if eligible
  };
}

/**
 * Format notification time ago
 */
export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}