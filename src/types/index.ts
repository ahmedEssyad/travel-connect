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
  id: string;
  userId: string;
  from: string;
  to: string;
  departureDate: Date;
  arrivalDate: Date;
  capacity: number;
  allowedItems: string[];
  description?: string;
  createdAt: Date;
}

export interface Request {
  id: string;
  userId: string;
  from: string;
  to: string;
  deadline: Date;
  itemType: string;
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