/**
 * Daily Meal Orders API
 *
 * GET  /api/school-meals/orders?organizationId=xxx — Get daily orders (filter by date range)
 * POST /api/school-meals/orders — Record daily counts
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

// Generate 2 weeks of demo daily orders
function generateDemoOrders(organizationId: string) {
  const yearGroups = ["R", "1", "2", "3", "4", "5", "6"];
  const orders: any[] = [];
  const today = new Date();

  for (let dayOffset = 13; dayOffset >= 0; dayOffset--) {
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);

    // Skip weekends
    const dow = date.getDay();
    if (dow === 0 || dow === 6) continue;

    const dateStr = date.toISOString().split("T")[0];

    for (const yg of yearGroups) {
      const isKS1 = ["R", "1", "2"].includes(yg);
      const totalPupils = 30;

      // KS1: higher uptake (~90%) due to UIFSM
      // KS2: lower uptake (~65%)
      const uptakeRate = isKS1
        ? 0.88 + Math.random() * 0.08
        : 0.6 + Math.random() * 0.12;
      const totalSchoolMeals = Math.round(totalPupils * uptakeRate);
      const packedLunch = totalPupils - totalSchoolMeals;

      // Slight variation for meals ordered vs served (waste tracking)
      const wasteRate = 0.02 + Math.random() * 0.04; // 2-6% waste
      const mealsServed = Math.round(totalSchoolMeals * (1 - wasteRate));

      let fsmCount: number, uifsmCount: number, paidCount: number;

      if (isKS1) {
        fsmCount = Math.round(3 + Math.random() * 2);
        uifsmCount = totalSchoolMeals - fsmCount;
        paidCount = 0;
      } else {
        fsmCount = Math.round(6 + Math.random() * 4);
        paidCount = totalSchoolMeals - fsmCount;
        uifsmCount = 0;
      }

      orders.push({
        id: `demo-${dateStr}-${yg}`,
        organization_id: organizationId,
        date: dateStr,
        year_group: yg,
        total_pupils: totalPupils,
        school_meals_ordered: totalSchoolMeals,
        school_meals_served: mealsServed,
        fsm_count: fsmCount,
        uifsm_count: uifsmCount,
        paid_count: paidCount,
        packed_lunch_count: packedLunch,
        absent_count: Math.round(Math.random() * 3),
        vegetarian_count: Math.round(totalSchoolMeals * 0.15),
        halal_count: Math.round(totalSchoolMeals * 0.08),
        other_dietary_count: Math.round(totalSchoolMeals * 0.03),
        waste_kg: parseFloat((Math.random() * 2 + 0.5).toFixed(1)),
        notes: "",
        created_at: new Date().toISOString(),
      });
    }
  }

  return orders;
}

export const GET = protectedRoute(async (auth, request: NextRequest) => {
  const { organizationId } = auth;
  const { searchParams } = new URL(request.url);

  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");
  const yearGroup = searchParams.get("year_group");

  try {
    const supabase = createServiceRoleClient();

    let query = supabase
      .from("daily_meal_orders")
      .select("*")
      .eq("organization_id", organizationId);

    if (dateFrom) query = query.gte("date", dateFrom);
    if (dateTo) query = query.lte("date", dateTo);
    if (yearGroup) query = query.eq("year_group", yearGroup);

    query = query
      .order("date", { ascending: false })
      .order("year_group", { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error("[school-meals/orders] DB error:", error.message);
    }

    if (data && data.length > 0) {
      return apiSuccess({ orders: data, isDemo: false });
    }

    // Fallback: demo data
    let demoOrders = generateDemoOrders(organizationId);

    if (dateFrom) demoOrders = demoOrders.filter((o) => o.date >= dateFrom);
    if (dateTo) demoOrders = demoOrders.filter((o) => o.date <= dateTo);
    if (yearGroup)
      demoOrders = demoOrders.filter((o) => o.year_group === yearGroup);

    return apiSuccess({ orders: demoOrders, isDemo: true });
  } catch (err: any) {
    console.error("[school-meals/orders] Error:", err.message);
    return apiSuccess({
      orders: generateDemoOrders(organizationId),
      isDemo: true,
    });
  }
});

export const POST = protectedRoute(
  async (auth, request: NextRequest) => {
    const { organizationId } = auth;

    try {
      const body = await request.json();
      const supabase = createServiceRoleClient();

      // Can post a single order or batch
      const orders = Array.isArray(body.orders) ? body.orders : [body];

      const orderRecords = orders.map((o: any) => ({
        organization_id: organizationId,
        date: o.date,
        year_group: o.year_group,
        total_pupils: o.total_pupils,
        school_meals_ordered: o.school_meals_ordered,
        school_meals_served: o.school_meals_served ?? o.school_meals_ordered,
        fsm_count: o.fsm_count ?? 0,
        uifsm_count: o.uifsm_count ?? 0,
        paid_count: o.paid_count ?? 0,
        packed_lunch_count: o.packed_lunch_count ?? 0,
        absent_count: o.absent_count ?? 0,
        vegetarian_count: o.vegetarian_count ?? 0,
        halal_count: o.halal_count ?? 0,
        other_dietary_count: o.other_dietary_count ?? 0,
        waste_kg: o.waste_kg ?? 0,
        notes: o.notes ?? "",
      }));

      const { data, error } = await supabase
        .from("daily_meal_orders")
        .upsert(orderRecords, { onConflict: "organization_id,date,year_group" })
        .select();

      if (error) {
        return apiError("Failed to save orders: " + error.message, 500);
      }

      return apiSuccess({ orders: data }, 201);
    } catch (err: any) {
      return apiError("Failed to record orders: " + err.message, 500);
    }
  },
  { requiredRole: "teacher" },
);
