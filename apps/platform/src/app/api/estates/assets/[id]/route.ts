/**
 * Single Asset API Routes
 *
 * GET    /api/estates/assets/[id]  - Get asset
 * PUT    /api/estates/assets/[id]  - Update asset
 * DELETE /api/estates/assets/[id]  - Delete asset
 */

import { NextRequest, NextResponse } from 'next/server';
import { AssetService } from '@/lib/estates-compliance/services/AssetService';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/estates/assets/[id]
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const asset = await AssetService.get(id);

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    return NextResponse.json({ data: asset });
  } catch (error) {
    console.error('Error in GET /api/estates/assets/[id]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch asset' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/estates/assets/[id]
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const updates = await request.json();

    const asset = await AssetService.update(id, updates);

    return NextResponse.json({ data: asset });
  } catch (error) {
    console.error('Error in PUT /api/estates/assets/[id]:', error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes('child assets')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update asset' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/estates/assets/[id]
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    await AssetService.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/estates/assets/[id]:', error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes('child assets')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete asset' },
      { status: 500 }
    );
  }
}
