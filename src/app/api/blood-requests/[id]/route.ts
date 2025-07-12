import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import BloodRequest from '@/models/BloodRequest';
import { requireAuth } from '@/lib/auth-middleware';
import { handleApiError, logError, createApiError, ErrorTypes, HttpStatus } from '@/lib/error-handler';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const { authenticated, user, error } = await requireAuth(request);
    if (!authenticated) {
      throw createApiError(error || 'Authentication required', HttpStatus.UNAUTHORIZED, ErrorTypes.AUTHENTICATION_ERROR);
    }

    await connectDB();
    
    const { id } = await params;
    
    if (!id) {
      throw createApiError('Blood request ID is required', HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
    }
    
    // Find the blood request
    const bloodRequest = await BloodRequest.findById(id);
    
    if (!bloodRequest) {
      throw createApiError('Blood request not found', HttpStatus.NOT_FOUND, ErrorTypes.NOT_FOUND);
    }
    
    // Check if user has access to this request
    // Users can view:
    // 1. Their own requests
    // 2. Requests they've responded to
    // 3. Active requests (for potential donors)
    const hasAccess = 
      bloodRequest.requesterId === user.id || // Own request
      bloodRequest.matchedDonors?.some((donor: any) => donor.donorId === user.id) || // Responded to
      bloodRequest.status === 'active'; // Active request
    
    if (!hasAccess) {
      throw createApiError('Access denied to this blood request', HttpStatus.FORBIDDEN, ErrorTypes.AUTHORIZATION_ERROR);
    }
    
    return NextResponse.json(bloodRequest);
    
  } catch (error) {
    const resolvedParams = await params;
    logError(error, `GET /api/blood-requests/${resolvedParams.id}`, { 
      userId: null,
      requestId: resolvedParams.id 
    });
    return handleApiError(error, `GET /api/blood-requests/${resolvedParams.id}`);
  }
}