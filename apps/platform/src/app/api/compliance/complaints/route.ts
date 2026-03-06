import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Generate a complaint reference number: COMP-YYYY-NNN
 */
async function generateReferenceNumber(
  supabase: ReturnType<typeof createClient>,
  organizationId: string,
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `COMP-${year}-`;

  const { data } = await supabase
    .from("compliance_complaints")
    .select("reference_number")
    .eq("organization_id", organizationId)
    .like("reference_number", `${prefix}%`)
    .order("reference_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  let nextNum = 1;
  if (data?.reference_number) {
    const lastNum = parseInt(data.reference_number.split("-")[2], 10);
    if (!isNaN(lastNum)) {
      nextNum = lastNum + 1;
    }
  }

  return `${prefix}${String(nextNum).padStart(3, "0")}`;
}

/**
 * GET /api/compliance/complaints
 * List complaints for an organization
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");
    const status = searchParams.get("status");
    const stage = searchParams.get("stage");

    if (!organizationId) {
      return NextResponse.json(
        { error: "Missing organizationId parameter" },
        { status: 400 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from("compliance_complaints")
      .select("*")
      .eq("organization_id", organizationId)
      .order("updated_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }
    if (stage) {
      query = query.eq("current_stage", stage);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching complaints:", error);
      return NextResponse.json(
        { error: "Failed to fetch complaints" },
        { status: 500 },
      );
    }

    return NextResponse.json({ complaints: data || [] });
  } catch (error: any) {
    console.error("Complaints API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/compliance/complaints
 * Create a new complaint (auto-generates reference_number as COMP-YYYY-NNN)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      organizationId,
      complainant_name,
      complainant_relationship,
      date_received,
      nature_of_complaint,
      category,
      current_stage,
      notes,
      user_id,
    } = body;

    if (!organizationId || !complainant_name || !nature_of_complaint) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: organizationId, complainant_name, nature_of_complaint",
        },
        { status: 400 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const reference_number = await generateReferenceNumber(
      supabase,
      organizationId,
    );

    const received = date_received || new Date().toISOString().split("T")[0];

    const { data: complaint, error } = await supabase
      .from("compliance_complaints")
      .insert({
        organization_id: organizationId,
        reference_number,
        complainant_name,
        complainant_relationship,
        date_received: received,
        nature_of_complaint,
        category,
        current_stage: current_stage || "stage_1",
        status: "open",
        notes,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating complaint:", error);
      return NextResponse.json(
        { error: "Failed to create complaint" },
        { status: 500 },
      );
    }

    // Audit log
    await supabase.from("compliance_audit_log").insert({
      organization_id: organizationId,
      entity_type: "complaint",
      entity_id: complaint.id,
      action: "created",
      actor_user_id: user_id || null,
      metadata: {
        reference_number,
        complainant_name,
        current_stage: current_stage || "stage_1",
      },
    });

    return NextResponse.json({ complaint }, { status: 201 });
  } catch (error: any) {
    console.error("Complaint create error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
