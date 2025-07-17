import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Donation from '@/models/Donation';
import { requireAuth } from '@/lib/auth-middleware';
import { donationOfferCreateSchema, donationOfferUpdateSchema, validateData } from '@/lib/validation-schemas';
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
    const myDonationsOnly = searchParams.get('myDonationsOnly') === 'true';
    
    let query = {};
    
    if (userId) {
      // If userId is provided, ensure it matches the authenticated user for security
      if (userId !== user.uid) {
        throw createApiError('Unauthorized: Cannot access other users\' donations', HttpStatus.FORBIDDEN, ErrorTypes.AUTHORIZATION_ERROR);
      }
      query = { userId };
    } else if (myDonationsOnly) {
      // Filter by authenticated user's donations only
      query = { userId: user.uid };
    }
    // If no filter specified, return all available donations (public listings)
    
    // Limit results and select only necessary fields for better performance
    const donations = await DonationOffer.find(query)
      .sort({ createdAt: -1 })
      .limit(100) // Limit to 100 most recent donations
      .select('-__v') // Exclude version field
      .lean(); // Return plain objects instead of mongoose documents
    
    return NextResponse.json(donations);
  } catch (error) {
    logError(error, 'GET /api/donations', { userId: request.headers.get('x-user-id') });
    return handleApiError(error, 'GET /api/donations');
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
    const validation = validateData(donationOfferCreateSchema, body);
    if (!validation.success) {
      throw createApiError(validation.error, HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
    }
    
    // Ensure the donation belongs to the authenticated user
    const donationData = {
      ...validation.data,
      userId: user.uid, // Override with authenticated user's ID
    };
    
    const donation = new DonationOffer(donationData);
    await donation.save();
    
    return NextResponse.json(donation, { status: HttpStatus.CREATED });
  } catch (error) {
    logError(error, 'POST /api/donations', { userId: request.headers.get('x-user-id'), body: JSON.stringify(body || {}) });
    return handleApiError(error, 'POST /api/donations');
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
      throw createApiError('Donation ID is required', HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
    }
    
    // Validate input data
    const validation = validateData(donationOfferUpdateSchema, updateData);
    if (!validation.success) {
      throw createApiError(validation.error, HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
    }
    
    // Ensure the user can only update their own donations
    const donation = await DonationOffer.findOneAndUpdate(
      { _id, userId: user.uid }, // Match both ID and user ownership
      validation.data, 
      { new: true }
    );
    
    if (!donation) {
      throw createApiError('Donation not found or unauthorized', HttpStatus.NOT_FOUND, ErrorTypes.NOT_FOUND);
    }
    
    return NextResponse.json(donation);
  } catch (error) {
    logError(error, 'PUT /api/donations', { userId: request.headers.get('x-user-id'), donationId: body?._id });
    return handleApiError(error, 'PUT /api/donations');
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
      throw createApiError('Donation ID required', HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
    }
    
    // Ensure the user can only delete their own donations
    const donation = await DonationOffer.findOneAndDelete({ _id: id, userId: user.uid });
    
    if (!donation) {
      throw createApiError('Donation not found or unauthorized', HttpStatus.NOT_FOUND, ErrorTypes.NOT_FOUND);
    }
    
    return NextResponse.json({ message: 'Donation deleted successfully' });
  } catch (error) {
    logError(error, 'DELETE /api/donations', { userId: request.headers.get('x-user-id'), donationId: id });
    return handleApiError(error, 'DELETE /api/donations');
  }
}