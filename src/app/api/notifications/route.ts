import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Notification from '@/models/Notification';
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

    // Get notifications for the user from database
    const notifications = await Notification.find({ userId: user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Format notifications for client
    const formattedNotifications = notifications.map(notification => ({
      id: notification._id.toString(),
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      timestamp: notification.createdAt.toISOString(),
      read: notification.read,
      urgent: notification.urgent
    }));

    return NextResponse.json({
      success: true,
      notifications: formattedNotifications
    });

  } catch (error) {
    logError(error, 'GET /api/notifications', { 
      userId: request.headers.get('x-user-id')
    });
    return handleApiError(error, 'GET /api/notifications');
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
    const { userId, title, message, data, urgent = false, type = 'general' } = body;

    if (!userId || !title || !message) {
      throw createApiError('userId, title, and message are required', HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
    }

    // Create notification in database
    const notification = new Notification({
      userId,
      type,
      title,
      message,
      data: data || {},
      urgent,
      read: false
    });

    await notification.save();

    console.log(`📱 In-app notification created for user ${userId}: ${title}`);

    return NextResponse.json({
      success: true,
      notification: {
        id: notification._id.toString(),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        timestamp: notification.createdAt.toISOString(),
        read: notification.read,
        urgent: notification.urgent
      }
    });

  } catch (error) {
    logError(error, 'POST /api/notifications', { 
      userId: request.body?.userId 
    });
    return handleApiError(error, 'POST /api/notifications');
  }
}