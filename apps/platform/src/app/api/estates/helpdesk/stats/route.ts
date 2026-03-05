/**
 * Helpdesk Statistics API
 *
 * GET /api/estates/helpdesk/stats - Get ticket statistics for dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { HelpdeskService } from '@/lib/estates-compliance/services/HelpdeskService';

export async function GET(request: NextRequest) {
  try {
    // TODO: Get organization_id from auth context
    const organization_id = request.headers.get('x-organization-id') || 'demo';

    const stats = await HelpdeskService.getStats(organization_id);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching helpdesk stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch helpdesk stats' },
      { status: 500 }
    );
  }
}
