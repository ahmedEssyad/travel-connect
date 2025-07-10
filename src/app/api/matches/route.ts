import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Match from '@/models/Match';
import Trip from '@/models/Trip';
import Request from '@/models/Request';
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
    
    let query = {};
    if (userId) {
      // Ensure user can only query their own matches
      if (userId !== user.uid) {
        throw createApiError('Unauthorized access', HttpStatus.FORBIDDEN, ErrorTypes.AUTHORIZATION_ERROR);
      }
      query = { userId };
    } else {
      // Default to authenticated user's matches
      query = { userId: user.uid };
    }
    
    const matches = await Match.find(query).sort({ createdAt: -1 });
    return NextResponse.json(matches);
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
    
    const { tripId, requestId } = validation.data;
    
    // Use authenticated user's ID instead of trusting client
    const userId = user.uid;
    
    // Check if a match already exists for this user with the same trip and request
    const existingMatch = await Match.findOne({
      tripId,
      requestId,
      userId
    });
    
    logInfo('Existing match check', 'POST /api/matches', { existingMatch: !!existingMatch });
    
    if (existingMatch) {
      logInfo('Match already exists', 'POST /api/matches', { matchId: existingMatch._id });
      throw createApiError('You have already sent a connection request for this match.', HttpStatus.CONFLICT, ErrorTypes.DUPLICATE_KEY);
    }
    
    const match = new Match(body);
    logInfo('Saving new match', 'POST /api/matches');
    await match.save();
    logInfo('Match saved successfully', 'POST /api/matches', { matchId: match._id });
    
    // Send real-time notification to the other user
    try {
      // Get trip and request details
      const trip = await Trip.findById(tripId);
      const request = await Request.findById(requestId);
      
      if (trip && request) {
        // Determine who to notify (the other user in the match)
        const notifyUserId = trip.userId === userId ? request.userId : trip.userId;
        
        // Get user details for notification
        const notifyUser = await User.findOne({ uid: notifyUserId });
        const currentUser = await User.findOne({ uid: userId });
        
        if (notifyUser && currentUser) {
          // Create notification payload
          const notification = {
            type: 'match_request',
            title: 'New Connection Request!',
            body: `${currentUser.name} wants to connect with you`,
            matchId: match._id,
            tripId: trip._id,
            requestId: request._id,
            fromUserId: userId,
            fromUserName: currentUser.name,
            tripRoute: `${trip.from} → ${trip.to}`,
            requestRoute: `${request.from} → ${request.to}`,
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
    const { _id, ...updateData } = body;
    
    if (!_id) {
      throw createApiError('Match ID is required', HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
    }
    
    // Ensure user can only update their own matches
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