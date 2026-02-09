/**
 * Contractors API Routes
 *
 * GET    /api/estates/contractors              - List contractors
 * POST   /api/estates/contractors              - Create contractor
 */

import { NextRequest, NextResponse } from 'next/server';
import { ContractorService } from '@/lib/estates-compliance/services/ContractorService';
import type { ContractorInput } from '@/types/estates-compliance';

/**
 * GET /api/estates/contractors
 *
 * Query params:
 * - status: 'active' | 'inactive' | 'restricted'
 * - preferred: boolean
 */
export async function GET(request: NextRequest) {
  console.log('[API] GET /api/estates/contractors hit');
  try {
    const searchParams = request.nextUrl.searchParams;

    // Get organization from session (TODO: implement auth check)
    const organizationId = searchParams.get('organization_id');
    console.log('[API] GET contractors org_id:', organizationId);

    if (!organizationId) {
      console.warn('[API] GET contractors missing organization_id');
      return NextResponse.json({ error: 'organization_id is required' }, { status: 400 });
    }

    // Parse filters
    const filters: {
      status?: 'active' | 'inactive' | 'restricted';
      preferred?: boolean;
    } = {};

    if (searchParams.get('status')) {
      filters.status = searchParams.get('status') as 'active' | 'inactive' | 'restricted';
    }
    if (searchParams.get('preferred') !== null) {
      filters.preferred = searchParams.get('preferred') === 'true';
    }

    console.log('[API] GET contractors filters:', filters);
    const contractors = await ContractorService.listContractors(organizationId, filters);
    console.log(`[API] GET contractors found ${contractors.length} records`);

    return NextResponse.json({ contractors, count: contractors.length });
  } catch (error) {
    console.error('Error in GET /api/estates/contractors:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch contractors' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/estates/contractors
 *
 * Body: ContractorInput
 */
export async function POST(request: NextRequest) {
  console.log('[API] POST /api/estates/contractors hit');
  try {
    const body = await request.json();
    const { organization_id, ...contractorData } = body;

    if (!organization_id) {
      return NextResponse.json({ error: 'organization_id is required' }, { status: 400 });
    }

    if (!contractorData.company_name) {
      return NextResponse.json({ error: 'company_name is required' }, { status: 400 });
    }

    const contractor = await ContractorService.createContractor(
      organization_id,
      contractorData as ContractorInput
    );

    return NextResponse.json({ data: contractor }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/estates/contractors:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create contractor' },
      { status: 500 }
    );
  }
}
