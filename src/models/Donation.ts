import mongoose, { Document, Schema } from 'mongoose';

export interface IDonation extends Document {
  requestId: string; // Blood request this donation fulfills
  donorId: string;
  recipientId: string;
  bloodType: string;
  hospital?: string;
  donationDate: Date;
  
  // Confirmation status
  donorConfirmed: boolean;
  donorConfirmedAt?: Date;
  recipientConfirmed: boolean;
  recipientConfirmedAt?: Date;
  
  // Status tracking
  status: 'pending' | 'donor_confirmed' | 'completed' | 'disputed';
  
  // Additional details
  notes?: string;
  volume?: number; // in ml
  
  createdAt: Date;
  updatedAt: Date;
}

const DonationSchema: Schema = new Schema({
  requestId: { 
    type: Schema.Types.ObjectId, 
    ref: 'BloodRequest', 
    required: true 
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
  hospital: { type: String },
  donationDate: { type: Date, required: true },
  
  // Confirmation tracking
  donorConfirmed: { type: Boolean, default: false },
  donorConfirmedAt: { type: Date },
  recipientConfirmed: { type: Boolean, default: false },
  recipientConfirmedAt: { type: Date },
  
  // Status
  status: { 
    type: String, 
    enum: ['pending', 'donor_confirmed', 'completed', 'disputed'],
    default: 'pending'
  },
  
  // Additional details
  notes: { type: String },
  volume: { type: Number }, // in ml
}, {
  timestamps: true,
});

// Indexes for efficient queries
DonationSchema.index({ donorId: 1, createdAt: -1 });
DonationSchema.index({ recipientId: 1, createdAt: -1 });
DonationSchema.index({ requestId: 1 });
DonationSchema.index({ status: 1 });

// Auto-update status based on confirmations
DonationSchema.pre('save', function(next) {
  if (this.donorConfirmed && !this.recipientConfirmed) {
    this.status = 'donor_confirmed';
  } else if (this.donorConfirmed && this.recipientConfirmed) {
    this.status = 'completed';
  }
  next();
});

export default mongoose.models.Donation || mongoose.model<IDonation>('Donation', DonationSchema);