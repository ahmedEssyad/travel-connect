import { NextResponse } from 'next/server';
import logger from '@/lib/logger';

export async function GET() {
  try {
    const stats = logger.getStats();

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching log stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch log statistics' },
      { status: 500 }
    );
  }
}