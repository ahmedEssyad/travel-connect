import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { handleApiError, logError, createApiError, ErrorTypes, HttpStatus } from '@/lib/error-handler';
import connectDB from '@/lib/mongodb';
import EnhancedDonation from '@/models/EnhancedDonation';
import BloodRequest from '@/models/BloodRequest';
import User from '@/models/User';

// GET - Retrieve donation status and timeline
export async function GET(request: NextRequest) {
  try {
    const { authenticated, user, error } = await requireAuth(request);
    if (!authenticated) {
      throw createApiError(error || 'Authentication required', HttpStatus.UNAUTHORIZED, ErrorTypes.AUTHENTICATION_ERROR);
    }

    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');
    const donationId = searchParams.get('donationId');

    if (!requestId && !donationId) {
      throw createApiError('Request ID or Donation ID required', HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
    }

    await connectDB();

    let donation;
    if (donationId) {
      donation = await EnhancedDonation.findById(donationId)
        .populate('donorId', 'name phoneNumber bloodType')
        .populate('recipientId', 'name phoneNumber');
    } else {
      donation = await EnhancedDonation.findOne({ requestId })
        .populate('donorId', 'name phoneNumber bloodType')
        .populate('recipientId', 'name phoneNumber');
    }

    if (!donation) {
      // Check if user is authorized for this blood request
      const bloodRequest = await BloodRequest.findById(requestId);
      if (!bloodRequest) {
        throw createApiError('Blood request not found', HttpStatus.NOT_FOUND, ErrorTypes.NOT_FOUND);
      }

      // Determine user role
      let userRole = null;
      let canInitiate = false;

      if (bloodRequest.requesterId.toString() === user.id) {
        userRole = 'recipient';
        canInitiate = false; // Recipients can't initiate donations
      } else {
        // Check if user is a matched donor
        const donorResponse = bloodRequest.matchedDonors.find(
          (matchedDonor: any) => matchedDonor.donorId === user.id
        );
        if (donorResponse && donorResponse.status === 'accepted') {
          userRole = 'donor';
          canInitiate = true;
        }
      }

      return NextResponse.json({
        donation: null,
        userRole,
        canInitiate,
        bloodRequest: {
          id: bloodRequest._id,
          patientInfo: bloodRequest.patientInfo,
          hospital: bloodRequest.hospital,
          urgencyLevel: bloodRequest.urgencyLevel,
          deadline: bloodRequest.deadline
        }
      });
    }

    // Determine user's role and permissions
    let userRole = null;
    let permissions = {
      canSchedule: false,
      canConfirmArrival: false,
      canConfirmCompletion: false,
      canConfirmReceipt: false,
      canDispute: false
    };

    const donorIdStr = donation.donorId?._id?.toString() || donation.donorId.toString();
    const recipientIdStr = donation.recipientId?._id?.toString() || donation.recipientId.toString();

    if (donorIdStr === user.id) {
      userRole = 'donor';
      permissions = {
        canSchedule: true,
        canConfirmArrival: donation.appointmentStatus === 'confirmed',
        canConfirmCompletion: donation.confirmations.donorArrived,
        canConfirmReceipt: false,
        canDispute: true
      };
    } else if (recipientIdStr === user.id) {
      userRole = 'recipient';
      permissions = {
        canSchedule: true,
        canConfirmArrival: false,
          canConfirmCompletion: false,
        canConfirmReceipt: donation.confirmations.donorCompleted,
        canDispute: true
      };
    }

    return NextResponse.json({
      donation,
      userRole,
      permissions,
      timeline: donation.timeline,
      verificationLevel: donation.verificationLevel,
      trustScore: donation.trustScore
    });

  } catch (error) {
    logError(error, 'GET /api/enhanced-donations');
    return handleApiError(error, 'GET /api/enhanced-donations');
  }
}

// POST - Create or update donation with advanced tracking
export async function POST(request: NextRequest) {
  try {
    const { authenticated, user, error } = await requireAuth(request);
    if (!authenticated) {
      throw createApiError(error || 'Authentication required', HttpStatus.UNAUTHORIZED, ErrorTypes.AUTHENTICATION_ERROR);
    }

    const body = await request.json();
    const { 
      action, // 'initiate', 'schedule', 'confirm_arrival', 'confirm_completion', 'confirm_receipt', 'dispute'
      requestId,
      donationId,
      ...actionData 
    } = body;

    if (!action) {
      throw createApiError('Action is required', HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
    }

    await connectDB();

    let donation;
    let bloodRequest;

    if (donationId) {
      donation = await EnhancedDonation.findById(donationId);
    } else if (requestId) {
      donation = await EnhancedDonation.findOne({ requestId });
      bloodRequest = await BloodRequest.findById(requestId);
    }

    switch (action) {
      case 'initiate':
        return await initiateDonation(user, requestId, actionData);
      
      case 'schedule':
        return await scheduleAppointment(donation, user, actionData);
      
      case 'confirm_arrival':
        return await confirmArrival(donation, user, actionData);
      
      case 'confirm_completion':
        return await confirmCompletion(donation, user, actionData);
      
      case 'confirm_receipt':
        return await confirmReceipt(donation, user, actionData);
      
      case 'dispute':
        return await createDispute(donation, user, actionData);
      
      default:
        throw createApiError('Invalid action', HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
    }

  } catch (error) {
    logError(error, 'POST /api/enhanced-donations');
    return handleApiError(error, 'POST /api/enhanced-donations');
  }
}

// Helper functions for each action
async function initiateDonation(user: any, requestId: string, data: any) {
  // Input validation
  if (!requestId || !requestId.match(/^[0-9a-fA-F]{24}$/)) {
    throw createApiError('Invalid request ID format', HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
  }

  // Verify user can initiate donation
  const bloodRequest = await BloodRequest.findById(requestId);
  if (!bloodRequest) {
    throw createApiError('Blood request not found', HttpStatus.NOT_FOUND, ErrorTypes.NOT_FOUND);
  }

  const donorResponse = bloodRequest.matchedDonors.find(
    (matchedDonor: any) => matchedDonor.donorId === user.id
  );
  if (!donorResponse || donorResponse.status !== 'accepted') {
    throw createApiError('You must accept to help before initiating donation', HttpStatus.FORBIDDEN, ErrorTypes.AUTHORIZATION_ERROR);
  }

  // Check if donation already exists - prevent dual records
  const existingDonation = await EnhancedDonation.findOne({ requestId });
  if (existingDonation) {
    throw createApiError('Donation already initiated for this request', HttpStatus.CONFLICT, ErrorTypes.BUSINESS_LOGIC_ERROR);
  }

  // Additional validation: Check if user has already initiated donation for this request
  const donorExistingDonation = await EnhancedDonation.findOne({ 
    requestId, 
    donorId: user.id 
  });
  if (donorExistingDonation) {
    throw createApiError('You have already initiated a donation for this request', HttpStatus.CONFLICT, ErrorTypes.BUSINESS_LOGIC_ERROR);
  }

  // Validate blood request is still active
  if (bloodRequest.status !== 'active') {
    throw createApiError('Blood request is no longer active', HttpStatus.BAD_REQUEST, ErrorTypes.BUSINESS_LOGIC_ERROR);
  }

  // Create new enhanced donation
  const donor = await User.findById(user.id);
  const donation = new EnhancedDonation({
    requestId,
    donorId: user.id,
    recipientId: bloodRequest.requesterId,
    bloodType: donor.bloodType,
    hospital: {
      name: data.hospitalName || bloodRequest.hospital?.name || 'Hospital not specified',
      address: data.hospitalAddress || bloodRequest.hospital?.address,
      contactNumber: data.hospitalPhone || bloodRequest.hospital?.contactNumber,
      department: data.department || bloodRequest.hospital?.department
    },
    metadata: {
      emergencyLevel: bloodRequest.urgencyLevel
    },
    overallStatus: 'initiated'
  });

  // Add initial timeline entry
  await donation.addTimelineEntry(
    'initiation',
    'donation_initiated',
    'donor',
    `Donation initiated by ${donor.name}`,
    data.location
  );

  await donation.save();

  return NextResponse.json({
    success: true,
    message: 'Donation initiated successfully',
    donation,
    nextSteps: ['Schedule appointment with recipient', 'Coordinate hospital visit time']
  }, { status: HttpStatus.CREATED });
}

async function scheduleAppointment(donation: any, user: any, data: any) {
  if (!donation) {
    throw createApiError('Donation not found', HttpStatus.NOT_FOUND, ErrorTypes.NOT_FOUND);
  }

  const { appointmentDate, appointmentTime, place, hospitalDetails, estimatedDuration } = data;

  if (!appointmentDate || !appointmentTime || !place) {
    throw createApiError('Appointment date, time, and place are required', HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
  }

  // Validate appointment date is in the future
  const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
  if (appointmentDateTime <= new Date()) {
    throw createApiError('Appointment must be scheduled for a future date and time', HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
  }

  // Validate appointment is not too far in the future (30 days max)
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  if (appointmentDateTime > maxDate) {
    throw createApiError('Appointment cannot be scheduled more than 30 days in advance', HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
  }

  // Update donation with appointment details
  donation.appointmentDate = new Date(appointmentDate);
  donation.appointmentTime = appointmentTime;
  donation.appointmentPlace = place;
  donation.estimatedDuration = estimatedDuration || 60;
  donation.appointmentStatus = 'confirmed';
  donation.overallStatus = 'scheduled';

  if (hospitalDetails) {
    Object.assign(donation.hospital, hospitalDetails);
  }

  await donation.addTimelineEntry(
    'scheduling',
    'appointment_scheduled',
    user.id === donation.donorId.toString() ? 'donor' : 'recipient',
    `Appointment scheduled for ${appointmentDate} at ${appointmentTime}${place ? ` at ${place}` : ''}`,
    data.location
  );

  await donation.save();

  // TODO: Send notifications to both parties
  // TODO: Send calendar invites
  // TODO: Set up reminder notifications

  return NextResponse.json({
    success: true,
    message: 'Appointment scheduled successfully',
    donation,
    nextSteps: ['Confirm attendance closer to appointment date', 'Arrive at hospital on time']
  });
}

async function confirmArrival(donation: any, user: any, data: any) {
  if (!donation) {
    throw createApiError('Donation not found', HttpStatus.NOT_FOUND, ErrorTypes.NOT_FOUND);
  }

  if (user.id !== donation.donorId.toString()) {
    throw createApiError('Only the donor can confirm arrival', HttpStatus.FORBIDDEN, ErrorTypes.AUTHORIZATION_ERROR);
  }

  donation.confirmations.donorArrived = true;
  donation.confirmations.donorArrivedAt = new Date();
  donation.confirmations.donorLocation = data.location;
  donation.overallStatus = 'in_progress';

  await donation.addTimelineEntry(
    'arrival',
    'donor_arrived',
    'donor',
    `Donor arrived at ${donation.hospital.name}`,
    data.location,
    data.arrivalPhoto
  );

  await donation.save();

  return NextResponse.json({
    success: true,
    message: 'Arrival confirmed. You can now proceed with donation.',
    donation,
    nextSteps: ['Complete the donation process', 'Upload donation receipt when done']
  });
}


async function confirmCompletion(donation: any, user: any, data: any) {
  if (!donation) {
    throw createApiError('Donation not found', HttpStatus.NOT_FOUND, ErrorTypes.NOT_FOUND);
  }

  if (user.id !== donation.donorId.toString()) {
    throw createApiError('Only the donor can confirm completion', HttpStatus.FORBIDDEN, ErrorTypes.AUTHORIZATION_ERROR);
  }

  donation.confirmations.donorCompleted = true;
  donation.confirmations.donorCompletedAt = new Date();
  donation.confirmations.donorNotes = data.notes;
  
  // Update medical info
  if (data.medicalInfo) {
    Object.assign(donation.medicalInfo, data.medicalInfo);
  }

  await donation.addTimelineEntry(
    'completion',
    'donor_completed',
    'donor',
    data.notes || 'Donation completed successfully',
    data.location
  );

  await donation.save();

  return NextResponse.json({
    success: true,
    message: 'Donation completion confirmed. Waiting for recipient confirmation.',
    donation,
    nextSteps: ['Recipient will confirm when blood is received', 'Process will be complete after recipient confirmation']
  });
}

async function confirmReceipt(donation: any, user: any, data: any) {
  if (!donation) {
    throw createApiError('Donation not found', HttpStatus.NOT_FOUND, ErrorTypes.NOT_FOUND);
  }

  if (user.id !== donation.recipientId.toString()) {
    throw createApiError('Only the recipient can confirm receipt', HttpStatus.FORBIDDEN, ErrorTypes.AUTHORIZATION_ERROR);
  }

  if (!donation.confirmations.donorCompleted) {
    throw createApiError('Donor must complete donation first', HttpStatus.BAD_REQUEST, ErrorTypes.BUSINESS_LOGIC_ERROR);
  }

  donation.confirmations.recipientReceived = true;
  donation.confirmations.recipientReceivedAt = new Date();
  donation.confirmations.recipientNotes = data.notes;

  await donation.addTimelineEntry(
    'receipt',
    'recipient_confirmed',
    'recipient',
    data.notes || 'Blood received successfully',
    data.location
  );

  await donation.save();

  // Update donor's statistics
  await User.findByIdAndUpdate(donation.donorId, {
    $inc: { totalDonations: 1 },
    $set: { 
      'medicalInfo.lastDonationDate': donation.confirmations.donorCompletedAt,
      updatedAt: new Date()
    }
  });

  // Update blood request status
  await BloodRequest.findOneAndUpdate(
    { 
      _id: donation.requestId,
      'matchedDonors.donorId': donation.donorId 
    },
    {
      $set: {
        status: 'fulfilled',
        'matchedDonors.$.status': 'completed'
      }
    }
  );

  return NextResponse.json({
    success: true,
    message: '🎉 Donation process completed successfully! Thank you for saving a life.',
    donation,
    completed: true
  });
}

async function createDispute(donation: any, user: any, data: any) {
  if (!donation) {
    throw createApiError('Donation not found', HttpStatus.NOT_FOUND, ErrorTypes.NOT_FOUND);
  }

  const userRole = user.id === donation.donorId.toString() ? 'donor' : 
                   user.id === donation.recipientId.toString() ? 'recipient' : null;

  if (!userRole) {
    throw createApiError('You are not authorized to dispute this donation', HttpStatus.FORBIDDEN, ErrorTypes.AUTHORIZATION_ERROR);
  }

  const dispute = {
    reportedBy: user.id,
    reason: data.reason,
    status: 'open',
    createdAt: new Date()
  };

  if (!donation.disputes) {
    donation.disputes = [];
  }
  donation.disputes.push(dispute);

  await donation.addTimelineEntry(
    'dispute',
    'dispute_opened',
    userRole as any,
    `Dispute opened: ${data.reason}`,
    data.location
  );

  await donation.save();

  // TODO: Notify admin team
  // TODO: Send notifications to other party

  return NextResponse.json({
    success: true,
    message: 'Dispute created successfully. Admin team will investigate.',
    dispute,
    supportContact: 'admin@bloodconnect.com'
  });
}