import mongoose, { Document, Schema } from 'mongoose';

export interface ITrip extends Document {
  userId: string;
  from: string;
  to: string;
  departureDate: Date;
  arrivalDate: Date;
  capacity: number;
  allowedItems: string[];
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TripSchema: Schema = new Schema({
  userId: { type: String, required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  departureDate: { type: Date, required: true },
  arrivalDate: { type: Date, required: true },
  capacity: { type: Number, required: true },
  allowedItems: [{ type: String }],
  description: { type: String },
}, {
  timestamps: true,
});

export default mongoose.models.Trip || mongoose.model<ITrip>('Trip', TripSchema);