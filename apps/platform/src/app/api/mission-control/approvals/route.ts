import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isMCAuthError } from "@/lib/mission-control/auth";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { logApprovalDecision } from "@/lib/mission-control/audit";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (isMCAuthError(auth)) return auth;

  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("mc_approval_queue")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({ items: data || [] });
  } catch (error: unknown) {
    console.error("[MC Approvals] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch approvals" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, { minRole: "admin" });
  if (isMCAuthError(auth)) return auth;

  try {
    const body = await request.json();
    const { id, decision, notes } = body;

    if (!id || !decision || !["approved", "rejected"].includes(decision)) {
      return NextResponse.json(
        { error: "id and decision (approved|rejected) are required" },
        { status: 400 },
      );
    }

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from("mc_approval_queue")
      .update({
        status: decision,
        decided_by: auth.email,
        decided_at: new Date().toISOString(),
        decision_notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("status", "pending")
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json(
        { error: "Approval item not found or already decided" },
        { status: 404 },
      );
    }

    // Audit log
    await logApprovalDecision(id, data.title, decision, auth.email);

    return NextResponse.json({ item: data });
  } catch (error: unknown) {
    console.error("[MC Approvals] Decision error:", error);
    return NextResponse.json(
      { error: "Failed to process approval decision" },
      { status: 500 },
    );
  }
}
