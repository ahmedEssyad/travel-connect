import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  chatId: string;
  senderId: string;
  text: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema: Schema = new Schema({
  chatId: { type: String, required: true, index: true }, // Add index for performance
  senderId: { type: String, required: true, index: true }, // Add index for performance
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

// Compound index for efficient queries
MessageSchema.index({ chatId: 1, timestamp: -1 });

export default mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);