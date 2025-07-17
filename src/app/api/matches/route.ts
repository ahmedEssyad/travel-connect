import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Match from '@/models/Match';
import BloodRequest from '@/models/BloodRequest';
import User from '@/models/User';
import { sendNotificationToUser } from '@/lib/websocket-server';
import { requireAuth } from '@/lib/auth-middleware';
import { matchCreateSchema, validateData } from '@/lib/validation-schemas';
import { handleApiError, logError, createApiError, ErrorTypes, HttpStatus, logInfo } from '@/lib/error-handler';

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
    
    // No longer auto-accepting matches - proper approval flow
    
    // Find matches where user is either the creator OR the target
    // First get matches created by this user
    const userCreatedMatches = await Match.find({ userId: user.uid }).sort({ createdAt: -1 });
    
    // Then get blood requests owned by this user to find matches targeting them
    const userRequests = await BloodRequest.find({ userId: user.uid });
    
    const userRequestIds = userRequests.map(request => request._id.toString());
    
    // Find matches targeting user's blood requests
    const targetingUserMatches = await Match.find({
      requestId: { $in: userRequestIds },
      userId: { $ne: user.uid } // Exclude matches created by this user (already included above)
    }).sort({ createdAt: -1 });
    
    // Combine and populate with blood request data
    const allMatches = [...userCreatedMatches, ...targetingUserMatches];
    
    // Populate each match with blood request details
    const populatedMatches = await Promise.all(
      allMatches.map(async (match) => {
        const request = await BloodRequest.findById(match.requestId);
        
        return {
          ...match.toObject(),
          request,
          // Add helper fields to identify the other user
          otherUserId: match.userId === user.uid ? request?.userId : match.userId
        };
      })
    );
    
    return NextResponse.json(populatedMatches);
  } catch (error) {
    logError(error, 'GET /api/matches', { userId: request.headers.get('x-user-id') });
    return handleApiError(error, 'GET /api/matches');
  }
}

export async function POST(request: NextRequest) {
  try {
    logInfo('Creating match request received', 'POST /api/matches');
    
    // Verify authentication
    const { authenticated, user, error } = await requireAuth(request);
    if (!authenticated) {
      throw createApiError(error || 'Authentication required', HttpStatus.UNAUTHORIZED, ErrorTypes.AUTHENTICATION_ERROR);
    }

    await connectDB();
    
    const body = await request.json();
    logInfo('Request body received', 'POST /api/matches', { body });
    
    // Validate input data
    const validation = validateData(matchCreateSchema, body);
    if (!validation.success) {
      logError(validation.error, 'POST /api/matches - Validation failed', { body });
      throw createApiError(validation.error, HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
    }
    
    const { requestId } = validation.data;
    
    // Use authenticated user's ID instead of trusting client
    const userId = user.uid;
    
    // Check if a match already exists for this user with the same blood request
    const existingMatch = await Match.findOne({
      requestId,
      userId
    });
    
    logInfo('Existing match check', 'POST /api/matches', { existingMatch: !!existingMatch });
    
    if (existingMatch) {
      logInfo('Match already exists', 'POST /api/matches', { matchId: existingMatch._id });
      throw createApiError('You have already sent a connection request for this match.', HttpStatus.CONFLICT, ErrorTypes.DUPLICATE_KEY);
    }
    
    // Create match with pending status - requires approval
    const matchData = {
      requestId: validation.data.requestId,
      userId,
      status: 'pending' // Requires approval from target user
    };
    
    const match = new Match(matchData);
    logInfo('Saving new match', 'POST /api/matches');
    await match.save();
    logInfo('Match saved successfully', 'POST /api/matches', { matchId: match._id });
    
    // Send real-time notification to the other user
    try {
      // Get blood request details
      const request = await BloodRequest.findById(requestId);
      
      if (request) {
        // Determine who to notify (the other user in the match)
        const notifyUserId = request.userId === userId ? match.userId : request.userId;
        
        // Get user details for notification
        const notifyUser = await User.findOne({ uid: notifyUserId });
        const currentUser = await User.findOne({ uid: userId });
        
        if (notifyUser && currentUser) {
          // Create notification payload
          const notification = {
            type: 'blood_match_request',
            title: 'New Blood Donation Match!',
            body: `${currentUser.name} wants to donate blood for your request`,
            matchId: match._id,
            requestId: request._id,
            fromUserId: userId,
            fromUserName: currentUser.name,
            bloodType: request.bloodType,
            urgency: request.urgency,
            timestamp: new Date().toISOString()
          };
          
          // Send WebSocket notification
          const notificationSent = sendNotificationToUser(notifyUserId, notification);
          if (notificationSent) {
            logInfo('Real-time notification sent', 'POST /api/matches', { notifyUserId });
          }
        }
      }
    } catch (notificationError) {
      logError(notificationError, 'POST /api/matches - Notification failed', { matchId: match._id });
      // Don't fail the match creation if notification fails
    }
    
    return NextResponse.json(match, { status: HttpStatus.CREATED });
  } catch (error) {
    logError(error, 'POST /api/matches', { userId: request.headers.get('x-user-id'), body: JSON.stringify(body || {}) });
    return handleApiError(error, 'POST /api/matches');
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
    const { _id, action, ...updateData } = body;
    
    if (!_id) {
      throw createApiError('Match ID is required', HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
    }
    
    // Handle match approval/rejection
    if (action === 'approve' || action === 'reject') {
      // Find the match and verify user has permission to approve/reject
      const match = await Match.findById(_id);
      if (!match) {
        throw createApiError('Match not found', HttpStatus.NOT_FOUND, ErrorTypes.NOT_FOUND);
      }
      
      // Get blood request to determine who can approve
      const request = await BloodRequest.findById(match.requestId);
      
      // User can approve if they own the blood request being matched to
      const canApprove = request?.userId === user.uid && match.userId !== user.uid;
      
      if (!canApprove) {
        throw createApiError('Unauthorized to approve this match', HttpStatus.FORBIDDEN, ErrorTypes.AUTHORIZATION_ERROR);
      }
      
      const newStatus = action === 'approve' ? 'accepted' : 'cancelled';
      const updatedMatch = await Match.findByIdAndUpdate(
        _id,
        { status: newStatus },
        { new: true }
      );
      
      logInfo(`Match ${action}d`, 'PUT /api/matches', { matchId: _id, newStatus });
      return NextResponse.json(updatedMatch);
    }
    
    // Regular update - ensure user can only update their own matches
    const match = await Match.findOneAndUpdate(
      { _id, userId: user.uid },
      updateData,
      { new: true }
    );
    
    if (!match) {
      throw createApiError('Match not found or unauthorized', HttpStatus.NOT_FOUND, ErrorTypes.NOT_FOUND);
    }
    
    return NextResponse.json(match);
  } catch (error) {
    logError(error, 'PUT /api/matches', { userId: request.headers.get('x-user-id'), matchId: body?._id });
    return handleApiError(error, 'PUT /api/matches');
  }
}