import { NextRequest, NextResponse } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string;
  skipSuccessfulRequests?: boolean;
}

export function createRateLimit(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests, please try again later.',
    skipSuccessfulRequests = false
  } = config;

  return async function rateLimit(
    request: NextRequest,
    getKey?: (req: NextRequest) => string
  ): Promise<NextResponse | null> {
    const now = Date.now();
    const key = getKey ? getKey(request) : getClientIP(request);
    
    if (!key) {
      return null; // Skip rate limiting if no key available
    }

    // Clean up expired entries
    if (store[key] && store[key].resetTime <= now) {
      delete store[key];
    }

    // Initialize or get current state
    if (!store[key]) {
      store[key] = {
        count: 0,
        resetTime: now + windowMs
      };
    }

    // Check if limit exceeded
    if (store[key].count >= maxRequests) {
      const remainingTime = Math.ceil((store[key].resetTime - now) / 1000);
      
      return NextResponse.json(
        { 
          error: message,
          retryAfter: remainingTime
        },
        { 
          status: 429,
          headers: {
            'Retry-After': remainingTime.toString(),
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(store[key].resetTime).toISOString()
          }
        }
      );
    }

    // Increment counter
    store[key].count++;

    // Add rate limit headers
    const remaining = Math.max(0, maxRequests - store[key].count);
    
    return null; // Continue processing
  };
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  return request.ip || 'unknown';
}

// Pre-configured rate limiters
export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per 15 minutes
  message: 'Too many authentication attempts, please try again in 15 minutes.'
});

export const smsRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 1, // 1 SMS per minute per phone number
  message: 'SMS sent too frequently, please wait 1 minute before requesting another.'
});

export const generalRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
  message: 'Too many requests, please slow down.'
});

// Rate limiter by phone number for SMS endpoints
export function createPhoneRateLimit(phoneNumber: string) {
  return createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 1,
    message: 'SMS verification code can only be sent once per minute.'
  });
}