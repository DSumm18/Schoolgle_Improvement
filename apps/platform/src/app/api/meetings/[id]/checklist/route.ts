import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * PATCH /api/meetings/[id]/checklist
 * Update checklist items (tick/untick)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { organizationId, items } = body as {
      organizationId: string;
      items: Array<{
        id: string;
        manually_ticked: boolean;
      }>;
    };

    if (!organizationId || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "Missing required fields: organizationId, items (array)" },
        { status: 400 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify meeting belongs to org
    const { data: meeting } = await supabase
      .from("meetings")
      .select("id")
      .eq("id", id)
      .eq("organization_id", organizationId)
      .single();

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    // Update each item
    const results = await Promise.all(
      items.map(async (item) => {
        const status = item.manually_ticked ? "green" : "red";
        const { error } = await supabase
          .from("meeting_checklist_items")
          .update({
            manually_ticked: item.manually_ticked,
            status,
          })
          .eq("id", item.id)
          .eq("meeting_id", id);

        return { id: item.id, error };
      }),
    );

    const failed = results.filter((r) => r.error);

    return NextResponse.json({
      updated: results.length - failed.length,
      failed: failed.length,
    });
  } catch (error: any) {
    console.error("Checklist update error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
