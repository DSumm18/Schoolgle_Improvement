// Ed Form Skills Approvals API
// Handle approval workflow for form RPA runs

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

/**
 * GET /api/ed/form-skills/approvals/[runId]
 * Get details of a run awaiting approval
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { runId } = await params;

    // Get the run with skill details
    const { data: run, error } = await supabase
      .from("ed_rpa_runs")
      .select(
        `
        *,
        skill:ed_rpa_skills(*)
      `,
      )
      .eq("id", runId)
      .single();

    if (error || !run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    // Check if user belongs to the school that triggered this run
    const { data: userOrg } = await supabase
      .from("user_organizations")
      .select("organization_id")
      .eq("user_id", user.id)
      .single();

    if (run.triggered_by_school !== userOrg?.organization_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(run);
  } catch (error) {
    console.error("[Form Skills Approvals API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/ed/form-skills/approvals/[runId]
 * Approve or reject a run
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { runId } = await params;
    const body = await request.json();
    const { decision, notes } = body; // decision: 'approved' | 'rejected' | 'changes_requested'

    if (
      !decision ||
      !["approved", "rejected", "changes_requested"].includes(decision)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid decision. Must be: approved, rejected, or changes_requested",
        },
        { status: 400 },
      );
    }

    // Approve the run
    const { data, error } = await supabase.rpc("approve_rpa_run", {
      p_run_id: runId,
      p_approver_id: user.id,
      p_decision: decision,
      p_notes: notes,
    });

    if (error || !data) {
      console.error("[Form Skills Approvals API] Approval error:", error);
      return NextResponse.json(
        { error: error?.message || "Approval failed" },
        { status: 500 },
      );
    }

    // If approved, execute the automation
    if (decision === "approved") {
      // Get the run details
      const { data: run } = await supabase
        .from("ed_rpa_runs")
        .select("*, skill:ed_rpa_skills(*)")
        .eq("id", runId)
        .single();

      if (run) {
        // Execute the automation (in a real implementation, this would trigger Playwright/Puppeteer)
        // For now, we'll mark it as completed
        await supabase
          .from("ed_rpa_runs")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            result: { success: true, message: "Approved by user" },
          })
          .eq("id", runId);
      }
    }

    return NextResponse.json({
      success: true,
      decision,
      message: `Run ${decision} successfully`,
    });
  } catch (error) {
    console.error("[Form Skills Approvals API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
