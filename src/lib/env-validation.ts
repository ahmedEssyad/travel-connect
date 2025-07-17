import { z } from 'zod';

const envSchema = z.object({
  // Database
  MONGODB_URI: z.string().min(1, 'MongoDB URI is required').optional(),
  
  // Authentication
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters').optional(),
  
  // Twilio SMS
  TWILIO_ACCOUNT_SID: z.string().min(1, 'Twilio Account SID is required').optional(),
  TWILIO_AUTH_TOKEN: z.string().min(1, 'Twilio Auth Token is required').optional(),
  TWILIO_PHONE_NUMBER: z.string().regex(/^\+\d{10,15}$/, 'Invalid Twilio phone number format').optional(),
  
  // Optional environment variables
  NODE_ENV: z.enum(['development', 'production', 'test']).optional(),
  
  // Firebase (optional for push notifications)
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().email().optional(),
});

export type Environment = z.infer<typeof envSchema>;

let validatedEnv: Environment | null = null;

export function validateEnvironment(): Environment {
  if (validatedEnv) {
    return validatedEnv;
  }

  try {
    validatedEnv = envSchema.parse(process.env);
    console.log('✅ Environment variables validated successfully');
    return validatedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      console.error('❌ Environment validation failed:');
      errorMessages.forEach(msg => console.error(`  - ${msg}`));
      
      throw new Error(`Environment validation failed:\n${errorMessages.join('\n')}`);
    }
    throw error;
  }
}

export function getEnv(): Environment {
  if (!validatedEnv) {
    throw new Error('Environment not validated. Call validateEnvironment() first.');
  }
  return validatedEnv;
}

// Environment validation status
export function isEnvironmentValid(): boolean {
  try {
    validateEnvironment();
    return true;
  } catch {
    return false;
  }
}

// Get environment-specific configurations
export function getConfig() {
  const env = getEnv();
  
  return {
    isDevelopment: env.NODE_ENV === 'development' || process.env.NODE_ENV === 'development',
    isProduction: env.NODE_ENV === 'production',
    isTest: env.NODE_ENV === 'test',
    
    database: {
      uri: env.MONGODB_URI || 'mongodb://localhost:27017/bloodconnect-dev',
    },
    
    auth: {
      jwtSecret: env.JWT_SECRET || 'development-jwt-secret-key-32-chars-min',
    },
    
    sms: {
      accountSid: env.TWILIO_ACCOUNT_SID || 'dev-account-sid',
      authToken: env.TWILIO_AUTH_TOKEN || 'dev-auth-token',
      phoneNumber: env.TWILIO_PHONE_NUMBER || '+1234567890',
    },
    
    firebase: {
      projectId: env.FIREBASE_PROJECT_ID,
      privateKey: env.FIREBASE_PRIVATE_KEY,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
    },
  };
}

// Validate on module load in production
if (process.env.NODE_ENV === 'production') {
  validateEnvironment();
}