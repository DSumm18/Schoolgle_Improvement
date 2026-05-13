import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { ensureStandardDocumentTemplates } from "@/lib/document-engine/standard-templates";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * GET /api/documents/templates/[id]
 * Get a single document template by ID
 */
export const GET = protectedRoute(async (auth, request) => {
  const supabase = createServiceRoleClient();
  const id = request.nextUrl.pathname.split("/").at(-1);
  await ensureStandardDocumentTemplates(supabase);

  if (!id) {
    return apiError("Template ID is required", 400, "MISSING_ID");
  }

  let templateQuery = supabase
    .from("document_templates")
    .select("*")
    .or(`organization_id.is.null,organization_id.eq.${auth.organizationId}`);

  templateQuery = UUID_PATTERN.test(id)
    ? templateQuery.eq("id", id)
    : templateQuery.eq("slug", id);

  const { data: template, error } = await templateQuery.single();

  if (error) {
    console.error("Error fetching document template:", error);
    return apiError("Template not found", 404, "NOT_FOUND");
  }

  // Ensure the template is accessible: system templates or org-owned
  if (
    template.organization_id &&
    template.organization_id !== auth.organizationId
  ) {
    return apiError("Access denied", 403, "FORBIDDEN");
  }

  return apiSuccess(template);
});

/**
 * PUT /api/documents/templates/[id]
 * Update a document template (only non-system templates)
 */
export const PUT = protectedRoute(
  async (auth, request) => {
    const supabase = createServiceRoleClient();
    const id = request.nextUrl.pathname.split("/").at(-1);

    if (!id) {
      return apiError("Template ID is required", 400, "MISSING_ID");
    }

    // Check the template exists and is not a system template
    const { data: existing, error: fetchError } = await supabase
      .from("document_templates")
      .select("id, is_system, organization_id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return apiError("Template not found", 404, "NOT_FOUND");
    }

    if (existing.is_system) {
      return apiError(
        "Cannot modify a system template",
        403,
        "SYSTEM_TEMPLATE",
      );
    }

    if (existing.organization_id !== auth.organizationId) {
      return apiError("Access denied", 403, "FORBIDDEN");
    }

    const body = await request.json();
    const {
      name,
      category,
      document_type,
      subject_template,
      body_template,
      available_placeholders,
      data_sources,
      description,
      tags,
    } = body;

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (name !== undefined) {
      updateData.name = name;
      updateData.slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    }
    if (category !== undefined) updateData.category = category;
    if (document_type !== undefined) updateData.document_type = document_type;
    if (subject_template !== undefined)
      updateData.subject_template = subject_template;
    if (body_template !== undefined) updateData.body_template = body_template;
    if (available_placeholders !== undefined)
      updateData.available_placeholders = available_placeholders;
    if (data_sources !== undefined) updateData.data_sources = data_sources;
    if (description !== undefined) updateData.description = description;
    if (tags !== undefined) updateData.tags = tags;

    const { data: template, error } = await supabase
      .from("document_templates")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating document template:", error);
      return apiError(error.message, 500);
    }

    return apiSuccess(template);
  },
  { requiredRole: "slt" },
);

/**
 * DELETE /api/documents/templates/[id]
 * Delete a document template (only non-system templates)
 */
export const DELETE = protectedRoute(
  async (auth, request) => {
    const supabase = createServiceRoleClient();
    const id = request.nextUrl.pathname.split("/").at(-1);

    if (!id) {
      return apiError("Template ID is required", 400, "MISSING_ID");
    }

    // Check the template exists and is not a system template
    const { data: existing, error: fetchError } = await supabase
      .from("document_templates")
      .select("id, is_system, organization_id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return apiError("Template not found", 404, "NOT_FOUND");
    }

    if (existing.is_system) {
      return apiError(
        "Cannot delete a system template",
        403,
        "SYSTEM_TEMPLATE",
      );
    }

    if (existing.organization_id !== auth.organizationId) {
      return apiError("Access denied", 403, "FORBIDDEN");
    }

    const { error } = await supabase
      .from("document_templates")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting document template:", error);
      return apiError(error.message, 500);
    }

    return apiSuccess({ success: true });
  },
  { requiredRole: "admin" },
);
