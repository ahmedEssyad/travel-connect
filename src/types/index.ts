export interface User {
  uid: string;
  email: string;
  name: string;
  photo?: string;
  location?: string;
  bio?: string;
  rating: number;
  createdAt: Date;
}

export interface Trip {
  _id: string;
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
  createdAt: Date;
}

export interface Request {
  _id: string;
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