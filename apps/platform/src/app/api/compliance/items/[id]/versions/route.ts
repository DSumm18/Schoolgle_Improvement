import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * GET /api/compliance/items/[id]/versions
 * List all versions for a compliance item
 */
export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const segments = req.nextUrl.pathname.split("/");
  const versionsIdx = segments.indexOf("versions");
  const id = versionsIdx > 0 ? segments[versionsIdx - 1] : null;

  if (!id) return apiError("Compliance item ID required", 400);

  const { data, error } = await supabase
    .from("compliance_versions")
    .select("*")
    .eq("compliance_item_id", id)
    .order("version_number", { ascending: false });

  if (error) {
    console.error("Error fetching versions:", error);
    return apiError("Failed to fetch versions", 500);
  }

  return apiSuccess({ versions: data || [] });
});

/**
 * POST /api/compliance/items/[id]/versions
 * Create a new version (auto-increments version_number)
 */
export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const segments = req.nextUrl.pathname.split("/");
  const versionsIdx = segments.indexOf("versions");
  const id = versionsIdx > 0 ? segments[versionsIdx - 1] : null;

  if (!id) return apiError("Compliance item ID required", 400);

  const body = await req.json();
  const {
    content_format,
    content_html,
    content_md,
    change_summary,
    source_template_id,
  } = body;

  // Get current max version number
  const { data: latest } = await supabase
    .from("compliance_versions")
    .select("version_number")
    .eq("compliance_item_id", id)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersion = (latest?.version_number || 0) + 1;

  const contentHash = content_html
    ? Buffer.from(content_html).toString("base64").slice(0, 40)
    : content_md
      ? Buffer.from(content_md).toString("base64").slice(0, 40)
      : undefined;

  const { data: version, error } = await supabase
    .from("compliance_versions")
    .insert({
      compliance_item_id: id,
      version_number: nextVersion,
      content_format: content_format || "html",
      content_html,
      content_md,
      created_by_user_id: auth.userId,
      change_summary,
      content_hash: contentHash,
      source_template_id,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating version:", error);
    return apiError("Failed to create version", 500);
  }

  // Update item's updated_at
  const { data: item } = await supabase
    .from("compliance_items")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("organization_id")
    .single();

  // Audit log
  if (item) {
    await supabase.from("compliance_audit_log").insert({
      organization_id: item.organization_id,
      entity_type: "compliance_version",
      entity_id: version.id,
      action: "created",
      actor_user_id: auth.userId,
      metadata: { compliance_item_id: id, version_number: nextVersion },
    });
  }

  return apiSuccess({ version }, 201);
});
