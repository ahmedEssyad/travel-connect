import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Trip from '@/models/Trip';
import { requireAuth } from '@/lib/auth-middleware';
import { tripCreateSchema, tripUpdateSchema, validateData } from '@/lib/validation-schemas';
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
    const userId = searchParams.get('userId');
    const myTripsOnly = searchParams.get('myTripsOnly') === 'true';
    
    let query = {};
    
    if (userId) {
      // If userId is provided, ensure it matches the authenticated user for security
      if (userId !== user.uid) {
        throw createApiError('Unauthorized: Cannot access other users\' trips', HttpStatus.FORBIDDEN, ErrorTypes.AUTHORIZATION_ERROR);
      }
      query = { userId };
    } else if (myTripsOnly) {
      // Filter by authenticated user's trips only
      query = { userId: user.uid };
    }
    // If no filter specified, return all trips (public listings)
    
    // Limit results and select only necessary fields for better performance
    const trips = await Trip.find(query)
      .sort({ createdAt: -1 })
      .limit(100) // Limit to 100 most recent trips
      .select('-__v') // Exclude version field
      .lean(); // Return plain objects instead of mongoose documents
    
    return NextResponse.json(trips);
  } catch (error) {
    logError(error, 'GET /api/trips', { userId: request.headers.get('x-user-id') });
    return handleApiError(error, 'GET /api/trips');
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { authenticated, user, error } = await requireAuth(request);
    if (!authenticated) {
      throw createApiError(error || 'Authentication required', HttpStatus.UNAUTHORIZED, ErrorTypes.AUTHENTICATION_ERROR);
    }

    await connectDB();
    
    const body = await request.json();
    
    // Validate input data
    const validation = validateData(tripCreateSchema, body);
    if (!validation.success) {
      throw createApiError(validation.error, HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
    }
    
    // Ensure the trip belongs to the authenticated user
    const tripData = {
      ...validation.data,
      userId: user.uid, // Override with authenticated user's ID
    };
    
    const trip = new Trip(tripData);
    await trip.save();
    
    return NextResponse.json(trip, { status: HttpStatus.CREATED });
  } catch (error) {
    logError(error, 'POST /api/trips', { userId: request.headers.get('x-user-id'), body: JSON.stringify(body || {}) });
    return handleApiError(error, 'POST /api/trips');
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
    const { _id, ...updateData } = body;
    
    if (!_id) {
      throw createApiError('Trip ID is required', HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
    }
    
    // Validate input data
    const validation = validateData(tripUpdateSchema, updateData);
    if (!validation.success) {
      throw createApiError(validation.error, HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
    }
    
    // Ensure the user can only update their own trips
    const trip = await Trip.findOneAndUpdate(
      { _id, userId: user.uid }, // Match both ID and user ownership
      validation.data, 
      { new: true }
    );
    
    if (!trip) {
      throw createApiError('Trip not found or unauthorized', HttpStatus.NOT_FOUND, ErrorTypes.NOT_FOUND);
    }
    
    return NextResponse.json(trip);
  } catch (error) {
    logError(error, 'PUT /api/trips', { userId: request.headers.get('x-user-id'), tripId: body?._id });
    return handleApiError(error, 'PUT /api/trips');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const { authenticated, user, error } = await requireAuth(request);
    if (!authenticated) {
      throw createApiError(error || 'Authentication required', HttpStatus.UNAUTHORIZED, ErrorTypes.AUTHENTICATION_ERROR);
    }

    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      throw createApiError('Trip ID required', HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
    }
    
    // Ensure the user can only delete their own trips
    const trip = await Trip.findOneAndDelete({ _id: id, userId: user.uid });
    
    if (!trip) {
      throw createApiError('Trip not found or unauthorized', HttpStatus.NOT_FOUND, ErrorTypes.NOT_FOUND);
    }
    
    return NextResponse.json({ message: 'Trip deleted successfully' });
  } catch (error) {
    logError(error, 'DELETE /api/trips', { userId: request.headers.get('x-user-id'), tripId: id });
    return handleApiError(error, 'DELETE /api/trips');
  }
}