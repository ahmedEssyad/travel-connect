import { NextRequest } from 'next/server';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    uid: string;
    email: string;
    emailVerified: boolean;
  };
}

export async function verifyAuthToken(request: NextRequest): Promise<{ user: any; error?: string }> {
  try {
    const authHeader = request.headers.get('authorization');
    const userIdHeader = request.headers.get('X-User-ID') || request.headers.get('x-user-id');
    const userEmailHeader = request.headers.get('X-User-Email') || request.headers.get('x-user-email');
    
    // Debug logging removed for production
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null, error: 'No authentication token provided' };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // For development: Simple validation with improved security
    // In production, use Firebase Admin SDK to verify the token
    if (token.length < 10) {
      return { user: null, error: 'Invalid token format' };
    }
    
    // Basic token validation - in production, this should verify with Firebase
    // For now, require tokens to be at least somewhat complex
    if (!token.includes('.') || token.length < 20) {
      return { user: null, error: 'Invalid token structure' };
    }
    
    // Extract user info from headers (already retrieved above)
    // WARNING: This is not secure for production - should verify with Firebase
    
    if (!userIdHeader) {
      return { user: null, error: 'User ID header missing' };
    }
    
    // Basic UID validation
    if (userIdHeader.length < 10 || userIdHeader.includes(' ')) {
      return { user: null, error: 'Invalid user ID format' };
    }
    
    return {
      user: {
        uid: userIdHeader,
        email: userEmailHeader || '',
        emailVerified: true,
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