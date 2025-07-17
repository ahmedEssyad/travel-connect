import { NextRequest, NextResponse } from 'next/server';
import logger, { LogLevel } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const level = searchParams.get('level');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const userId = searchParams.get('userId');
    const endpoint = searchParams.get('endpoint');

    const options: any = {
      limit,
      offset,
    };

    if (level !== null) {
      options.level = parseInt(level) as LogLevel;
    }

    if (startDate) {
      options.startDate = new Date(startDate);
    }

    if (endDate) {
      options.endDate = new Date(endDate);
    }

    if (userId) {
      options.userId = userId;
    }

    if (endpoint) {
      options.endpoint = endpoint;
    }

    const result = logger.getLogs(options);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const daysToKeep = parseInt(searchParams.get('daysToKeep') || '30');

    const removedCount = logger.clearOldLogs(daysToKeep);

    return NextResponse.json({
      success: true,
      message: `Cleared ${removedCount} old log entries`,
      removedCount,
    });
  } catch (error) {
    console.error('Error clearing logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear logs' },
      { status: 500 }
    );
  }
}