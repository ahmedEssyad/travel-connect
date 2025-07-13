import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { handleApiError, logError, createApiError, ErrorTypes, HttpStatus } from '@/lib/error-handler';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const { authenticated, user, error } = await requireAuth(request);
    if (!authenticated) {
      throw createApiError(error || 'Authentication required', HttpStatus.UNAUTHORIZED, ErrorTypes.AUTHENTICATION_ERROR);
    }

    const { id } = await params;

    if (!id) {
      throw createApiError('Notification ID is required', HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR);
    }

    await connectDB();

    // Find and update the notification in database
    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: user.id }, // Make sure user owns this notification
      { read: true, updatedAt: new Date() },
      { new: true }
    );
    
    if (!notification) {
      throw createApiError('Notification not found', HttpStatus.NOT_FOUND, ErrorTypes.NOT_FOUND);
    }

    return NextResponse.json({
      success: true,
      message: 'Notification marked as read',
      notification: {
        id: notification._id.toString(),
        read: notification.read
      }
    });

  } catch (error) {
    const resolvedParams = await params;
    const { authenticated, user: authUser } = await requireAuth(request).catch(() => ({ authenticated: false, user: null }));
    logError(error, `PUT /api/notifications/${resolvedParams.id}/read`, { 
      userId: authUser?.id,
      notificationId: resolvedParams.id 
    });
    return handleApiError(error, `PUT /api/notifications/${resolvedParams.id}/read`);
  }
}