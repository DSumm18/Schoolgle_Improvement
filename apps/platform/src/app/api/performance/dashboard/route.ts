import { protectedRoute, apiSuccess } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

// ─── Demo Dashboard Stats ────────────────────────────────────────────

const DEMO_DASHBOARD = {
  cycle: {
    id: "demo-cycle-2025",
    name: "2025-26 Appraisal Cycle",
    academic_year: "2025-26",
    status: "active",
    objectives_due: "2025-10-31",
    mid_year_due: "2026-02-14",
    end_year_due: "2026-07-18",
    pay_review_due: "2026-09-01",
  },
  total_staff: 12,
  stages: {
    not_started: 0,
    objectives_set: 2,
    mid_year_review: 5,
    end_year_review: 3,
    pay_recommendation: 3,
    completed: 0,
  },
  percentages: {
    objectives_set: 100,
    mid_year_complete: 83,
    end_year_complete: 25,
    pay_recommendations_submitted: 25,
  },
  by_role_type: {
    teacher: {
      total: 7,
      objectives_set: 7,
      mid_year_complete: 5,
      end_year_complete: 1,
    },
    leader: {
      total: 3,
      objectives_set: 3,
      mid_year_complete: 3,
      end_year_complete: 1,
    },
    support: {
      total: 2,
      objectives_set: 2,
      mid_year_complete: 2,
      end_year_complete: 1,
    },
  },
  ect_count: 2,
  pending_pay_decisions: {
    progression: 1,
    ups_threshold: 1,
    increment: 1,
    total: 3,
    pending_headteacher: 2,
    pending_governors: 1,
  },
  observations_this_cycle: 12,
  cpd_hours_logged: 47,
  demo: true,
};

/**
 * GET /api/performance/dashboard
 * Return overview stats for the performance management module
 */
export const GET = protectedRoute(async (auth) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();

  // Get active cycle
  const { data: cycles } = await supabase
    .from("appraisal_cycles")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1);

  const activeCycle = cycles?.[0];

  if (!activeCycle) {
    return apiSuccess(DEMO_DASHBOARD);
  }

  // Get all appraisals for active cycle
  const { data: appraisals } = await supabase
    .from("staff_appraisals")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("cycle_id", activeCycle.id);

  const all = appraisals || [];
  const total = all.length;

  if (total === 0) {
    return apiSuccess(DEMO_DASHBOARD);
  }

  // Count by status
  const stages: Record<string, number> = {
    not_started: 0,
    objectives_set: 0,
    mid_year_review: 0,
    end_year_review: 0,
    pay_recommendation: 0,
    completed: 0,
  };
  for (const a of all) {
    if (stages[a.status] !== undefined) stages[a.status]++;
  }

  // Percentages
  const objectivesSet = total - stages.not_started;
  const midYearComplete = all.filter(
    (a: any) => a.mid_year_review?.completed,
  ).length;
  const endYearComplete = all.filter(
    (a: any) => a.end_year_review?.completed,
  ).length;
  const payRecsSubmitted = all.filter((a: any) => a.pay_recommendation).length;

  // By role type
  const byRole: Record<string, any> = {};
  for (const rt of ["teacher", "leader", "support"]) {
    const group = all.filter((a: any) => a.role_type === rt);
    byRole[rt] = {
      total: group.length,
      objectives_set: group.filter((a: any) => a.status !== "not_started")
        .length,
      mid_year_complete: group.filter((a: any) => a.mid_year_review?.completed)
        .length,
      end_year_complete: group.filter((a: any) => a.end_year_review?.completed)
        .length,
    };
  }

  // ECTs
  const ectCount = all.filter((a: any) => a.is_ect).length;

  // Pay decisions
  const payRecs = all
    .filter((a: any) => a.pay_recommendation)
    .map((a: any) => a.pay_recommendation);
  const pendingPay: Record<string, number> = {
    progression: 0,
    ups_threshold: 0,
    increment: 0,
    total: payRecs.length,
    pending_headteacher: 0,
    pending_governors: 0,
  };
  for (const pr of payRecs) {
    if (pr.type && pendingPay[pr.type] !== undefined) pendingPay[pr.type]++;
    if (pr.status === "pending_headteacher") pendingPay.pending_headteacher++;
    if (pr.status === "pending_governors") pendingPay.pending_governors++;
  }

  // Observations count
  let obsCount = 0;
  let cpdCount = 0;
  for (const a of all) {
    obsCount += (a.observations || []).length;
    cpdCount += (a.cpd_completed || []).length;
  }

  return apiSuccess({
    cycle: activeCycle,
    total_staff: total,
    stages,
    percentages: {
      objectives_set: total > 0 ? Math.round((objectivesSet / total) * 100) : 0,
      mid_year_complete:
        total > 0 ? Math.round((midYearComplete / total) * 100) : 0,
      end_year_complete:
        total > 0 ? Math.round((endYearComplete / total) * 100) : 0,
      pay_recommendations_submitted:
        total > 0 ? Math.round((payRecsSubmitted / total) * 100) : 0,
    },
    by_role_type: byRole,
    ect_count: ectCount,
    pending_pay_decisions: pendingPay,
    observations_this_cycle: obsCount,
    cpd_hours_logged: cpdCount,
    demo: false,
  });
});
