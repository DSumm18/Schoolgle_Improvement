import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * GET /api/meetings/templates
 * List meeting templates (global + org custom)
 */
export const GET = protectedRoute(async (auth, request) => {
  const { searchParams } = new URL(request.url);
  const organizationId =
    searchParams.get("organizationId") || auth.organizationId;
  const category = searchParams.get("category");

  const supabase = createServiceRoleClient();

  let query = supabase.from("meeting_templates").select("*").order("name");

  // Return global templates + org-specific custom templates
  if (organizationId) {
    query = query.or(
      `organization_id.is.null,organization_id.eq.${organizationId}`,
    );
  } else {
    query = query.is("organization_id", null);
  }

  if (category) {
    query = query.eq("category", category);
  }

  const { data: templates, error } = await query;

  if (error) {
    console.error("Error fetching templates:", error);
    return apiError("Failed to fetch templates", 500);
  }

  return apiSuccess({ templates: templates || [] });
});

/**
 * POST /api/meetings/templates
 * Create a custom meeting template
 */
export const POST = protectedRoute(async (auth, request) => {
  const body = await request.json();
  const {
    organizationId,
    name,
    category,
    description,
    opening_script,
    closing_script,
    compliance_items,
    preparation_guide,
  } = body;

  const resolvedOrgId = organizationId || auth.organizationId;

  if (!resolvedOrgId || !name || !category) {
    return apiError(
      "Missing required fields: organizationId, name, category",
      400,
    );
  }

  const supabase = createServiceRoleClient();

  const { data: template, error } = await supabase
    .from("meeting_templates")
    .insert({
      name,
      category,
      description: description || "",
      opening_script: opening_script || [],
      closing_script: closing_script || [],
      compliance_items: compliance_items || [],
      preparation_guide: preparation_guide || {},
      is_custom: true,
      organization_id: resolvedOrgId,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating template:", error);
    return apiError("Failed to create template", 500);
  }

  return apiSuccess({ template }, 201);
});
