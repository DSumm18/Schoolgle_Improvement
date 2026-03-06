import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/compliance/consent
 * List consent records for an organization
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");
    const consent_type = searchParams.get("consent_type");
    const academic_year = searchParams.get("academic_year");

    if (!organizationId) {
      return NextResponse.json(
        { error: "Missing organizationId parameter" },
        { status: 400 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from("compliance_consent_records")
      .select("*")
      .eq("organization_id", organizationId)
      .order("updated_at", { ascending: false });

    if (consent_type) {
      query = query.eq("consent_type", consent_type);
    }
    if (academic_year) {
      query = query.eq("academic_year", academic_year);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching consent records:", error);
      return NextResponse.json(
        { error: "Failed to fetch consent records" },
        { status: 500 },
      );
    }

    return NextResponse.json({ records: data || [] });
  } catch (error: any) {
    console.error("Consent API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/compliance/consent
 * Create a new consent record
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      organizationId,
      pupil_name,
      pupil_id,
      parent_guardian_name,
      parent_guardian_email,
      consent_type,
      consent_given,
      consent_date,
      academic_year,
      expiry_date,
      notes,
      user_id,
    } = body;

    if (!organizationId || !pupil_name || !consent_type) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: organizationId, pupil_name, consent_type",
        },
        { status: 400 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: record, error } = await supabase
      .from("compliance_consent_records")
      .insert({
        organization_id: organizationId,
        pupil_name,
        pupil_id,
        parent_guardian_name,
        parent_guardian_email,
        consent_type,
        consent_given: consent_given ?? true,
        consent_date: consent_date || new Date().toISOString().split("T")[0],
        academic_year,
        expiry_date,
        withdrawn_date: null,
        notes,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating consent record:", error);
      return NextResponse.json(
        { error: "Failed to create consent record" },
        { status: 500 },
      );
    }

    // Audit log
    await supabase.from("compliance_audit_log").insert({
      organization_id: organizationId,
      entity_type: "consent_record",
      entity_id: record.id,
      action: "created",
      actor_user_id: user_id || null,
      metadata: {
        pupil_name,
        consent_type,
        consent_given: consent_given ?? true,
      },
    });

    return NextResponse.json({ record }, { status: 201 });
  } catch (error: any) {
    console.error("Consent create error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/compliance/consent
 * Update a consent record (e.g., withdraw consent by setting withdrawn_date)
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, user_id, ...fields } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    const allowedFields = [
      "pupil_name",
      "pupil_id",
      "parent_guardian_name",
      "parent_guardian_email",
      "consent_type",
      "consent_given",
      "consent_date",
      "academic_year",
      "expiry_date",
      "withdrawn_date",
      "notes",
    ];

    for (const field of allowedFields) {
      if (fields[field] !== undefined) {
        updateData[field] = fields[field];
      }
    }

    const { data, error } = await supabase
      .from("compliance_consent_records")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating consent record:", error);
      return NextResponse.json(
        { error: "Failed to update consent record" },
        { status: 500 },
      );
    }

    // Audit log
    const action = fields.withdrawn_date ? "withdrawn" : "updated";
    await supabase.from("compliance_audit_log").insert({
      organization_id: data.organization_id,
      entity_type: "consent_record",
      entity_id: id,
      action,
      actor_user_id: user_id || null,
      metadata: updateData,
    });

    return NextResponse.json({ record: data });
  } catch (error: any) {
    console.error("Consent PUT error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
