/**
 * Task Statistics API
 *
 * GET /api/estates/tasks/stats - Get task statistics for dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { TaskService } from '@/lib/estates-compliance/services/TaskService';

export async function GET(request: NextRequest) {
  try {
    // TODO: Get organization_id from auth context
    const organization_id = request.headers.get('x-organization-id') || 'demo';

    const stats = await TaskService.getStats(organization_id);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching task stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task stats' },
      { status: 500 }
    );
  }
}
