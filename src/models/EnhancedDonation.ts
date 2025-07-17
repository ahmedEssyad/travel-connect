import mongoose, { Document, Schema } from 'mongoose';

export interface IEnhancedDonation extends Document {
  // Basic Info
  requestId: string;
  donorId: string;
  recipientId: string;
  bloodType: string;
  
  // Appointment & Scheduling
  appointmentDate?: Date;
  appointmentTime?: string;
  appointmentPlace?: string;
  estimatedDuration?: number; // minutes
  appointmentStatus: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'missed' | 'cancelled';
  
  // Location & Hospital
  hospital: {
    name: string;
    address?: string;
    contactNumber?: string;
    department?: string;
    referenceNumber?: string; // Hospital's internal reference
  };
  
  // Verification & Proof
  proofOfDonation: {
    hospitalReceipt?: string; // File path or URL
    medicalStaffSignature?: string;
    hospitalReferenceNumber?: string;
    donationCertificate?: string;
    bloodBagId?: string; // Unique identifier from blood bank
  };
  
  // Multi-Stage Confirmations
  confirmations: {
    // Stage 1: Donor at hospital
    donorArrived: boolean;
    donorArrivedAt?: Date;
    donorLocation?: { lat: number; lng: number };
    
    // Stage 2: Hospital processing
    hospitalReceived: boolean;
    hospitalReceivedAt?: Date;
    hospitalStaffId?: string;
    hospitalNotes?: string;
    
    // Stage 3: Donor completion
    donorCompleted: boolean;
    donorCompletedAt?: Date;
    donorNotes?: string;
    
    // Stage 4: Blood bank processing
    bloodBankProcessed: boolean;
    bloodBankProcessedAt?: Date;
    bloodBankReference?: string;
    
    // Stage 5: Recipient received
    recipientReceived: boolean;
    recipientReceivedAt?: Date;
    recipientNotes?: string;
  };
  
  // Advanced Tracking
  timeline: Array<{
    stage: string;
    status: string;
    timestamp: Date;
    actor: 'donor' | 'recipient' | 'hospital' | 'system';
    notes?: string;
    location?: { lat: number; lng: number };
    proof?: string; // File reference
  }>;
  
  // Status & Workflow
  overallStatus: 'initiated' | 'scheduled' | 'in_progress' | 'donor_completed' | 'hospital_confirmed' | 'blood_processed' | 'recipient_confirmed' | 'completed' | 'disputed' | 'failed';
  
  // Quality & Trust
  verificationLevel: 'basic' | 'verified' | 'hospital_verified' | 'medical_verified';
  trustScore: number; // 0-100 based on verification level
  
  // Dispute Resolution
  disputes?: Array<{
    reportedBy: string;
    reason: string;
    status: 'open' | 'investigating' | 'resolved' | 'closed';
    resolution?: string;
    createdAt: Date;
  }>;
  
  // Medical Details
  medicalInfo: {
    volume?: number; // ml
    donationType: 'whole_blood' | 'plasma' | 'platelets' | 'red_cells';
    medicalClearance?: boolean;
    donorHealthStatus?: string;
    postDonationNotes?: string;
  };
  
