import { z } from 'zod';

// User validation schema
export const userSchema = z.object({
  uid: z.string().min(1, 'User ID is required'),
  email: z.string().email('Invalid email format'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name too long'),
  phone: z.string().optional(),
  photo: z.string().url('Invalid photo URL').optional().or(z.literal('')),
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  // Location removed - now handled dynamically via LocationContext
  bio: z.string().max(500, 'Bio too long').optional().or(z.literal('')),
  medicalInfo: z.object({
    weight: z.number().min(30).max(300).optional(),
    age: z.number().min(18).max(100).optional(),
    lastDonationDate: z.date().optional(),
    medicalConditions: z.array(z.string()).optional(),
    availableForDonation: z.boolean().default(false).optional(),
    isDonor: z.boolean().default(false).optional()
  }).optional(),
  emergencyContact: z.object({
    name: z.string().max(100, 'Name too long').optional(),
    phone: z.string().optional(),
    relationship: z.string().max(50, 'Relationship too long').optional()
  }).optional(),
  notificationPreferences: z.object({
    sms: z.boolean().default(true).optional(),
    push: z.boolean().default(true).optional(),
    email: z.boolean().default(true).optional(),
    urgencyLevels: z.array(z.enum(['critical', 'urgent', 'standard'])).default(['critical', 'urgent', 'standard']).optional()
  }).optional(),
  deviceTokens: z.array(z.string()).optional(),
  isVerified: z.boolean().default(false).optional(),
  rating: z.number().min(1).max(5).default(5),
  totalDonations: z.number().min(0).default(0).optional(),
});

export const userUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name too long').optional(),
  phone: z.string().optional(),
  photo: z.string().optional().or(z.literal('')),
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  // Location removed - now handled dynamically via LocationContext
  bio: z.string().max(500, 'Bio too long').optional().or(z.literal('')),
  medicalInfo: z.object({
    weight: z.number().min(30).max(300).optional(),
    age: z.number().min(18).max(100).optional(),
    lastDonationDate: z.date().optional(),
    medicalConditions: z.array(z.string()).optional(),
    availableForDonation: z.boolean().optional(),
    isDonor: z.boolean().optional()
  }).optional(),
  emergencyContact: z.object({
    name: z.string().max(100, 'Name too long').optional(),
    phone: z.string().optional(),
    relationship: z.string().max(50, 'Relationship too long').optional()
  }).optional(),
  notificationPreferences: z.object({
    sms: z.boolean().optional(),
    push: z.boolean().optional(),
    email: z.boolean().optional(),
    urgencyLevels: z.array(z.enum(['critical', 'urgent', 'standard'])).optional()
  }).optional(),
  deviceTokens: z.array(z.string()).optional(),
  isVerified: z.boolean().optional(),
  rating: z.number().min(1).max(5).optional(),
  totalDonations: z.number().min(0).optional(),
});

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
  fromCoords: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional(),
  toCoords: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional(),
  departureDate: z.string(),
  arrivalDate: z.string(),
  tripType: z.enum(['car_sharing', 'delivery_service'], { required_error: 'Trip type is required' }),
  capacity: z.number().min(1, 'Capacity must be at least 1').max(100, 'Capacity too high'),
  allowedItems: z.array(z.string()).optional(),
  description: z.string().max(1000, 'Description too long').optional(),
}).refine((data) => {
  // For delivery service, allowedItems is required
  if (data.tripType === 'delivery_service' && (!data.allowedItems || data.allowedItems.length === 0)) {
    return false;
  }
  return true;
}, {
  message: 'Allowed items are required for delivery service trips',
  path: ['allowedItems']
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
  fromCoords: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional(),
  toCoords: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional(),
  deadline: z.string(),
  requestType: z.enum(['travel_companion', 'delivery_request'], { required_error: 'Request type is required' }),
  itemType: z.string().optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  reward: z.string().max(200, 'Reward description too long').optional(),
  photo: z.string().url('Invalid photo URL').optional(),
}).refine((data) => {
  // For delivery request, itemType is required
  if (data.requestType === 'delivery_request' && !data.itemType) {
    return false;
  }
  return true;
}, {
  message: 'Item type is required for delivery requests',
  path: ['itemType']
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
    .regex(/^[a-zA-Z0-9\-]+_[a-zA-Z0-9\-]+$/, 'Invalid chat ID format'),
  senderId: z.string().min(1, 'Sender ID is required'),
  text: z.string().min(1, 'Message text is required').max(1000, 'Message too long'),
  timestamp: z.date().optional(),
});

