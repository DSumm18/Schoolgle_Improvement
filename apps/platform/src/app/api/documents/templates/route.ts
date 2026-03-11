import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * GET /api/documents/templates
 * List document templates (system + org-specific)
 *
 * Query params: module, category, document_type, organizationId, search
 */
export const GET = protectedRoute(async (auth, request) => {
  const supabase = createServiceRoleClient();
  const { searchParams } = new URL(request.url);

  const module = searchParams.get("module");
  const category = searchParams.get("category");
  const documentType = searchParams.get("document_type");
  const organizationId =
    searchParams.get("organizationId") || auth.organizationId;
  const search = searchParams.get("search");

  let query = supabase
    .from("document_templates")
    .select("*")
    .or(`organization_id.is.null,organization_id.eq.${organizationId}`)
    .order("module", { ascending: true })
    .order("name", { ascending: true });

  if (module) query = query.eq("module", module);
  if (category) query = query.eq("category", category);
  if (documentType) query = query.eq("document_type", documentType);
  if (search) query = query.ilike("name", `%${search}%`);

  const { data: templates, error } = await query;

  if (error) {
    console.error("Error fetching document templates:", error);
    return apiError(error.message, 500);
  }

  return apiSuccess(templates || []);
});

/**
 * POST /api/documents/templates
 * Create a custom document template
 */
export const POST = protectedRoute(
  async (auth, request) => {
    const supabase = createServiceRoleClient();
    const body = await request.json();

    const {
      organizationId,
      name,
      module,
      category,
      document_type,
      subject_template,
      body_template,
      available_placeholders,
      data_sources,
      description,
      tags,
    } = body;

    if (
      !name ||
      !module ||
      !category ||
      !document_type ||
      !subject_template ||
      !body_template
    ) {
      return apiError(
        "Missing required fields: name, module, category, document_type, subject_template, body_template",
        400,
        "MISSING_FIELDS",
      );
    }

    const resolvedOrgId = organizationId || auth.organizationId;

    // Auto-generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const { data: template, error } = await supabase
      .from("document_templates")
      .insert({
        organization_id: resolvedOrgId,
        name,
        slug,
        module,
        category,
        document_type,
        subject_template,
        body_template,
        available_placeholders: available_placeholders || [],
        data_sources: data_sources || [],
        description: description || null,
        tags: tags || [],
        created_by: auth.userId,
        is_system: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating document template:", error);
      return apiError(error.message, 500);
    }

    return apiSuccess(template, 201);
  },
  { requiredRole: "slt" },
);
