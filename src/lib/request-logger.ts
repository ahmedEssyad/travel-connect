import { NextRequest, NextResponse } from 'next/server';
import logger from './logger';
import monitoring from './monitoring';

export function withRequestLogging(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    let response: NextResponse;
    
    try {
      // Execute the actual handler
      response = await handler(req);
      
      // Calculate response time
      const responseTime = Date.now() - startTime;
      
      // Log the request
      logger.apiRequest(req, response, responseTime);
      
      // Record metrics
      monitoring.recordApiRequest(responseTime, response.status);
      
      return response;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Log the error
      logger.error(
        `API Error: ${req.method} ${req.url}`,
        {
          endpoint: req.url,
          method: req.method,
          responseTime,
          ip: req.ip,
          userAgent: req.headers.get('user-agent'),
        },
        error as Error
      );
      
      // Create error response
      response = NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
      
      // Record error metrics
      monitoring.recordApiRequest(responseTime, 500);
      
      return response;
    }
  };
}

// Middleware function for automatic request logging
export function createRequestLogger() {
  return (req: NextRequest) => {
    const startTime = Date.now();
    
    // Add request start time to headers for tracking
    const url = new URL(req.url);
    
    // Skip logging for static assets and health checks
    if (
      url.pathname.startsWith('/_next') ||
      url.pathname.startsWith('/favicon') ||
      url.pathname === '/api/ping'
    ) {
      return NextResponse.next();
    }
    
    // Continue with request
    const response = NextResponse.next();
    
    // Log in the background (don't await)
    setImmediate(() => {
      const responseTime = Date.now() - startTime;
      logger.apiRequest(req, { statusCode: 200 }, responseTime);
      monitoring.recordApiRequest(responseTime, 200);
    });
    
    return response;
  };
}