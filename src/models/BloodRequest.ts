import mongoose, { Document, Schema } from 'mongoose';

export interface IBloodRequest extends Document {
  requesterId: string;
  patientInfo: {
    name: string;
    age: number;
    bloodType: string;
    condition: string;
    urgentNote?: string;
  };
  hospital?: {
    name?: string;
    address?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    contactNumber?: string;
    department?: string;
  };
  urgencyLevel: 'critical' | 'urgent' | 'standard';
  requiredUnits: number;
  deadline: Date;
  description?: string;
  status: 'active' | 'fulfilled' | 'expired' | 'cancelled';
  matchedDonors: Array<{
    donorId: string;
    donorName: string;
    donorBloodType: string;
    status: 'pending' | 'accepted' | 'completed' | 'declined';
    respondedAt?: Date;
    completedAt?: Date;
    notes?: string;
  }>;
  fulfilledUnits: number;
  contactInfo: {
    requesterName: string;
    requesterPhone: string;
    alternateContact?: string;
  };
  medicalDetails?: {
    procedure?: string;
    doctorName?: string;
    roomNumber?: string;
    specialInstructions?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const BloodRequestSchema: Schema = new Schema({
  requesterId: { type: String, required: true },
  patientInfo: {
    name: { type: String, required: true },
    age: { type: Number, required: true, min: 0, max: 150 },
    bloodType: { 
      type: String, 
      required: true,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    condition: { type: String, required: true },
    urgentNote: { type: String }
  },
  hospital: {
    name: { type: String },
    address: { type: String },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    },
    contactNumber: { type: String },
    department: { type: String }
  },
  urgencyLevel: { 
    type: String, 
    required: true,
    enum: ['critical', 'urgent', 'standard'],
    default: 'standard'
  },
  requiredUnits: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 10 
  },
  deadline: { type: Date, required: true },
  description: { type: String, maxlength: 1000 },
  status: { 
    type: String, 
    required: true,
    enum: ['active', 'fulfilled', 'expired', 'cancelled'],
    default: 'active'
  },
  matchedDonors: [{
    donorId: { type: String, required: true },
    donorName: { type: String, required: true },
    donorBloodType: { type: String, required: true },
    status: { 
      type: String, 
      required: true,
      enum: ['pending', 'accepted', 'completed', 'declined'],
      default: 'pending'
    },
    respondedAt: { type: Date },
    completedAt: { type: Date },
    notes: { type: String }
  }],
  fulfilledUnits: { type: Number, default: 0, min: 0 },
  contactInfo: {
    requesterName: { type: String, required: true },
    requesterPhone: { type: String, required: true },
    alternateContact: { type: String }
  },
  medicalDetails: {
    procedure: { type: String },
    doctorName: { type: String },
    roomNumber: { type: String },
    specialInstructions: { type: String }
  }
}, {
  timestamps: true,
});

// Create geospatial index for location-based queries
BloodRequestSchema.index({ 'hospital.coordinates': '2dsphere' });

// Create compound index for active requests by blood type and urgency
BloodRequestSchema.index({ 
  'patientInfo.bloodType': 1,
  urgencyLevel: 1,
  status: 1,
  deadline: 1
});

// Create index for requester queries
BloodRequestSchema.index({ requesterId: 1, status: 1 });

// Create index for deadline-based queries (for expiration)
BloodRequestSchema.index({ deadline: 1, status: 1 });

// Create TTL index to automatically expire old requests after 30 days
BloodRequestSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// Virtual to check if request is expired
BloodRequestSchema.virtual('isExpired').get(function() {
  return this.deadline < new Date() && this.status === 'active';
});

// Virtual to calculate remaining time
BloodRequestSchema.virtual('remainingTime').get(function() {
  const now = new Date();
  const timeLeft = this.deadline.getTime() - now.getTime();
  return Math.max(0, timeLeft);
});

// Virtual to get accepted donors count
BloodRequestSchema.virtual('acceptedDonorsCount').get(function() {
  return this.matchedDonors.filter(donor => donor.status === 'accepted').length;
});

// Pre-save middleware to update status if deadline passed
BloodRequestSchema.pre('save', function(next) {
  if (this.deadline < new Date() && this.status === 'active') {
    this.status = 'expired';
  }
  next();
});

export default mongoose.models.BloodRequest || mongoose.model<IBloodRequest>('BloodRequest', BloodRequestSchema);