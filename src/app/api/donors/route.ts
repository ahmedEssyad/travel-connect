import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { requireAuth } from '@/lib/auth-middleware';
import { handleApiError, logError, createApiError, ErrorTypes, HttpStatus } from '@/lib/error-handler';
import { getCompatibleDonors, calculateDistance } from '@/lib/blood-notification';
import { BloodType } from '@/lib/blood-types';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const { authenticated, user, error } = await requireAuth(request);
    if (!authenticated) {
      throw createApiError(error || 'Authentication required', HttpStatus.UNAUTHORIZED, ErrorTypes.AUTHENTICATION_ERROR);
    }

    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const bloodType = searchParams.get('bloodType') as BloodType;
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = searchParams.get('radius');
    const availableOnly = searchParams.get('availableOnly') === 'true';
    const verifiedOnly = searchParams.get('verifiedOnly') === 'true';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const skip = (page - 1) * limit;

    // Build query
    let query: any = {
      'medicalInfo.isDonor': true
    };

    if (availableOnly) {
      query['medicalInfo.availableForDonation'] = true;
      
      // Add last donation date filter (56 days minimum)
      const minDate = new Date();
      minDate.setDate(minDate.getDate() - 56);
      query.$or = [
        { 'medicalInfo.lastDonationDate': { $lt: minDate } },
        { 'medicalInfo.lastDonationDate': { $exists: false } }
      ];
    }

    if (verifiedOnly) {
      query.isVerified = true;
    }

    if (bloodType) {
      const compatibleBloodTypes = getCompatibleDonors(bloodType);
      query.bloodType = { $in: compatibleBloodTypes };
    }

    // Add location-based filtering
    if (lat && lng && radius) {
      query['location.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseFloat(radius) * 1000 // Convert km to meters
        }
      };
    }

    // Find donors
    const donors = await User.find(query)
      .select('uid name bloodType location rating totalDonations isVerified medicalInfo.availableForDonation medicalInfo.lastDonationDate createdAt')
      .sort({ 
        rating: -1,           // Higher rating first
        totalDonations: -1,   // More donations first
        createdAt: -1        // More recent first
      })
      .skip(skip)
      .limit(limit);

    // Calculate distances if location provided
    const donorsWithDistance = donors.map(donor => {
      const donorData = donor.toObject();
      
      if (lat && lng && donor.location?.coordinates) {
        const distance = calculateDistance(
          parseFloat(lat),
          parseFloat(lng),
          donor.location.coordinates.lat,
          donor.location.coordinates.lng
        );
        donorData.distance = Math.round(distance * 10) / 10; // Round to 1 decimal
      }
      
      // Calculate eligibility status
      const lastDonation = donor.medicalInfo?.lastDonationDate;
      const daysSinceLastDonation = lastDonation 
        ? Math.floor((Date.now() - new Date(lastDonation).getTime()) / (1000 * 60 * 60 * 24))
        : null;
      
      donorData.eligibility = {
        canDonate: !lastDonation || daysSinceLastDonation >= 56,
        daysSinceLastDonation,
        nextEligibleDate: lastDonation 
          ? new Date(new Date(lastDonation).getTime() + (56 * 24 * 60 * 60 * 1000))
          : null
      };
      
      return donorData;
    });

    const total = await User.countDocuments(query);

    return NextResponse.json({
      donors: donorsWithDistance,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      filters: {
        bloodType,
        availableOnly,
        verifiedOnly,
        radius: radius ? parseFloat(radius) : null,
        location: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null
      }
    });

  } catch (error) {
    logError(error, 'GET /api/donors');
    return handleApiError(error, 'GET /api/donors');
  }
}

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
    const { becomesDonor } = body;
    
    // Update user to become a donor
    const updatedUser = await User.findOneAndUpdate(
      { uid: user.uid },
      { 
        'medicalInfo.isDonor': becomesDonor,
        'medicalInfo.availableForDonation': becomesDonor,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!updatedUser) {
      throw createApiError('User not found', HttpStatus.NOT_FOUND, ErrorTypes.NOT_FOUND);
    }
    
    return NextResponse.json({
      success: true,
      message: becomesDonor ? 'You are now registered as a blood donor!' : 'Donor status updated',
      isDonor: updatedUser.medicalInfo?.isDonor || false
    });

  } catch (error) {
    logError(error, 'POST /api/donors', { userId: request.headers.get('x-user-id') });
    return handleApiError(error, 'POST /api/donors');
  }
}

export async function PUT(request: NextRequest) {
  let body: any = null;
  
  try {
    // Verify authentication
    const { authenticated, user, error } = await requireAuth(request);
    if (!authenticated) {
      throw createApiError(error || 'Authentication required', HttpStatus.UNAUTHORIZED, ErrorTypes.AUTHENTICATION_ERROR);
    }

    await connectDB();
    
    body = await request.json();
    const { availableForDonation, lastDonationDate } = body;
    
    // Update donor availability
    const updateData: any = {};
    
    if (typeof availableForDonation === 'boolean') {
      updateData['medicalInfo.availableForDonation'] = availableForDonation;
    }
    
    if (lastDonationDate) {
      updateData['medicalInfo.lastDonationDate'] = new Date(lastDonationDate);
    }
    
    const updatedUser = await User.findOneAndUpdate(
      { uid: user.uid },
      { 
        ...updateData,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!updatedUser) {
      throw createApiError('User not found', HttpStatus.NOT_FOUND, ErrorTypes.NOT_FOUND);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Donor availability updated',
      availableForDonation: updatedUser.medicalInfo?.availableForDonation || false,
      lastDonationDate: updatedUser.medicalInfo?.lastDonationDate
    });

  } catch (error) {
    logError(error, 'PUT /api/donors', { userId: request.headers.get('x-user-id') });
    return handleApiError(error, 'PUT /api/donors');
  }
}