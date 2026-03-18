/**
 * Behaviour Dashboard Stats API
 *
 * GET /api/behaviour/dashboard - Dashboard statistics
 */

import { protectedRoute, apiSuccess } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

function generateDemoStats() {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  // Term start ~6 weeks ago
  const termStart = new Date(now);
  termStart.setDate(termStart.getDate() - 42);

  return {
    today: {
      total: 14,
      positive: 10,
      negative: 4,
      ratio: 2.5,
    },
    this_week: {
      total: 62,
      positive: 45,
      negative: 17,
      ratio: 2.65,
    },
    this_term: {
      total: 346,
      positive: 248,
      negative: 98,
      ratio: 2.53,
    },
    detentions_scheduled: 3,
    active_exclusions: 2,
    slt_referrals_today: 1,
    category_breakdown: {
      positive: [
        { category: "achievement", count: 68 },
        { category: "effort", count: 52 },
        { category: "kindness", count: 41 },
        { category: "homework", count: 35 },
        { category: "leadership", count: 22 },
        { category: "improvement", count: 18 },
        { category: "community", count: 8 },
        { category: "attendance", count: 4 },
      ],
      negative: [
        { category: "disruption", count: 28 },
        { category: "defiance", count: 16 },
        { category: "uniform", count: 14 },
        { category: "mobile_phone", count: 11 },
        { category: "verbal_abuse", count: 9 },
        { category: "truancy", count: 7 },
        { category: "bullying", count: 5 },
        { category: "physical_aggression", count: 4 },
        { category: "damage", count: 2 },
        { category: "other_negative", count: 2 },
      ],
    },
    by_time_of_day: [
      { period: "Registration", positive: 12, negative: 2 },
      { period: "Period 1", positive: 32, negative: 14 },
      { period: "Period 2", positive: 38, negative: 12 },
      { period: "Break", positive: 18, negative: 16 },
      { period: "Period 3", positive: 42, negative: 18 },
      { period: "Lunch", positive: 22, negative: 14 },
      { period: "Period 4", positive: 46, negative: 12 },
      { period: "Period 5", positive: 34, negative: 8 },
      { period: "After School", positive: 4, negative: 2 },
    ],
    by_location: [
      { location: "Classrooms", count: 52 },
      { location: "Playground", count: 18 },
      { location: "Dining Hall", count: 14 },
      { location: "Corridors", count: 8 },
      { location: "Sports Hall", count: 6 },
    ],
    exclusion_summary: {
      fixed_term_this_term: 4,
      permanent_this_term: 0,
      lunchtime_this_term: 2,
      managed_moves: 1,
      total_days_lost: 16,
      pupils_excluded: 3,
    },
    repeat_offenders: [
      {
        pupil_name: "Jake Williams",
        year_group: 10,
        incident_count: 7,
        last_incident: todayStr,
        categories: ["disruption", "defiance", "verbal_abuse"],
      },
      {
        pupil_name: "Mason Clarke",
        year_group: 9,
        incident_count: 5,
        last_incident: todayStr,
        categories: ["physical_aggression", "disruption"],
      },
      {
        pupil_name: "Ethan Patel",
        year_group: 11,
        incident_count: 5,
        last_incident: todayStr,
        categories: ["defiance", "verbal_abuse", "truancy"],
      },
      {
        pupil_name: "Charlie Hall",
        year_group: 10,
        incident_count: 4,
        last_incident: todayStr,
        categories: ["disruption", "damage"],
      },
      {
        pupil_name: "Noah Jenkins",
        year_group: 8,
        incident_count: 3,
        last_incident: todayStr,
        categories: ["uniform", "mobile_phone", "disruption"],
      },
    ],
    demo: true,
  };
}

