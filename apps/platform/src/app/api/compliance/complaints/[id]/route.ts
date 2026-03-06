import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/compliance/complaints/[id]
 * Get a single complaint
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: complaint, error } = await supabase
      .from("compliance_complaints")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !complaint) {
      return NextResponse.json(
        { error: "Complaint not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ complaint });
  } catch (error: any) {
    console.error("Complaint GET error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/compliance/complaints/[id]
 * Update a complaint (including stage progression)
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
      "complainant_name",
      "complainant_relationship",
      "complainant_contact",
      "date_received",
      "summary",
      "category",
      "stage",
      "status",
      "assigned_to",
      "deadline_date",
      "desired_outcome",
      "resolution_summary",
      "resolution_date",
      "outcome",
      "lessons_learned",
      "notes",
    ];

    for (const field of allowedFields) {
      if (fields[field] !== undefined) {
        updateData[field] = fields[field];
      }
    }

    const { data, error } = await supabase
      .from("compliance_complaints")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating complaint:", error);
      return NextResponse.json(
        { error: "Failed to update complaint" },
        { status: 500 },
      );
    }

    // Audit log
    await supabase.from("compliance_audit_log").insert({
      organization_id: data.organization_id,
      entity_type: "complaint",
      entity_id: id,
      action: "updated",
      actor_user_id: user_id || null,
      metadata: updateData,
    });

    return NextResponse.json({ complaint: data });
  } catch (error: any) {
    console.error("Complaint PUT error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
