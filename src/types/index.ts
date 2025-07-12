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

export interface Trip {
  _id: string;
  id: string; // For compatibility
  userId: string;
  from: string;
  to: string;
  fromCoords?: { lat: number; lng: number };
  toCoords?: { lat: number; lng: number };
  departureDate: Date;
  arrivalDate: Date;
  tripType: 'car_sharing' | 'delivery_service';
  capacity: number;
  allowedItems: string[];
  description?: string;
  photos?: string[]; // Trip photos
  status?: 'active' | 'completed' | 'cancelled';
  createdAt: Date;
}

export interface Request {
  _id: string;
  id: string; // For compatibility
  userId: string;
  from: string;
  to: string;
  fromCoords?: { lat: number; lng: number };
  toCoords?: { lat: number; lng: number };
  deadline: Date;
  requestType: 'travel_companion' | 'delivery_request';
  itemType?: string;
  description?: string;
  reward?: string;
  photo?: string;
  photos?: string[]; // Multiple item photos
  status?: 'active' | 'matched' | 'completed' | 'cancelled';
  createdAt: Date;
}

export interface Match {
  id: string;
  tripId: string;
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