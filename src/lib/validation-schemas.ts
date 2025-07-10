import { z } from 'zod';

// User validation schema
export const userSchema = z.object({
  uid: z.string().min(1, 'User ID is required'),
  email: z.string().email('Invalid email format'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name too long'),
  photo: z.string().url('Invalid photo URL').optional().or(z.literal('')),
  location: z.string().max(100, 'Location too long').optional().or(z.literal('')),
  bio: z.string().max(500, 'Bio too long').optional().or(z.literal('')),
  rating: z.number().min(1).max(5).default(5),
});

export const userUpdateSchema = userSchema.omit({ uid: true, email: true });

// Trip validation schema
export const tripSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  from: z.string().min(1, 'Departure location is required').max(100, 'Location too long'),
  to: z.string().min(1, 'Destination is required').max(100, 'Location too long'),
  departureDate: z.string(),
  arrivalDate: z.string(),
  capacity: z.number().min(1, 'Capacity must be at least 1').max(100, 'Capacity too high'),
  allowedItems: z.array(z.string()).min(1, 'At least one item type must be selected'),
  description: z.string().max(1000, 'Description too long').optional(),
});

export const tripCreateSchema = z.object({
  from: z.string().min(1, 'Departure location is required').max(100, 'Location too long'),
  to: z.string().min(1, 'Destination is required').max(100, 'Location too long'),
  departureDate: z.string(),
  arrivalDate: z.string(),
  capacity: z.number().min(1, 'Capacity must be at least 1').max(100, 'Capacity too high'),
  allowedItems: z.array(z.string()).min(1, 'At least one item type must be selected'),
  description: z.string().max(1000, 'Description too long').optional(),
});

export const tripUpdateSchema = z.object({
  from: z.string().min(1, 'Departure location is required').max(100, 'Location too long').optional(),
  to: z.string().min(1, 'Destination is required').max(100, 'Location too long').optional(),
  departureDate: z.string().optional(),
  arrivalDate: z.string().optional(),
  capacity: z.number().min(1, 'Capacity must be at least 1').max(100, 'Capacity too high').optional(),
  allowedItems: z.array(z.string()).min(1, 'At least one item type must be selected').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
});

// Request validation schema
export const requestSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  from: z.string().min(1, 'Pickup location is required').max(100, 'Location too long'),
  to: z.string().min(1, 'Delivery location is required').max(100, 'Location too long'),
  deadline: z.string(),
  itemType: z.string().min(1, 'Item type is required'),
  description: z.string().max(1000, 'Description too long').optional(),
  reward: z.string().max(200, 'Reward description too long').optional(),
  photo: z.string().url('Invalid photo URL').optional(),
});

export const requestCreateSchema = z.object({
  from: z.string().min(1, 'Pickup location is required').max(100, 'Location too long'),
  to: z.string().min(1, 'Delivery location is required').max(100, 'Location too long'),
  deadline: z.string(),
  itemType: z.string().min(1, 'Item type is required'),
  description: z.string().max(1000, 'Description too long').optional(),
  reward: z.string().max(200, 'Reward description too long').optional(),
  photo: z.string().url('Invalid photo URL').optional(),
});

export const requestUpdateSchema = z.object({
  from: z.string().min(1, 'Pickup location is required').max(100, 'Location too long').optional(),
  to: z.string().min(1, 'Delivery location is required').max(100, 'Location too long').optional(),
  deadline: z.string().optional(),
  itemType: z.string().min(1, 'Item type is required').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  reward: z.string().max(200, 'Reward description too long').optional(),
  photo: z.string().url('Invalid photo URL').optional(),
});

// Match validation schema
export const matchSchema = z.object({
  tripId: z.string().min(1, 'Trip ID is required'),
  requestId: z.string().min(1, 'Request ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  status: z.enum(['pending', 'accepted', 'completed', 'cancelled']).default('pending'),
});

export const matchCreateSchema = z.object({
  tripId: z.string().min(1, 'Trip ID is required'),
  requestId: z.string().min(1, 'Request ID is required'),
});

// Message validation schema
export const messageSchema = z.object({
  chatId: z.string()
    .min(1, 'Chat ID is required')
    .regex(/^[a-zA-Z0-9]+_[a-zA-Z0-9]+$/, 'Invalid chat ID format'),
  senderId: z.string().min(1, 'Sender ID is required'),
  text: z.string().min(1, 'Message text is required').max(1000, 'Message too long'),
  timestamp: z.date().optional(),
});

export const messageCreateSchema = z.object({
  chatId: z.string()
    .min(1, 'Chat ID is required')
    .regex(/^[a-zA-Z0-9]+_[a-zA-Z0-9]+$/, 'Invalid chat ID format'),
  text: z.string().min(1, 'Message text is required').max(1000, 'Message too long'),
});

// Validation helper function
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('; ');
      return { success: false, error: errorMessages };
    }
    return { success: false, error: 'Validation failed' };
  }
}