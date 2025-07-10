import mongoose, { Document, Schema } from 'mongoose';

export interface IRequest extends Document {
  userId: string;
  from: string;
  to: string;
  deadline: Date;
  itemType: string;
  description?: string;
  reward?: string;
  photo?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RequestSchema: Schema = new Schema({
  userId: { type: String, required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  deadline: { type: Date, required: true },
  itemType: { type: String, required: true },
  description: { type: String },
  reward: { type: String },
  photo: { type: String },
}, {
  timestamps: true,
});

export default mongoose.models.Request || mongoose.model<IRequest>('Request', RequestSchema);