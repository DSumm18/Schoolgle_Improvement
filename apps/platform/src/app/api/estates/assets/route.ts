/**
 * Assets API Routes
 *
 * GET    /api/estates/assets              - List assets
 * POST   /api/estates/assets              - Create asset
 */

import { NextRequest, NextResponse } from 'next/server';
import { AssetService } from '@/lib/estates-compliance/services/AssetService';
import type { AssetInput } from '@/types/estates-compliance';

/**
 * GET /api/estates/assets
 *
 * Query params:
 * - page: number (default: 1)
 * - page_size: number (default: 50)
 * - asset_type: string
 * - category: string
 * - building: string
 * - floor: string
 * - room: string
 * - status: string
 * - compliance_domain: string
 * - search: string
 */
export async function GET(request: NextRequest) {
  console.log('[API] GET /api/estates/assets hit');
  try {
    const searchParams = request.nextUrl.searchParams;

    // Get organization from session (TODO: implement auth check)
    const organizationId = searchParams.get('organization_id');
    console.log('[API] GET assets org_id:', organizationId);

    if (!organizationId) {
      console.warn('[API] GET assets missing organization_id');
      return NextResponse.json({ error: 'organization_id is required' }, { status: 400 });
    }

    // Parse filters
    const filters: {
      asset_type?: string;
      category?: string;
      building?: string;
      floor?: string;
      room?: string;
      status?: string;
      compliance_domain?: string;
      search?: string;
    } = {};

    if (searchParams.get('asset_type')) filters.asset_type = searchParams.get('asset_type')!;
    if (searchParams.get('category')) filters.category = searchParams.get('category')!;
    if (searchParams.get('building')) filters.building = searchParams.get('building')!;
    if (searchParams.get('floor')) filters.floor = searchParams.get('floor')!;
    if (searchParams.get('room')) filters.room = searchParams.get('room')!;
    if (searchParams.get('status')) filters.status = searchParams.get('status')!;
    if (searchParams.get('compliance_domain'))
      filters.compliance_domain = searchParams.get('compliance_domain')!;
    if (searchParams.get('search')) filters.search = searchParams.get('search')!;

    // Parse pagination
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('page_size') || '50', 10);

    console.log('[API] GET assets filters:', filters, 'page:', page);
    const result = await AssetService.list(organizationId, filters, { page, pageSize });
    console.log(`[API] GET assets found ${result.count} records`);

    return NextResponse.json({
      assets: result.data,
      total: result.count,
      page: result.page,
      pageSize: result.page_size,
      hasMore: result.has_more,
    });
  } catch (error) {
    console.error('Error in GET /api/estates/assets:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch assets' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/estates/assets
 *
 * Body: AssetInput
 */
export async function POST(request: NextRequest) {
  console.log('[API] POST /api/estates/assets hit');
  try {
    const body = await request.json();
    const { organization_id, ...assetData } = body;

    if (!organization_id) {
      return NextResponse.json({ error: 'organization_id is required' }, { status: 400 });
    }

    if (!assetData.asset_type) {
      return NextResponse.json({ error: 'asset_type is required' }, { status: 400 });
    }

    if (!assetData.name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const asset = await AssetService.create(organization_id, assetData as AssetInput);

    return NextResponse.json({ data: asset }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/estates/assets:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create asset' },
      { status: 500 }
    );
  }
}
