/**
 * Evidence API Routes
 *
 * GET    /api/estates/evidence              - List evidence
 * POST   /api/estates/evidence              - Upload/create evidence
 * PUT    /api/estates/evidence              - Update evidence
 */

import { NextRequest, NextResponse } from 'next/server';
import { EvidenceService } from '@/lib/estates-compliance/services/EvidenceService';
import type { EstatesEvidenceInput, EvidenceFilters } from '@/types/estates-compliance';

/**
 * GET /api/estates/evidence
 *
 * Query params:
 * - page: number (default: 1)
 * - page_size: number (default: 50)
 * - evidence_type: string
 * - status: string
 * - compliance_domain: string
 * - asset_id: string
 * - task_id: string
 * - contractor_id: string
 * - date_from: string (ISO date)
 * - date_to: string (ISO date)
 * - expiry_from: string (ISO date)
 * - expiry_to: string (ISO date)
 * - search: string
 * - tags: string (comma-separated)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Get organization from session (TODO: implement auth check)
    const organizationId = searchParams.get('organization_id');
    if (!organizationId) {
      return NextResponse.json({ error: 'organization_id is required' }, { status: 400 });
    }

    // Parse filters
    const filters: EvidenceFilters = {};

    if (searchParams.get('evidence_type')) {
      filters.evidence_type = searchParams.get('evidence_type') as any;
    }
    if (searchParams.get('status')) {
      filters.status = searchParams.get('status') as any;
    }
    if (searchParams.get('compliance_domain')) {
      filters.compliance_domain = searchParams.get('compliance_domain')!;
    }
    if (searchParams.get('asset_id')) {
      filters.asset_id = searchParams.get('asset_id')!;
    }
    if (searchParams.get('task_id')) {
      filters.task_id = searchParams.get('task_id')!;
    }
    if (searchParams.get('contractor_id')) {
      filters.contractor_id = searchParams.get('contractor_id')!;
    }
    if (searchParams.get('date_from')) {
      filters.date_from = searchParams.get('date_from')!;
    }
    if (searchParams.get('date_to')) {
      filters.date_to = searchParams.get('date_to')!;
    }
    if (searchParams.get('expiry_from')) {
      filters.expiry_from = searchParams.get('expiry_from')!;
    }
    if (searchParams.get('expiry_to')) {
      filters.expiry_to = searchParams.get('expiry_to')!;
    }
    if (searchParams.get('search')) {
      filters.search = searchParams.get('search')!;
    }
    if (searchParams.get('tags')) {
      filters.tags = searchParams.get('tags')!.split(',');
    }

    // Parse pagination
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('page_size') || '50', 10);

    const result = await EvidenceService.list(organizationId, filters, { page, pageSize });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in GET /api/estates/evidence:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch evidence' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/estates/evidence
 *
 * Body: EstatesEvidenceInput & {
 *   file?: File;
 *   driveFileId?: string; // for Google Drive links
 *   existing_evidence_id?: string; // for linking existing evidence
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const organizationId = formData.get('organization_id') as string;
    const userId = formData.get('user_id') as string;

    if (!organizationId) {
      return NextResponse.json({ error: 'organization_id is required' }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const sourceType = formData.get('source_type') as 'upload' | 'google_drive' | 'onedrive' | 'link' | 'existing';

    // Handle different source types
    if (sourceType === 'upload') {
      // File upload
      const file = formData.get('file') as File | null;
      const title = formData.get('title') as string;
      const description = formData.get('description') as string | null;
      const evidenceType = formData.get('evidence_type') as any;
      const complianceDomain = formData.get('compliance_domain') as string | null;
      const assetId = formData.get('asset_id') as string | null;
      const taskId = formData.get('task_id') as string | null;
      const contractorId = formData.get('contractor_id') as string | null;
      const contractId = formData.get('contract_id') as string | null;
      const documentNumber = formData.get('document_number') as string | null;
      const issuingBody = formData.get('issuing_body') as string | null;
      const issuedDate = formData.get('issued_date') as string | null;
      const expiryDate = formData.get('expiry_date') as string | null;
      const tags = formData.get('tags') as string | null;

      if (!file) {
        return NextResponse.json({ error: 'file is required for upload' }, { status: 400 });
      }
      if (!title) {
        return NextResponse.json({ error: 'title is required' }, { status: 400 });
      }
      if (!evidenceType) {
        return NextResponse.json({ error: 'evidence_type is required' }, { status: 400 });
      }

      const evidence = await EvidenceService.upload(organizationId, userId, {
        title,
        description: description || undefined,
        evidence_type: evidenceType,
        source_type: 'upload',
        compliance_domain: complianceDomain || undefined,
        asset_id: assetId || undefined,
        task_id: taskId || undefined,
        contractor_id: contractorId || undefined,
        contract_id: contractId || undefined,
        document_number: documentNumber || undefined,
        issuing_body: issuingBody || undefined,
        issued_date: issuedDate || undefined,
        expiry_date: expiryDate || undefined,
        tags: tags ? tags.split(',') : [],
        file,
      });

      return NextResponse.json({ data: evidence }, { status: 201 });
    }

    if (sourceType === 'google_drive') {
      // Google Drive link (placeholder for future)
      const driveFileId = formData.get('drive_file_id') as string;
      const title = formData.get('title') as string;
      const description = formData.get('description') as string | null;
      const evidenceType = formData.get('evidence_type') as any;
      const complianceDomain = formData.get('compliance_domain') as string | null;
      const assetId = formData.get('asset_id') as string | null;
      const taskId = formData.get('task_id') as string | null;

      if (!driveFileId) {
        return NextResponse.json({ error: 'drive_file_id is required for Google Drive link' }, { status: 400 });
      }
      if (!title) {
        return NextResponse.json({ error: 'title is required' }, { status: 400 });
      }
      if (!evidenceType) {
        return NextResponse.json({ error: 'evidence_type is required' }, { status: 400 });
      }

      const evidence = await EvidenceService.linkGoogleDrive(organizationId, userId, {
        driveFileId,
        title,
        description: description || undefined,
        evidence_type: evidenceType,
        compliance_domain: complianceDomain || undefined,
        asset_id: assetId || undefined,
        task_id: taskId || undefined,
      });

      return NextResponse.json({ data: evidence }, { status: 201 });
    }

    if (sourceType === 'existing') {
      // Link to existing evidence
      const existingEvidenceId = formData.get('existing_evidence_id') as string;
      const title = formData.get('title') as string | null;
      const description = formData.get('description') as string | null;
      const complianceDomain = formData.get('compliance_domain') as string | null;
      const assetId = formData.get('asset_id') as string | null;
      const taskId = formData.get('task_id') as string | null;
      const contractorId = formData.get('contractor_id') as string | null;
      const contractId = formData.get('contract_id') as string | null;

      if (!existingEvidenceId) {
        return NextResponse.json({ error: 'existing_evidence_id is required for linking' }, { status: 400 });
      }

      const evidence = await EvidenceService.linkExisting(organizationId, userId, existingEvidenceId, {
        title: title || undefined,
        description: description || undefined,
        compliance_domain: complianceDomain || undefined,
        asset_id: assetId || undefined,
        task_id: taskId || undefined,
        contractor_id: contractorId || undefined,
        contract_id: contractId || undefined,
      });

      return NextResponse.json({ data: evidence }, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid source_type' }, { status: 400 });
  } catch (error) {
    console.error('Error in POST /api/estates/evidence:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create evidence' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/estates/evidence
 *
 * Body: Partial<EstatesEvidenceInput> & {
 *   id: string;
 *   status?: string;
 *   verified?: boolean;
 *   verification_notes?: string;
 * }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const evidence = await EvidenceService.update(id, updates);

    return NextResponse.json({ data: evidence });
  } catch (error) {
    console.error('Error in PUT /api/estates/evidence:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update evidence' },
      { status: 500 }
    );
  }
}