export const messageCreateSchema = z.object({
  chatId: z.string()
    .min(1, 'Chat ID is required')
    .regex(/^[a-zA-Z0-9\-]+_[a-zA-Z0-9\-]+$/, 'Invalid chat ID format'),
  text: z.string().min(1, 'Message text is required').max(1000, 'Message too long'),
});

// Blood Request validation schema
export const bloodRequestSchema = z.object({
  requesterId: z.string().min(1, 'Requester ID is required'),
  patientInfo: z.object({
    name: z.string().min(2, 'Patient name must be at least 2 characters').max(100, 'Patient name too long'),
    age: z.number().min(0, 'Age must be positive').max(150, 'Invalid age'),
    bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], { required_error: 'Blood type is required' }),
    condition: z.string().min(1, 'Medical condition is required').max(500, 'Condition description too long'),
    urgentNote: z.string().max(200, 'Urgent note too long').optional()
  }),
  hospital: z.object({
    name: z.string().max(100, 'Hospital name too long').optional(),
    address: z.string().max(200, 'Address too long').optional(),
    coordinates: z.object({
      lat: z.number().min(-90).max(90, 'Invalid latitude'),
      lng: z.number().min(-180).max(180, 'Invalid longitude')
    }).optional(),
    contactNumber: z.string().optional(),
    department: z.string().max(100, 'Department name too long').optional()
  }).optional(),
  urgencyLevel: z.enum(['critical', 'urgent', 'standard'], { required_error: 'Urgency level is required' }),
  requiredUnits: z.number().min(1, 'At least 1 unit required').max(10, 'Maximum 10 units allowed'),
  deadline: z.string().transform((str) => new Date(str)),
  description: z.string().max(1000, 'Description too long').optional(),
  contactInfo: z.object({
    requesterName: z.string().min(1, 'Requester name is required').max(100, 'Name too long'),
    requesterPhone: z.string().min(1, 'Phone number is required'),
    alternateContact: z.string().optional()
  }),
  medicalDetails: z.object({
    procedure: z.string().max(200, 'Procedure description too long').optional(),
    doctorName: z.string().max(100, 'Doctor name too long').optional(),
    roomNumber: z.string().max(50, 'Room number too long').optional(),
    specialInstructions: z.string().max(500, 'Instructions too long').optional()
  }).optional()
});

export const bloodRequestCreateSchema = bloodRequestSchema.omit({ requesterId: true });

export const bloodRequestUpdateSchema = z.object({
  urgencyLevel: z.enum(['critical', 'urgent', 'standard']).optional(),
  requiredUnits: z.number().min(1).max(10).optional(),
  deadline: z.string().transform((str) => new Date(str)).optional(),
  description: z.string().max(1000).optional(),
  status: z.enum(['active', 'fulfilled', 'expired', 'cancelled']).optional(),
  contactInfo: z.object({
    requesterName: z.string().min(1).max(100).optional(),
    requesterPhone: z.string().min(1).optional(),
    alternateContact: z.string().optional()
  }).optional(),
  medicalDetails: z.object({
    procedure: z.string().max(200).optional(),
    doctorName: z.string().max(100).optional(),
    roomNumber: z.string().max(50).optional(),
    specialInstructions: z.string().max(500).optional()
  }).optional()
});

// Donor Response validation schema
export const donorResponseSchema = z.object({
  requestId: z.string().min(1, 'Request ID is required'),
  response: z.enum(['accepted', 'declined'], { required_error: 'Response is required' }),
  notes: z.string().max(500, 'Notes too long').optional()
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