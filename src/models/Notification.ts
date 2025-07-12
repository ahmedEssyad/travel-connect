import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: string;
  type: 'blood_request' | 'donation_update' | 'chat_message' | 'general';
  title: string;
  message: string;
  data?: any;
  urgent: boolean;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  type: { 
    type: String, 
    enum: ['blood_request', 'donation_update', 'chat_message', 'general'],
    default: 'general'
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: { type: Schema.Types.Mixed },
  urgent: { type: Boolean, default: false },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for efficient queries
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, read: 1 });

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);