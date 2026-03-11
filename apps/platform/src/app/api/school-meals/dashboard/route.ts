/**
 * School Meals Dashboard API
 *
 * GET /api/school-meals/dashboard?organizationId=xxx — Overview stats:
 *   FSM/UIFSM counts, uptake %, dietary requirements, daily trends, Ever 6 FSM
 */

import { protectedRoute, apiSuccess } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

interface DashboardData {
  totalPupils: number;
  totalOnSchoolMeals: number;
  schoolMealUptakePct: number;
  fsmEligibleCount: number;
  uifsmCount: number;
  ever6FsmCount: number;
  paidMealsCount: number;
  packedLunchCount: number;
  mealPrice: number;
  dailyOrdersToday: number;
  byYearGroup: {
    yearGroup: string;
    total: number;
    fsm: number;
    uifsm: number;
    paid: number;
    packedLunch: number;
    uptakePct: number;
  }[];
  dietarySummary: { requirement: string; count: number }[];
  allergySummary: { allergy: string; count: number }[];
  dailyTrends: {
    date: string;
    ordered: number;
    served: number;
    wasteKg: number;
  }[];
  financials: {
    fsmFundingDaily: number;
    uifsmFundingDaily: number;
    paidIncomeDaily: number;
    totalDailyIncome: number;
    estimatedTermIncome: number;
    estimatedAnnualIncome: number;
  };
  nationalBenchmarks: {
    ks1UptakePct: number;
    ks2UptakePct: number;
    schoolKs1UptakePct: number;
    schoolKs2UptakePct: number;
  };
  isDemo: boolean;
}

function generateDemoDashboard(organizationId: string): DashboardData {
  const mealPrice = 2.65;
  const fsmFunding = 2.53;
  const uifsmFunding = 2.53;

  // Year group distribution
  const yearGroups = [
    { yearGroup: "R", total: 30, fsm: 3, uifsm: 21, paid: 0, packedLunch: 6 },
    { yearGroup: "1", total: 30, fsm: 3, uifsm: 21, paid: 0, packedLunch: 6 },
    { yearGroup: "2", total: 30, fsm: 4, uifsm: 21, paid: 0, packedLunch: 5 },
    { yearGroup: "3", total: 30, fsm: 8, uifsm: 0, paid: 9, packedLunch: 13 },
    { yearGroup: "4", total: 30, fsm: 8, uifsm: 0, paid: 9, packedLunch: 13 },
    { yearGroup: "5", total: 30, fsm: 8, uifsm: 0, paid: 9, packedLunch: 13 },
    { yearGroup: "6", total: 30, fsm: 8, uifsm: 0, paid: 8, packedLunch: 14 },
  ];

  const byYearGroup = yearGroups.map((yg) => ({
    ...yg,
    uptakePct: Math.round(((yg.fsm + yg.uifsm + yg.paid) / yg.total) * 100),
  }));

  const totalPupils = 210;
  const fsmEligibleCount = 42;
  const uifsmCount = 63;
  const paidMealsCount = 35;
  const packedLunchCount = 70;
  const totalOnSchoolMeals = fsmEligibleCount + uifsmCount + paidMealsCount; // 140
  const ever6FsmCount = 56; // Includes former FSM pupils

  // Daily trends: 2 weeks of weekday data
  const dailyTrends: DashboardData["dailyTrends"] = [];
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dow = date.getDay();
    if (dow === 0 || dow === 6) continue;

    const baseOrdered = 130 + Math.round(Math.random() * 20);
    const wasteRate = 0.02 + Math.random() * 0.04;

    dailyTrends.push({
      date: date.toISOString().split("T")[0],
      ordered: baseOrdered,
      served: Math.round(baseOrdered * (1 - wasteRate)),
      wasteKg: parseFloat((Math.random() * 8 + 2).toFixed(1)),
    });
  }

  // Dietary requirements summary
  const dietarySummary = [
    { requirement: "Standard", count: 160 },
    { requirement: "Vegetarian", count: 22 },
    { requirement: "Halal", count: 15 },
    { requirement: "Vegan", count: 5 },
    { requirement: "Gluten-Free", count: 4 },
    { requirement: "Dairy-Free", count: 4 },
  ];

  // Allergy summary
  const allergySummary = [
    { allergy: "Nuts", count: 6 },
    { allergy: "Dairy", count: 4 },
    { allergy: "Gluten", count: 3 },
    { allergy: "Eggs", count: 2 },
    { allergy: "Soya", count: 1 },
  ];

  // Financial summary
  const fsmFundingDaily = fsmEligibleCount * fsmFunding;
  const uifsmFundingDaily = uifsmCount * uifsmFunding;
  const paidIncomeDaily = paidMealsCount * mealPrice;
  const totalDailyIncome =
    fsmFundingDaily + uifsmFundingDaily + paidIncomeDaily;

  // KS1 uptake
  const ks1Total = 90;
  const ks1Meals = 3 + 3 + 4 + 21 + 21 + 21; // fsm + uifsm
  const ks2Total = 120;
  const ks2Meals = 8 * 4 + 9 * 3 + 8; // fsm + paid for Y3-6

  return {
    totalPupils,
    totalOnSchoolMeals,
    schoolMealUptakePct: Math.round((totalOnSchoolMeals / totalPupils) * 100),
    fsmEligibleCount,
    uifsmCount,
    ever6FsmCount,
    paidMealsCount,
    packedLunchCount,
    mealPrice,
    dailyOrdersToday:
      dailyTrends.length > 0 ? dailyTrends[dailyTrends.length - 1].ordered : 0,
    byYearGroup,
    dietarySummary,
    allergySummary,
    dailyTrends,
    financials: {
      fsmFundingDaily,
      uifsmFundingDaily,
      paidIncomeDaily,
      totalDailyIncome,
      estimatedTermIncome: Math.round(totalDailyIncome * 65), // ~65 school days per term
      estimatedAnnualIncome: Math.round(totalDailyIncome * 190), // ~190 school days
    },
    nationalBenchmarks: {
      ks1UptakePct: 86,
      ks2UptakePct: 67,
      schoolKs1UptakePct: Math.round((ks1Meals / ks1Total) * 100),
      schoolKs2UptakePct: Math.round((ks2Meals / ks2Total) * 100),
    },
    isDemo: true,
  };
}