  // Additional Metadata
  metadata: {
    donationDuration?: number; // minutes
    waitTime?: number; // minutes
    hospitalRating?: number; // 1-5
    donorRating?: number; // recipient rates donor
    recipientRating?: number; // donor rates recipient
    emergencyLevel: 'critical' | 'urgent' | 'standard';
    followUpRequired?: boolean;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const enhancedDonationSchema: Schema = new Schema({
  requestId: { 
    type: Schema.Types.ObjectId, 
    ref: 'BloodRequest', 
    required: true,
    unique: true // Ensure one donation per request
  },
  donorId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  recipientId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  bloodType: { 
    type: String, 
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  
  // Appointment scheduling
  appointmentDate: { type: Date },
  appointmentTime: { type: String },
  appointmentPlace: { type: String },
  estimatedDuration: { type: Number, default: 60 },
  appointmentStatus: {
    type: String,
    enum: ['scheduled', 'confirmed', 'in_progress', 'completed', 'missed', 'cancelled'],
    default: 'scheduled'
  },
  
  // Hospital information
  hospital: {
    name: { type: String, required: true },
    address: { type: String },
    contactNumber: { type: String },
    department: { type: String },
    referenceNumber: { type: String }
  },
  
  // Proof and verification
  proofOfDonation: {
    hospitalReceipt: { type: String },
    medicalStaffSignature: { type: String },
    hospitalReferenceNumber: { type: String },
    donationCertificate: { type: String },
    bloodBagId: { type: String }
  },
  
  // Multi-stage confirmations
  confirmations: {
    donorArrived: { type: Boolean, default: false },
    donorArrivedAt: { type: Date },
    donorLocation: {
      lat: { type: Number },
      lng: { type: Number }
    },
    
    hospitalReceived: { type: Boolean, default: false },
    hospitalReceivedAt: { type: Date },
    hospitalStaffId: { type: String },
    hospitalNotes: { type: String },
    
    donorCompleted: { type: Boolean, default: false },
    donorCompletedAt: { type: Date },
    donorNotes: { type: String },
    
    bloodBankProcessed: { type: Boolean, default: false },
    bloodBankProcessedAt: { type: Date },
    bloodBankReference: { type: String },
    
    recipientReceived: { type: Boolean, default: false },
    recipientReceivedAt: { type: Date },
    recipientNotes: { type: String }
  },
  
  // Timeline tracking
  timeline: [{
    stage: { type: String, required: true },
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    actor: { 
      type: String, 
      enum: ['donor', 'recipient', 'hospital', 'system'],
      required: true 
    },
    notes: { type: String },
    location: {
      lat: { type: Number },
      lng: { type: Number }
    },
    proof: { type: String }
  }],
  
  // Overall status
  overallStatus: {
    type: String,
    enum: [
      'initiated', 'scheduled', 'in_progress', 'donor_completed', 
      'hospital_confirmed', 'blood_processed', 'recipient_confirmed', 
      'completed', 'disputed', 'failed'
    ],
    default: 'initiated'
  },
  
  // Verification and trust
  verificationLevel: {
    type: String,
    enum: ['basic', 'verified', 'hospital_verified', 'medical_verified'],
    default: 'basic'
  },
  trustScore: { type: Number, default: 50, min: 0, max: 100 },
  
  // Disputes
  disputes: [{
    reportedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['open', 'investigating', 'resolved', 'closed'],
      default: 'open' 
    },
    resolution: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Medical information
  medicalInfo: {
    volume: { type: Number },
    donationType: {
      type: String,
      enum: ['whole_blood', 'plasma', 'platelets', 'red_cells'],
      default: 'whole_blood'
    },
    medicalClearance: { type: Boolean },
    donorHealthStatus: { type: String },
    postDonationNotes: { type: String }
  },
  
  // Metadata
  metadata: {
    donationDuration: { type: Number },
    waitTime: { type: Number },
    hospitalRating: { type: Number, min: 1, max: 5 },
    donorRating: { type: Number, min: 1, max: 5 },
    recipientRating: { type: Number, min: 1, max: 5 },
    emergencyLevel: {
      type: String,
      enum: ['critical', 'urgent', 'standard'],
      default: 'standard'
    },
    followUpRequired: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

// Indexes for performance
enhancedDonationSchema.index({ donorId: 1, createdAt: -1 });
enhancedDonationSchema.index({ recipientId: 1, createdAt: -1 });
enhancedDonationSchema.index({ requestId: 1 }, { unique: true });
enhancedDonationSchema.index({ overallStatus: 1 });
enhancedDonationSchema.index({ appointmentDate: 1 });
enhancedDonationSchema.index({ verificationLevel: 1 });
enhancedDonationSchema.index({ trustScore: -1 });

// Auto-update overall status based on confirmations
enhancedDonationSchema.pre('save', function(next) {
  const confirmations = this.confirmations;
  
  if (confirmations.recipientReceived && confirmations.donorCompleted && confirmations.hospitalReceived) {
    this.overallStatus = 'completed';
    this.trustScore = Math.min(100, this.trustScore + 20);
  } else if (confirmations.bloodBankProcessed) {
    this.overallStatus = 'blood_processed';
  } else if (confirmations.hospitalReceived) {
    this.overallStatus = 'hospital_confirmed';
  } else if (confirmations.donorCompleted) {
    this.overallStatus = 'donor_completed';
  } else if (confirmations.donorArrived) {
    this.overallStatus = 'in_progress';
  }
  
  // Update verification level based on proof
  if (this.proofOfDonation.hospitalReceipt && this.proofOfDonation.medicalStaffSignature) {
    this.verificationLevel = 'medical_verified';
    this.trustScore = Math.min(100, this.trustScore + 30);
  } else if (this.proofOfDonation.hospitalReceipt) {
    this.verificationLevel = 'hospital_verified';
    this.trustScore = Math.min(100, this.trustScore + 15);
  } else if (this.confirmations.hospitalReceived) {
    this.verificationLevel = 'verified';
    this.trustScore = Math.min(100, this.trustScore + 10);
  }
  
  next();
});

// Method to add timeline entry
enhancedDonationSchema.methods.addTimelineEntry = function(
  stage: string, 
  status: string, 
  actor: 'donor' | 'recipient' | 'hospital' | 'system',
  notes?: string,
  location?: { lat: number; lng: number },
  proof?: string
) {
  this.timeline.push({
    stage,
    status,
    timestamp: new Date(),
    actor,
    notes,
    location,
    proof
  });
  return this.save();
};

export default mongoose.models.EnhancedDonation || mongoose.model<IEnhancedDonation>('EnhancedDonation', enhancedDonationSchema);