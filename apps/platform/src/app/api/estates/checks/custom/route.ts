/**
 * Custom Checks API
 *
 * GET /api/estates/checks/custom - List custom checks for an organization
 * POST /api/estates/checks/custom - Create a new custom check
 */

import { NextRequest, NextResponse } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import {
  getCustomChecks,
  createCustomCheck,
  cloneCustomCheck,
  incrementTemplateUsage,
  type CreateCustomCheckInput,
  type CustomCheckFilters,
} from "@/lib/estates-compliance/database/custom-checks";
import { COMMON_TEMPLATES } from "@/lib/estates-compliance/check-templates";

export const GET = protectedRoute(async (auth, request) => {
  const searchParams = request.nextUrl.searchParams;
  const includePublic = searchParams.get("include_public") === "true";

  // Parse filters
  const filters: CustomCheckFilters = {
    domain: (searchParams.get("domain") as any) || undefined,
    frequency: (searchParams.get("frequency") as any) || undefined,
    visibility: (searchParams.get("visibility") as any) || undefined,
    is_template: searchParams.get("is_template") === "true" ? true : undefined,
    search: searchParams.get("search") || undefined,
    tags: searchParams.get("tags")?.split(",") || undefined,
    include_archived: searchParams.get("include_archived") === "true",
  };

  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");

  // Get organization's custom checks using authenticated org ID
  const orgChecks = await getCustomChecks(auth.organizationId, filters, {
    page,
    pageSize,
  });

  // If requested, also include public templates
  let publicTemplates: any[] = [];
  if (includePublic) {
    publicTemplates = COMMON_TEMPLATES.map((t) => ({
      ...t,
      id: `builtin_${t.id}`,
      is_builtin: true,
    }));
  }

  return apiSuccess({
    checks: orgChecks.data,
    total: orgChecks.total,
    page: orgChecks.page,
    pageSize: orgChecks.pageSize,
    totalPages: orgChecks.totalPages,
    public_templates: includePublic ? publicTemplates : undefined,
  });
});

export const POST = protectedRoute(
  async (auth, request) => {
    const body = await request.json();

    // Handle cloning from template
    if (body.clone_from) {
      if (body.clone_from.startsWith("builtin_")) {
        const templateId = body.clone_from.replace("builtin_", "");
        const template = COMMON_TEMPLATES.find((t) => t.id === templateId);

        if (!template) {
          return apiError("Template not found", 404);
        }

        const newCheck = await createCustomCheck({
          organization_id: auth.organizationId,
          name: body.name || template.name,
          description: body.description || template.description,
          compliance_domain:
            body.compliance_domain || template.compliance_domain,
          frequency: body.frequency || template.frequency,
          estimated_duration:
            body.estimated_duration ?? template.estimated_duration,
          requires_qualification:
            body.requires_qualification || template.requires_qualification,
          evidence_required:
            body.evidence_required || template.evidence_required,
          checklist_items: body.checklist_items || template.checklist_items,
          notes: body.notes || template.notes,
          classification: body.classification || "non_statutory",
          frequency_locked:
            body.frequency_locked ?? body.classification === "statutory",
          statutory_reference: body.statutory_reference,
          visibility: body.visibility || "private",
          tags: body.tags || template.tags,
          is_template: false,
          template_parent_id: template.id,
          created_by: auth.userId,
        });

        return apiSuccess(newCheck, 201);
      } else {
        const newCheck = await cloneCustomCheck(
          body.clone_from,
          auth.organizationId,
          auth.userId,
          {
            name: body.name,
            description: body.description,
            compliance_domain: body.compliance_domain,
            frequency: body.frequency,
            visibility: body.visibility,
          },
        );

        await incrementTemplateUsage(body.clone_from);
        return apiSuccess(newCheck, 201);
      }
    }

    // Create new custom check from scratch
    const input: CreateCustomCheckInput = {
      organization_id: auth.organizationId,
      name: body.name,
      description: body.description,
      compliance_domain: body.compliance_domain,
      frequency: body.frequency,
      estimated_duration: body.estimated_duration,
      requires_qualification: body.requires_qualification,
      evidence_required: body.evidence_required || [],
      checklist_items: body.checklist_items || [],
      notes: body.notes,
      classification: body.classification || "non_statutory",
      frequency_locked:
        body.frequency_locked ?? body.classification === "statutory",
      statutory_reference: body.statutory_reference,
      visibility: body.visibility || "private",
      tags: body.tags || [],
      is_template: body.is_template || false,
      created_by: auth.userId,
    };

    const newCheck = await createCustomCheck(input);
    return apiSuccess(newCheck, 201);
  },
  { requiredRole: "caretaker" },
);
