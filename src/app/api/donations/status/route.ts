import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { handleApiError, logError, createApiError, ErrorTypes, HttpStatus } from '@/lib/error-handler';
import connectDB from '@/lib/mongodb';
import Donation from '@/models/Donation';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const { authenticated, user, error } = await requireAuth(request);
    if (!authenticated) {
      throw createApiError(error || 'Authentication required', HttpStatus.UNAUTHORIZED, ErrorTypes.AUTHENTICATION_ERROR);
    }

    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');

    if (!requestId) {
      throw createApiError('Request ID is required', HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
    }

    await connectDB();

    // Get donation status
    const donation = await Donation.findOne({ requestId })
      .populate('donorId', 'name phoneNumber bloodType')
      .populate('recipientId', 'name phoneNumber');

    if (!donation) {
      // No donation record exists yet - we need to determine user role from the blood request
      const BloodRequest = (await import('@/models/BloodRequest')).default;
      const bloodRequest = await BloodRequest.findById(requestId);
      
      let userRole = null;
      let canConfirm = false;
      
      if (bloodRequest) {
        console.log('No donation record, checking blood request:', {
          requesterId: bloodRequest.requesterId,
          currentUserId: user.id,
          userName: user.name,
          matchedDonors: bloodRequest.matchedDonors
        });
        
        if (bloodRequest.requesterId.toString() === user.id) {
          userRole = 'recipient';
          canConfirm = false; // Recipient can't confirm until donor confirms first
        } else {
          // Anyone who is not the recipient can potentially be a donor
          // They might help through chat even if not formally "matched"
          userRole = 'donor';
          canConfirm = true; // Any potential donor can start the confirmation process
        }
      }
      
      return NextResponse.json({
        success: true,
        donation: null,
        canConfirm,
        userRole
      });
    }

    // Determine user's role in this donation
    let userRole = null;
    console.log('Donation status debug:', {
      donorId: donation.donorId._id.toString(),
      recipientId: donation.recipientId._id.toString(),
      currentUserId: user.id,
      userName: user.name
    });
    
    if (donation.donorId._id.toString() === user.id) {
      userRole = 'donor';
    } else if (donation.recipientId._id.toString() === user.id) {
      userRole = 'recipient';
    }

    // Determine if user can confirm
    let canConfirm = false;
    if (userRole === 'donor' && !donation.donorConfirmed) {
      canConfirm = true;
    } else if (userRole === 'recipient' && donation.donorConfirmed && !donation.recipientConfirmed) {
      canConfirm = true;
    }

    return NextResponse.json({
      success: true,
      donation,
      canConfirm,
      userRole,
      status: donation.status
    });

  } catch (error) {
    logError(error, 'GET /api/donations/status');
    return handleApiError(error, 'GET /api/donations/status');
  }
}