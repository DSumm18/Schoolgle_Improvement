import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Calculate deadline date: received + 20 working days
 * Skips weekends (Saturday/Sunday). Does not account for bank holidays.
 */
function addWorkingDays(startDate: string, days: number): string {
  const date = new Date(startDate);
  let added = 0;
  while (added < days) {
    date.setDate(date.getDate() + 1);
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      added++;
    }
  }
  return date.toISOString().split("T")[0];
}

/**
 * GET /api/compliance/foi
 * List FOI requests for an organization
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

    const { data, error } = await supabase
      .from("compliance_foi_requests")
      .select("*")
      .eq("organization_id", organizationId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching FOI requests:", error);
      return NextResponse.json(
        { error: "Failed to fetch FOI requests" },
        { status: 500 },
      );
    }

    return NextResponse.json({ requests: data || [] });
  } catch (error: any) {
    console.error("FOI API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/compliance/foi
 * Create a new FOI request (auto-calculates deadline as received + 20 working days)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      organizationId,
      requester_name,
      requester_email,
      requester_address,
      date_received,
      description,
      information_requested,
      assigned_to,
      status,
      exemptions_applied,
      response_summary,
      notes,
      user_id,
    } = body;

    if (!organizationId || !requester_name || !description) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: organizationId, requester_name, description",
        },
        { status: 400 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const received = date_received || new Date().toISOString().split("T")[0];
    const deadline_date = addWorkingDays(received, 20);

    const { data: request, error } = await supabase
      .from("compliance_foi_requests")
      .insert({
        organization_id: organizationId,
        requester_name,
        requester_email,
        requester_address,
        date_received: received,
        deadline_date,
        description,
        information_requested,
        assigned_to,
        status: status || "received",
        exemptions_applied: exemptions_applied || [],
        response_summary,
        notes,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating FOI request:", error);
      return NextResponse.json(
        { error: "Failed to create FOI request" },
        { status: 500 },
      );
    }

    // Audit log
    await supabase.from("compliance_audit_log").insert({
      organization_id: organizationId,
      entity_type: "foi_request",
      entity_id: request.id,
      action: "created",
      actor_user_id: user_id || null,
      metadata: { requester_name, deadline_date, description },
    });

    return NextResponse.json({ request }, { status: 201 });
  } catch (error: any) {
    console.error("FOI create error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
