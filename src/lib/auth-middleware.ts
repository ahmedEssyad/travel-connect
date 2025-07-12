import { NextRequest } from 'next/server';
import { verifyAuthToken as verifyJWT } from '@/lib/sms-auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    phoneNumber: string;
    name: string;
    email?: string;
    bloodType?: string;
  };
}

export async function verifyAuthToken(request: NextRequest): Promise<{ user: any; error?: string }> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null, error: 'No authentication token provided' };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify JWT token
    const decoded = verifyJWT(token);
    if (!decoded) {
      return { user: null, error: 'Invalid or expired token' };
    }

    // Get user from database
    await connectDB();
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return { user: null, error: 'User not found' };
    }

    return {
      user: {
        id: user._id.toString(),
        uid: user._id.toString(), // For backward compatibility
        phoneNumber: user.phoneNumber,
        name: user.name,
        email: user.email,
        bloodType: user.bloodType,
        emailVerified: true, // Phone verification handles this
      }
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return { 
      user: null, 
      error: error instanceof Error ? error.message : 'Authentication failed' 
    };
  }
}

export async function requireAuth(request: NextRequest) {
  const { user, error } = await verifyAuthToken(request);
  
  if (!user) {
    return {
      authenticated: false,
      user: null,
      error: error || 'Authentication required'
    };
  }
  
  return {
    authenticated: true,
    user,
    error: null
  };
}