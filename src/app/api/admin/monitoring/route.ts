import { NextRequest, NextResponse } from 'next/server';
import monitoring from '@/lib/monitoring';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'current';

    switch (type) {
      case 'current':
        const currentMetrics = monitoring.getCurrentMetrics();
        return NextResponse.json({
          success: true,
          data: currentMetrics,
        });

      case 'history':
        const hours = parseInt(searchParams.get('hours') || '24');
        const history = monitoring.getMetrics(hours);
        return NextResponse.json({
          success: true,
          data: history,
        });

      case 'health':
        const healthCheck = await monitoring.performHealthCheck();
        return NextResponse.json({
          success: true,
          data: healthCheck,
        });

      case 'performance':
        const performanceStats = monitoring.getPerformanceStats();
        return NextResponse.json({
          success: true,
          data: performanceStats,
        });

      case 'alerts':
        const alerts = monitoring.getAlerts();
        return NextResponse.json({
          success: true,
          data: alerts,
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid monitoring type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error fetching monitoring data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch monitoring data' },
      { status: 500 }
    );
  }
}