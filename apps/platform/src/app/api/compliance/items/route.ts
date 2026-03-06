import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/compliance/items
 * List compliance items for an organization
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");
    const type = searchParams.get("type");
    const status = searchParams.get("status");

    if (!organizationId) {
      return NextResponse.json(
        { error: "Missing organizationId parameter" },
        { status: 400 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from("compliance_items")
      .select(
        "*, current_version:compliance_versions(*), review_schedule:compliance_review_schedule(*)",
      )
      .eq("organization_id", organizationId)
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
      return NextResponse.json(
        { error: "Failed to fetch compliance items" },
        { status: 500 },
      );
    }

    return NextResponse.json({ items: data || [] });
  } catch (error: any) {
    console.error("Compliance items API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/compliance/items
 * Create a new compliance item
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      organizationId,
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
      created_by_user_id,
      review_frequency,
      custom_days,
      reminder_days,
    } = body;

    if (!organizationId || !type || !title) {
      return NextResponse.json(
        { error: "Missing required fields: organizationId, type, title" },
        { status: 400 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create the compliance item
    const { data: item, error: itemError } = await supabase
      .from("compliance_items")
      .insert({
        organization_id: organizationId,
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
      return NextResponse.json(
        { error: "Failed to create compliance item" },
        { status: 500 },
      );
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
        created_by_user_id,
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
      organization_id: organizationId,
      entity_type: "compliance_item",
      entity_id: item.id,
      action: "created",
      actor_user_id: created_by_user_id,
      metadata: { type, title },
    });

    return NextResponse.json(
      {
        item: { ...item, current_version: version, review_schedule: schedule },
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Compliance item create error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
