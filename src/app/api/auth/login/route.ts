import { NextRequest, NextResponse } from 'next/server';
import { compareSync } from 'bcryptjs';
import { generateAuthToken, formatMauritanianPhone } from '@/lib/sms-auth';
import { handleApiError, logError, createApiError, ErrorTypes, HttpStatus } from '@/lib/error-handler';
import { authRateLimit } from '@/lib/rate-limiter';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, password } = await request.json();

    if (!phoneNumber || !password) {
      throw createApiError('Phone number and password are required', HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
    }

    // Apply rate limiting for login attempts
    const rateLimitResponse = await authRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    await connectDB();

    const formattedPhone = formatMauritanianPhone(phoneNumber);

    // Find user with password field included
    const user = await User.findOne({ phoneNumber: formattedPhone }).select('+password');
    
    if (!user) {
      throw createApiError('User not found', HttpStatus.NOT_FOUND, ErrorTypes.NOT_FOUND);
    }

    if (!user.hasPassword || !user.password) {
      throw createApiError('Password not set. Please use SMS verification.', HttpStatus.BAD_REQUEST, ErrorTypes.AUTHENTICATION_ERROR);
    }

    // Verify password
    const isPasswordValid = compareSync(password, user.password);
    
    if (!isPasswordValid) {
      throw createApiError('Invalid password', HttpStatus.BAD_REQUEST, ErrorTypes.AUTHENTICATION_ERROR);
    }

    // Update last login
    user.updatedAt = new Date();
    await user.save();

    // Generate JWT token
    const token = generateAuthToken(user._id.toString(), formattedPhone);

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id.toString(),
        phoneNumber: user.phoneNumber,
        name: user.name,
        email: user.email,
        bloodType: user.bloodType,
        isProfileComplete: !!(user.name && user.bloodType),
        hasPassword: user.hasPassword
      },
      token
    });

  } catch (error) {
    logError(error, 'POST /api/auth/login');
    return handleApiError(error, 'POST /api/auth/login');
  }
}