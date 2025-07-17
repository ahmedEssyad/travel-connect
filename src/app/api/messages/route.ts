import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Message from '@/models/Message';
import { requireAuth } from '@/lib/auth-middleware';
import { handleApiError, logError, createApiError, ErrorTypes, HttpStatus } from '@/lib/error-handler';
import { messageCreateSchema, validateData } from '@/lib/validation-schemas';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const { authenticated, user, error } = await requireAuth(request);
    if (!authenticated) {
      throw createApiError(error || 'Authentication required', HttpStatus.UNAUTHORIZED, ErrorTypes.AUTHENTICATION_ERROR);
    }

    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');
    
    if (!chatId) {
      throw createApiError('Chat ID required', HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
    }
    
    // Verify user has access to this chat
    // Chat ID formats: "userId1_userId2" (old) or "userId1_userId2_requestId" (new)
    const chatUserIds = chatId.split('_');
    if ((chatUserIds.length !== 2 && chatUserIds.length !== 3) || !chatUserIds.slice(0, 2).includes(user.id)) {
      throw createApiError('Unauthorized access to chat', HttpStatus.FORBIDDEN, ErrorTypes.AUTHORIZATION_ERROR);
    }
    
    const messages = await Message.find({ chatId }).sort({ timestamp: 1 });
    return NextResponse.json(messages);
  } catch (error) {
    logError(error, 'GET /api/messages', { userId: request.headers.get('x-user-id'), chatId: request.url });
    return handleApiError(error, 'GET /api/messages');
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
    
    // Validate input data
    const validation = validateData(messageCreateSchema, body);
    if (!validation.success) {
      throw createApiError(validation.error, HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
    }
    
    const { chatId, text } = validation.data;
    
    // Verify user has access to this chat
    const chatUserIds = chatId.split('_');
    if ((chatUserIds.length !== 2 && chatUserIds.length !== 3) || !chatUserIds.slice(0, 2).includes(user.id)) {
      throw createApiError('Unauthorized access to chat', HttpStatus.FORBIDDEN, ErrorTypes.AUTHORIZATION_ERROR);
    }
    
    // Ensure the senderId matches the authenticated user
    const messageData = {
      chatId,
      senderId: user.id, // Override with authenticated user's ID
      text: text.trim(),
      timestamp: new Date()
    };
    
    const message = new Message(messageData);
    await message.save();
    
    return NextResponse.json(message, { status: HttpStatus.CREATED });
  } catch (error) {
    logError(error, 'POST /api/messages', { userId: request.headers.get('x-user-id'), body: JSON.stringify(body || {}) });
    return handleApiError(error, 'POST /api/messages');
  }
}