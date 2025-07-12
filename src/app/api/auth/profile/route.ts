import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/sms-auth';
import { handleApiError, logError, createApiError, ErrorTypes, HttpStatus } from '@/lib/error-handler';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw createApiError('Authorization token required', HttpStatus.UNAUTHORIZED, ErrorTypes.AUTHENTICATION_ERROR);
    }

    const decoded = verifyAuthToken(token);
    if (!decoded) {
      throw createApiError('Invalid or expired token', HttpStatus.UNAUTHORIZED, ErrorTypes.AUTHENTICATION_ERROR);
    }

    await connectDB();

    const user = await User.findById(decoded.userId);
    if (!user) {
      throw createApiError('User not found', HttpStatus.NOT_FOUND, ErrorTypes.NOT_FOUND);
    }

    console.log('Profile GET - User hasPassword:', user.hasPassword);

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        phoneNumber: user.phoneNumber,
        name: user.name,
        email: user.email,
        bloodType: user.bloodType,
        medicalInfo: user.medicalInfo,
        emergencyContacts: user.emergencyContacts,
        notificationPreferences: user.notificationPreferences,
        isProfileComplete: !!(user.name && user.bloodType),
        hasPassword: user.hasPassword || false
      }
    });

  } catch (error) {
    logError(error, 'GET /api/auth/profile');
    return handleApiError(error, 'GET /api/auth/profile');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw createApiError('Authorization token required', HttpStatus.UNAUTHORIZED, ErrorTypes.AUTHENTICATION_ERROR);
    }

    const decoded = verifyAuthToken(token);
    if (!decoded) {
      throw createApiError('Invalid or expired token', HttpStatus.UNAUTHORIZED, ErrorTypes.AUTHENTICATION_ERROR);
    }

    const updateData = await request.json();

    await connectDB();

    const user = await User.findByIdAndUpdate(
      decoded.userId,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );

    if (!user) {
      throw createApiError('User not found', HttpStatus.NOT_FOUND, ErrorTypes.NOT_FOUND);
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id.toString(),
        phoneNumber: user.phoneNumber,
        name: user.name,
        email: user.email,
        bloodType: user.bloodType,
        medicalInfo: user.medicalInfo,
        emergencyContacts: user.emergencyContacts,
        notificationPreferences: user.notificationPreferences,
        isProfileComplete: !!(user.name && user.bloodType),
        hasPassword: user.hasPassword || false
      }
    });

  } catch (error) {
    logError(error, 'PUT /api/auth/profile');
    return handleApiError(error, 'PUT /api/auth/profile');
  }
}