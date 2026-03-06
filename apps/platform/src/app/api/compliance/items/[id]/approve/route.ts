import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/compliance/items/[id]/approve
 * Get approvals for a compliance item
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from("compliance_approvals")
      .select("*")
      .eq("compliance_item_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching approvals:", error);
      return NextResponse.json(
        { error: "Failed to fetch approvals" },
        { status: 500 },
      );
    }

    return NextResponse.json({ approvals: data || [] });
  } catch (error: any) {
    console.error("Approvals API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/compliance/items/[id]/approve
 * Create or update an approval decision
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      version_id,
      stage,
      approver_user_id,
      approver_role,
      decision,
      decision_notes,
    } = body;

    if (!stage || !decision) {
      return NextResponse.json(
        { error: "Missing required fields: stage, decision" },
        { status: 400 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Upsert: if same user+stage+item exists, update it
    const { data: existing } = await supabase
      .from("compliance_approvals")
      .select("id")
      .eq("compliance_item_id", id)
      .eq("stage", stage)
      .eq("approver_user_id", approver_user_id)
      .maybeSingle();

    let approval;
    let error;

    if (existing) {
      const result = await supabase
        .from("compliance_approvals")
        .update({
          version_id,
          decision,
          decision_notes,
          decided_at: decision !== "pending" ? new Date().toISOString() : null,
        })
        .eq("id", existing.id)
        .select()
        .single();
      approval = result.data;
      error = result.error;
    } else {
      const result = await supabase
        .from("compliance_approvals")
        .insert({
          compliance_item_id: id,
          version_id,
          stage,
          approver_user_id,
          approver_role,
          decision,
          decision_notes,
          decided_at: decision !== "pending" ? new Date().toISOString() : null,
        })
        .select()
        .single();
      approval = result.data;
      error = result.error;
    }

    if (error) {
      console.error("Error saving approval:", error);
      return NextResponse.json(
        { error: "Failed to save approval" },
        { status: 500 },
      );
    }

    // Get org id for audit log
    const { data: item } = await supabase
      .from("compliance_items")
      .select("organization_id")
      .eq("id", id)
      .single();

    if (item) {
      await supabase.from("compliance_audit_log").insert({
        organization_id: item.organization_id,
        entity_type: "compliance_approval",
        entity_id: approval.id,
        action:
          decision === "approved"
            ? "approved"
            : decision === "rejected"
              ? "rejected"
              : "approval_pending",
        actor_user_id: approver_user_id,
        metadata: { compliance_item_id: id, stage, decision },
      });
    }

    return NextResponse.json({ approval }, { status: 201 });
  } catch (error: any) {
    console.error("Approval create error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
