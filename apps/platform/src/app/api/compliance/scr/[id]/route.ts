import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/compliance/scr/[id]
 * Get a single SCR entry
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: entry, error } = await supabase
      .from("compliance_scr_entries")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !entry) {
      return NextResponse.json(
        { error: "SCR entry not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ entry });
  } catch (error: any) {
    console.error("SCR entry GET error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/compliance/scr/[id]
 * Update an SCR entry
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
      "staff_name",
      "role",
      "start_date",
      "dbs_certificate_number",
      "dbs_date",
      "dbs_type",
      "dbs_update_service",
      "dbs_update_service_checked_date",
      "barred_list_checked",
      "barred_list_checked_date",
      "identity_verified",
      "identity_verified_date",
      "qualifications_verified",
      "qualifications_verified_date",
      "right_to_work_verified",
      "right_to_work_verified_date",
      "prohibition_check",
      "prohibition_check_date",
      "section_128_check",
      "section_128_check_date",
      "overseas_check",
      "overseas_check_date",
      "references_received",
      "references_received_date",
      "medical_clearance",
      "medical_clearance_date",
      "safeguarding_training_date",
      "safeguarding_training_level",
      "notes",
      "status",
    ];

    for (const field of allowedFields) {
      if (fields[field] !== undefined) {
        updateData[field] = fields[field];
      }
    }

    const { data, error } = await supabase
      .from("compliance_scr_entries")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating SCR entry:", error);
      return NextResponse.json(
        { error: "Failed to update SCR entry" },
        { status: 500 },
      );
    }

    // Audit log
    await supabase.from("compliance_audit_log").insert({
      organization_id: data.organization_id,
      entity_type: "scr_entry",
      entity_id: id,
      action: "updated",
      actor_user_id: user_id || null,
      metadata: updateData,
    });

    return NextResponse.json({ entry: data });
  } catch (error: any) {
    console.error("SCR entry PUT error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/compliance/scr/[id]
 * Soft delete an SCR entry by setting status to 'leaver'
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
      .from("compliance_scr_entries")
      .update({ status: "leaver", updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error archiving SCR entry:", error);
      return NextResponse.json(
        { error: "Failed to archive SCR entry" },
        { status: 500 },
      );
    }

    // Audit log
    await supabase.from("compliance_audit_log").insert({
      organization_id: data.organization_id,
      entity_type: "scr_entry",
      entity_id: id,
      action: "archived",
      actor_user_id: actorUserId,
      metadata: { status: "leaver" },
    });

    return NextResponse.json({ entry: data });
  } catch (error: any) {
    console.error("SCR entry DELETE error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
