import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Message from '@/models/Message';
import BloodRequest from '@/models/BloodRequest';
import { requireAuth } from '@/lib/auth-middleware';
import { handleApiError, logError, createApiError, ErrorTypes, HttpStatus } from '@/lib/error-handler';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const { authenticated, user, error } = await requireAuth(request);
    if (!authenticated) {
      throw createApiError(error || 'Authentication required', HttpStatus.UNAUTHORIZED, ErrorTypes.AUTHENTICATION_ERROR);
    }

    await connectDB();
    
    // Find all chats where the user is a participant
    const chats = await Message.aggregate([
      {
        $match: {
          chatId: { $regex: user.id }
        }
      },
      {
        $group: {
          _id: '$chatId',
          lastMessage: { $last: '$$ROOT' },
          messageCount: { $sum: 1 }
        }
      },
      {
        $sort: { 'lastMessage.timestamp': -1 }
      }
    ]);

    // Get additional info for each chat
    const chatDetails = await Promise.all(
      chats.map(async (chat) => {
        const chatUserIds = chat._id.split('_');
        const otherUserId = chatUserIds.slice(0, 2).find(id => id !== user.id);
        
        // Try to find the associated blood request
        const bloodRequest = await BloodRequest.findOne({
          $or: [
            { requesterId: user.id }, // User is the requester
            { requesterId: otherUserId } // Other user is the requester
          ]
        }).populate('requesterId', 'name phoneNumber');

        return {
          chatId: chat._id,
          otherUserId,
          lastMessage: chat.lastMessage,
          messageCount: chat.messageCount,
          bloodRequest: bloodRequest ? {
            _id: bloodRequest._id,
            patientName: bloodRequest.patientInfo.name,
            bloodType: bloodRequest.patientInfo.bloodType,
            urgencyLevel: bloodRequest.urgencyLevel,
            requesterName: bloodRequest.requesterId.name,
            isMyRequest: bloodRequest.requesterId._id.toString() === user.id
          } : null
        };
      })
    );

    return NextResponse.json(chatDetails);
  } catch (error) {
    logError(error, 'GET /api/chats', { userId: request.headers.get('x-user-id') });
    return handleApiError(error, 'GET /api/chats');
  }
}