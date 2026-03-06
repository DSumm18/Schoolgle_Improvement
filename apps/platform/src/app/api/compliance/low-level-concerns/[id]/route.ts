import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/compliance/low-level-concerns/[id]
 * Get a single low-level concern
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: concern, error } = await supabase
      .from("compliance_low_level_concerns")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !concern) {
      return NextResponse.json(
        { error: "Low-level concern not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ concern });
  } catch (error: any) {
    console.error("Low-level concern GET error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/compliance/low-level-concerns/[id]
 * Update a low-level concern (e.g., DSL review, escalation to LADO)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { user_id, ...fields } = body;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    const allowedFields = [
      "subject_name",
      "subject_role",
      "reported_by",
      "date_of_concern",
      "date_reported",
      "description",
      "context",
      "category",
      "children_involved",
      "witnesses",
      "immediate_action_taken",
      "dsl_name",
      "dsl_review_date",
      "dsl_review_notes",
      "risk_level",
      "pattern_identified",
      "escalated_to_lado",
      "escalated_date",
      "outcome",
      "status",
      "notes",
    ];

    for (const field of allowedFields) {
      if (fields[field] !== undefined) {
        updateData[field] = fields[field];
      }
    }

    const { data, error } = await supabase
      .from("compliance_low_level_concerns")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating low-level concern:", error);
      return NextResponse.json(
        { error: "Failed to update low-level concern" },
        { status: 500 },
      );
    }

    // Determine action type for audit
    let action = "updated";
    if (fields.escalated_to_lado === true) {
      action = "escalated_to_lado";
    } else if (fields.dsl_review_date && fields.dsl_review_notes) {
      action = "dsl_reviewed";
    } else if (fields.status === "closed") {
      action = "closed";
    }

    // Audit log
    await supabase.from("compliance_audit_log").insert({
      organization_id: data.organization_id,
      entity_type: "low_level_concern",
      entity_id: id,
      action,
      actor_user_id: user_id || null,
      metadata: updateData,
    });

    return NextResponse.json({ concern: data });
  } catch (error: any) {
    console.error("Low-level concern PUT error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
