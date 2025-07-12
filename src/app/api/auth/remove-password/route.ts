import { NextRequest, NextResponse } from 'next/server';
import { compareSync } from 'bcryptjs';
import { requireAuth } from '@/lib/auth-middleware';
import { handleApiError, logError, createApiError, ErrorTypes, HttpStatus } from '@/lib/error-handler';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { authenticated, user, error } = await requireAuth(request);
    if (!authenticated) {
      throw createApiError(error || 'Authentication required', HttpStatus.UNAUTHORIZED, ErrorTypes.AUTHENTICATION_ERROR);
    }

    const { currentPassword } = await request.json();

    if (!currentPassword) {
      throw createApiError('Current password is required', HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
    }

    await connectDB();

    // Find user with password field included
    const userDoc = await User.findById(user.id).select('+password');
    
    if (!userDoc) {
      throw createApiError('User not found', HttpStatus.NOT_FOUND, ErrorTypes.NOT_FOUND);
    }

    if (!userDoc.hasPassword || !userDoc.password) {
      throw createApiError('No password set', HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
    }

    // Verify current password
    const isCurrentPasswordValid = compareSync(currentPassword, userDoc.password);
    
    if (!isCurrentPasswordValid) {
      throw createApiError('Current password is incorrect', HttpStatus.BAD_REQUEST, ErrorTypes.AUTHENTICATION_ERROR);
    }

    // Remove password
    await User.findByIdAndUpdate(user.id, {
      $unset: { password: 1 },
      hasPassword: false,
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Password removed successfully'
    });

  } catch (error) {
    logError(error, 'POST /api/auth/remove-password');
    return handleApiError(error, 'POST /api/auth/remove-password');
  }
}