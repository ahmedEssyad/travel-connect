import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { handleApiError, logError, createApiError, ErrorTypes, HttpStatus } from '@/lib/error-handler';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { authenticated, user, error } = await requireAuth(request);
    if (!authenticated) {
      throw createApiError(error || 'Authentication required', HttpStatus.UNAUTHORIZED, ErrorTypes.AUTHENTICATION_ERROR);
    }

    const body = await request.json();
    const { to, message, urgent = false } = body;

    if (!to || !message) {
      throw createApiError('Phone number and message are required', HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
    }

    // Check if Twilio is configured
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      // Log the SMS that would be sent (for development)
      console.log('SMS would be sent:', {
        to,
        from: fromNumber || '+222XXXXXXXX',
        message,
        urgent
      });

      // Return success for development
      return NextResponse.json({
        success: true,
        message: 'SMS sent (development mode)',
        sid: 'dev_' + Date.now()
      });
    }

    // Send SMS using Twilio
    const twilio = require('twilio')(accountSid, authToken);
    
    const smsResult = await twilio.messages.create({
      body: message,
      from: fromNumber,
      to: to
    });

    console.log('SMS sent successfully:', smsResult.sid);

    return NextResponse.json({
      success: true,
      message: 'SMS sent successfully',
      sid: smsResult.sid
    });

  } catch (error) {
    console.error('SMS sending error:', error);
    logError(error, 'POST /api/notifications/sms', { 
      to: request.body?.to,
      urgent: request.body?.urgent 
    });
    return handleApiError(error, 'POST /api/notifications/sms');
  }
}