export const GET = protectedRoute(async (auth, _request: NextRequest) => {
  const { organizationId } = auth;

  try {
    const supabase = createServiceRoleClient();

    // Try to fetch real registration data
    const { data: registrations, error: regError } = await supabase
      .from("pupil_meal_registrations")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("status", "active");

    if (regError) {
      console.error(
        "[school-meals/dashboard] Registrations error:",
        regError.message,
      );
    }

    // If no real data, return demo
    if (!registrations || registrations.length === 0) {
      return apiSuccess(generateDemoDashboard(organizationId));
    }

    // Build dashboard from real data
    const { data: config } = await supabase
      .from("school_meals_config")
      .select("*")
      .eq("organization_id", organizationId)
      .maybeSingle();

    const mealPrice = config?.meal_price ?? 2.65;
    const fsmFunding = config?.fsm_funding_per_meal ?? 2.53;
    const uifsmFunding = config?.uifsm_funding_per_meal ?? 2.53;

    const totalPupils = registrations.length;
    const fsmEligible = registrations.filter((r: any) => r.fsm_eligible);
    const uifsm = registrations.filter((r: any) => r.meal_type === "uifsm");
    const paid = registrations.filter((r: any) => r.meal_type === "paid");
    const packedLunch = registrations.filter(
      (r: any) => r.meal_type === "packed_lunch",
    );
    const ever6 = registrations.filter((r: any) => r.ever_6_fsm);
    const totalOnSchoolMeals = registrations.filter((r: any) =>
      ["fsm", "uifsm", "paid"].includes(r.meal_type),
    ).length;

    // By year group
    const yearGroups = ["R", "1", "2", "3", "4", "5", "6"];
    const byYearGroup = yearGroups.map((yg) => {
      const inYg = registrations.filter((r: any) => r.year_group === yg);
      const fsm = inYg.filter((r: any) => r.meal_type === "fsm").length;
      const uifsmYg = inYg.filter((r: any) => r.meal_type === "uifsm").length;
      const paidYg = inYg.filter((r: any) => r.meal_type === "paid").length;
      const plYg = inYg.filter(
        (r: any) => r.meal_type === "packed_lunch",
      ).length;
      const meals = fsm + uifsmYg + paidYg;
      return {
        yearGroup: yg,
        total: inYg.length,
        fsm,
        uifsm: uifsmYg,
        paid: paidYg,
        packedLunch: plYg,
        uptakePct:
          inYg.length > 0 ? Math.round((meals / inYg.length) * 100) : 0,
      };
    });

    // Dietary summary
    const dietaryMap = new Map<string, number>();
    registrations.forEach((r: any) => {
      const req = r.dietary_requirement || "Standard";
      dietaryMap.set(req, (dietaryMap.get(req) || 0) + 1);
    });
    const dietarySummary = Array.from(dietaryMap.entries())
      .map(([requirement, count]) => ({ requirement, count }))
      .sort((a, b) => b.count - a.count);

    // Allergy summary
    const allergyMap = new Map<string, number>();
    registrations.forEach((r: any) => {
      if (r.allergies && Array.isArray(r.allergies)) {
        r.allergies.forEach((a: string) => {
          allergyMap.set(a, (allergyMap.get(a) || 0) + 1);
        });
      }
    });
    const allergySummary = Array.from(allergyMap.entries())
      .map(([allergy, count]) => ({ allergy, count }))
      .sort((a, b) => b.count - a.count);

    // Daily trends from orders
    const today = new Date();
    const twoWeeksAgo = new Date(today);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const { data: orders } = await supabase
      .from("daily_meal_orders")
      .select("*")
      .eq("organization_id", organizationId)
      .gte("date", twoWeeksAgo.toISOString().split("T")[0])
      .order("date", { ascending: true });

    const dailyTrends: DashboardData["dailyTrends"] = [];
    if (orders && orders.length > 0) {
      const byDate = new Map<
        string,
        { ordered: number; served: number; wasteKg: number }
      >();
      orders.forEach((o: any) => {
        const existing = byDate.get(o.date) || {
          ordered: 0,
          served: 0,
          wasteKg: 0,
        };
        existing.ordered += o.school_meals_ordered || 0;
        existing.served += o.school_meals_served || 0;
        existing.wasteKg += o.waste_kg || 0;
        byDate.set(o.date, existing);
      });
      byDate.forEach((val, date) => {
        dailyTrends.push({ date, ...val });
      });
    }

    // Financial
    const fsmFundingDaily = fsmEligible.length * fsmFunding;
    const uifsmFundingDaily = uifsm.length * uifsmFunding;
    const paidIncomeDaily = paid.length * mealPrice;
    const totalDailyIncome =
      fsmFundingDaily + uifsmFundingDaily + paidIncomeDaily;

    // KS1/KS2 benchmarks
    const ks1Regs = registrations.filter((r: any) =>
      ["R", "1", "2"].includes(r.year_group),
    );
    const ks1Meals = ks1Regs.filter((r: any) =>
      ["fsm", "uifsm", "paid"].includes(r.meal_type),
    ).length;
    const ks2Regs = registrations.filter((r: any) =>
      ["3", "4", "5", "6"].includes(r.year_group),
    );
    const ks2Meals = ks2Regs.filter((r: any) =>
      ["fsm", "uifsm", "paid"].includes(r.meal_type),
    ).length;

    const dashboard: DashboardData = {
      totalPupils,
      totalOnSchoolMeals,
      schoolMealUptakePct:
        totalPupils > 0
          ? Math.round((totalOnSchoolMeals / totalPupils) * 100)
          : 0,
      fsmEligibleCount: fsmEligible.length,
      uifsmCount: uifsm.length,
      ever6FsmCount: ever6.length,
      paidMealsCount: paid.length,
      packedLunchCount: packedLunch.length,
      mealPrice,
      dailyOrdersToday:
        dailyTrends.length > 0
          ? dailyTrends[dailyTrends.length - 1].ordered
          : totalOnSchoolMeals,
      byYearGroup,
      dietarySummary,
      allergySummary,
      dailyTrends,
      financials: {
        fsmFundingDaily,
        uifsmFundingDaily,
        paidIncomeDaily,
        totalDailyIncome,
        estimatedTermIncome: Math.round(totalDailyIncome * 65),
        estimatedAnnualIncome: Math.round(totalDailyIncome * 190),
      },
      nationalBenchmarks: {
        ks1UptakePct: 86,
        ks2UptakePct: 67,
        schoolKs1UptakePct:
          ks1Regs.length > 0
            ? Math.round((ks1Meals / ks1Regs.length) * 100)
            : 0,
        schoolKs2UptakePct:
          ks2Regs.length > 0
            ? Math.round((ks2Meals / ks2Regs.length) * 100)
            : 0,
      },
      isDemo: false,
    };

    return apiSuccess(dashboard);
  } catch (err: any) {
    console.error("[school-meals/dashboard] Error:", err.message);
    return apiSuccess(generateDemoDashboard(organizationId));
  }
});
