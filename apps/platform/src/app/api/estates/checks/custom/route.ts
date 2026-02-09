/**
 * Custom Checks API
 *
 * GET /api/estates/checks/custom - List custom checks for an organization
 * POST /api/estates/checks/custom - Create a new custom check
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getCustomChecks,
  createCustomCheck,
  cloneCustomCheck,
  incrementTemplateUsage,
  type CreateCustomCheckInput,
  type CustomCheckFilters,
} from '@/lib/estates-compliance/database/custom-checks';
import { COMMON_TEMPLATES } from '@/lib/estates-compliance/check-templates';

export async function GET(request: NextRequest) {
  try {
    // TODO: Get organization_id and user_id from auth context
    const organization_id = request.headers.get('x-organization-id') || 'demo';
    const user_id = request.headers.get('x-user-id') || 'demo-user';

    const searchParams = request.nextUrl.searchParams;
    const includePublic = searchParams.get('include_public') === 'true';

    // Parse filters
    const filters: CustomCheckFilters = {
      domain: searchParams.get('domain') as any || undefined,
      frequency: searchParams.get('frequency') as any || undefined,
      visibility: searchParams.get('visibility') as any || undefined,
      is_template: searchParams.get('is_template') === 'true' ? true : undefined,
      search: searchParams.get('search') || undefined,
      tags: searchParams.get('tags')?.split(',') || undefined,
      include_archived: searchParams.get('include_archived') === 'true',
    };

    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    // Get organization's custom checks
    const orgChecks = await getCustomChecks(organization_id, filters, { page, pageSize });

    // If requested, also include public templates
    let publicTemplates = [];
    if (includePublic) {
      // Get built-in templates
      publicTemplates = COMMON_TEMPLATES.map(t => ({
        ...t,
        id: `builtin_${t.id}`,
        is_builtin: true,
      }));

      // TODO: Also fetch user-created public templates from database
    }

    return NextResponse.json({
      checks: orgChecks.data,
      total: orgChecks.total,
      page: orgChecks.page,
      pageSize: orgChecks.pageSize,
      totalPages: orgChecks.totalPages,
      public_templates: includePublic ? publicTemplates : undefined,
    });
  } catch (error) {
    console.error('Error fetching custom checks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch custom checks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Get organization_id and user_id from auth context
    const organization_id = request.headers.get('x-organization-id') || 'demo';
    const user_id = request.headers.get('x-user-id') || 'demo-user';

    const body = await request.json();

    // Handle cloning from template
    if (body.clone_from) {
      // Check if cloning from built-in template or custom check
      if (body.clone_from.startsWith('builtin_')) {
        const templateId = body.clone_from.replace('builtin_', '');
        const template = COMMON_TEMPLATES.find(t => t.id === templateId);

        if (!template) {
          return NextResponse.json(
            { error: 'Template not found' },
            { status: 404 }
          );
        }

        // Create from built-in template
        const newCheck = await createCustomCheck({
          organization_id,
          name: body.name || template.name,
          description: body.description || template.description,
          compliance_domain: body.compliance_domain || template.compliance_domain,
          frequency: body.frequency || template.frequency,
          estimated_duration: body.estimated_duration ?? template.estimated_duration,
          requires_qualification: body.requires_qualification || template.requires_qualification,
          evidence_required: body.evidence_required || template.evidence_required,
          checklist_items: body.checklist_items || template.checklist_items,
          notes: body.notes || template.notes,
          visibility: body.visibility || 'private',
          tags: body.tags || template.tags,
          is_template: false,
          template_parent_id: template.id,
          created_by: user_id,
        });

        return NextResponse.json(newCheck, { status: 201 });
      } else {
        // Clone from existing custom check
        const newCheck = await cloneCustomCheck(
          body.clone_from,
          organization_id,
          user_id,
          {
            name: body.name,
            description: body.description,
            compliance_domain: body.compliance_domain,
            frequency: body.frequency,
            visibility: body.visibility,
          }
        );

        // Increment usage count of the original
        await incrementTemplateUsage(body.clone_from);

        return NextResponse.json(newCheck, { status: 201 });
      }
    }

    // Create new custom check from scratch
    const input: CreateCustomCheckInput = {
      organization_id,
      name: body.name,
      description: body.description,
      compliance_domain: body.compliance_domain,
      frequency: body.frequency,
      estimated_duration: body.estimated_duration,
      requires_qualification: body.requires_qualification,
      evidence_required: body.evidence_required || [],
      checklist_items: body.checklist_items || [],
      notes: body.notes,
      visibility: body.visibility || 'private',
      tags: body.tags || [],
      is_template: body.is_template || false,
      created_by: user_id,
    };

    const newCheck = await createCustomCheck(input);

    return NextResponse.json(newCheck, { status: 201 });
  } catch (error) {
    console.error('Error creating custom check:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create custom check' },
      { status: 500 }
    );
  }
}
