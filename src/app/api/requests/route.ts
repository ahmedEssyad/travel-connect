import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import BloodRequest from '@/models/BloodRequest';
import { requireAuth } from '@/lib/auth-middleware';
import { requestCreateSchema, requestUpdateSchema, validateData } from '@/lib/validation-schemas';
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
    const myRequestsOnly = searchParams.get('myRequestsOnly') === 'true';
    
    let query = {};
    
    if (userId) {
      // If userId is provided, ensure it matches the authenticated user for security
      if (userId !== user.uid) {
        throw createApiError('Unauthorized: Cannot access other users\' requests', HttpStatus.FORBIDDEN, ErrorTypes.AUTHORIZATION_ERROR);
      }
      query = { userId };
    } else if (myRequestsOnly) {
      // Filter by authenticated user's requests only
      query = { userId: user.uid };
    }
    // If no filter specified, return all requests (public listings)
    
    // Limit results and select only necessary fields for better performance
    const requests = await BloodRequest.find(query)
      .sort({ createdAt: -1 })
      .limit(100) // Limit to 100 most recent requests
      .select('-__v') // Exclude version field
      .lean(); // Return plain objects instead of mongoose documents
    
    return NextResponse.json(requests);
  } catch (error) {
    logError(error, 'GET /api/requests', { userId: request.headers.get('x-user-id') });
    return handleApiError(error, 'GET /api/requests');
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
    const validation = validateData(requestCreateSchema, body);
    if (!validation.success) {
      throw createApiError(validation.error, HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
    }
    
    // Ensure the request belongs to the authenticated user
    const requestData = {
      ...validation.data,
      userId: user.uid, // Override with authenticated user's ID
    };
    
    const bloodRequest = new BloodRequest(requestData);
    await bloodRequest.save();
    
    return NextResponse.json(bloodRequest, { status: HttpStatus.CREATED });
  } catch (error) {
    logError(error, 'POST /api/requests', { userId: request.headers.get('x-user-id'), body: JSON.stringify(body || {}) });
    return handleApiError(error, 'POST /api/requests');
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
      throw createApiError('Request ID is required', HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
    }
    
    // Validate input data
    const validation = validateData(requestUpdateSchema, updateData);
    if (!validation.success) {
      throw createApiError(validation.error, HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
    }
    
    // Ensure the user can only update their own requests
    const bloodRequest = await BloodRequest.findOneAndUpdate(
      { _id, userId: user.uid },
      validation.data, 
      { new: true }
    );
    
    if (!bloodRequest) {
      throw createApiError('Blood request not found or unauthorized', HttpStatus.NOT_FOUND, ErrorTypes.NOT_FOUND);
    }
    
    return NextResponse.json(bloodRequest);
  } catch (error) {
    logError(error, 'PUT /api/requests', { userId: request.headers.get('x-user-id'), requestId: body?._id });
    return handleApiError(error, 'PUT /api/requests');
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
      throw createApiError('Request ID required', HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
    }
    
    // Ensure the user can only delete their own requests
    const bloodRequest = await BloodRequest.findOneAndDelete({ _id: id, userId: user.uid });
    
    if (!bloodRequest) {
      throw createApiError('Blood request not found or unauthorized', HttpStatus.NOT_FOUND, ErrorTypes.NOT_FOUND);
    }
    
    return NextResponse.json({ message: 'Blood request deleted successfully' });
  } catch (error) {
    logError(error, 'DELETE /api/requests', { userId: request.headers.get('x-user-id'), requestId: id });
    return handleApiError(error, 'DELETE /api/requests');
  }
}