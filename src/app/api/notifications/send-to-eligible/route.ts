import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import BloodRequest from '@/models/BloodRequest';
import { requireAuth } from '@/lib/auth-middleware';
import { handleApiError, logError, createApiError, ErrorTypes, HttpStatus } from '@/lib/error-handler';
import { 
  checkDonationEligibility, 
  createBloodRequestNotification, 
  sendSMSNotification, 
  createSMSMessage,
  shouldNotifyUser 
} from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { authenticated, user, error } = await requireAuth(request);
    if (!authenticated) {
      throw createApiError(error || 'Authentication required', HttpStatus.UNAUTHORIZED, ErrorTypes.AUTHENTICATION_ERROR);
    }

    await connectDB();

    const body = await request.json();
    const { requestId, maxDistance = 50, urgentOnly = false } = body;

    if (!requestId) {
      throw createApiError('Request ID is required', HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
    }

    // Get the blood request
    const bloodRequest = await BloodRequest.findById(requestId);
    if (!bloodRequest) {
      throw createApiError('Blood request not found', HttpStatus.NOT_FOUND, ErrorTypes.NOT_FOUND);
    }

    // Only the requester can send notifications for their request
    if (bloodRequest.requesterId !== user.id) {
      throw createApiError('Only the requester can send notifications', HttpStatus.FORBIDDEN, ErrorTypes.AUTHORIZATION_ERROR);
    }

    // Get all potential donors (users with blood type info)
    const potentialDonors = await User.find({
      bloodType: { $exists: true, $ne: null },
      _id: { $ne: user.id }, // Exclude the requester
      'medicalInfo.availableForDonation': { $ne: false } // Only available donors
    });

    console.log(`Found ${potentialDonors.length} potential donors`);

    const eligibleDonors = [];
    const notificationPromises = [];

    for (const donor of potentialDonors) {
      // Check eligibility
      const eligibility = checkDonationEligibility(donor, bloodRequest, maxDistance);
      
      if (eligibility.isEligible) {
        eligibleDonors.push(donor);
        
        // Get notification preferences
        const notifyPrefs = shouldNotifyUser(donor, bloodRequest);
        
        if (notifyPrefs.inApp || notifyPrefs.sms || notifyPrefs.push) {
          // Create notification
          const notification = createBloodRequestNotification(bloodRequest, urgentOnly);
          
          if (notification) {
            // Send SMS notification
            if (notifyPrefs.sms && donor.phoneNumber) {
              const smsMessage = createSMSMessage(bloodRequest);
              notificationPromises.push(
                sendSMSNotification(donor.phoneNumber, smsMessage, notification.urgent)
              );
            }
            
            // TODO: Send push notification
            // TODO: Save in-app notification to database
          }
        }
      }
    }

    // Wait for all notifications to be sent
    const notificationResults = await Promise.allSettled(notificationPromises);
    const successfulNotifications = notificationResults.filter(result => 
      result.status === 'fulfilled' && result.value === true
    ).length;

    console.log(`Sent notifications to ${successfulNotifications} eligible donors`);

    return NextResponse.json({
      success: true,
      message: 'Notifications sent to eligible donors',
      stats: {
        totalPotentialDonors: potentialDonors.length,
        eligibleDonors: eligibleDonors.length,
        notificationsSent: successfulNotifications
      }
    });

  } catch (error) {
    console.error('Notification sending error:', error);
    logError(error, 'POST /api/notifications/send-to-eligible', { 
      requestId: request.body?.requestId 
    });
    return handleApiError(error, 'POST /api/notifications/send-to-eligible');
  }
}