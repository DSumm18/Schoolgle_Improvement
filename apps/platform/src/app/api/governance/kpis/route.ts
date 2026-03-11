import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import type {
  GovernanceStatistics,
  GetGovernanceKpiRequest,
  GetGovernanceKpiResponse,
  SkillsCoverage,
  GovernorKpiSnapshot,
  GovernorStatus,
  GovernorType,
} from "@/lib/governance";

/**
 * GET /api/governance/kpis
 * Get governance KPIs and statistics for an organization
 */
export const GET = protectedRoute(async (auth, req) => {
  const { searchParams } = new URL(req.url);
  const organizationId =
    searchParams.get("organizationId") || auth.organizationId;
  const fromDate = searchParams.get("from_date");
  const includeHistory = searchParams.get("includeHistory") === "true";

  if (!organizationId) {
    return apiError("Missing organizationId parameter", 400);
  }

  const supabase = createServiceRoleClient();

  // Fetch all relevant data in parallel
  const [
    governorsResult,
    meetingsResult,
    trainingResult,
    policiesResult,
    visitsResult,
    snapshotsResult,
  ] = await Promise.all([
    // Governors
    supabase
      .from("governors")
      .select("*")
      .eq("organization_id", organizationId),

    // Meetings (past year)
    supabase
      .from("governor_meetings")
      .select("*")
      .eq("organization_id", organizationId)
      .gte(
        "scheduled_date",
        new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      ),

    // Training
    supabase
      .from("governor_training")
      .select("*")
      .eq("organization_id", organizationId),

    // Policies
    supabase
      .from("governance_policy_reviews")
      .select("*")
      .eq("organization_id", organizationId),

    // Visits (current term/semester)
    supabase
      .from("governor_visits")
      .select("*")
      .eq("organization_id", organizationId)
      .gte(
        "scheduled_date",
        new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      ),

    // Historical snapshots
    includeHistory
      ? supabase
          .from("governance_kpi_snapshots")
          .select("*")
          .eq("organization_id", organizationId)
          .order("snapshot_date", { ascending: false })
          .limit(12)
      : Promise.resolve({ data: [] }),
  ]);

  const governors = governorsResult.data || [];
  const meetings = meetingsResult.data || [];
  const training = trainingResult.data || [];
  const policies = policiesResult.data || [];
  const visits = visitsResult.data || [];
  const snapshots = snapshotsResult.data || [];

  // Calculate governor statistics
  const totalGovernors = governors.length;
  const activeGovernors = governors.filter((g: any) => g.status === "active");
  const governorTypes = governors.reduce(
    (acc: any, g: any) => {
      acc[g.governor_type] = (acc[g.governor_type] || 0) + 1;
      return acc;
    },
    {} as Record<GovernorType, number>,
  );

  // Calculate vacancies (active governors with end_date in the past)
  const today = new Date();
  const vacantPositions = activeGovernors.filter(
    (g: any) => g.end_date && new Date(g.end_date) < today,
  ).length;

  // Calculate meeting statistics
  const upcomingMeetings = meetings.filter(
    (m: any) => new Date(m.scheduled_date) >= today && m.status === "scheduled",
  ).length;
  const pastMeetingsThisYear = meetings.filter(
    (m: any) => new Date(m.scheduled_date) < today && m.status === "completed",
  ).length;

  // Calculate average attendance
  let totalAttendanceRate = 0;
  const governorsWithAttendance = governors.filter(
    (g: any) => g.meetings_total > 0,
  );
  if (governorsWithAttendance.length > 0) {
    const attendanceSum = governorsWithAttendance.reduce(
      (sum: number, g: any) => {
        return sum + g.meetings_attended / g.meetings_total;
      },
      0,
    );
    totalAttendanceRate = Math.round(
      (attendanceSum / governorsWithAttendance.length) * 100,
    );
  }

  // Calculate training statistics
  const todayStr = today.toISOString().split("T")[0];
  const expiredTraining = training.filter(
    (t: any) => t.expiry_date && t.expiry_date < todayStr,
  ).length;
  const trainingCompletionRate =
    governors.length > 0
      ? Math.round((training.length / (governors.length * 3)) * 100) // Assuming 3 required trainings per governor
      : 0;

  // Calculate policy statistics
  const statutoryPolicies = policies.filter((p: any) => p.is_statutory).length;
  const policiesCurrent = policies.filter(
    (p: any) => p.review_status === "current" || p.next_review_date >= todayStr,
  ).length;
  const policiesNeedReview = policies.filter(
    (p: any) =>
      p.review_status === "under_review" ||
      (p.review_status === "current" && p.next_review_date < todayStr),
  ).length;
  const policiesOverdue = policies.filter(
    (p: any) => p.next_review_date < todayStr,
  ).length;

  // Calculate visit statistics
  const visitsThisTerm = visits.length;
  const visitsCompleted = visits.filter(
    (v: any) => v.status === "completed",
  ).length;
  const visitsScheduled = visits.filter(
    (v: any) => v.status === "scheduled",
  ).length;

  // Build statistics object
  const statistics: GovernanceStatistics = {
    // Governor stats
    total_governors: totalGovernors,
    active_governors: activeGovernors.length,
    vacant_positions: vacantPositions,
    governor_types: governorTypes,

    // Meeting stats
    upcoming_meetings: upcomingMeetings,
    past_meetings_this_year: pastMeetingsThisYear,
    average_attendance_rate: totalAttendanceRate,

    // Training stats
    training_completion_rate: trainingCompletionRate,
    expired_training_count: expiredTraining,

    // Policy stats
    statutory_policies: statutoryPolicies,
    policies_current: policiesCurrent,
    policies_need_review: policiesNeedReview,
    policies_overdue: policiesOverdue,

    // Visit stats
    visits_this_term: visitsThisTerm,
    visits_completed: visitsCompleted,
    visits_scheduled: visitsScheduled,
  };

  // Calculate skills coverage
  const allSkills = governors.flatMap((g: any) => g.skills || []);
  const uniqueSkills = [...new Set(allSkills)];
  const requiredSkills = [
    "finance",
    "safeguarding",
    "hr",
    "health_and_safety",
    "send",
    "curriculum",
    "data_protection",
  ];

  const skillsCoverage: SkillsCoverage[] = requiredSkills.map((skill) => ({
    skill,
    required: true,
    covered: allSkills.includes(skill),
    governors: governors
      .filter((g: any) => g.skills?.includes(skill))
      .map((g: any) => g.full_name),
  }));

  // Calculate trends
  const trends = {
    attendance_trend: "stable" as "improving" | "stable" | "declining",
    training_trend: "stable" as "improving" | "stable" | "declining",
    policy_compliance_trend: "stable" as "improving" | "stable" | "declining",
  };

  if (snapshots.length >= 2) {
    const latest = snapshots[0] as GovernorKpiSnapshot;
    const previous = snapshots[1] as GovernorKpiSnapshot;

    if (latest.attendance_percentage > previous.attendance_percentage) {
      trends.attendance_trend = "improving";
    } else if (latest.attendance_percentage < previous.attendance_percentage) {
      trends.attendance_trend = "declining";
    }

    if (latest.training_completion_rate > previous.training_completion_rate) {
      trends.training_trend = "improving";
    } else if (
      latest.training_completion_rate < previous.training_completion_rate
    ) {
      trends.training_trend = "declining";
    }

    const latestPolicyRate =
      latest.policies_current /
      (latest.policies_current + latest.policies_outstanding_review);
    const previousPolicyRate =
      previous.policies_current /
      (previous.policies_current + previous.policies_outstanding_review);
    if (latestPolicyRate > previousPolicyRate) {
      trends.policy_compliance_trend = "improving";
    } else if (latestPolicyRate < previousPolicyRate) {
      trends.policy_compliance_trend = "declining";
    }
  }

  const response: GetGovernanceKpiResponse = {
    current: statistics,
    historical: snapshots,
    skills_coverage: skillsCoverage,
    trends,
  };

  return apiSuccess(response);
});

/**
 * POST /api/governance/kpis
 * Create a new KPI snapshot (trigger manually or scheduled)
 */
export const POST = protectedRoute(async (auth, req) => {
  const body = await req.json();
  const { organizationId } = body as { organizationId: string };

  const orgId = organizationId || auth.organizationId;

  if (!orgId) {
    return apiError("Missing organizationId", 400);
  }

  const supabase = createServiceRoleClient();

  // Call the function to create snapshot
  const { data: snapshotId, error } = await supabase.rpc(
    "create_governance_kpi_snapshot",
    {
      org_id: orgId,
    },
  );

  if (error) {
    console.error("Error creating KPI snapshot:", error);
    return apiError("Failed to create KPI snapshot", 500);
  }

  return apiSuccess({
    success: true,
    snapshot_id: snapshotId,
  });
});
