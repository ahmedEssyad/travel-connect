import { NextRequest, NextResponse } from 'next/server';
import { hashSync } from 'bcryptjs';
import { verifyCode, formatMauritanianPhone } from '@/lib/sms-auth';
import { handleApiError, logError, createApiError, ErrorTypes, HttpStatus } from '@/lib/error-handler';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, code, newPassword } = await request.json();

    if (!phoneNumber || !code || !newPassword) {
      throw createApiError('Phone number, verification code, and new password are required', HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
    }

    if (newPassword.length < 6) {
      throw createApiError('Password must be at least 6 characters long', HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
    }

    // Verify the SMS code
    const result = await verifyCode(phoneNumber, code);

    if (!result.success) {
      throw createApiError(result.message, HttpStatus.BAD_REQUEST, ErrorTypes.AUTHENTICATION_ERROR);
    }

    await connectDB();

    const formattedPhone = formatMauritanianPhone(phoneNumber);

    // Find user
    const user = await User.findOne({ phoneNumber: formattedPhone });
    
    if (!user) {
      throw createApiError('User not found', HttpStatus.NOT_FOUND, ErrorTypes.NOT_FOUND);
    }

    // Hash the new password
    const hashedPassword = hashSync(newPassword, 12);

    // Update user password
    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      hasPassword: true,
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    logError(error, 'POST /api/auth/reset-password');
    return handleApiError(error, 'POST /api/auth/reset-password');
  }
}