import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/compliance/scr
 * List Single Central Record entries for an organization
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
      .from("compliance_scr_entries")
      .select("*")
      .eq("organization_id", organizationId)
      .order("updated_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching SCR entries:", error);
      return NextResponse.json(
        { error: "Failed to fetch SCR entries" },
        { status: 500 },
      );
    }

    return NextResponse.json({ entries: data || [] });
  } catch (error: any) {
    console.error("SCR API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/compliance/scr
 * Create a new Single Central Record entry
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      organizationId,
      staff_name,
      role,
      start_date,
      dbs_certificate_number,
      dbs_date,
      dbs_type,
      dbs_update_service,
      dbs_update_checked_date,
      identity_verified,
      identity_verified_date,
      qualifications_verified,
      qualifications_date,
      right_to_work_verified,
      right_to_work_date,
      prohibition_check,
      prohibition_check_date,
      section_128_check,
      section_128_date,
      overseas_check,
      overseas_check_date,
      references_obtained,
      references_date,
      medical_fitness,
      medical_fitness_date,
      safer_recruitment_trained,
      disqualification_declaration,
      notes,
      status,
      user_id,
    } = body;

    if (!organizationId || !staff_name || !role) {
      return NextResponse.json(
        { error: "Missing required fields: organizationId, staff_name, role" },
        { status: 400 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: entry, error } = await supabase
      .from("compliance_scr_entries")
      .insert({
        organization_id: organizationId,
        staff_name,
        role,
        start_date,
        dbs_certificate_number,
        dbs_date,
        dbs_type,
        dbs_update_service: dbs_update_service || false,
        dbs_update_checked_date,
        identity_verified: identity_verified || false,
        identity_verified_date,
        qualifications_verified: qualifications_verified || false,
        qualifications_date,
        right_to_work_verified: right_to_work_verified || false,
        right_to_work_date,
        prohibition_check: prohibition_check || false,
        prohibition_check_date,
        section_128_check: section_128_check || false,
        section_128_date,
        overseas_check: overseas_check || false,
        overseas_check_date,
        references_obtained: references_obtained || false,
        references_date,
        medical_fitness: medical_fitness || false,
        medical_fitness_date,
        safer_recruitment_trained: safer_recruitment_trained || false,
        disqualification_declaration: disqualification_declaration || false,
        notes,
        status: status || "active",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating SCR entry:", error);
      return NextResponse.json(
        { error: "Failed to create SCR entry" },
        { status: 500 },
      );
    }

    // Audit log
    await supabase.from("compliance_audit_log").insert({
      organization_id: organizationId,
      entity_type: "scr_entry",
      entity_id: entry.id,
      action: "created",
      actor_user_id: user_id || null,
      metadata: { staff_name, role, dbs_type },
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error: any) {
    console.error("SCR create error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
