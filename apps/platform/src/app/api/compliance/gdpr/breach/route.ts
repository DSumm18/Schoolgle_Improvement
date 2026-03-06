import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/compliance/gdpr/breach
 * List data breaches for an organization
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
      .eq("type", "breach")
      .neq("status", "archived")
      .order("updated_at", { ascending: false });

    if (!items || items.length === 0) {
      return NextResponse.json({ breaches: [] });
    }

    const { data: breachRecords } = await supabase
      .from("compliance_breach_records")
      .select("*")
      .in(
        "compliance_item_id",
        items.map((i) => i.id),
      );

    const breaches = items.map((item) => ({
      ...item,
      breach:
        breachRecords?.find((b) => b.compliance_item_id === item.id) || null,
    }));

    return NextResponse.json({ breaches });
  } catch (error: any) {
    console.error("Breach API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/compliance/gdpr/breach
 * Create a new data breach record
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      organizationId,
      title,
      owner_user_id,
      created_by_user_id,
      date_discovered,
      date_occurred,
      description,
      data_affected,
      individuals_affected,
      severity,
      ico_notified,
      ico_notification_date,
      ico_reference,
      individuals_notified,
      root_cause,
      actions_taken,
      preventive_measures,
      reported_by_user_id,
    } = body;

    if (!organizationId || !description) {
      return NextResponse.json(
        { error: "Missing required fields: organizationId, description" },
        { status: 400 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create compliance item
    const { data: item, error: itemError } = await supabase
      .from("compliance_items")
      .insert({
        organization_id: organizationId,
        type: "breach",
        title:
          title || `Data Breach - ${new Date().toISOString().split("T")[0]}`,
        status: "draft",
        owner_user_id,
        tags: [],
        confidentiality_level: "highly_restricted",
      })
      .select()
      .single();

    if (itemError) {
      console.error("Error creating breach item:", itemError);
      return NextResponse.json(
        { error: "Failed to create breach record" },
        { status: 500 },
      );
    }

    // Create breach record
    const { data: breach, error: breachError } = await supabase
      .from("compliance_breach_records")
      .insert({
        compliance_item_id: item.id,
        date_discovered:
          date_discovered || new Date().toISOString().split("T")[0],
        date_occurred,
        description,
        data_affected,
        individuals_affected,
        severity: severity || "medium",
        ico_notified: ico_notified || false,
        ico_notification_date,
        ico_reference,
        individuals_notified: individuals_notified || false,
        root_cause,
        actions_taken,
        preventive_measures,
        reported_by_user_id,
      })
      .select()
      .single();

    if (breachError) {
      console.error("Error creating breach record:", breachError);
    }

    // Audit log
    await supabase.from("compliance_audit_log").insert({
      organization_id: organizationId,
      entity_type: "breach",
      entity_id: item.id,
      action: "created",
      actor_user_id: created_by_user_id || reported_by_user_id,
      metadata: {
        severity,
        date_discovered:
          date_discovered || new Date().toISOString().split("T")[0],
      },
    });

    return NextResponse.json({ item, breach }, { status: 201 });
  } catch (error: any) {
    console.error("Breach create error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
