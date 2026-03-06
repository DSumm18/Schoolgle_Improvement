import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/compliance/dpo-service
 * Fetch DPO service record for an organization
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { error: "Missing organizationId parameter" },
        { status: 400 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: dpoService, error } = await supabase
      .from("compliance_dpo_service")
      .select("*")
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (error) {
      console.error("DPO service fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch DPO service record" },
        { status: 500 },
      );
    }

    return NextResponse.json({ dpoService: dpoService || null });
  } catch (error: any) {
    console.error("DPO service API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/compliance/dpo-service
 * Create or update DPO service record for an organization
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      organizationId,
      service_tier,
      consultant_name,
      consultant_email,
      consultant_phone,
      contract_start,
      contract_end,
      annual_fee_pence,
      service_includes,
      sla_response_hours,
      ico_registration_number,
      actor_user_id,
    } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: "Missing required field: organizationId" },
        { status: 400 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if a record already exists for this organization
    const { data: existing } = await supabase
      .from("compliance_dpo_service")
      .select("id")
      .eq("organization_id", organizationId)
      .maybeSingle();

    const isUpdate = !!existing;

    const record = {
      organization_id: organizationId,
      service_tier,
      consultant_name,
      consultant_email,
      consultant_phone,
      contract_start,
      contract_end,
      annual_fee_pence,
      service_includes,
      sla_response_hours,
      ico_registration_number,
    };

    let dpoService;
    let error;

    if (isUpdate) {
      const result = await supabase
        .from("compliance_dpo_service")
        .update(record)
        .eq("organization_id", organizationId)
        .select()
        .single();
      dpoService = result.data;
      error = result.error;
    } else {
      const result = await supabase
        .from("compliance_dpo_service")
        .insert(record)
        .select()
        .single();
      dpoService = result.data;
      error = result.error;
    }

    if (error) {
      console.error("DPO service upsert error:", error);
      return NextResponse.json(
        { error: "Failed to save DPO service record" },
        { status: 500 },
      );
    }

    // Audit log
    await supabase.from("compliance_audit_log").insert({
      organization_id: organizationId,
      entity_type: "dpo_service",
      entity_id: dpoService.id,
      action: isUpdate ? "updated" : "created",
      actor_user_id: actor_user_id || null,
      metadata: {
        service_tier,
        consultant_name,
        ico_registration_number,
      },
    });

    return NextResponse.json({ dpoService }, { status: isUpdate ? 200 : 201 });
  } catch (error: any) {
    console.error("DPO service save error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
