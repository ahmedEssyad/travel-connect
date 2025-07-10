import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { requireAuth } from '@/lib/auth-middleware';
import { userSchema, userUpdateSchema, validateData } from '@/lib/validation-schemas';
import { handleApiError, logError, createApiError, ErrorTypes, HttpStatus } from '@/lib/error-handler';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const { authenticated, user, error } = await requireAuth(request);
    if (!authenticated) {
      throw createApiError(error || 'Authentication required', HttpStatus.UNAUTHORIZED, ErrorTypes.AUTHENTICATION_ERROR);
    }

    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');
    
    if (uid) {
      // Users can only access their own profile or public profiles
      const requestedUser = await User.findOne({ uid });
      if (!requestedUser) {
        throw createApiError('User not found', HttpStatus.NOT_FOUND, ErrorTypes.NOT_FOUND);
      }
      
      // Return only public fields for other users
      if (uid !== user.uid) {
        const publicProfile = {
          uid: requestedUser.uid,
          name: requestedUser.name,
          rating: requestedUser.rating,
          location: requestedUser.location,
          bio: requestedUser.bio,
          photo: requestedUser.photo,
          createdAt: requestedUser.createdAt,
        };
        return NextResponse.json(publicProfile);
      }
      
      // Return full profile for own user, but exclude sensitive fields
      const ownProfile = {
        uid: requestedUser.uid,
        name: requestedUser.name,
        email: requestedUser.email,
        rating: requestedUser.rating,
        location: requestedUser.location,
        bio: requestedUser.bio,
        photo: requestedUser.photo,
        createdAt: requestedUser.createdAt,
        updatedAt: requestedUser.updatedAt,
        // Exclude internal fields like __v, _id, etc.
      };
      return NextResponse.json(ownProfile);
    }
    
    // Remove the ability to list all users for security
    throw createApiError('User ID required', HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
  } catch (error) {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');
    logError(error, 'GET /api/users', { userId: request.headers.get('x-user-id'), requestedUid: uid });
    return handleApiError(error, 'GET /api/users');
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    
    // Validate input data
    const validation = validateData(userSchema, body);
    if (!validation.success) {
      throw createApiError(validation.error, HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
    }
    
    const user = new User(validation.data);
    await user.save();
    
    return NextResponse.json(user, { status: HttpStatus.CREATED });
  } catch (error) {
    logError(error, 'POST /api/users', { body: JSON.stringify(body || {}) });
    return handleApiError(error, 'POST /api/users');
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify authentication
    const { authenticated, user, error } = await requireAuth(request);
    if (!authenticated) {
      throw createApiError(error || 'Authentication required', HttpStatus.UNAUTHORIZED, ErrorTypes.AUTHENTICATION_ERROR);
    }

    await connectDB();
    
    const body = await request.json();
    const { uid, ...updateData } = body;
    
    if (!uid) {
      throw createApiError('User ID is required', HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
    }
    
    // Users can only update their own profile
    if (uid !== user.uid) {
      throw createApiError('Unauthorized: Cannot update other users', HttpStatus.FORBIDDEN, ErrorTypes.AUTHORIZATION_ERROR);
    }
    
    // Validate input data
    const validation = validateData(userUpdateSchema, updateData);
    if (!validation.success) {
      throw createApiError(validation.error, HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
    }
    
    const updatedUser = await User.findOneAndUpdate(
      { uid },
      validation.data,
      { new: true }
    );
    
    if (!updatedUser) {
      throw createApiError('User not found', HttpStatus.NOT_FOUND, ErrorTypes.NOT_FOUND);
    }
    
    return NextResponse.json(updatedUser);
  } catch (error) {
    logError(error, 'PUT /api/users', { userId: request.headers.get('x-user-id'), targetUid: body?.uid });
    return handleApiError(error, 'PUT /api/users');
  }
}