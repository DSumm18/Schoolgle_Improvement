import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/meetings/[id]
 * Get a single meeting with template, checklist, and minutes
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { error: "Missing organizationId" },
        { status: 400 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch meeting
    const { data: meeting, error } = await supabase
      .from("meetings")
      .select("*")
      .eq("id", id)
      .eq("organization_id", organizationId)
      .single();

    if (error || !meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    // Fetch template, checklist, and minutes in parallel
    const [templateRes, checklistRes, minutesRes] = await Promise.all([
      supabase
        .from("meeting_templates")
        .select("*")
        .eq("id", meeting.template_id)
        .single(),
      supabase
        .from("meeting_checklist_items")
        .select("*")
        .eq("meeting_id", id)
        .order("order_index"),
      supabase
        .from("meeting_minutes")
        .select("*")
        .eq("meeting_id", id)
        .maybeSingle(),
    ]);

    return NextResponse.json({
      meeting,
      template: templateRes.data,
      checklist_items: checklistRes.data || [],
      minutes: minutesRes.data,
    });
  } catch (error: any) {
    console.error("Meeting detail error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/meetings/[id]
 * Update meeting details
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { organizationId, ...updates } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: "Missing organizationId" },
        { status: 400 },
      );
    }

    // Only allow safe fields to be updated
    const allowedFields = [
      "attendee_name",
      "attendee_role",
      "purpose",
      "scheduled_at",
      "location",
      "status",
      "notes",
    ];
    const safeUpdates: Record<string, any> = {};
    for (const key of allowedFields) {
      if (key in updates) safeUpdates[key] = updates[key];
    }
    safeUpdates.updated_at = new Date().toISOString();

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: meeting, error } = await supabase
      .from("meetings")
      .update(safeUpdates)
      .eq("id", id)
      .eq("organization_id", organizationId)
      .select()
      .single();

    if (error) {
      console.error("Error updating meeting:", error);
      return NextResponse.json(
        { error: "Failed to update meeting" },
        { status: 500 },
      );
    }

    return NextResponse.json({ meeting });
  } catch (error: any) {
    console.error("Meeting update error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/meetings/[id]
 * Delete a meeting (only if scheduled or cancelled)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { error: "Missing organizationId" },
        { status: 400 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Only delete if not completed
    const { data: meeting } = await supabase
      .from("meetings")
      .select("status")
      .eq("id", id)
      .eq("organization_id", organizationId)
      .single();

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    if (meeting.status === "completed") {
      return NextResponse.json(
        { error: "Cannot delete a completed meeting. Cancel it instead." },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("meetings")
      .delete()
      .eq("id", id)
      .eq("organization_id", organizationId);

    if (error) {
      console.error("Error deleting meeting:", error);
      return NextResponse.json(
        { error: "Failed to delete meeting" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Meeting delete error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
