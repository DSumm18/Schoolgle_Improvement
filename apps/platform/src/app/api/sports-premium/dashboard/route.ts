/**
 * Sports Premium Dashboard API
 *
 * GET /api/sports-premium/dashboard — Overview: funding, spend by indicator, swimming, impact
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

// ─── Demo Dashboard Data ─────────────────────────────────────────────

const DEMO_DASHBOARD = {
  strategy: {
    id: "demo-strategy-2025-26",
    academic_year: "2025-26",
    total_funding: 17100,
    base_funding: 16000,
    per_pupil_funding: 10,
    pupil_count: 210,
    headteacher_name: "Mrs Sarah Johnson",
    pe_lead_name: "Mr James Williams",
    status: "active",
  },
  funding: {
    total: 17100,
    budgeted: 17100,
    actual_spent: 15570,
    remaining: 1530,
    percent_spent: 91,
  },
  indicators: [
    {
      number: 1,
      name: "Engagement of all pupils in regular physical activity",
      short_name: "Engagement",
      budgeted: 6000,
      actual: 5450,
      item_count: 2,
      status: "on_track",
    },
    {
      number: 2,
      name: "The profile of PE and sport is raised across the school",
      short_name: "Profile",
      budgeted: 1200,
      actual: 1100,
      item_count: 2,
      status: "on_track",
    },
    {
      number: 3,
      name: "Increased confidence, knowledge and skills of all staff in teaching PE and sport",
      short_name: "Staff Knowledge",
      budgeted: 5800,
      actual: 5380,
      item_count: 2,
      status: "on_track",
    },
    {
      number: 4,
      name: "Broader experience of a range of sports and activities offered to all pupils",
      short_name: "Broader Experience",
      budgeted: 2700,
      actual: 2500,
      item_count: 2,
      status: "on_track",
    },
    {
      number: 5,
      name: "Increased participation in competitive sport",
      short_name: "Competition",
      budgeted: 1400,
      actual: 1140,
      item_count: 2,
      status: "on_track",
    },
  ],
  swimming: {
    year_group: 6,
    cohort_size: 30,
    swim_25m_percent: 72,
    range_of_strokes_percent: 68,
    self_rescue_percent: 85,
    national_average_25m: 77,
    actions_taken:
      "Additional top-up swimming lessons provided for 12 pupils who had not met the 25m standard. Partnership with local leisure centre for weekly sessions.",
  },
  impact_summary: {
    total_items: 10,
    completed: 3,
    in_progress: 6,
    planned: 1,
    key_achievements: [
      "Pupil participation in regular physical activity increased from 35% to 62%",
      "Teacher confidence in delivering PE rose from 45% to 78%",
      "Teams entered in 8 competitions, up from 3 last year",
      "12 additional pupils achieved 25m swimming standard",
      "100% pupil participation in intra-school competitions",
    ],
    areas_for_development: [
      "Swimming attainment still below national average — continue top-up programme",
      "After-school club attendance lower for disadvantaged pupils — targeted outreach needed",
      "Y6 residential not yet confirmed for next year — book early",
    ],
  },
  _demo: true,
};

export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const url = new URL(request.url);
  const year = url.searchParams.get("year") || "2025-26";

  const supabase = createServiceRoleClient();

  // Try to fetch real strategy
  const { data: strategy } = await supabase
    .from("sports_premium_strategies")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("academic_year", year)
    .maybeSingle();

  // No real data — return demo
  if (!strategy) {
    return apiSuccess(DEMO_DASHBOARD);
  }

  // Fetch spend items
  const { data: spendItems } = await supabase
    .from("sports_premium_spend")
    .select("*")
    .eq("strategy_id", strategy.id)
    .order("indicator", { ascending: true });

  const items = spendItems || [];

  // Calculate indicator summaries
  const indicatorNames: Record<number, { name: string; short_name: string }> = {
    1: {
      name: "Engagement of all pupils in regular physical activity",
      short_name: "Engagement",
    },
    2: {
      name: "The profile of PE and sport is raised across the school",
      short_name: "Profile",
    },
    3: {
      name: "Increased confidence, knowledge and skills of all staff in teaching PE and sport",
      short_name: "Staff Knowledge",
    },
    4: {
      name: "Broader experience of a range of sports and activities offered to all pupils",
      short_name: "Broader Experience",
    },
    5: {
      name: "Increased participation in competitive sport",
      short_name: "Competition",
    },
  };

  const indicators = [1, 2, 3, 4, 5].map((num) => {
    const indicatorItems = items.filter((i: any) => i.indicator === num);
    const budgeted = indicatorItems.reduce(
      (sum: number, i: any) => sum + (i.budgeted_cost || 0),
      0,
    );
    const actual = indicatorItems.reduce(
      (sum: number, i: any) => sum + (i.actual_cost || 0),
      0,
    );
    return {
      number: num,
      ...indicatorNames[num],
      budgeted,
      actual,
      item_count: indicatorItems.length,
      status: actual <= budgeted ? "on_track" : "over_budget",
    };
  });

  const totalBudgeted = indicators.reduce((sum, i) => sum + i.budgeted, 0);
  const totalActual = indicators.reduce((sum, i) => sum + i.actual, 0);

  const completed = items.filter((i: any) => i.status === "completed").length;
  const inProgress = items.filter(
    (i: any) => i.status === "in_progress",
  ).length;
  const planned = items.filter((i: any) => i.status === "planned").length;

  return apiSuccess({
    strategy: {
      id: strategy.id,
      academic_year: strategy.academic_year,
      total_funding: strategy.total_funding,
      base_funding: strategy.base_funding,
      per_pupil_funding: strategy.per_pupil_funding,
      pupil_count: strategy.pupil_count,
      headteacher_name: strategy.headteacher_name,
      pe_lead_name: strategy.pe_lead_name,
      status: strategy.status,
    },
    funding: {
      total: strategy.total_funding,
      budgeted: totalBudgeted,
      actual_spent: totalActual,
      remaining: strategy.total_funding - totalActual,
      percent_spent:
        strategy.total_funding > 0
          ? Math.round((totalActual / strategy.total_funding) * 100)
          : 0,
    },
    indicators,
    swimming: {
      year_group: 6,
      cohort_size: strategy.pupil_count
        ? Math.round(strategy.pupil_count / 7)
        : 30,
      swim_25m_percent: strategy.swimming_25m_percent || 0,
      range_of_strokes_percent: strategy.swimming_strokes_percent || 0,
      self_rescue_percent: strategy.swimming_self_rescue_percent || 0,
      national_average_25m: 77,
    },
    impact_summary: {
      total_items: items.length,
      completed,
      in_progress: inProgress,
      planned,
      key_achievements: items
        .filter((i: any) => i.impact_notes)
        .map((i: any) => i.impact_notes)
        .slice(0, 5),
      areas_for_development: [],
    },
  });
});
