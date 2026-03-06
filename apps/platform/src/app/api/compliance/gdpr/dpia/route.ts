import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/compliance/gdpr/dpia
 * List DPIAs for an organization
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

    // Get DPIA items
    const { data: items } = await supabase
      .from("compliance_items")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("type", "dpia")
      .neq("status", "archived")
      .order("updated_at", { ascending: false });

    if (!items || items.length === 0) {
      return NextResponse.json({ dpias: [] });
    }

    // Get DPIA records
    const { data: dpiaRecords } = await supabase
      .from("compliance_dpia_records")
      .select("*")
      .in(
        "compliance_item_id",
        items.map((i) => i.id),
      );

    const dpias = items.map((item) => ({
      ...item,
      dpia: dpiaRecords?.find((d) => d.compliance_item_id === item.id) || null,
    }));

    return NextResponse.json({ dpias });
  } catch (error: any) {
    console.error("DPIA API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/compliance/gdpr/dpia
 * Create a new DPIA (creates compliance_item + dpia record)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      organizationId,
      title,
      owner_user_id,
      created_by_user_id,
      processing_description,
      purpose,
      lawful_basis,
      data_categories,
      special_category_data,
      recipients,
      transfers_outside_uk,
      necessity_assessment,
      proportionality_assessment,
      risks,
      mitigations,
      consultation_required,
      consultation_notes,
      review_date,
    } = body;

    if (!organizationId || !title) {
      return NextResponse.json(
        { error: "Missing required fields: organizationId, title" },
        { status: 400 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create compliance item
    const { data: item, error: itemError } = await supabase
      .from("compliance_items")
      .insert({
        organization_id: organizationId,
        type: "dpia",
        title,
        status: "draft",
        owner_user_id,
        tags: [],
        confidentiality_level: "restricted",
      })
      .select()
      .single();

    if (itemError) {
      console.error("Error creating DPIA item:", itemError);
      return NextResponse.json(
        { error: "Failed to create DPIA" },
        { status: 500 },
      );
    }

    // Create DPIA record
    const { data: dpia, error: dpiaError } = await supabase
      .from("compliance_dpia_records")
      .insert({
        compliance_item_id: item.id,
        processing_description,
        purpose,
        lawful_basis,
        data_categories: data_categories || [],
        special_category_data: special_category_data || false,
        recipients,
        transfers_outside_uk: transfers_outside_uk || false,
        necessity_assessment,
        proportionality_assessment,
        risks: risks || [],
        mitigations: mitigations || [],
        consultation_required: consultation_required || false,
        consultation_notes,
        review_date,
      })
      .select()
      .single();

    if (dpiaError) {
      console.error("Error creating DPIA record:", dpiaError);
    }

    // Audit log
    await supabase.from("compliance_audit_log").insert({
      organization_id: organizationId,
      entity_type: "dpia",
      entity_id: item.id,
      action: "created",
      actor_user_id: created_by_user_id,
      metadata: { title },
    });

    return NextResponse.json({ item, dpia }, { status: 201 });
  } catch (error: any) {
    console.error("DPIA create error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
