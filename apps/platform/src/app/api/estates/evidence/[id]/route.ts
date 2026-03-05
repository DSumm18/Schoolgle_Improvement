/**
 * Individual Evidence API Routes
 *
 * GET    /api/estates/evidence/[id]         - Get evidence by ID
 * PUT    /api/estates/evidence/[id]         - Update evidence
 * DELETE /api/estates/evidence/[id]         - Delete evidence
 * POST   /api/estates/evidence/[id]/verify  - Verify evidence
 * POST   /api/estates/evidence/[id]/version - Create new version
 */

import { NextRequest, NextResponse } from 'next/server';
import { EvidenceService } from '@/lib/estates-compliance/services/EvidenceService';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/estates/evidence/[id]
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const evidence = await EvidenceService.get(id);

    if (!evidence) {
      return NextResponse.json({ error: 'Evidence not found' }, { status: 404 });
    }

    return NextResponse.json({ data: evidence });
  } catch (error) {
    console.error('Error in GET /api/estates/evidence/[id]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch evidence' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/estates/evidence/[id]
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const updates = await request.json();

    const evidence = await EvidenceService.update(id, updates);

    return NextResponse.json({ data: evidence });
  } catch (error) {
    console.error('Error in PUT /api/estates/evidence/[id]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update evidence' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/estates/evidence/[id]
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    await EvidenceService.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/estates/evidence/[id]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete evidence' },
      { status: 500 }
    );
  }
}
