import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/meetings/[id]/complete
 * Transition meeting to completed, calculate compliance score
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { organizationId } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: "Missing organizationId" },
        { status: 400 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate compliance score from checklist items
    const { data: items } = await supabase
      .from("meeting_checklist_items")
      .select("*")
      .eq("meeting_id", id);

    const total = items?.length || 0;
    const covered =
      items?.filter((i: any) => i.status === "green" || i.manually_ticked)
        .length || 0;
    const score = total > 0 ? Math.round((covered / total) * 100) : 0;

    const { data: meeting, error } = await supabase
      .from("meetings")
      .update({
        status: "completed",
        ended_at: new Date().toISOString(),
        compliance_score: score,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("organization_id", organizationId)
      .eq("status", "in_progress")
      .select()
      .single();

    if (error || !meeting) {
      return NextResponse.json(
        {
          error:
            "Meeting not found or cannot be completed (must be in_progress)",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ meeting, compliance_score: score });
  } catch (error: any) {
    console.error("Meeting complete error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
