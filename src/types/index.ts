export interface User {
  id: string;
  phoneNumber: string;
  name: string;
  email?: string;
  photo?: string;
  bloodType?: string;
  bio?: string;
  medicalInfo?: {
    weight?: number;
    age?: number;
    lastDonationDate?: Date;
    medicalConditions?: string[];
    availableForDonation?: boolean;
    isDonor?: boolean;
  };
  emergencyContacts?: {
    name?: string;
    phone?: string;
    relationship?: string;
  }[];
  notificationPreferences?: {
    sms?: boolean;
    push?: boolean;
    email?: boolean;
    urgencyLevels?: string[];
  };
  deviceTokens?: string[];
  isVerified?: boolean;
  hasPassword?: boolean;
  rating: number;
  totalDonations?: number;
  isProfileComplete?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Request {
  _id: string;
  id: string; // For compatibility
  userId: string;
  title: string;
  description?: string;
  bloodType: string;
  urgencyLevel: 'critical' | 'urgent' | 'standard';
  patientInfo: {
    name: string;
    age: number;
    condition: string;
  };
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  hospital?: {
    name?: string;
    address?: string;
    coordinates?: { lat: number; lng: number };
  };
  contactInfo: {
    phone: string;
    alternatePhone?: string;
  };
  deadline: Date;
  status?: 'active' | 'matched' | 'completed' | 'cancelled';
  createdAt: Date;
}

export interface Match {
  id: string;
  donorId: string;
  requestId: string;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  createdAt: Date;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: Date;
}