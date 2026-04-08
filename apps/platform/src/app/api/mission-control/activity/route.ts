import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isMCAuthError } from "@/lib/mission-control/auth";
import { createServiceRoleClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (isMCAuthError(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500);

    const supabase = createServiceRoleClient();
    let query = supabase
      .from("mc_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (category && category !== "all") {
      query = query.eq("event_category", category);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ entries: data || [] });
  } catch (error: unknown) {
    console.error("[MC Activity] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity log" },
      { status: 500 },
    );
  }
}
