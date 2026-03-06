import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/compliance/items/[id]/acknowledge
 * Get acknowledgement status for a compliance item
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from("compliance_acknowledgements")
      .select("*")
      .eq("compliance_item_id", id)
      .order("acknowledged_at", { ascending: false });

    if (error) {
      console.error("Error fetching acknowledgements:", error);
      return NextResponse.json(
        { error: "Failed to fetch acknowledgements" },
        { status: 500 },
      );
    }

    return NextResponse.json({ acknowledgements: data || [] });
  } catch (error: any) {
    console.error("Acknowledgements API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/compliance/items/[id]/acknowledge
 * Record a staff acknowledgement
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { user_id, user_name, version_id, method } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: "Missing required field: user_id" },
        { status: 400 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if already acknowledged this version
    const { data: existing } = await supabase
      .from("compliance_acknowledgements")
      .select("id")
      .eq("compliance_item_id", id)
      .eq("user_id", user_id)
      .eq("version_id", version_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Already acknowledged", acknowledgement: existing },
        { status: 409 },
      );
    }

    const { data: ack, error } = await supabase
      .from("compliance_acknowledgements")
      .insert({
        compliance_item_id: id,
        version_id,
        user_id,
        user_name,
        method: method || "web",
        acknowledged_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error recording acknowledgement:", error);
      return NextResponse.json(
        { error: "Failed to record acknowledgement" },
        { status: 500 },
      );
    }

    // Audit log
    const { data: item } = await supabase
      .from("compliance_items")
      .select("organization_id")
      .eq("id", id)
      .single();

    if (item) {
      await supabase.from("compliance_audit_log").insert({
        organization_id: item.organization_id,
        entity_type: "compliance_acknowledgement",
        entity_id: ack.id,
        action: "acknowledged",
        actor_user_id: user_id,
        actor_name: user_name,
        metadata: { compliance_item_id: id, version_id },
      });
    }

    return NextResponse.json({ acknowledgement: ack }, { status: 201 });
  } catch (error: any) {
    console.error("Acknowledgement create error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
