import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * GET /api/compliance/items/[id]
 * Get a single compliance item with version, schedule, and approvals
 */
export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const segments = req.nextUrl.pathname.split("/");
  const id = segments[segments.length - 1];

  const { data: item, error } = await supabase
    .from("compliance_items")
    .select("*")
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .single();

  if (error || !item) {
    return apiError("Compliance item not found", 404);
  }

  // Fetch full version history, newest first
  const { data: versions } = await supabase
    .from("compliance_versions")
    .select("*")
    .eq("compliance_item_id", id)
    .order("version_number", { ascending: false });

  // Fetch review schedule
  const { data: schedule } = await supabase
    .from("compliance_review_schedule")
    .select("*")
    .eq("compliance_item_id", id)
    .maybeSingle();

  // Fetch approvals
  const { data: approvals } = await supabase
    .from("compliance_approvals")
    .select("*")
    .eq("compliance_item_id", id)
    .order("created_at", { ascending: false });

  return apiSuccess({
    item: {
      ...item,
      current_version: versions?.[0] || null,
      review_schedule: schedule,
    },
    versions: versions || [],
    approvals: approvals || [],
  });
});

/**
 * PUT /api/compliance/items/[id]
 * Update compliance item fields
 */
export const PUT = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const segments = req.nextUrl.pathname.split("/");
  const id = segments[segments.length - 1];

  const body = await req.json();
  const {
    title,
    status,
    owner_user_id,
    category,
    tags,
    confidentiality_level,
    metadata,
    content_format,
    content_html,
    content_md,
    change_summary,
  } = body;

  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };
  if (title !== undefined) updateData.title = title;
  if (status !== undefined) updateData.status = status;
  if (owner_user_id !== undefined) updateData.owner_user_id = owner_user_id;
  if (category !== undefined) updateData.category = category;
  if (tags !== undefined) updateData.tags = tags;
  if (confidentiality_level !== undefined)
    updateData.confidentiality_level = confidentiality_level;
  if (metadata !== undefined) updateData.metadata = metadata;

  const { data, error } = await supabase
    .from("compliance_items")
    .update(updateData)
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .select()
    .single();

  if (error) {
    console.error("Error updating compliance item:", error);
    return apiError("Failed to update compliance item", 500);
  }

  let currentVersion = null;
  if (content_html !== undefined || content_md !== undefined) {
    const { data: latestVersion } = await supabase
      .from("compliance_versions")
      .select("version_number")
      .eq("compliance_item_id", id)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    const contentHash = content_html
      ? Buffer.from(content_html).toString("base64").slice(0, 40)
      : content_md
        ? Buffer.from(content_md).toString("base64").slice(0, 40)
        : undefined;

    const { data: version, error: versionError } = await supabase
      .from("compliance_versions")
      .insert({
        compliance_item_id: id,
        version_number: (latestVersion?.version_number || 0) + 1,
        content_format: content_format || "html",
        content_html,
        content_md,
        created_by_user_id: auth.userId,
        change_summary: change_summary || "Updated policy content",
        content_hash: contentHash,
      })
      .select()
      .single();

    if (versionError) {
      console.error("Error creating compliance version:", versionError);
      return apiError("Policy metadata updated, but version history failed", 500);
    }
    currentVersion = version;
  }

  // Audit log
  await supabase.from("compliance_audit_log").insert({
    organization_id: data.organization_id,
    entity_type: "compliance_item",
    entity_id: id,
    action: "updated",
    actor_user_id: auth.userId,
    metadata: updateData,
  });

  return apiSuccess({
    item: {
      ...data,
      current_version: currentVersion,
    },
  });
});

export const PATCH = PUT;

/**
 * DELETE /api/compliance/items/[id]
 * Archive a compliance item (soft delete)
 */
export const DELETE = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const segments = req.nextUrl.pathname.split("/");
  const id = segments[segments.length - 1];

  const { data, error } = await supabase
    .from("compliance_items")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .select()
    .single();

  if (error) {
    console.error("Error archiving compliance item:", error);
    return apiError("Failed to archive compliance item", 500);
  }

  // Audit log
  await supabase.from("compliance_audit_log").insert({
    organization_id: data.organization_id,
    entity_type: "compliance_item",
    entity_id: id,
    action: "archived",
    actor_user_id: auth.userId,
  });

  return apiSuccess({ item: data });
});
