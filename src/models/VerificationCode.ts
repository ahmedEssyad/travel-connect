import mongoose, { Schema, Document } from 'mongoose';

export interface IVerificationCode extends Document {
  phoneNumber: string;
  verificationCode: string;
  expiresAt: Date;
  verified: boolean;
  createdAt: Date;
}

const VerificationCodeSchema = new Schema({
  phoneNumber: {
    type: String,
    required: true,
    index: true,
    unique: true // Un seul code par numéro
  },
  verificationCode: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // MongoDB supprime automatiquement les documents expirés
  },
  verified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index TTL pour auto-suppression des codes expirés
VerificationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const VerificationCode = mongoose.models.VerificationCode || mongoose.model<IVerificationCode>('VerificationCode', VerificationCodeSchema);

export default VerificationCode;