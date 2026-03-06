import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/compliance/items/[id]
 * Get a single compliance item with version, schedule, and approvals
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: item, error } = await supabase
      .from("compliance_items")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !item) {
      return NextResponse.json(
        { error: "Compliance item not found" },
        { status: 404 },
      );
    }

    // Fetch latest version
    const { data: version } = await supabase
      .from("compliance_versions")
      .select("*")
      .eq("compliance_item_id", id)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();

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

    return NextResponse.json({
      item: {
        ...item,
        current_version: version,
        review_schedule: schedule,
      },
      approvals: approvals || [],
    });
  } catch (error: any) {
    console.error("Compliance item GET error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/compliance/items/[id]
 * Update compliance item fields
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      title,
      status,
      owner_user_id,
      category,
      tags,
      confidentiality_level,
      metadata,
      actor_user_id,
    } = body;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
      .select()
      .single();

    if (error) {
      console.error("Error updating compliance item:", error);
      return NextResponse.json(
        { error: "Failed to update compliance item" },
        { status: 500 },
      );
    }

    // Audit log
    await supabase.from("compliance_audit_log").insert({
      organization_id: data.organization_id,
      entity_type: "compliance_item",
      entity_id: id,
      action: "updated",
      actor_user_id,
      metadata: updateData,
    });

    return NextResponse.json({ item: data });
  } catch (error: any) {
    console.error("Compliance item PUT error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/compliance/items/[id]
 * Archive a compliance item (soft delete)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const actorUserId = searchParams.get("actorUserId");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from("compliance_items")
      .update({ status: "archived", updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error archiving compliance item:", error);
      return NextResponse.json(
        { error: "Failed to archive compliance item" },
        { status: 500 },
      );
    }

    // Audit log
    await supabase.from("compliance_audit_log").insert({
      organization_id: data.organization_id,
      entity_type: "compliance_item",
      entity_id: id,
      action: "archived",
      actor_user_id: actorUserId,
    });

    return NextResponse.json({ item: data });
  } catch (error: any) {
    console.error("Compliance item DELETE error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
