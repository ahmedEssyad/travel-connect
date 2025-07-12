import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { handleApiError, logError, createApiError, ErrorTypes, HttpStatus } from '@/lib/error-handler';
import connectDB from '@/lib/mongodb';
import Donation from '@/models/Donation';
import BloodRequest from '@/models/BloodRequest';
import User from '@/models/User';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { authenticated, user, error } = await requireAuth(request);
    if (!authenticated) {
      throw createApiError(error || 'Authentication required', HttpStatus.UNAUTHORIZED, ErrorTypes.AUTHENTICATION_ERROR);
    }

    const { 
      requestId, 
      confirmationType, // 'donor' or 'recipient'
      hospital,
      notes,
      volume,
      donationDate 
    } = await request.json();

    if (!requestId || !confirmationType) {
      throw createApiError('Request ID and confirmation type are required', HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
    }

    if (!['donor', 'recipient'].includes(confirmationType)) {
      throw createApiError('Invalid confirmation type', HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
    }

    await connectDB();

    // Get the blood request
    const bloodRequest = await BloodRequest.findById(requestId);
    if (!bloodRequest) {
      throw createApiError('Blood request not found', HttpStatus.NOT_FOUND, ErrorTypes.NOT_FOUND);
    }

    // Check if user is authorized for this confirmation type
    if (confirmationType === 'donor') {
      // For donor confirmation, we need to check if this user responded to the request
      // This could be improved by checking actual donor responses
    } else if (confirmationType === 'recipient') {
      // Handle both string and ObjectId formats for requesterId
      const requesterIdStr = bloodRequest.requesterId.toString();
      if (requesterIdStr !== user.id) {
        throw createApiError('Only the requester can confirm receipt', HttpStatus.FORBIDDEN, ErrorTypes.AUTHORIZATION_ERROR);
      }
    }

    // Check if donation record exists, create if not
    let donation = await Donation.findOne({ requestId });
    
    if (!donation && confirmationType === 'donor') {
      // Create new donation record
      const donor = await User.findById(user.id);
      if (!donor) {
        throw createApiError('Donor not found', HttpStatus.NOT_FOUND, ErrorTypes.NOT_FOUND);
      }

      // Handle test user IDs that aren't valid ObjectIds
      let recipientObjectId;
      if (mongoose.Types.ObjectId.isValid(bloodRequest.requesterId)) {
        recipientObjectId = new mongoose.Types.ObjectId(bloodRequest.requesterId);
      } else {
        // For test data like "test-user-123", create a fake ObjectId
        // This is a temporary solution for testing
        const testUserId = bloodRequest.requesterId.toString();
        console.log('Converting test user ID to ObjectId:', testUserId);
        
        // Create a consistent ObjectId from the test string
        const hash = testUserId.split('').reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0);
        
        const hexString = Math.abs(hash).toString(16).padStart(24, '0').substring(0, 24);
        recipientObjectId = new mongoose.Types.ObjectId(hexString);
      }

      donation = new Donation({
        requestId,
        donorId: user.id,
        recipientId: recipientObjectId,
        bloodType: donor.bloodType,
        hospital: hospital || bloodRequest.hospitalInfo?.name,
        donationDate: donationDate ? new Date(donationDate) : new Date(),
        notes,
        volume,
        donorConfirmed: true,
        donorConfirmedAt: new Date()
      });
    } else if (!donation) {
      throw createApiError('Donation must be initiated by donor first', HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
    } else {
      // Update existing donation
      if (confirmationType === 'donor') {
        donation.donorConfirmed = true;
        donation.donorConfirmedAt = new Date();
        if (hospital) donation.hospital = hospital;
        if (notes) donation.notes = notes;
        if (volume) donation.volume = volume;
        if (donationDate) donation.donationDate = new Date(donationDate);
      } else {
        donation.recipientConfirmed = true;
        donation.recipientConfirmedAt = new Date();
        if (notes) donation.notes = (donation.notes || '') + '\nRecipient: ' + notes;
      }
    }

    await donation.save();

    // Update user's donation count if completed
    if (donation.status === 'completed') {
      await User.findByIdAndUpdate(donation.donorId, {
        $inc: { totalDonations: 1 },
        $set: { 
          'medicalInfo.lastDonationDate': donation.donationDate,
          updatedAt: new Date()
        }
      });

      // Update blood request status
      await BloodRequest.findByIdAndUpdate(requestId, {
        status: 'fulfilled',
        updatedAt: new Date()
      });
    }

    // Get populated donation for response
    const populatedDonation = await Donation.findById(donation._id)
      .populate('donorId', 'name phoneNumber bloodType')
      .populate('recipientId', 'name phoneNumber');

    return NextResponse.json({
      success: true,
      message: confirmationType === 'donor' ? 
        'Donation confirmed! Waiting for recipient confirmation.' :
        'Thank you! Donation has been fully confirmed.',
      donation: populatedDonation,
      isComplete: donation.status === 'completed'
    });

  } catch (error) {
    logError(error, 'POST /api/donations/confirm');
    return handleApiError(error, 'POST /api/donations/confirm');
  }
}