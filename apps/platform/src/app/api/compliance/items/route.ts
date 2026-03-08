import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * GET /api/compliance/items
 * List compliance items for an organization
 */
export const GET = protectedRoute(async (auth, request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const status = searchParams.get("status");

  const supabase = createServiceRoleClient();

  let query = supabase
    .from("compliance_items")
    .select(
      "*, current_version:compliance_versions(*), review_schedule:compliance_review_schedule(*)",
    )
    .eq("organization_id", auth.organizationId)
    .order("updated_at", { ascending: false });

  if (type) {
    query = query.eq("type", type);
  }
  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching compliance items:", error);
    return apiError("Failed to fetch compliance items", 500);
  }

  return apiSuccess({ items: data || [] });
});

/**
 * POST /api/compliance/items
 * Create a new compliance item
 */
export const POST = protectedRoute(
  async (auth, request: NextRequest) => {
    const body = await request.json();
    const {
      type,
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
      review_frequency,
      custom_days,
      reminder_days,
    } = body;

    if (!type || !title) {
      return apiError("Missing required fields: type, title", 400);
    }

    const supabase = createServiceRoleClient();

    // Create the compliance item
    const { data: item, error: itemError } = await supabase
      .from("compliance_items")
      .insert({
        organization_id: auth.organizationId,
        type,
        title,
        status: status || "draft",
        owner_user_id,
        category,
        tags: tags || [],
        confidentiality_level: confidentiality_level || "public_internal",
        metadata,
      })
      .select()
      .single();

    if (itemError) {
      console.error("Error creating compliance item:", itemError);
      return apiError("Failed to create compliance item", 500);
    }

    // Create first version
    const contentHash = content_html
      ? Buffer.from(content_html).toString("base64").slice(0, 40)
      : undefined;

    const { data: version, error: versionError } = await supabase
      .from("compliance_versions")
      .insert({
        compliance_item_id: item.id,
        version_number: 1,
        content_format: content_format || "html",
        content_html,
        content_md,
        created_by_user_id: auth.userId,
        change_summary: "Initial version",
        content_hash: contentHash,
      })
      .select()
      .single();

    if (versionError) {
      console.error("Error creating version:", versionError);
    }

    // Create review schedule if policy
    let schedule = null;
    if (type === "policy" && review_frequency) {
      const nextReview = new Date();
      const days =
        review_frequency === "annual"
          ? 365
          : review_frequency === "termly"
            ? 120
            : review_frequency === "quarterly"
              ? 90
              : custom_days || 365;
      nextReview.setDate(nextReview.getDate() + days);

      const { data: sched, error: schedError } = await supabase
        .from("compliance_review_schedule")
        .insert({
          compliance_item_id: item.id,
          review_frequency,
          custom_days,
          next_review_date: nextReview.toISOString().split("T")[0],
          reminder_days: reminder_days || [30, 7],
        })
        .select()
        .single();

      if (schedError) {
        console.error("Error creating review schedule:", schedError);
      }
      schedule = sched;
    }

    // Audit log
    await supabase.from("compliance_audit_log").insert({
      organization_id: auth.organizationId,
      entity_type: "compliance_item",
      entity_id: item.id,
      action: "created",
      actor_user_id: auth.userId,
      metadata: { type, title },
    });

    return apiSuccess(
      {
        item: { ...item, current_version: version, review_schedule: schedule },
      },
      201,
    );
  },
  { requiredRole: "slt" },
);
