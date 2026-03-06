import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/compliance/gdpr/sar
 * List Subject Access Requests for an organization
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

    const { data: items } = await supabase
      .from("compliance_items")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("type", "sar")
      .neq("status", "archived")
      .order("updated_at", { ascending: false });

    if (!items || items.length === 0) {
      return NextResponse.json({ sars: [] });
    }

    const { data: sarRecords } = await supabase
      .from("compliance_sar_records")
      .select("*")
      .in(
        "compliance_item_id",
        items.map((i) => i.id),
      );

    const sars = items.map((item) => ({
      ...item,
      sar: sarRecords?.find((s) => s.compliance_item_id === item.id) || null,
    }));

    return NextResponse.json({ sars });
  } catch (error: any) {
    console.error("SAR API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/compliance/gdpr/sar
 * Create a new Subject Access Request
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      organizationId,
      title,
      owner_user_id,
      created_by_user_id,
      requester_name,
      requester_relationship,
      date_received,
      identity_verified,
      identity_verified_date,
      deadline_date,
      notes,
    } = body;

    if (!organizationId || !requester_name) {
      return NextResponse.json(
        { error: "Missing required fields: organizationId, requester_name" },
        { status: 400 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const received = date_received || new Date().toISOString().split("T")[0];
    const deadline =
      deadline_date ||
      (() => {
        const d = new Date(received);
        d.setDate(d.getDate() + 30); // ICO: one calendar month
        return d.toISOString().split("T")[0];
      })();

    // Create compliance item
    const { data: item, error: itemError } = await supabase
      .from("compliance_items")
      .insert({
        organization_id: organizationId,
        type: "sar",
        title: title || `SAR - ${requester_name}`,
        status: "draft",
        owner_user_id,
        tags: [],
        confidentiality_level: "highly_restricted",
      })
      .select()
      .single();

    if (itemError) {
      console.error("Error creating SAR item:", itemError);
      return NextResponse.json(
        { error: "Failed to create SAR" },
        { status: 500 },
      );
    }

    // Create SAR record
    const { data: sar, error: sarError } = await supabase
      .from("compliance_sar_records")
      .insert({
        compliance_item_id: item.id,
        requester_name,
        requester_relationship,
        date_received: received,
        identity_verified: identity_verified || false,
        identity_verified_date,
        deadline_date: deadline,
        extension_applied: false,
        individuals_notified: false,
        notes,
      })
      .select()
      .single();

    if (sarError) {
      console.error("Error creating SAR record:", sarError);
    }

    // Audit log
    await supabase.from("compliance_audit_log").insert({
      organization_id: organizationId,
      entity_type: "sar",
      entity_id: item.id,
      action: "created",
      actor_user_id: created_by_user_id,
      metadata: { requester_name, deadline_date: deadline },
    });

    return NextResponse.json({ item, sar }, { status: 201 });
  } catch (error: any) {
    console.error("SAR create error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
