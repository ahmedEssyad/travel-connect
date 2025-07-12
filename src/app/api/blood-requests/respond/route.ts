import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import BloodRequest from '@/models/BloodRequest';
import User from '@/models/User';
import { requireAuth } from '@/lib/auth-middleware';
import { handleApiError, logError, createApiError, ErrorTypes, HttpStatus } from '@/lib/error-handler';
import { canDonateToPatient } from '@/lib/blood-types';

export async function POST(request: NextRequest) {
  let body: any = null;
  
  try {
    // Verify authentication
    const { authenticated, user, error } = await requireAuth(request);
    if (!authenticated) {
      throw createApiError(error || 'Authentication required', HttpStatus.UNAUTHORIZED, ErrorTypes.AUTHENTICATION_ERROR);
    }

    await connectDB();
    
    body = await request.json();
    const { requestId } = body;
    
    if (!requestId) {
      throw createApiError('Request ID is required', HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
    }
    
    // Find the blood request
    const bloodRequest = await BloodRequest.findById(requestId);
    if (!bloodRequest) {
      throw createApiError('Blood request not found', HttpStatus.NOT_FOUND, ErrorTypes.NOT_FOUND);
    }
    
    // Check if request is still active
    if (bloodRequest.status !== 'active') {
      throw createApiError('Blood request is no longer active', HttpStatus.BAD_REQUEST, ErrorTypes.BUSINESS_LOGIC_ERROR);
    }
    
    // Check if deadline has passed
    if (bloodRequest.deadline < new Date()) {
      throw createApiError('Blood request deadline has passed', HttpStatus.BAD_REQUEST, ErrorTypes.BUSINESS_LOGIC_ERROR);
    }
    
    // Can't help your own request
    if (bloodRequest.requesterId === user.id) {
      throw createApiError('You cannot respond to your own request', HttpStatus.BAD_REQUEST, ErrorTypes.BUSINESS_LOGIC_ERROR);
    }
    
    // Get donor information
    const donor = await User.findById(user.id);
    if (!donor) {
      throw createApiError('Donor not found', HttpStatus.NOT_FOUND, ErrorTypes.NOT_FOUND);
    }
    
    // Check if donor has blood type information
    if (!donor.bloodType) {
      throw createApiError('Please update your blood type in your profile before helping', HttpStatus.BAD_REQUEST, ErrorTypes.BUSINESS_LOGIC_ERROR);
    }
    
    // Check blood type compatibility
    if (!canDonateToPatient(donor.bloodType, bloodRequest.patientInfo.bloodType)) {
      throw createApiError(`Your blood type ${donor.bloodType} is not compatible with ${bloodRequest.patientInfo.bloodType}`, HttpStatus.BAD_REQUEST, ErrorTypes.BUSINESS_LOGIC_ERROR);
    }
    
    // Check if donor has already responded
    const existingResponse = bloodRequest.matchedDonors.find(
      (matchedDonor: any) => matchedDonor.donorId === user.id
    );
    
    if (existingResponse) {
      throw createApiError('You have already responded to this request', HttpStatus.BAD_REQUEST, ErrorTypes.BUSINESS_LOGIC_ERROR);
    }
    
    // Get requester information
    const requester = await User.findById(bloodRequest.requesterId);
    if (!requester) {
      throw createApiError('Requester not found', HttpStatus.NOT_FOUND, ErrorTypes.NOT_FOUND);
    }
    
    // Add donor response
    const donorResponse = {
      donorId: user.id,
      donorName: donor.name,
      donorBloodType: donor.bloodType,
      donorPhone: donor.phoneNumber,
      status: 'accepted',
      respondedAt: new Date()
    };
    
    // Update blood request with donor response
    await BloodRequest.findByIdAndUpdate(
      requestId,
      { 
        $push: { matchedDonors: donorResponse }
      }
    );
    
    // Create chat ID (sorted alphabetically for consistency)
    const chatId = [user.id, bloodRequest.requesterId].sort().join('_');
    
    // Create auto-message for the chat
    const Message = (await import('@/models/Message')).default;
    const autoMessage = new Message({
      chatId,
      senderId: 'system',
      text: `${donor.name} (${donor.bloodType}) wants to help with your blood request! 🩸`,
      timestamp: new Date()
    });
    await autoMessage.save();
    
    console.log(`Donor ${donor.name} (${donor.bloodType}) responded to blood request ${requestId} and chat created`);
    
    // Return success with chat information
    return NextResponse.json({
      success: true,
      message: 'Response recorded successfully! You can now chat with the requester.',
      chatId,
      donor: {
        id: donor._id,
        name: donor.name,
        bloodType: donor.bloodType,
        phoneNumber: donor.phoneNumber
      },
      requester: {
        id: requester._id,
        name: requester.name,
        phoneNumber: requester.phoneNumber
      },
      request: {
        id: bloodRequest._id,
        patientInfo: bloodRequest.patientInfo,
        hospital: bloodRequest.hospital,
        deadline: bloodRequest.deadline,
        urgencyLevel: bloodRequest.urgencyLevel
      }
    });

  } catch (error) {
    console.error('Donor response error:', error);
    logError(error, 'POST /api/blood-requests/respond', { 
      userId: null,
      requestId: body?.requestId 
    });
    return handleApiError(error, 'POST /api/blood-requests/respond');
  }
}