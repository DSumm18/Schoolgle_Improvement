/**
 * Emergency Dashboard API
 *
 * GET /api/emergency/dashboard - Overview stats: plans by type, drill compliance, overdue drills, evacuation times
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

interface DrillComplianceCheck {
  type: string;
  label: string;
  requirement: string;
  frequency: "termly" | "annual" | "biannual";
  requiredPerYear: number;
  completedCount: number;
  lastDrill: string | null;
  nextDue: string | null;
  compliant: boolean;
}

export const GET = protectedRoute(async (auth) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();

  // Fetch plans
  const { data: plans } = await supabase
    .from("emergency_plans")
    .select("id, plan_type, title, status, last_reviewed_at, next_review_due")
    .eq("organization_id", organizationId);

  // Fetch drills from last 2 years
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

  const { data: drills } = await supabase
    .from("emergency_drills")
    .select("*")
    .eq("organization_id", organizationId)
    .gte("drill_date", twoYearsAgo.toISOString().split("T")[0])
    .order("drill_date", { ascending: false });

  const now = new Date();
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(now.getFullYear() - 1);
  const thisAcademicYearStart = getAcademicYearStart(now);

  const recentDrills = (drills || []).filter(
    (d) => new Date(d.drill_date) >= oneYearAgo,
  );

  // Count drills by type in current academic year
  const academicYearDrills = (drills || []).filter(
    (d) => new Date(d.drill_date) >= thisAcademicYearStart,
  );

  const fireDrillsThisYear = academicYearDrills.filter(
    (d) => d.drill_type === "fire_evacuation",
  );
  const lockdownDrillsThisYear = academicYearDrills.filter(
    (d) => d.drill_type === "lockdown",
  );

  // Determine term boundaries for fire drill compliance
  const terms = getTermDates(thisAcademicYearStart);
  const fireByTerm = terms.map((term) => {
    const drillsInTerm = fireDrillsThisYear.filter((d) => {
      const date = new Date(d.drill_date);
      return date >= term.start && date <= term.end;
    });
    return {
      term: term.name,
      count: drillsInTerm.length,
      compliant: drillsInTerm.length >= 1,
    };
  });

  // Evacuation time stats for fire drills
  const fireTimesSeconds = recentDrills
    .filter(
      (d) =>
        d.drill_type === "fire_evacuation" && d.evacuation_time_seconds != null,
    )
    .map((d) => d.evacuation_time_seconds);

  const bestTime =
    fireTimesSeconds.length > 0 ? Math.min(...fireTimesSeconds) : null;
  const avgTime =
    fireTimesSeconds.length > 0
      ? Math.round(
          fireTimesSeconds.reduce((a: number, b: number) => a + b, 0) /
            fireTimesSeconds.length,
        )
      : null;
  const worstTime =
    fireTimesSeconds.length > 0 ? Math.max(...fireTimesSeconds) : null;

  // Compliance checks
  const compliance: DrillComplianceCheck[] = [
    {
      type: "fire_evacuation",
      label: "Fire Evacuation Drill",
      requirement: "Regulatory Reform (Fire Safety) Order 2005",
      frequency: "termly",
      requiredPerYear: 3,
      completedCount: fireDrillsThisYear.length,
      lastDrill:
        fireDrillsThisYear.length > 0 ? fireDrillsThisYear[0].drill_date : null,
      nextDue: getNextFireDrillDue(fireByTerm, terms),
      compliant: fireDrillsThisYear.length >= getCurrentTermNumber(now),
    },
    {
      type: "lockdown",
      label: "Lockdown Drill",
      requirement: "DfE Guidance / KCSIE",
      frequency: "annual",
      requiredPerYear: 1,
      completedCount: lockdownDrillsThisYear.length,
      lastDrill:
        lockdownDrillsThisYear.length > 0
          ? lockdownDrillsThisYear[0].drill_date
          : null,
      nextDue:
        lockdownDrillsThisYear.length === 0
          ? "Overdue - complete before end of academic year"
          : null,
      compliant: lockdownDrillsThisYear.length >= 1,
    },
  ];

  // Overdue plan reviews
  const overduePlans = (plans || []).filter(
    (p) => p.next_review_due && new Date(p.next_review_due) < now,
  );

  // Issues from recent drills
  const recentIssues = recentDrills
    .filter((d) => d.issues_found && d.issues_found.length > 0)
    .flatMap((d) =>
      d.issues_found.map((issue: string) => ({
        drill_type: d.drill_type,
        drill_date: d.drill_date,
        issue,
      })),
    );

  const dashboard = {
    plans: {
      total: (plans || []).length,
      active: (plans || []).filter((p) => p.status === "active").length,
      draft: (plans || []).filter((p) => p.status === "draft").length,
      under_review: (plans || []).filter((p) => p.status === "under_review")
        .length,
      overdue_reviews: overduePlans.length,
      by_type: (plans || []).map((p) => ({
        type: p.plan_type,
        title: p.title,
        status: p.status,
        last_reviewed: p.last_reviewed_at,
        next_review: p.next_review_due,
        overdue: p.next_review_due ? new Date(p.next_review_due) < now : false,
      })),
    },
    drills: {
      total_this_year: academicYearDrills.length,
      fire_by_term: fireByTerm,
      compliance,
      evacuation_times: {
        best_seconds: bestTime,
        average_seconds: avgTime,
        worst_seconds: worstTime,
        target_seconds: 180,
      },
      recent_issues: recentIssues.slice(0, 10),
    },
    overall_status: calculateOverallStatus(compliance, overduePlans),
  };

  return apiSuccess(dashboard);
});

// ─── Helpers ────────────────────────────────────────────────────────

function getAcademicYearStart(date: Date): Date {
  const year =
    date.getMonth() >= 8 ? date.getFullYear() : date.getFullYear() - 1;
  return new Date(year, 8, 1); // September 1st
}

function getCurrentTermNumber(date: Date): number {
  const month = date.getMonth();
  // Sept-Dec = Term 1, Jan-Mar = Term 2, Apr-Jul = Term 3
  if (month >= 8 && month <= 11) return 1;
  if (month >= 0 && month <= 2) return 2;
  return 3;
}

function getTermDates(academicYearStart: Date) {
  const year = academicYearStart.getFullYear();
  return [
    {
      name: "Autumn",
      start: new Date(year, 8, 1),
      end: new Date(year, 11, 20),
    },
    {
      name: "Spring",
      start: new Date(year + 1, 0, 6),
      end: new Date(year + 1, 2, 31),
    },
    {
      name: "Summer",
      start: new Date(year + 1, 3, 14),
      end: new Date(year + 1, 6, 22),
    },
  ];
}

function getNextFireDrillDue(
  fireByTerm: { term: string; compliant: boolean }[],
  terms: { name: string; end: Date }[],
): string | null {
  for (let i = 0; i < fireByTerm.length; i++) {
    if (!fireByTerm[i].compliant) {
      return `Due by end of ${terms[i].name} term (${terms[i].end.toISOString().split("T")[0]})`;
    }
  }
  return null;
}

function calculateOverallStatus(
  compliance: DrillComplianceCheck[],
  overduePlans: unknown[],
): "green" | "amber" | "red" {
  const allCompliant = compliance.every((c) => c.compliant);
  const noOverdue = overduePlans.length === 0;

  if (allCompliant && noOverdue) return "green";
  if (!allCompliant && overduePlans.length > 1) return "red";
  return "amber";
}
