/**
 * Evidence Stats API Route
 *
 * GET /api/estates/evidence/stats - Get evidence statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { EvidenceService } from '@/lib/estates-compliance/services/EvidenceService';

/**
 * GET /api/estates/evidence/stats
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organization_id');

    if (!organizationId) {
      return NextResponse.json({ error: 'organization_id is required' }, { status: 400 });
    }

    const stats = await EvidenceService.getStats(organizationId);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error in GET /api/estates/evidence/stats:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch evidence stats' },
      { status: 500 }
    );
  }
}
