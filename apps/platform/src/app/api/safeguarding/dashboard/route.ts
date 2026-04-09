import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * GET /api/safeguarding/dashboard
 * Dashboard stats for safeguarding module
 */
export const GET = protectedRoute(
  async (auth) => {
    const { organizationId } = auth;
    const supabase = createServiceRoleClient();

    // Fetch all open/active concerns
    const { data: concerns, error: concernsError } = await supabase
      .from("safeguarding_concerns")
      .select(
        "id, severity, status, category, created_at, follow_up_date, pupil_pseudonym_label, reference_number",
      )
      .eq("organization_id", organizationId)
      .in("status", ["open", "triaged", "referred", "monitoring"])
      .order("created_at", { ascending: false });

    if (concernsError) {
      console.error("Error fetching dashboard data:", concernsError);
      return apiError("Failed to fetch dashboard data", 500);
    }

    const allConcerns = concerns || [];

    // Severity counts
    const bySeverity = {
      red: allConcerns.filter((c) => c.severity === "red").length,
      amber: allConcerns.filter((c) => c.severity === "amber").length,
      green: allConcerns.filter((c) => c.severity === "green").length,
    };

    // Status counts
    const byStatus = {
      open: allConcerns.filter((c) => c.status === "open").length,
      triaged: allConcerns.filter((c) => c.status === "triaged").length,
      referred: allConcerns.filter((c) => c.status === "referred").length,
      monitoring: allConcerns.filter((c) => c.status === "monitoring").length,
    };

    // Category breakdown
    const byCategory: Record<string, number> = {};
    allConcerns.forEach((c) => {
      byCategory[c.category] = (byCategory[c.category] || 0) + 1;
    });

    // Overdue follow-ups
    const today = new Date().toISOString().split("T")[0];
    const overdue = allConcerns.filter(
      (c) =>
        c.follow_up_date && c.follow_up_date < today && c.status !== "closed",
    );

    // Recent concerns (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recent = allConcerns.filter(
      (c) => new Date(c.created_at) >= sevenDaysAgo,
    );

    // Fetch referral outcomes
    const { data: referrals } = await supabase
      .from("safeguarding_referrals")
      .select("id, outcome_status, referral_type, created_at")
      .eq("organization_id", organizationId);

    const referralOutcomes: Record<string, number> = {};
    (referrals || []).forEach((r) => {
      referralOutcomes[r.outcome_status] =
        (referralOutcomes[r.outcome_status] || 0) + 1;
    });

    // Fetch total closed this academic year
    const academicYearStart = getAcademicYearStart();
    const { count: closedThisYear } = await supabase
      .from("safeguarding_concerns")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "closed")
      .gte("created_at", academicYearStart.toISOString());

    return apiSuccess({
      summary: {
        total_active: allConcerns.length,
        by_severity: bySeverity,
        by_status: byStatus,
        by_category: byCategory,
        overdue_follow_ups: overdue.length,
        recent_7_days: recent.length,
        closed_this_year: closedThisYear || 0,
        total_referrals: (referrals || []).length,
        referral_outcomes: referralOutcomes,
      },
      recent_concerns: allConcerns.slice(0, 10),
      overdue_concerns: overdue,
    });
  },
  { requiredRole: "teacher" },
);

function getAcademicYearStart(): Date {
  const now = new Date();
  const year = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return new Date(year, 8, 1); // September 1st
}
