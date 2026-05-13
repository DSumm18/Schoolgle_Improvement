import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { DEFAULT_MEETING_TEMPLATES } from "@/lib/meetings/meeting-template-catalog";
import { createServiceRoleClient } from "@/lib/supabase-server";

async function ensureDefaultTemplates(supabase: ReturnType<typeof createServiceRoleClient>) {
  const { data: existingTemplates, error: existingError } = await supabase
    .from("meeting_templates")
    .select("name")
    .is("organization_id", null);

  if (existingError) {
    console.error("Error checking default meeting templates:", existingError);
    return;
  }

  const existingNames = new Set((existingTemplates || []).map((template) => template.name));
  const missingTemplates = DEFAULT_MEETING_TEMPLATES.filter(
    (template) => !existingNames.has(template.name),
  );

  if (missingTemplates.length === 0) return;

  for (const template of missingTemplates) {
    const { error: insertError } = await supabase.from("meeting_templates").insert({
      ...template,
      is_custom: false,
      organization_id: null,
    });

    if (insertError) {
      console.error(
        `Error seeding default meeting template "${template.name}":`,
        insertError,
      );
    }
  }
}

function toVirtualTemplate(template: (typeof DEFAULT_MEETING_TEMPLATES)[number]) {
  const slug = template.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return {
    ...template,
    id: `default:${slug}`,
    is_custom: false,
    organization_id: null,
    created_by: null,
    created_at: "2026-04-27T00:00:00.000Z",
    updated_at: "2026-04-27T00:00:00.000Z",
  };
}

function mergeWithBuiltInTemplates(
  templates: Array<{ name: string; category: string }>,
  category: string | null,
) {
  const existingNames = new Set(templates.map((template) => template.name));
  const builtIns = DEFAULT_MEETING_TEMPLATES.filter(
    (template) =>
      !existingNames.has(template.name) &&
      (!category || template.category === category),
  ).map(toVirtualTemplate);

  return [...templates, ...builtIns].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

/**
 * GET /api/meetings/templates
 * List meeting templates (global + org custom)
 */
export const GET = protectedRoute(async (auth, request) => {
  const { searchParams } = new URL(request.url);
  // orgId MUST come from authenticated session — never from caller
  const organizationId = auth.organizationId;
  const category = searchParams.get("category");

  const supabase = createServiceRoleClient();
  await ensureDefaultTemplates(supabase);

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

  return apiSuccess({
    templates: mergeWithBuiltInTemplates(templates || [], category),
  });
});

/**
 * POST /api/meetings/templates
 * Create a custom meeting template
 */
export const POST = protectedRoute(async (auth, request) => {
  const body = await request.json();
  const {
    name,
    category,
    description,
    opening_script,
    closing_script,
    compliance_items,
    preparation_guide,
  } = body;

  // orgId MUST come from authenticated session — never from caller
  const resolvedOrgId = auth.organizationId;

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
