import { NextRequest, NextResponse } from 'next/server';
import { sendVerificationCode, validateMauritanianPhone, formatMauritanianPhone } from '@/lib/sms-auth';
import { handleApiError, logError, createApiError, ErrorTypes, HttpStatus } from '@/lib/error-handler';
import { smsRateLimit } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      throw createApiError('Phone number is required', HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
    }

    // Validate phone number format
    if (!validateMauritanianPhone(phoneNumber)) {
      throw createApiError('Invalid Mauritanian phone number format', HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
    }

    // Apply rate limiting by phone number
    const formattedPhone = formatMauritanianPhone(phoneNumber);
    const rateLimitResponse = await smsRateLimit(request, () => formattedPhone);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Send verification code
    const result = await sendVerificationCode(phoneNumber);

    if (!result.success) {
      throw createApiError(result.message, HttpStatus.BAD_REQUEST, ErrorTypes.EXTERNAL_SERVICE_ERROR);
    }

    return NextResponse.json({
      success: true,
      message: result.message
    });

  } catch (error) {
    logError(error, 'POST /api/auth/send-code');
    return handleApiError(error, 'POST /api/auth/send-code');
  }
}