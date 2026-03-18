/**
 * Behaviour Patterns API
 *
 * GET /api/behaviour/patterns - Pattern analysis data
 */

import { protectedRoute, apiSuccess } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

function generateDemoPatterns() {
  return {
    by_day_of_week: [
      { day: "Monday", positive: 52, negative: 22 },
      { day: "Tuesday", positive: 48, negative: 18 },
      { day: "Wednesday", positive: 56, negative: 16 },
      { day: "Thursday", positive: 44, negative: 24 },
      { day: "Friday", positive: 48, negative: 18 },
    ],
    by_lesson_period: [
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
    by_staff: [
      { staff: "Mrs J. Hartley", positive: 42, negative: 8 },
      { staff: "Mr A. Singh", positive: 36, negative: 12 },
      { staff: "Miss L. Cooper", positive: 38, negative: 6 },
      { staff: "Mr D. Thompson", positive: 28, negative: 18 },
      { staff: "Mrs S. Williams", positive: 44, negative: 4 },
      { staff: "Ms R. Chen", positive: 32, negative: 14 },
      { staff: "Mr K. Okafor", positive: 18, negative: 22 },
      { staff: "Mrs P. Davies", positive: 10, negative: 14 },
    ],
    hotspot_locations: [
      { location: "Corridor - Main", incidents: 18, severity_avg: 2.4 },
      { location: "Playground", incidents: 16, severity_avg: 1.8 },
      { location: "Dining Hall", incidents: 14, severity_avg: 2.1 },
      { location: "Sports Hall", incidents: 8, severity_avg: 2.6 },
      { location: "ICT Suite", incidents: 6, severity_avg: 1.5 },
    ],
    by_year_group: [
      { year_group: 7, positive: 48, negative: 12 },
      { year_group: 8, positive: 42, negative: 16 },
      { year_group: 9, positive: 38, negative: 22 },
      { year_group: 10, positive: 52, negative: 28 },
      { year_group: 11, positive: 44, negative: 14 },
      { year_group: 12, positive: 16, negative: 4 },
      { year_group: 13, positive: 8, negative: 2 },
    ],
    trends: {
      weeks: [
        { week: "W1", positive: 42, negative: 16 },
        { week: "W2", positive: 48, negative: 14 },
        { week: "W3", positive: 44, negative: 18 },
        { week: "W4", positive: 52, negative: 12 },
        { week: "W5", positive: 56, negative: 16 },
        { week: "W6", positive: 62, negative: 17 },
      ],
    },
    demo: true,
  };
}

export const GET = protectedRoute(async (auth) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();

  // Check if real data exists
  const { data, error } = await supabase
    .from("behaviour_incidents")
    .select("id")
    .eq("organization_id", organizationId)
    .limit(1);

  if (error || !data || data.length === 0) {
    // Try MIS resolver before falling back to demo
    try {
      const { getMISDataServiceForOrg } =
        await import("@/lib/mis/data-service");
      const mis = await getMISDataServiceForOrg(organizationId);
      const behaviourResult = await mis.read(organizationId, "behaviour");

      if (behaviourResult.data.length > 0) {
        const misIncidents = behaviourResult.data as any[];

        // Map MIS data to the same shape used by the aggregation below
        const incidents = misIncidents.map((r: any) => ({
          type: (r.type as string).toLowerCase(),
          category: r.category,
          location: r.location,
          lesson_period: null as string | null,
          reported_by: r.recorded_by,
          year_group: r.year_group,
          created_at:
            r.date && r.time
              ? `${r.date}T${r.time}:00.000Z`
              : r.date
                ? `${r.date}T00:00:00.000Z`
                : new Date().toISOString(),
        }));

        // Aggregate by day of week
        const dayMap: Record<string, { positive: number; negative: number }> =
          {};
        const days = [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ];
        for (const inc of incidents) {
          const day = days[new Date(inc.created_at).getDay()];
          if (!dayMap[day]) dayMap[day] = { positive: 0, negative: 0 };
          dayMap[day][inc.type as "positive" | "negative"]++;
        }

        // Aggregate by staff
        const staffMap: Record<string, { positive: number; negative: number }> =
          {};
        for (const inc of incidents) {
          const s = inc.reported_by || "Unknown";
          if (!staffMap[s]) staffMap[s] = { positive: 0, negative: 0 };
          staffMap[s][inc.type as "positive" | "negative"]++;
        }

        // Aggregate by location (negative only for hotspots)
        const locMap: Record<string, number> = {};
        for (const inc of incidents.filter((i) => i.type === "negative")) {
          const l = inc.location || "Unknown";
          locMap[l] = (locMap[l] || 0) + 1;
        }

        // Aggregate by year group
        const ygMap: Record<number, { positive: number; negative: number }> =
          {};
        for (const inc of incidents) {
          const yg = inc.year_group || 0;
          if (!ygMap[yg]) ygMap[yg] = { positive: 0, negative: 0 };
          ygMap[yg][inc.type as "positive" | "negative"]++;
        }

        return apiSuccess({
          by_day_of_week: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
          ].map((d) => ({
            day: d,
            ...(dayMap[d] || { positive: 0, negative: 0 }),
          })),
          by_lesson_period: [], // MIS data doesn't include lesson period
          by_staff: Object.entries(staffMap).map(([staff, counts]) => ({
            staff,
            ...counts,
          })),
          hotspot_locations: Object.entries(locMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([location, incidents]) => ({
              location,
              incidents,
              severity_avg: 0,
            })),
          by_year_group: Object.entries(ygMap)
            .map(([yg, counts]) => ({
              year_group: parseInt(yg),
              ...counts,
            }))
            .sort((a, b) => a.year_group - b.year_group),
          demo: false,
          data_source: "mis",
        });
      }
    } catch (misErr) {
      console.warn("[behaviour/patterns] MIS read failed:", misErr);
    }

    return apiSuccess(generateDemoPatterns());
  }

  // With real data, aggregate patterns
  const { data: incidents } = await supabase
    .from("behaviour_incidents")
    .select(
      "type, category, location, lesson_period, reported_by, year_group, created_at",
    )
    .eq("organization_id", organizationId)
    .gte("created_at", new Date(Date.now() - 42 * 86400000).toISOString());

  if (!incidents || incidents.length === 0) {
    return apiSuccess(generateDemoPatterns());
  }

  // Aggregate by day of week
  const dayMap: Record<string, { positive: number; negative: number }> = {};
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  for (const inc of incidents) {
    const day = days[new Date(inc.created_at).getDay()];
    if (!dayMap[day]) dayMap[day] = { positive: 0, negative: 0 };
    dayMap[day][inc.type as "positive" | "negative"]++;
  }

  // Aggregate by lesson period
  const periodMap: Record<string, { positive: number; negative: number }> = {};
  for (const inc of incidents) {
    const p = inc.lesson_period || "Unknown";
    if (!periodMap[p]) periodMap[p] = { positive: 0, negative: 0 };
    periodMap[p][inc.type as "positive" | "negative"]++;
  }

  // Aggregate by staff
  const staffMap: Record<string, { positive: number; negative: number }> = {};
  for (const inc of incidents) {
    const s = inc.reported_by || "Unknown";
    if (!staffMap[s]) staffMap[s] = { positive: 0, negative: 0 };
    staffMap[s][inc.type as "positive" | "negative"]++;
  }

  // Aggregate by location (negative only for hotspots)
  const locMap: Record<string, number> = {};
  for (const inc of incidents.filter((i) => i.type === "negative")) {
    const l = inc.location || "Unknown";
    locMap[l] = (locMap[l] || 0) + 1;
  }

  return apiSuccess({
    by_day_of_week: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
    ].map((d) => ({ day: d, ...(dayMap[d] || { positive: 0, negative: 0 }) })),
    by_lesson_period: Object.entries(periodMap).map(([period, counts]) => ({
      period,
      ...counts,
    })),
    by_staff: Object.entries(staffMap).map(([staff, counts]) => ({
      staff,
      ...counts,
    })),
    hotspot_locations: Object.entries(locMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([location, incidents]) => ({
        location,
        incidents,
        severity_avg: 0,
      })),
    demo: false,
  });
});
