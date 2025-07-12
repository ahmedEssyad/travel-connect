import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  phoneNumber: string; // Primary identifier for phone-based auth
  name: string;
  email?: string; // Optional
  photo?: string;
  bloodType?: string;
  // Location is now handled dynamically via LocationContext - not stored permanently
  bio?: string;
  password?: string; // For password-based authentication
  hasPassword?: boolean; // Whether user has set a password
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
  rating: number;
  totalDonations?: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  phoneNumber: { type: String, required: true, unique: true },
  name: { type: String, default: '' },
  email: { type: String, default: '' },
  photo: { type: String },
  bloodType: { 
    type: String, 
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    sparse: true
  },
  // Location removed - now handled dynamically via LocationContext
  bio: { type: String },
  password: { type: String, select: false }, // Password field (excluded from queries by default)
  hasPassword: { type: Boolean, default: false }, // Whether user has set a password
  medicalInfo: {
    weight: { type: Number },
    age: { type: Number },
    lastDonationDate: { type: Date },
    medicalConditions: [{ type: String }],
    availableForDonation: { type: Boolean, default: false },
    isDonor: { type: Boolean, default: false }
  },
  emergencyContacts: [{
    name: { type: String },
    phone: { type: String },
    relationship: { type: String }
  }],
  notificationPreferences: {
    sms: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    urgencyLevels: [{ 
      type: String, 
      enum: ['critical', 'urgent', 'standard'],
      default: ['critical', 'urgent', 'standard']
    }]
  },
  deviceTokens: [{ type: String }],
  isVerified: { type: Boolean, default: true }, // Phone verification handles this
  rating: { type: Number, default: 5 },
  totalDonations: { type: Number, default: 0 },
}, {
  timestamps: true,
});

// Location-based queries now handled via real-time geolocation in LocationContext

// Create compound index for blood type and availability
UserSchema.index({ 
  bloodType: 1, 
  'medicalInfo.availableForDonation': 1,
  'medicalInfo.isDonor': 1
});

// Create index for notification preferences
UserSchema.index({ 
  'notificationPreferences.urgencyLevels': 1 
});

// Create index for phone number searches (already unique, but adding for performance)
UserSchema.index({ phoneNumber: 1 });

// Create index for donor queries (most common query)
UserSchema.index({ 
  'medicalInfo.isDonor': 1,
  'medicalInfo.availableForDonation': 1,
  bloodType: 1
});

// Create index for donation history
UserSchema.index({ 
  totalDonations: -1,
  'medicalInfo.lastDonationDate': -1
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);