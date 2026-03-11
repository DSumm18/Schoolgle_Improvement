import { protectedRoute, apiSuccess } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * GET /api/hr/sickness/analytics
 * Enhanced sickness analytics: patterns, benchmarks, costs, pipeline
 */
export const GET = protectedRoute(async (auth) => {
  const supabase = createServiceRoleClient();
  const orgId = auth.organizationId;

  // Get all records from last 12 months
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

  const { data: records } = await supabase
    .from("sickness_absence_records")
    .select("*")
    .eq("organization_id", orgId)
    .gte("start_date", twelveMonthsAgo.toISOString().split("T")[0])
    .order("start_date", { ascending: true });

  const allRecords = records || [];

  // Get staff count for benchmarking
  const { count: totalStaff } = await supabase
    .from("staff_directory")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("is_active", true);

  const staffCount = totalStaff || 1;

  // Get staff with roles for department analysis
  const staffIds = [...new Set(allRecords.map((r) => r.staff_id))];
  const { data: staffList } = await supabase
    .from("staff_directory")
    .select("id, display_name, job_title, role_category")
    .eq("organization_id", orgId)
    .in("id", staffIds.length > 0 ? staffIds : ["__none__"]);

  const staffMap: Record<string, any> = {};
  for (const s of staffList || []) {
    staffMap[s.id] = s;
  }

  // 1. DAY-OF-WEEK PATTERNS
  const dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (const r of allRecords) {
    const day = new Date(r.start_date).getDay();
    dayOfWeekCounts[day]++;
  }
  const weekdayCounts = dayOfWeekCounts.slice(1, 6); // Mon-Fri only
  const avgWeekday = weekdayCounts.reduce((s, c) => s + c, 0) / 5;
  const mondaySpike =
    avgWeekday > 0 ? (dayOfWeekCounts[1] / avgWeekday - 1) * 100 : 0;
  const fridaySpike =
    avgWeekday > 0 ? (dayOfWeekCounts[5] / avgWeekday - 1) * 100 : 0;

  const dayOfWeekPattern = dayLabels.map((label, i) => ({
    day: label,
    count: dayOfWeekCounts[i],
    isSpike: i === 1 ? mondaySpike > 30 : i === 5 ? fridaySpike > 30 : false,
  }));

  // 2. TERM/SEASONAL PATTERNS (UK school terms approximation)
  const termBreakdown: Array<{ term: string; count: number; days: number }> =
    [];

  // Define terms for current academic year
  const now = new Date();
  const academicYear =
    now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  const terms = [
    {
      name: "Autumn 1",
      start: `${academicYear}-09-01`,
      end: `${academicYear}-10-25`,
    },
    {
      name: "Autumn 2",
      start: `${academicYear}-11-01`,
      end: `${academicYear}-12-20`,
    },
    {
      name: "Spring 1",
      start: `${academicYear + 1}-01-06`,
      end: `${academicYear + 1}-02-14`,
    },
    {
      name: "Spring 2",
      start: `${academicYear + 1}-02-24`,
      end: `${academicYear + 1}-04-04`,
    },
    {
      name: "Summer 1",
      start: `${academicYear + 1}-04-22`,
      end: `${academicYear + 1}-05-23`,
    },
    {
      name: "Summer 2",
      start: `${academicYear + 1}-06-02`,
      end: `${academicYear + 1}-07-22`,
    },
  ];

  for (const term of terms) {
    const termRecords = allRecords.filter(
      (r) => r.start_date >= term.start && r.start_date <= term.end,
    );
    const termDays = termRecords.reduce(
      (s, r) => s + (Number(r.working_days_lost) || 0),
      0,
    );
    termBreakdown.push({
      term: term.name,
      count: termRecords.length,
      days: termDays,
    });
  }

  // 3. DEPARTMENT/ROLE CLUSTERS
  const departmentMap: Record<
    string,
    { count: number; days: number; staffCount: number; staffIds: Set<string> }
  > = {};
  for (const r of allRecords) {
    const staff = staffMap[r.staff_id];
    const dept = staff?.role_category || "Uncategorised";
    if (!departmentMap[dept]) {
      departmentMap[dept] = {
        count: 0,
        days: 0,
        staffCount: 0,
        staffIds: new Set(),
      };
    }
    departmentMap[dept].count++;
    departmentMap[dept].days += Number(r.working_days_lost) || 0;
    departmentMap[dept].staffIds.add(r.staff_id);
  }

  const departmentClusters = Object.entries(departmentMap)
    .map(([department, data]) => ({
      department,
      absences: data.count,
      days: Math.round(data.days * 10) / 10,
      staffAffected: data.staffIds.size,
      avgDaysPerAbsence:
        data.count > 0 ? Math.round((data.days / data.count) * 10) / 10 : 0,
    }))
    .sort((a, b) => b.absences - a.absences);

  // 4. SUPPLY COVER COSTS (£200/day UK average for supply teachers)
  const SUPPLY_COST_PER_DAY = 200;
  const totalDaysLost = allRecords.reduce(
    (s, r) => s + (Number(r.working_days_lost) || 0),
    0,
  );
  const estimatedSupplyCost = Math.round(totalDaysLost * SUPPLY_COST_PER_DAY);

  // Monthly supply costs
  const monthlyCosts: Array<{ month: string; days: number; cost: number }> = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const year = d.getFullYear();
    const month = d.getMonth();
    const monthStart = new Date(year, month, 1).toISOString().split("T")[0];
    const monthEnd = new Date(year, month + 1, 0).toISOString().split("T")[0];
    const monthLabel = d.toLocaleDateString("en-GB", {
      month: "short",
      year: "2-digit",
    });

    const monthDays = allRecords
      .filter((r) => r.start_date >= monthStart && r.start_date <= monthEnd)
      .reduce((s, r) => s + (Number(r.working_days_lost) || 0), 0);

    monthlyCosts.push({
      month: monthLabel,
      days: Math.round(monthDays * 10) / 10,
      cost: Math.round(monthDays * SUPPLY_COST_PER_DAY),
    });
  }

  // 5. DfE BENCHMARK COMPARISON
  // National averages from DfE School Workforce Census 2023/24
  const absenceRate =
    staffCount > 0
      ? Math.round((totalDaysLost / (staffCount * 190)) * 1000) / 10
      : 0; // 190 = approx working days in school year

  const benchmarks = {
    school_absence_rate: absenceRate,
    national_average_rate: 4.5,
    national_avg_days_per_teacher: 8.3,
    school_avg_days_per_staff:
      staffCount > 0 ? Math.round((totalDaysLost / staffCount) * 10) / 10 : 0,
    national_pct_teachers_absent: 65.7,
    school_pct_staff_absent:
      staffCount > 0
        ? Math.round((staffIds.length / staffCount) * 1000) / 10
        : 0,
    performance:
      absenceRate <= 3.5
        ? "excellent"
        : absenceRate <= 4.5
          ? "good"
          : absenceRate <= 6.0
            ? "average"
            : "concern",
  };

  // 6. FORMAL STAGE PIPELINE
  // Count staff at each formal stage based on their most recent record
  const staffLatestStage: Record<string, string> = {};
  // Records are ordered by start_date ascending, so last one wins
  for (const r of allRecords) {
    if (r.formal_stage && r.formal_stage !== "none") {
      staffLatestStage[r.staff_id] = r.formal_stage;
    }
  }

  const stagePipeline: Record<string, number> = {
    informal_meeting: 0,
    stage_1: 0,
    stage_2: 0,
    stage_3: 0,
    dismissal: 0,
  };

  for (const stage of Object.values(staffLatestStage)) {
    if (stagePipeline[stage] !== undefined) {
      stagePipeline[stage]++;
    }
  }

  const formalStagePipeline = Object.entries(stagePipeline).map(
    ([stage, count]) => ({
      stage,
      label: stage.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      count,
    }),
  );

  // 7. REASON BREAKDOWN with days (enriched version of top_reasons)
  const reasonBreakdown: Record<
    string,
    { count: number; days: number; ongoing: number }
  > = {};
  for (const r of allRecords) {
    const cat = r.reason_category || "other";
    if (!reasonBreakdown[cat]) {
      reasonBreakdown[cat] = { count: 0, days: 0, ongoing: 0 };
    }
    reasonBreakdown[cat].count++;
    reasonBreakdown[cat].days += Number(r.working_days_lost) || 0;
    if (!r.end_date) reasonBreakdown[cat].ongoing++;
  }

  const enrichedReasons = Object.entries(reasonBreakdown)
    .map(([category, data]) => ({
      category,
      count: data.count,
      days: Math.round(data.days * 10) / 10,
      ongoing: data.ongoing,
      avgDuration:
        data.count > 0 ? Math.round((data.days / data.count) * 10) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // 8. PATTERN ALERTS
  const alerts: Array<{
    type: string;
    severity: "info" | "warning" | "critical";
    message: string;
  }> = [];

  if (mondaySpike > 30) {
    alerts.push({
      type: "day_pattern",
      severity: mondaySpike > 50 ? "warning" : "info",
      message: `Monday absences are ${Math.round(mondaySpike)}% above average — may indicate morale or workload issues`,
    });
  }
  if (fridaySpike > 30) {
    alerts.push({
      type: "day_pattern",
      severity: fridaySpike > 50 ? "warning" : "info",
      message: `Friday absences are ${Math.round(fridaySpike)}% above average — consider extended weekend pattern`,
    });
  }
  if (absenceRate > 6.0) {
    alerts.push({
      type: "benchmark",
      severity: "critical",
      message: `Absence rate (${absenceRate}%) significantly exceeds the national average (4.5%)`,
    });
  } else if (absenceRate > 4.5) {
    alerts.push({
      type: "benchmark",
      severity: "warning",
      message: `Absence rate (${absenceRate}%) is above the national average (4.5%)`,
    });
  }

  // Check for high-frequency absentees (3+ spells in 12 months)
  const staffSpellCounts: Record<string, number> = {};
  for (const r of allRecords) {
    staffSpellCounts[r.staff_id] = (staffSpellCounts[r.staff_id] || 0) + 1;
  }
  const frequentAbsentees = Object.values(staffSpellCounts).filter(
    (c) => c >= 3,
  ).length;
  if (frequentAbsentees > 0) {
    alerts.push({
      type: "frequency",
      severity: frequentAbsentees > 3 ? "warning" : "info",
      message: `${frequentAbsentees} staff member${frequentAbsentees > 1 ? "s have" : " has"} had 3+ absence spells in 12 months`,
    });
  }

  // Department hotspot
  const topDept = departmentClusters[0];
  if (
    topDept &&
    departmentClusters.length > 1 &&
    topDept.absences > departmentClusters[1].absences * 2
  ) {
    alerts.push({
      type: "department",
      severity: "warning",
      message: `${topDept.department} department has ${topDept.absences} absences — more than double any other department`,
    });
  }

  return apiSuccess({
    day_of_week_pattern: dayOfWeekPattern,
    monday_spike_pct: Math.round(mondaySpike),
    friday_spike_pct: Math.round(fridaySpike),
    term_breakdown: termBreakdown,
    department_clusters: departmentClusters,
    supply_costs: {
      total_days_lost: Math.round(totalDaysLost * 10) / 10,
      estimated_total_cost: estimatedSupplyCost,
      cost_per_day: SUPPLY_COST_PER_DAY,
      monthly: monthlyCosts,
    },
    benchmarks,
    formal_stage_pipeline: formalStagePipeline,
    enriched_reasons: enrichedReasons,
    alerts,
    period: {
      from: twelveMonthsAgo.toISOString().split("T")[0],
      to: new Date().toISOString().split("T")[0],
    },
  });
});
