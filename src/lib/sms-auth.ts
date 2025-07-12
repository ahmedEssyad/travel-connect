import twilio from 'twilio';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

// Twilio client initialization
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

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

    // Store verification code
    verificationCodes.set(formattedPhone, {
      phoneNumber: formattedPhone,
      verificationCode,
      expiresAt,
      verified: false
    });

    // Save to file for development persistence
    saveCodesToFile();

    console.log('Stored verification code:', { formattedPhone, verificationCode, expiresAt });
    console.log('Current verification codes after storing:', Array.from(verificationCodes.keys()));

    // Send SMS
    const message = await client.messages.create({
      body: `Your BloodConnect verification code is: ${verificationCode}. Valid for 10 minutes.`,
      from: TWILIO_PHONE_NUMBER,
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
    
    // First, try to reload from file if not in memory
    if (!verificationCodes.has(formattedPhone)) {
      console.log('Code not in memory, reloading from file...');
      loadCodesFromFile();
    }
    
    const verification = verificationCodes.get(formattedPhone);

    console.log('Verification attempt:', { formattedPhone, code, hasVerification: !!verification });
    console.log('Current verification codes:', Array.from(verificationCodes.keys()));

    if (!verification) {
      // Development mode: allow a default code for testing
      if (process.env.NODE_ENV === 'development' && code === '123456') {
        console.log('Using development fallback code');
        return { success: true, message: 'Phone number verified successfully (dev mode)' };
      }
      
      // Try to read directly from file as last resort
      try {
        if (fs.existsSync(CODES_FILE)) {
          const data = fs.readFileSync(CODES_FILE, 'utf8');
          const savedCodes = JSON.parse(data);
          const fileVerification = savedCodes[formattedPhone];
          
          if (fileVerification && new Date(fileVerification.expiresAt) > new Date()) {
            console.log('Found code in file, checking...');
            if (fileVerification.verificationCode === code) {
              console.log('File verification successful!');
              return { success: true, message: 'Phone number verified successfully' };
            }
          }
        }
      } catch (fileError) {
        console.error('Error reading from file:', fileError);
      }
      
      return { success: false, message: 'No verification code found for this number' };
    }

    if (verification.expiresAt < new Date()) {
      verificationCodes.delete(formattedPhone);
      saveCodesToFile();
      return { success: false, message: 'Verification code has expired' };
    }

    if (verification.verificationCode !== code) {
      return { success: false, message: 'Invalid verification code' };
    }

    // Mark as verified
    verification.verified = true;
    verificationCodes.set(formattedPhone, verification);
    
    // Save to file
    saveCodesToFile();

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