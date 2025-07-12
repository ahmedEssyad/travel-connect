import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { handleApiError, logError, createApiError, ErrorTypes, HttpStatus } from '@/lib/error-handler';

// Same in-memory store as notifications/route.ts
// In production, this would be a database operation
const notificationStore = new Map<string, any[]>();

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

    // Get user notifications
    const userNotifications = notificationStore.get(user.id) || [];
    
    // Find and update the notification
    const notificationIndex = userNotifications.findIndex(n => n.id === id);
    
    if (notificationIndex === -1) {
      throw createApiError('Notification not found', HttpStatus.NOT_FOUND, ErrorTypes.NOT_FOUND);
    }

    // Mark as read
    userNotifications[notificationIndex].read = true;
    notificationStore.set(user.id, userNotifications);

    return NextResponse.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    const resolvedParams = await params;
    logError(error, `PUT /api/notifications/${resolvedParams.id}/read`, { 
      userId: null,
      notificationId: resolvedParams.id 
    });
    return handleApiError(error, `PUT /api/notifications/${resolvedParams.id}/read`);
  }
}