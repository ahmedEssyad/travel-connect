import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Message from '@/models/Message';
import User from '@/models/User';
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
    
    // Find all unique chat IDs where the user is a participant
    // Use more efficient query - chatId format is "userId1_userId2" (sorted)
    const userChats = await Message.aggregate([
      {
        // Match messages where the user is involved in the chat (much faster than regex)
        $match: {
          $or: [
            { chatId: { $regex: `^${user.id}_` } }, // User is first in chatId
            { chatId: { $regex: `_${user.id}$` } }  // User is second in chatId
          ]
        }
      },
      {
        // Group by chatId to get unique chats
        $group: {
          _id: '$chatId',
          lastMessage: { $last: '$text' },
          lastActivity: { $last: '$timestamp' },
          messages: { $push: '$$ROOT' }
        }
      },
      {
        // Sort by last activity (most recent first)
        $sort: { lastActivity: -1 }
      }
    ]);

    // Process each chat to get other user info
    const chatsWithUserInfo = await Promise.all(
      userChats.map(async (chat) => {
        const chatId = chat._id;
        const chatUserIds = chatId.split('_');
        
        // Find the other user ID (not the current user) - only check first two parts for user IDs
        const otherUserId = chatUserIds.slice(0, 2).find(id => id !== user.id);
        
        if (!otherUserId) {
          return null; // Skip invalid chats
        }

        // Get other user's info
        let otherUserName = 'Unknown User';
        try {
          const otherUser = await User.findById(otherUserId).select('name phone');
          if (otherUser) {
            otherUserName = otherUser.name || otherUser.phone || 'Unknown User';
          }
        } catch (userError) {
          console.error('Error fetching user info for:', otherUserId, userError);
        }

        return {
          chatId,
          otherUserId,
          otherUserName,
          lastMessage: chat.lastMessage,
          lastActivity: chat.lastActivity,
          messageCount: chat.messages.length
        };
      })
    );

    // Filter out null entries and return
    const validChats = chatsWithUserInfo.filter(chat => chat !== null);
    
    return NextResponse.json(validChats);
  } catch (error) {
    logError(error, 'GET /api/messages/user-chats', { userId: request.headers.get('x-user-id') });
    return handleApiError(error, 'GET /api/messages/user-chats');
  }
}