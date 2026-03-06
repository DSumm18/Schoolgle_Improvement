import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/meetings
 * List meetings for an organization
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");
    const status = searchParams.get("status");
    const templateId = searchParams.get("templateId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!organizationId) {
      return NextResponse.json(
        { error: "Missing organizationId" },
        { status: 400 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from("meetings")
      .select("*, meeting_templates(id, name, category)")
      .eq("organization_id", organizationId)
      .order("scheduled_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq("status", status);
    if (templateId) query = query.eq("template_id", templateId);

    const { data: meetings, error } = await query;

    if (error) {
      console.error("Error fetching meetings:", error);
      return NextResponse.json(
        { error: "Failed to fetch meetings" },
        { status: 500 },
      );
    }

    // Summary counts
    const all = meetings || [];
    const scheduled = all.filter((m) => m.status === "scheduled").length;
    const in_progress = all.filter((m) => m.status === "in_progress").length;
    const completed = all.filter((m) => m.status === "completed").length;

    return NextResponse.json({
      meetings: all,
      counts: { total: all.length, scheduled, in_progress, completed },
      limit,
      offset,
    });
  } catch (error: any) {
    console.error("Meetings API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/meetings
 * Create a new meeting from a template
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      organizationId,
      leaderId,
      template_id,
      attendee_name,
      attendee_role,
      purpose,
      scheduled_at,
      location,
    } = body;

    if (
      !organizationId ||
      !leaderId ||
      !template_id ||
      !attendee_name ||
      !scheduled_at
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: organizationId, leaderId, template_id, attendee_name, scheduled_at",
        },
        { status: 400 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch template to copy compliance items
    const { data: template, error: templateError } = await supabase
      .from("meeting_templates")
      .select("*")
      .eq("id", template_id)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 },
      );
    }

    const meetingId = uuidv4();

    // Create meeting
    const { data: meeting, error: meetingError } = await supabase
      .from("meetings")
      .insert({
        id: meetingId,
        template_id,
        organization_id: organizationId,
        leader_id: leaderId,
        attendee_name,
        attendee_role: attendee_role || null,
        purpose: purpose || null,
        scheduled_at,
        location: location || null,
        status: "scheduled",
        notes: [],
      })
      .select()
      .single();

    if (meetingError) {
      console.error("Error creating meeting:", meetingError);
      return NextResponse.json(
        { error: "Failed to create meeting" },
        { status: 500 },
      );
    }

    // Copy compliance items from template to checklist
    const complianceItems = (template.compliance_items || []) as Array<{
      phrase: string;
      category: string;
      is_critical: boolean;
      order_index: number;
    }>;

    if (complianceItems.length > 0) {
      const checklistRows = complianceItems.map((item) => ({
        id: uuidv4(),
        meeting_id: meetingId,
        phrase: item.phrase,
        category: item.category || null,
        is_critical: item.is_critical || false,
        status: "red",
        manually_ticked: false,
        order_index: item.order_index,
      }));

      const { error: checklistError } = await supabase
        .from("meeting_checklist_items")
        .insert(checklistRows);

      if (checklistError) {
        console.error("Error creating checklist items:", checklistError);
      }
    }

    return NextResponse.json(
      { meeting, template_name: template.name },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Meeting creation error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