export const GET = protectedRoute(async (auth) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();

  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).toISOString();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
  const weekStartStr = new Date(
    weekStart.getFullYear(),
    weekStart.getMonth(),
    weekStart.getDate(),
  ).toISOString();

  // Try to get real data
  const { data: todayIncidents, error } = await supabase
    .from("behaviour_incidents")
    .select("id, type, category")
    .eq("organization_id", organizationId)
    .gte("created_at", todayStart);

  if (error || !todayIncidents || todayIncidents.length === 0) {
    // Try MIS resolver before falling back to demo
    try {
      const { getMISDataServiceForOrg } =
        await import("@/lib/mis/data-service");
      const mis = await getMISDataServiceForOrg(organizationId);
      const behaviourResult = await mis.read(organizationId, "behaviour");

      if (behaviourResult.data.length > 0) {
        const misIncidents = behaviourResult.data as any[];
        const todayStr = now.toISOString().split("T")[0];

        // Compute today's stats
        const todayMIS = misIncidents.filter((r) => r.date === todayStr);
        const todayPos = todayMIS.filter((r) => r.type === "Positive").length;
        const todayNeg = todayMIS.filter((r) => r.type === "Negative").length;

        // Compute this week's stats
        const weekMIS = misIncidents.filter(
          (r) => r.date >= weekStartStr.split("T")[0],
        );
        const weekPos = weekMIS.filter((r) => r.type === "Positive").length;
        const weekNeg = weekMIS.filter((r) => r.type === "Negative").length;

        // Compute this term stats (last 6 weeks)
        const termStart = new Date(now);
        termStart.setDate(termStart.getDate() - 42);
        const termStartStr = termStart.toISOString().split("T")[0];
        const termMIS = misIncidents.filter((r) => r.date >= termStartStr);
        const termPos = termMIS.filter((r) => r.type === "Positive").length;
        const termNeg = termMIS.filter((r) => r.type === "Negative").length;

        // Category breakdown
        const posCats: Record<string, number> = {};
        const negCats: Record<string, number> = {};
        for (const r of termMIS) {
          const cat = r.category || "other";
          if (r.type === "Positive") {
            posCats[cat] = (posCats[cat] || 0) + 1;
          } else {
            negCats[cat] = (negCats[cat] || 0) + 1;
          }
        }

        // Exclusion summary
        const exclusions = misIncidents.filter((r) => r.is_exclusion);
        const fteCount = exclusions.filter(
          (r) => r.exclusion_type === "FTE",
        ).length;
        const pexCount = exclusions.filter(
          (r) => r.exclusion_type === "PEX",
        ).length;
        const totalDaysLost = exclusions.reduce(
          (sum, r) => sum + (r.exclusion_days || 0),
          0,
        );
        const excludedPupils = new Set(exclusions.map((r) => r.student_id))
          .size;

        // Repeat offenders (negative incidents)
        const pupilNegMap: Record<
          string,
          {
            name: string;
            year_group: number;
            count: number;
            lastDate: string;
            categories: Set<string>;
          }
        > = {};
        for (const r of termMIS) {
          if (r.type !== "Negative") continue;
          if (!pupilNegMap[r.student_id]) {
            pupilNegMap[r.student_id] = {
              name: r.student_name,
              year_group: r.year_group,
              count: 0,
              lastDate: r.date,
              categories: new Set(),
            };
          }
          const entry = pupilNegMap[r.student_id];
          entry.count++;
          if (r.date > entry.lastDate) entry.lastDate = r.date;
          entry.categories.add(r.category);
        }

        const repeatOffenders = Object.values(pupilNegMap)
          .filter((p) => p.count >= 2)
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
          .map((p) => ({
            pupil_name: p.name,
            year_group: p.year_group,
            incident_count: p.count,
            last_incident: p.lastDate,
            categories: Array.from(p.categories),
          }));

        // Active exclusions (those with end date >= today)
        const activeExcl = exclusions.filter((r) => r.date >= todayStr).length;

        // SLT referrals today
        const sltToday = todayMIS.filter(
          (r) => r.action_taken && r.action_taken.toLowerCase().includes("slt"),
        ).length;

        return apiSuccess({
          today: {
            total: todayMIS.length,
            positive: todayPos,
            negative: todayNeg,
            ratio:
              todayNeg > 0
                ? Math.round((todayPos / todayNeg) * 100) / 100
                : todayPos,
          },
          this_week: {
            total: weekMIS.length,
            positive: weekPos,
            negative: weekNeg,
            ratio:
              weekNeg > 0
                ? Math.round((weekPos / weekNeg) * 100) / 100
                : weekPos,
          },
          this_term: {
            total: termMIS.length,
            positive: termPos,
            negative: termNeg,
            ratio:
              termNeg > 0
                ? Math.round((termPos / termNeg) * 100) / 100
                : termPos,
          },
          detentions_scheduled: 0,
          active_exclusions: activeExcl,
          slt_referrals_today: sltToday,
          category_breakdown: {
            positive: Object.entries(posCats)
              .sort((a, b) => b[1] - a[1])
              .map(([category, count]) => ({ category, count })),
            negative: Object.entries(negCats)
              .sort((a, b) => b[1] - a[1])
              .map(([category, count]) => ({ category, count })),
          },
          exclusion_summary: {
            fixed_term_this_term: fteCount,
            permanent_this_term: pexCount,
            lunchtime_this_term: 0,
            managed_moves: 0,
            total_days_lost: totalDaysLost,
            pupils_excluded: excludedPupils,
          },
          repeat_offenders: repeatOffenders,
          demo: false,
          data_source: "mis",
        });
      }
    } catch (misErr) {
      console.warn("[behaviour/dashboard] MIS read failed:", misErr);
    }

    return apiSuccess(generateDemoStats());
  }

  // If we have real data, compute stats
  const todayPositive = todayIncidents.filter(
    (i) => i.type === "positive",
  ).length;
  const todayNegative = todayIncidents.filter(
    (i) => i.type === "negative",
  ).length;

  const { data: weekIncidents } = await supabase
    .from("behaviour_incidents")
    .select("id, type, category")
    .eq("organization_id", organizationId)
    .gte("created_at", weekStartStr);

  const weekPositive =
    weekIncidents?.filter((i) => i.type === "positive").length || 0;
  const weekNegative =
    weekIncidents?.filter((i) => i.type === "negative").length || 0;

  const { data: activeExclusions } = await supabase
    .from("behaviour_exclusions")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("status", "active");

  return apiSuccess({
    today: {
      total: todayIncidents.length,
      positive: todayPositive,
      negative: todayNegative,
      ratio:
        todayNegative > 0
          ? Math.round((todayPositive / todayNegative) * 100) / 100
          : todayPositive,
    },
    this_week: {
      total: weekIncidents?.length || 0,
      positive: weekPositive,
      negative: weekNegative,
      ratio:
        weekNegative > 0
          ? Math.round((weekPositive / weekNegative) * 100) / 100
          : weekPositive,
    },
    active_exclusions: activeExclusions?.length || 0,
    demo: false,
  });
});
