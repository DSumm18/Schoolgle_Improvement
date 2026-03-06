import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/compliance/low-level-concerns
 * List low-level concerns for an organization
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");
    const status = searchParams.get("status");

    if (!organizationId) {
      return NextResponse.json(
        { error: "Missing organizationId parameter" },
        { status: 400 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from("compliance_low_level_concerns")
      .select("*")
      .eq("organization_id", organizationId)
      .order("updated_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching low-level concerns:", error);
      return NextResponse.json(
        { error: "Failed to fetch low-level concerns" },
        { status: 500 },
      );
    }

    return NextResponse.json({ concerns: data || [] });
  } catch (error: any) {
    console.error("Low-level concerns API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/compliance/low-level-concerns
 * Create a new low-level concern
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      organizationId,
      subject_name,
      subject_role,
      reported_by,
      date_of_concern,
      date_reported,
      description,
      context,
      category,
      children_involved,
      witnesses,
      immediate_action_taken,
      dsl_name,
      dsl_review_date,
      dsl_review_notes,
      risk_level,
      pattern_identified,
      escalated_to_lado,
      escalated_date,
      outcome,
      status,
      notes,
      user_id,
    } = body;

    if (!organizationId || !subject_name || !description) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: organizationId, subject_name, description",
        },
        { status: 400 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: concern, error } = await supabase
      .from("compliance_low_level_concerns")
      .insert({
        organization_id: organizationId,
        subject_name,
        subject_role,
        reported_by,
        date_of_concern:
          date_of_concern || new Date().toISOString().split("T")[0],
        date_reported: date_reported || new Date().toISOString().split("T")[0],
        description,
        context,
        category,
        children_involved: children_involved || [],
        witnesses: witnesses || [],
        immediate_action_taken,
        dsl_name,
        dsl_review_date,
        dsl_review_notes,
        risk_level: risk_level || "low",
        pattern_identified: pattern_identified || false,
        escalated_to_lado: escalated_to_lado || false,
        escalated_date,
        outcome,
        status: status || "open",
        notes,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating low-level concern:", error);
      return NextResponse.json(
        { error: "Failed to create low-level concern" },
        { status: 500 },
      );
    }

    // Audit log
    await supabase.from("compliance_audit_log").insert({
      organization_id: organizationId,
      entity_type: "low_level_concern",
      entity_id: concern.id,
      action: "created",
      actor_user_id: user_id || null,
      metadata: { subject_name, category, risk_level: risk_level || "low" },
    });

    return NextResponse.json({ concern }, { status: 201 });
  } catch (error: any) {
    console.error("Low-level concern create error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
