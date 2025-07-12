import { NextRequest, NextResponse } from 'next/server';
import { hashSync } from 'bcryptjs';
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

    const { password } = await request.json();

    if (!password) {
      throw createApiError('Password is required', HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
    }

    if (password.length < 6) {
      throw createApiError('Password must be at least 6 characters long', HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
    }

    await connectDB();

    // Hash password
    const hashedPassword = hashSync(password, 12);

    // Update user password
    const updatedUser = await User.findByIdAndUpdate(user.id, {
      password: hashedPassword,
      hasPassword: true,
      updatedAt: new Date()
    }, { new: true });

    console.log('Password set for user:', user.id, 'hasPassword:', updatedUser?.hasPassword);

    return NextResponse.json({
      success: true,
      message: 'Password set successfully'
    });

  } catch (error) {
    logError(error, 'POST /api/auth/set-password');
    return handleApiError(error, 'POST /api/auth/set-password');
  }
}