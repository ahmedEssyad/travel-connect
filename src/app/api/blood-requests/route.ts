import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import BloodRequest from '@/models/BloodRequest';
import User from '@/models/User';
import { requireAuth } from '@/lib/auth-middleware';
import { bloodRequestCreateSchema, bloodRequestUpdateSchema, validateData } from '@/lib/validation-schemas';
import { handleApiError, logError, createApiError, ErrorTypes, HttpStatus } from '@/lib/error-handler';
import { BloodNotificationService, findCompatibleDonors } from '@/lib/blood-notification';
import { calculateDistance } from '@/lib/geolocation-utils';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('id');
    const requesterId = searchParams.get('requesterId');
    const urgency = searchParams.get('urgency');
    const bloodType = searchParams.get('bloodType');
    const status = searchParams.get('status');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = searchParams.get('radius');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const skip = (page - 1) * limit;

    if (requestId) {
      // Get specific blood request
      const bloodRequest = await BloodRequest.findById(requestId);
      if (!bloodRequest) {
        throw createApiError('Blood request not found', HttpStatus.NOT_FOUND, ErrorTypes.NOT_FOUND);
      }
      return NextResponse.json(bloodRequest);
    }

    // Build query
    let query: any = {};
    
    if (urgency) {
      query.urgencyLevel = urgency;
    }
    
    if (bloodType) {
      query['patientInfo.bloodType'] = bloodType;
    }
    
    if (status) {
      query.status = status;
    } else {
      // Default to active requests only
      query.status = 'active';
    }
    
    if (requesterId) {
      query.requesterId = requesterId;
    }

    // Add location-based filtering (if coordinates are valid)
    let useGeoQuery = false;
    let userLocation = { lat: 0, lng: 0 };
    
    if (lat && lng && radius) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      const radiusKm = parseFloat(radius);
      
      // Only add geospatial query if coordinates are valid
      if (!isNaN(latitude) && !isNaN(longitude) && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180) {
        useGeoQuery = true;
        userLocation = { lat: latitude, lng: longitude };
        
            // Use MongoDB $geoNear aggregation for better performance
        useGeoQuery = true;
      }
    }

    // Add deadline filter (show recent requests up to 24 hours past deadline for active requests)
    if (query.status === 'active') {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
      query.deadline = { $gt: twentyFourHoursAgo };
    }

    console.log('Blood requests query:', JSON.stringify(query, null, 2));

    let bloodRequests;
    let total;
    let paginatedRequests;

    if (useGeoQuery && userLocation) {
      const radiusKm = parseFloat(radius!);
      const radiusInMeters = radiusKm * 1000;

      // First, try to get requests with coordinates for geospatial filtering
      const geoQuery = {
        ...query,
        'hospital.coordinates': { $exists: true, $ne: null }
      };

      const pipeline = [
        { $match: geoQuery },
        {
          $addFields: {
            distance: {
              $multiply: [
                6371000, // Earth's radius in meters
                {
                  $acos: {
                    $add: [
                      {
                        $multiply: [
                          { $sin: { $multiply: [{ $divide: ["$hospital.coordinates.lat", 57.2958] }] } },
                          { $sin: { $multiply: [{ $divide: [userLocation.lat, 57.2958] }] } }
                        ]
                      },
                      {
                        $multiply: [
                          { $cos: { $multiply: [{ $divide: ["$hospital.coordinates.lat", 57.2958] }] } },
                          { $cos: { $multiply: [{ $divide: [userLocation.lat, 57.2958] }] } },
                          { $cos: { $multiply: [{ $divide: [{ $subtract: ["$hospital.coordinates.lng", userLocation.lng] }, 57.2958] }] } }
                        ]
                      }
                    ]
                  }
                }
              ]
            }
          }
        },
        { $match: { distance: { $lte: radiusInMeters } } },
        {
          $facet: {
            data: [
              { $sort: { urgencyLevel: 1, deadline: 1, createdAt: -1 } },
              { $skip: skip },
              { $limit: limit }
            ],
            count: [{ $count: "total" }]
          }
        }
      ];

      const [result] = await BloodRequest.aggregate(pipeline);
      const geoRequests = result.data || [];
      const geoTotal = result.count[0]?.total || 0;
      
      // If no geo results, fall back to regular query (for requests without coordinates)
      if (geoRequests.length === 0) {
        console.log('No geo results found, falling back to regular query');
        total = await BloodRequest.countDocuments(query);
        
        bloodRequests = await BloodRequest.find(query)
          .sort({ 
            urgencyLevel: 1,
            deadline: 1,     
            createdAt: -1    
          })
          .skip(skip)
          .limit(limit)
          .lean();
          
        paginatedRequests = bloodRequests;
      } else {
        bloodRequests = geoRequests;
        total = geoTotal;
        paginatedRequests = bloodRequests;
      }
    } else {
      // No geospatial filtering - use optimized find with indexes
      total = await BloodRequest.countDocuments(query);
      
      bloodRequests = await BloodRequest.find(query)
        .sort({ 
          urgencyLevel: 1, // Uses compound index
          deadline: 1,     
          createdAt: -1    
        })
        .skip(skip)
        .limit(limit)
        .lean(); // Use lean() for better performance
        
      paginatedRequests = bloodRequests;
    }

    console.log(`Found ${paginatedRequests.length} blood requests, total: ${total}`);

    return NextResponse.json({
      requests: paginatedRequests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logError(error, 'GET /api/blood-requests');
    return handleApiError(error, 'GET /api/blood-requests');
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
    console.log('Blood request creation data:', body);
    
    // Validate input data
    const validation = validateData(bloodRequestCreateSchema, body);
    if (!validation.success) {
      console.error('Validation failed:', validation.error);
      throw createApiError(validation.error, HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
    }

    // Create blood request with contact info
    const bloodRequestData = {
      ...validation.data,
      requesterId: user.id,
      status: 'active',
      fulfilledUnits: 0,
      matchedDonors: [],
      contactInfo: {
        requesterName: user.name || 'User',
        requesterPhone: user.phoneNumber || '',
        alternateContact: validation.data.contactInfo?.alternateContact || ''
      }
    };

    const bloodRequest = new BloodRequest(bloodRequestData);
    await bloodRequest.save();

    console.log('Blood request created:', bloodRequest._id);

    // Find compatible donors with optimized aggregation pipeline
    const maxNotifications = 50;
    
    // Get blood type compatibility rules
    const { canDonateToPatient } = await import('@/lib/blood-types');
    
    // Build compatible blood types array for direct MongoDB query
    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const compatibleBloodTypes = bloodTypes.filter(donorType => 
      canDonateToPatient(donorType, bloodRequest.patientInfo.bloodType)
    );

    // Use aggregation for better performance
    const compatibleDonors = await User.aggregate([
      {
        $match: {
          'medicalInfo.isDonor': true,
          'medicalInfo.availableForDonation': true,
          bloodType: { $in: compatibleBloodTypes }
        }
      },
      {
        $project: {
          name: 1,
          phoneNumber: 1,
          bloodType: 1,
          location: 1,
          medicalInfo: 1,
          notificationPreferences: 1
        }
      },
      { $limit: maxNotifications * 2 }
    ]);
    
    console.log(`Found ${compatibleDonors.length} compatible donors`);
    console.log('Compatible donors:', compatibleDonors.map(d => ({ name: d.name, bloodType: d.bloodType, phone: d.phoneNumber })));

    // Send notifications to eligible donors
    try {
      console.log('📢 Sending notifications to eligible donors...');
      
      // Import notification functions
      const { 
        checkDonationEligibility, 
        createBloodRequestNotification, 
        sendSMSNotification, 
        createSMSMessage,
        shouldNotifyUser 
      } = await import('@/lib/notifications');
      
      const eligibleDonors = [];
      const notificationPromises = [];
      
      // Process donors in batches for better performance
      const batchSize = 10;
      for (let i = 0; i < compatibleDonors.length; i += batchSize) {
        const batch = compatibleDonors.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (donor) => {
          try {
            // Check eligibility
            const eligibility = checkDonationEligibility(donor, bloodRequest, 50);
            
            if (eligibility.isEligible) {
              eligibleDonors.push(donor);
              
              // Get notification preferences
              const notifyPrefs = shouldNotifyUser(donor, bloodRequest);
              console.log(`Donor ${donor.name} notification preferences:`, notifyPrefs);
              
              const notificationResults = [];
              
              // Send SMS notification with requester contact info
              if (notifyPrefs.sms && donor.phoneNumber) {
                console.log(`Sending SMS to ${donor.phoneNumber}`);
                const requesterPhone = bloodRequest.contactInfo?.requesterPhone || user.phoneNumber;
                const smsMessage = createSMSMessage(bloodRequest, requesterPhone);
                const smsResult = await sendSMSNotification(donor.phoneNumber, smsMessage, bloodRequest.urgencyLevel === 'critical');
                notificationResults.push(smsResult);
                console.log(`SMS result for ${donor.phoneNumber}:`, smsResult);
              }
              
              // Create in-app notification directly
              if (notifyPrefs.inApp) {
                try {
                  const { default: Notification } = await import('@/models/Notification');
                  
                  const notification = new Notification({
                    userId: donor._id.toString(),
                    type: 'blood_request',
                    title: `🩸 ${bloodRequest.patientInfo.bloodType} Blood Needed`,
                    message: `${bloodRequest.patientInfo.name} needs ${bloodRequest.patientInfo.bloodType} blood at ${bloodRequest.hospital.name}. Can you help?`,
                    data: {
                      requestId: bloodRequest._id.toString(),
                      bloodType: bloodRequest.patientInfo.bloodType,
                      hospital: bloodRequest.hospital.name,
                      urgency: bloodRequest.urgencyLevel,
                      deadline: bloodRequest.deadline
                    },
                    urgent: bloodRequest.urgencyLevel === 'critical',
                    read: false
                  });
                  
                  await notification.save();
                  console.log(`✅ In-app notification created for ${donor.name}`);
                  notificationResults.push(true);
                } catch (notifError) {
                  console.error(`❌ In-app notification failed for ${donor.name}:`, notifError);
                  notificationResults.push(false);
                }
              }
              
              return notificationResults.some(result => result === true);
            }
            return false;
          } catch (error) {
            console.error(`Error processing notifications for donor ${donor.name}:`, error);
            return false;
          }
        });
          
          // Wait for current batch to complete before processing next batch
          await Promise.allSettled(batchPromises);
        }
      
      console.log(`📢 Processed ${eligibleDonors.length} eligible donors`);
      
    } catch (notificationError) {
      console.error('Error sending notifications:', notificationError);
      // Don't fail the request creation if notifications fail
    }

    return NextResponse.json({
      success: true,
      request: bloodRequest,
      notifiedDonors: compatibleDonors.length
    }, { status: HttpStatus.CREATED });

  } catch (error) {
    console.error('Blood request creation error:', error);
    console.error('Request body:', body);
    logError(error, 'POST /api/blood-requests', { userId: request.headers.get('x-user-id') });
    return handleApiError(error, 'POST /api/blood-requests');
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
    const { requestId, ...updateData } = body;
    
    if (!requestId) {
      throw createApiError('Request ID is required', HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
    }
    
    // Validate input data
    const validation = validateData(bloodRequestUpdateSchema, updateData);
    if (!validation.success) {
      throw createApiError(validation.error, HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
    }
    
    // Find the blood request
    const bloodRequest = await BloodRequest.findById(requestId);
    if (!bloodRequest) {
      throw createApiError('Blood request not found', HttpStatus.NOT_FOUND, ErrorTypes.NOT_FOUND);
    }
    
    // Check if user owns this request
    if (bloodRequest.requesterId !== user.uid) {
      throw createApiError('Unauthorized: Cannot update others blood requests', HttpStatus.FORBIDDEN, ErrorTypes.AUTHORIZATION_ERROR);
    }
    
    // Update the blood request
    const updatedBloodRequest = await BloodRequest.findByIdAndUpdate(
      requestId,
      validation.data,
      { new: true }
    );
    
    return NextResponse.json(updatedBloodRequest);

  } catch (error) {
    logError(error, 'PUT /api/blood-requests', { userId: request.headers.get('x-user-id'), requestId: body?.requestId });
    return handleApiError(error, 'PUT /api/blood-requests');
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
    const requestId = searchParams.get('id');
    
    if (!requestId) {
      throw createApiError('Request ID is required', HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
    }
    
    // Find the blood request
    const bloodRequest = await BloodRequest.findById(requestId);
    if (!bloodRequest) {
      throw createApiError('Blood request not found', HttpStatus.NOT_FOUND, ErrorTypes.NOT_FOUND);
    }
    
    // Check if user owns this request
    if (bloodRequest.requesterId !== user.uid) {
      throw createApiError('Unauthorized: Cannot delete others blood requests', HttpStatus.FORBIDDEN, ErrorTypes.AUTHORIZATION_ERROR);
    }
    
    // Instead of deleting, mark as cancelled
    await BloodRequest.findByIdAndUpdate(requestId, { status: 'cancelled' });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Blood request cancelled successfully' 
    });

  } catch (error) {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('id');
    logError(error, 'DELETE /api/blood-requests', { userId: request.headers.get('x-user-id'), requestId });
    return handleApiError(error, 'DELETE /api/blood-requests');
  }
}