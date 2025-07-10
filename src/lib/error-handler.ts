import { NextResponse } from 'next/server';

export interface ApiError {
  message: string;
  statusCode: number;
  errorCode?: string;
  details?: any;
}

export class AppError extends Error {
  public statusCode: number;
  public errorCode?: string;
  public details?: any;

  constructor(message: string, statusCode: number = 500, errorCode?: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.name = 'AppError';
  }
}

export function createApiError(message: string, statusCode: number = 500, errorCode?: string, details?: any): AppError {
  return new AppError(message, statusCode, errorCode, details);
}

export function handleApiError(error: unknown, operation?: string): NextResponse {
  console.error(`API Error in ${operation}:`, error);

  // Handle known AppError
  if (error instanceof AppError) {
    return NextResponse.json({
      error: error.message,
      errorCode: error.errorCode,
      details: error.details,
    }, { status: error.statusCode });
  }

  // Handle MongoDB errors
  if (error && typeof error === 'object' && 'code' in error) {
    const mongoError = error as any;
    
    // Duplicate key error
    if (mongoError.code === 11000) {
      const field = Object.keys(mongoError.keyPattern || {})[0] || 'field';
      return NextResponse.json({
        error: `This ${field} already exists`,
        errorCode: 'DUPLICATE_KEY',
      }, { status: 409 });
    }
    
    // Validation error
    if (mongoError.name === 'ValidationError') {
      const validationErrors = Object.values(mongoError.errors || {}).map((err: any) => err.message);
      return NextResponse.json({
        error: 'Validation failed',
        errorCode: 'VALIDATION_ERROR',
        details: validationErrors,
      }, { status: 400 });
    }
    
    // Cast error (invalid ObjectId)
    if (mongoError.name === 'CastError') {
      return NextResponse.json({
        error: 'Invalid ID format',
        errorCode: 'INVALID_ID',
      }, { status: 400 });
    }
  }

  // Handle standard JavaScript errors
  if (error instanceof Error) {
    // Don't expose internal errors to client in production
    const message = process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message;
    
    return NextResponse.json({
      error: message,
      errorCode: 'INTERNAL_ERROR',
    }, { status: 500 });
  }

  // Fallback error
  return NextResponse.json({
    error: 'An unexpected error occurred',
    errorCode: 'UNKNOWN_ERROR',
  }, { status: 500 });
}

export function logError(error: unknown, context?: string, additionalInfo?: any) {
  const timestamp = new Date().toISOString();
  
  // Sanitize additionalInfo to remove sensitive data
  const sanitizedInfo = sanitizeLogData(additionalInfo);
  
  const errorInfo = {
    timestamp,
    context,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
    } : error,
    additionalInfo: sanitizedInfo,
  };

  console.error('🚨 ERROR:', JSON.stringify(errorInfo, null, 2));
  
  // In production, you would send this to your logging service
  // Example: sendToLoggingService(errorInfo);
}

function sanitizeLogData(data: any): any {
  if (!data) return data;
  
  const sensitiveKeys = ['password', 'token', 'email', 'phone', 'body', 'text', 'message'];
  
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return sanitizeObject(parsed);
    } catch {
      return '[SANITIZED_STRING]';
    }
  }
  
  if (typeof data === 'object') {
    return sanitizeObject(data);
  }
  
  return data;
}

function sanitizeObject(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized: any = {};
  const sensitiveKeys = ['password', 'token', 'email', 'phone', 'body', 'text', 'message'];
  
  for (const [key, value] of Object.entries(obj)) {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

export function logInfo(message: string, context?: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logInfo = {
    timestamp,
    level: 'INFO',
    context,
    message,
    data,
  };

  console.log('ℹ️ INFO:', JSON.stringify(logInfo, null, 2));
}

export function logWarning(message: string, context?: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logInfo = {
    timestamp,
    level: 'WARNING',
    context,
    message,
    data,
  };

  console.warn('⚠️ WARNING:', JSON.stringify(logInfo, null, 2));
}

// Common error types
export const ErrorTypes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_KEY: 'DUPLICATE_KEY',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMIT: 'RATE_LIMIT',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;

// HTTP status codes
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;