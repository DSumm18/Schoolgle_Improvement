/**
 * Single Contractor API Routes
 *
 * GET    /api/estates/contractors/[id]  - Get contractor
 * PUT    /api/estates/contractors/[id]  - Update contractor
 * DELETE /api/estates/contractors/[id]  - Delete contractor
 */

import { NextRequest, NextResponse } from 'next/server';
import { ContractorService } from '@/lib/estates-compliance/services/ContractorService';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/estates/contractors/[id]
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const contractor = await ContractorService.getContractor(id);

    if (!contractor) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 });
    }

    return NextResponse.json({ data: contractor });
  } catch (error) {
    console.error('Error in GET /api/estates/contractors/[id]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch contractor' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/estates/contractors/[id]
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const updates = await request.json();

    const contractor = await ContractorService.updateContractor(id, updates);

    return NextResponse.json({ data: contractor });
  } catch (error) {
    console.error('Error in PUT /api/estates/contractors/[id]:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update contractor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/estates/contractors/[id]
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    await ContractorService.deleteContractor(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/estates/contractors/[id]:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes('active contract')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete contractor' },
      { status: 500 }
    );
  }
}
