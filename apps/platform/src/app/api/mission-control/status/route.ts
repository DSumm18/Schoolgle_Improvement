import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isMCAuthError } from "@/lib/mission-control/auth";
import { createServiceRoleClient } from "@/lib/supabase-server";
import type { MCDashboardStatus, MCActivityFeedItem } from "@/lib/mission-control/types";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (isMCAuthError(auth)) return auth;

  try {
    const supabase = createServiceRoleClient();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    // Fetch stats in parallel
    const [approvalsResult, skillsResult, activityResult] = await Promise.all([
      // Pending approvals count
      supabase
        .from("mc_approval_queue")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      // Skills run today
      supabase
        .from("mc_skill_executions")
        .select("id", { count: "exact", head: true })
        .gte("created_at", todayStart),
      // Recent activity for feed
      supabase
        .from("mc_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    const status: MCDashboardStatus = {
      jarvis: {
        lastPollTime: now.toISOString(),
        activeAgents: 0,
        tasksInQueue: 0,
      },
      pendingApprovals: approvalsResult.count || 0,
      skillsRunToday: skillsResult.count || 0,
      buildHealth: {
        lastBuildStatus: "unknown",
        testCount: 0,
        vectorScore: null,
      },
    };

    // Map audit log to activity feed items
    const activity: MCActivityFeedItem[] = (activityResult.data || []).map((entry) => ({
      id: entry.id,
      timestamp: entry.created_at,
      type: entry.event_category === "skill"
        ? "skill_execution"
        : entry.event_category === "approval"
          ? "approval"
          : entry.event_category === "security"
            ? "security"
            : entry.event_category === "error"
              ? "error"
              : "system",
      icon: entry.event_category,
      description: entry.description,
      status: (entry.metadata as Record<string, unknown>)?.status as string || entry.event_category,
      metadata: entry.metadata as Record<string, unknown>,
    }));

    return NextResponse.json({ status, activity });
  } catch (error: unknown) {
    console.error("[MC Status] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard status" },
      { status: 500 },
    );
  }
}
