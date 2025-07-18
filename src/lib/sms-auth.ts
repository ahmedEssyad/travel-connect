import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { validateEnvironment, getConfig } from './env-validation';
import connectDB from './mongodb';
import VerificationCode from '@/models/VerificationCode';

// Dynamic import for twilio to reduce bundle size
let twilioClient: any = null;
const getTwilioClient = async () => {
  if (!twilioClient) {
    const twilio = await import('twilio');
    const config = getConfig();
    twilioClient = twilio.default(config.sms.accountSid, config.sms.authToken);
  }
  return twilioClient;
};

// Validate and get environment configuration
validateEnvironment();
const config = getConfig();

const JWT_SECRET = config.auth.jwtSecret;
const TWILIO_PHONE_NUMBER = config.sms.phoneNumber;

export interface PhoneVerification {
  phoneNumber: string;
  verificationCode: string;
  expiresAt: Date;
  verified: boolean;
}

// In-memory storage for verification codes (use Redis in production)
const verificationCodes = new Map<string, PhoneVerification>();

// File-based storage for development (to persist across server restarts)
const CODES_FILE = path.join(process.cwd(), '.tmp-verification-codes.json');

// Load codes from file on startup
function loadCodesFromFile(): void {
  try {
    if (fs.existsSync(CODES_FILE)) {
      const data = fs.readFileSync(CODES_FILE, 'utf8');
      const savedCodes = JSON.parse(data);
      for (const [phone, verification] of Object.entries(savedCodes)) {
        const verificationData = verification as PhoneVerification;
        // Only load non-expired codes
        if (new Date(verificationData.expiresAt) > new Date()) {
          verificationCodes.set(phone, {
            ...verificationData,
            expiresAt: new Date(verificationData.expiresAt)
          });
        }
      }
      console.log('Loaded verification codes from file:', Array.from(verificationCodes.keys()));
    }
  } catch (error) {
    console.error('Error loading verification codes:', error);
  }
}

// Save codes to file
function saveCodesToFile(): void {
  try {
    const codesObj: Record<string, PhoneVerification> = {};
    for (const [phone, verification] of verificationCodes.entries()) {
      codesObj[phone] = verification;
    }
    fs.writeFileSync(CODES_FILE, JSON.stringify(codesObj, null, 2));
  } catch (error) {
    console.error('Error saving verification codes:', error);
  }
}

// Load codes on startup
loadCodesFromFile();

/**
 * Format phone number for Mauritania
 * Mauritanian phone numbers: +222 XXXX XXXX
 */
export function formatMauritanianPhone(phoneNumber: string): string {
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');
  
  // Handle different input formats
  if (digits.startsWith('222')) {
    // Already has country code
    return '+' + digits;
  } else if (digits.length === 8) {
    // Local number format
    return '+222' + digits;
  } else {
    throw new Error('Invalid Mauritanian phone number format');
  }
}

/**
 * Validate Mauritanian phone number
 */
export function validateMauritanianPhone(phoneNumber: string): boolean {
  try {
    const formatted = formatMauritanianPhone(phoneNumber);
    // Mauritanian numbers: +222 followed by 8 digits
    return /^\+222\d{8}$/.test(formatted);
  } catch {
    return false;
  }
}

/**
 * Generate 6-digit verification code
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send SMS verification code
 */
export async function sendVerificationCode(phoneNumber: string): Promise<{ success: boolean; message: string }> {
  try {
    // Validate phone number
    if (!validateMauritanianPhone(phoneNumber)) {
      throw new Error('Invalid Mauritanian phone number');
    }

    const formattedPhone = formatMauritanianPhone(phoneNumber);
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Connect to database
    await connectDB();
    
    // Store verification code in database (upsert)
    await VerificationCode.findOneAndUpdate(
      { phoneNumber: formattedPhone },
      {
        phoneNumber: formattedPhone,
        verificationCode,
        expiresAt,
        verified: false,
        createdAt: new Date()
      },
      { upsert: true, new: true }
    );
    
    console.log('Stored verification code in DB:', { formattedPhone, verificationCode, expiresAt });

    // Send SMS with dynamic import
    const client = await getTwilioClient();
    
    // Create bilingual welcome message
    const welcomeMessage = `Munqidh - منقذ

Bienvenue! Votre code de vérification: ${verificationCode}
مرحباً! رمز التحقق الخاص بك: ${verificationCode}

Valide 10 min / صالح لمدة 10 دقائق`;
    
    const message = await client.messages.create({
      body: welcomeMessage,
      from: 'Munqidh',
      to: formattedPhone
    });

    console.log('SMS sent successfully:', message.sid);
    return { success: true, message: 'Verification code sent successfully' };

  } catch (error) {
    console.error('SMS sending error:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to send verification code' 
    };
  }
}

/**
 * Verify SMS code
 */
export async function verifyCode(phoneNumber: string, code: string): Promise<{ success: boolean; message: string }> {
  try {
    const formattedPhone = formatMauritanianPhone(phoneNumber);
    
    // Connect to database
    await connectDB();
    
    // Find verification code in database
    const verification = await VerificationCode.findOne({ 
      phoneNumber: formattedPhone 
    });

    console.log('Verification attempt:', { 
      formattedPhone, 
      code, 
      hasVerification: !!verification,
      originalPhone: phoneNumber 
    });

    if (!verification) {
      return { success: false, message: 'No verification code found for this number' };
    }

    if (verification.expiresAt < new Date()) {
      // Remove expired code
      await VerificationCode.deleteOne({ phoneNumber: formattedPhone });
      return { success: false, message: 'Verification code has expired' };
    }

    if (verification.verificationCode !== code) {
      return { success: false, message: 'Invalid verification code' };
    }

    // Mark as verified and save
    verification.verified = true;
    await verification.save();

    return { success: true, message: 'Phone number verified successfully' };

  } catch (error) {
    console.error('Code verification error:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Verification failed' 
    };
  }
}

/**
 * Check if phone number is verified
 */
export function isPhoneVerified(phoneNumber: string): boolean {
  try {
    const formattedPhone = formatMauritanianPhone(phoneNumber);
    const verification = verificationCodes.get(formattedPhone);
    return verification?.verified || false;
  } catch {
    return false;
  }
}

/**
 * Generate JWT token for authenticated user
 */
export function generateAuthToken(userId: string, phoneNumber: string): string {
  return jwt.sign(
    { 
      userId, 
      phoneNumber,
      type: 'phone_auth'
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

/**
 * Verify JWT token
 */
export function verifyAuthToken(token: string): { userId: string; phoneNumber: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.type === 'phone_auth') {
      return {
        userId: decoded.userId,
        phoneNumber: decoded.phoneNumber
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Hash password (if needed for additional security)
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Compare password (if needed for additional security)
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Clean up expired verification codes
 */
export function cleanupExpiredCodes(): void {
  const now = new Date();
  let hasChanges = false;
  for (const [phone, verification] of verificationCodes.entries()) {
    if (verification.expiresAt < now) {
      verificationCodes.delete(phone);
      hasChanges = true;
    }
  }
  if (hasChanges) {
    saveCodesToFile();
  }
}

// Clean up expired codes every 5 minutes
setInterval(cleanupExpiredCodes, 5 * 60 * 1000);