import mongoose, { Document, Schema } from 'mongoose';

export interface IMatch extends Document {
  donorId: string;
  requestId: string;
  bloodRequestId: string;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const MatchSchema: Schema = new Schema({
  donorId: { type: String, required: true },
  requestId: { type: String, required: true },
  bloodRequestId: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'completed', 'cancelled'],
    default: 'pending'
  },
}, {
  timestamps: true,
});

export default mongoose.models.Match || mongoose.model<IMatch>('Match', MatchSchema);