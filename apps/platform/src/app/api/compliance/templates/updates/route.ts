import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * GET /api/compliance/templates/updates
 *
 * Check which of the organization's policies are based on outdated template versions.
 * Returns a list of items where the source template has been updated since the policy
 * was created, enabling a "template update available" notification cascade.
 */
export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();

  // Get all published/approved policies for this org that were created from a template
  const { data: items, error: itemsError } = await supabase
    .from("compliance_items")
    .select(
      `
      id,
      title,
      status,
      compliance_versions!inner (
        id,
        version_number,
        source_template_id,
        created_at
      )
    `,
    )
    .eq("organization_id", organizationId)
    .eq("type", "policy")
    .in("status", ["published", "approved", "draft", "in_review"])
    .not("compliance_versions.source_template_id", "is", null);

  if (itemsError) {
    console.error("Error fetching items:", itemsError);
    return apiError("Failed to fetch items", 500);
  }

  if (!items || items.length === 0) {
    return apiSuccess({ updates: [] });
  }

  // Collect unique template IDs
  const templateIds = new Set<string>();
  for (const item of items) {
    const versions = item.compliance_versions as any[];
    for (const v of versions) {
      if (v.source_template_id) {
        templateIds.add(v.source_template_id);
      }
    }
  }

  // Get current template versions
  const { data: templates, error: tplError } = await supabase
    .from("compliance_templates")
    .select("id, name, version, last_updated_at, source_reference")
    .in("id", Array.from(templateIds));

  if (tplError) {
    console.error("Error fetching templates:", tplError);
    return apiError("Failed to fetch templates", 500);
  }

  const templateMap = new Map((templates || []).map((t) => [t.id, t]));

  // Compare: find items where the latest version was created BEFORE
  // the template was last updated
  const updates: Array<{
    item_id: string;
    item_title: string;
    item_status: string;
    template_id: string;
    template_name: string;
    template_version: number;
    template_source_reference: string | null;
    template_updated_at: string;
    item_version_created_at: string;
  }> = [];

  for (const item of items) {
    const versions = (item.compliance_versions as any[]).sort(
      (a: any, b: any) => b.version_number - a.version_number,
    );
    const latestVersion = versions[0];
    if (!latestVersion?.source_template_id) continue;

    const template = templateMap.get(latestVersion.source_template_id);
    if (!template) continue;

    // If template was updated after the policy version was created
    if (
      new Date(template.last_updated_at) > new Date(latestVersion.created_at)
    ) {
      updates.push({
        item_id: item.id,
        item_title: item.title,
        item_status: item.status,
        template_id: template.id,
        template_name: template.name,
        template_version: template.version,
        template_source_reference: template.source_reference,
        template_updated_at: template.last_updated_at,
        item_version_created_at: latestVersion.created_at,
      });
    }
  }

  return apiSuccess({
    updates,
    total_policies_checked: items.length,
    updates_available: updates.length,
  });
});
