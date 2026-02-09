/**
 * Individual Custom Check API
 *
 * GET /api/estates/checks/custom/[id] - Get a single custom check
 * PUT /api/estates/checks/custom/[id] - Update a custom check
 * DELETE /api/estates/checks/custom/[id] - Archive/delete a custom check
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCustomCheckById, updateCustomCheck, archiveCustomCheck, deleteCustomCheck } from '@/lib/estates-compliance/database/custom-checks';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const check = await getCustomCheckById(id);

    if (!check) {
      return NextResponse.json(
        { error: 'Custom check not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(check);
  } catch (error) {
    console.error('Error fetching custom check:', error);
    return NextResponse.json(
      { error: 'Failed to fetch custom check' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Verify user has permission to edit this check
    const user_id = request.headers.get('x-user-id') || 'demo-user';

    const { id } = await params;
    const body = await request.json();

    // Check if exists
    const existing = await getCustomCheckById(id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Custom check not found' },
        { status: 404 }
      );
    }

    const updated = await updateCustomCheck(id, {
      ...body,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating custom check:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update custom check' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Verify user has permission to delete this check
    const { id } = await params;

    const searchParams = request.nextUrl.searchParams;
    const permanent = searchParams.get('permanent') === 'true';

    // Check if exists
    const existing = await getCustomCheckById(id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Custom check not found' },
        { status: 404 }
      );
    }

    if (permanent) {
      await deleteCustomCheck(id);
    } else {
      await archiveCustomCheck(id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting custom check:', error);
    return NextResponse.json(
      { error: 'Failed to delete custom check' },
      { status: 500 }
    );
  }
}
