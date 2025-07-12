import { NextRequest, NextResponse } from 'next/server';
import { verifyCode, generateAuthToken, formatMauritanianPhone } from '@/lib/sms-auth';
import { handleApiError, logError, createApiError, ErrorTypes, HttpStatus } from '@/lib/error-handler';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, code } = await request.json();

    if (!phoneNumber || !code) {
      throw createApiError('Phone number and verification code are required', HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
    }

    // Verify the code
    const result = await verifyCode(phoneNumber, code);

    if (!result.success) {
      throw createApiError(result.message, HttpStatus.BAD_REQUEST, ErrorTypes.AUTHENTICATION_ERROR);
    }

    await connectDB();

    const formattedPhone = formatMauritanianPhone(phoneNumber);

    // Find or create user
    let user = await User.findOne({ phoneNumber: formattedPhone });
    
    if (!user) {
      // Create new user
      user = new User({
        phoneNumber: formattedPhone,
        name: '', // Will be set during profile completion
        email: '', // Optional
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await user.save();
    } else {
      // Update last login
      user.updatedAt = new Date();
      await user.save();
    }

    // Generate JWT token
    const token = generateAuthToken(user._id.toString(), formattedPhone);

    return NextResponse.json({
      success: true,
      message: 'Authentication successful',
      user: {
        id: user._id.toString(),
        phoneNumber: user.phoneNumber,
        name: user.name,
        email: user.email,
        bloodType: user.bloodType,
        isProfileComplete: !!(user.name && user.bloodType),
        hasPassword: user.hasPassword || false
      },
      token
    });

  } catch (error) {
    logError(error, 'POST /api/auth/verify-code');
    return handleApiError(error, 'POST /api/auth/verify-code');
  }
}