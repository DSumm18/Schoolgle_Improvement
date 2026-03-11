/**
 * Pupil Meal Registrations API
 *
 * GET  /api/school-meals/registrations?organizationId=xxx — List registrations (filter by year_group, meal_type, fsm)
 * POST /api/school-meals/registrations — Register/update a pupil
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

// Demo registrations: 210 pupils across R-Y6
function generateDemoRegistrations(organizationId: string) {
  const yearGroups = ["R", "1", "2", "3", "4", "5", "6"];
  const mealTypes = ["fsm", "uifsm", "paid", "packed_lunch", "home"];
  const dietaryOptions = [
    "Standard",
    "Vegetarian",
    "Vegan",
    "Halal",
    "Gluten-Free",
    "Dairy-Free",
  ];
  const allergies = [
    "Nuts",
    "Dairy",
    "Gluten",
    "Eggs",
    "Soya",
    "Fish",
    "Sesame",
  ];
  const firstNames = [
    "Pupil_A",
    "Pupil_B",
    "Pupil_C",
    "Pupil_D",
    "Pupil_E",
    "Pupil_F",
    "Pupil_G",
    "Pupil_H",
    "Pupil_I",
    "Pupil_J",
    "Pupil_K",
    "Pupil_L",
    "Pupil_M",
    "Pupil_N",
    "Pupil_O",
    "Pupil_P",
    "Pupil_Q",
    "Pupil_R",
    "Pupil_S",
    "Pupil_T",
    "Pupil_U",
    "Pupil_V",
    "Pupil_W",
    "Pupil_X",
    "Pupil_Y",
    "Pupil_Z",
    "Pupil_AA",
    "Pupil_AB",
    "Pupil_AC",
    "Pupil_AD",
  ];

  const registrations: any[] = [];
  let id = 1;

  // Distribution: 42 FSM, 63 UIFSM (KS1), 35 paid, 70 packed lunch, 0 home
  // Year groups R,1,2 = 30 each = 90 pupils (KS1) - UIFSM eligible
  // Year groups 3,4,5,6 = 30 each = 120 pupils (KS2)
  const distribution: Record<string, Record<string, number>> = {
    R: { uifsm: 21, fsm: 3, packed_lunch: 6, paid: 0, home: 0 },
    "1": { uifsm: 21, fsm: 3, packed_lunch: 6, paid: 0, home: 0 },
    "2": { uifsm: 21, fsm: 4, packed_lunch: 5, paid: 0, home: 0 },
    "3": { fsm: 8, paid: 9, packed_lunch: 13, home: 0, uifsm: 0 },
    "4": { fsm: 8, paid: 9, packed_lunch: 13, home: 0, uifsm: 0 },
    "5": { fsm: 8, paid: 9, packed_lunch: 13, home: 0, uifsm: 0 },
    "6": { fsm: 8, paid: 8, packed_lunch: 14, home: 0, uifsm: 0 },
  };

  for (const yg of yearGroups) {
    const dist = distribution[yg];
    let pupilIdx = 0;

    for (const [mealType, count] of Object.entries(dist)) {
      for (let i = 0; i < count; i++) {
        const nameIdx = pupilIdx % firstNames.length;
        const hasAllergy = Math.random() < 0.08; // ~8% have allergies
        const hasDietary = Math.random() < 0.15; // ~15% non-standard dietary
        const isFsmEligible =
          mealType === "fsm" || (mealType !== "uifsm" && Math.random() < 0.05);
        const isEver6 = isFsmEligible || Math.random() < 0.08;

        registrations.push({
          id: `demo-${id}`,
          organization_id: organizationId,
          pupil_name_pseudonymised: `${firstNames[nameIdx]}_Y${yg}_${id}`,
          year_group: yg,
          meal_type: mealType,
          fsm_eligible: isFsmEligible,
          ever_6_fsm: isEver6,
          uifsm_eligible: ["R", "1", "2"].includes(yg),
          dietary_requirement: hasDietary
            ? dietaryOptions[Math.floor(Math.random() * dietaryOptions.length)]
            : "Standard",
          allergies: hasAllergy
            ? [allergies[Math.floor(Math.random() * allergies.length)]]
            : [],
          start_date: "2025-09-01",
          status: "active",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        id++;
        pupilIdx++;
      }
    }
  }

  return registrations;
}

export const GET = protectedRoute(async (auth, request: NextRequest) => {
  const { organizationId } = auth;
  const { searchParams } = new URL(request.url);

  const yearGroup = searchParams.get("year_group");
  const mealType = searchParams.get("meal_type");
  const fsmOnly = searchParams.get("fsm") === "true";
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "50");

  try {
    const supabase = createServiceRoleClient();

    let query = supabase
      .from("pupil_meal_registrations")
      .select("*", { count: "exact" })
      .eq("organization_id", organizationId)
      .eq("status", "active");

    if (yearGroup) query = query.eq("year_group", yearGroup);
    if (mealType) query = query.eq("meal_type", mealType);
    if (fsmOnly) query = query.eq("fsm_eligible", true);

    query = query
      .order("year_group", { ascending: true })
      .order("pupil_name_pseudonymised", { ascending: true })
      .range((page - 1) * pageSize, page * pageSize - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("[school-meals/registrations] DB error:", error.message);
    }

    if (data && data.length > 0) {
      return apiSuccess({
        registrations: data,
        total: count || data.length,
        page,
        pageSize,
        isDemo: false,
      });
    }

    // Fallback: demo data
    let demoData = generateDemoRegistrations(organizationId);

    // Apply filters to demo data
    if (yearGroup)
      demoData = demoData.filter((r) => r.year_group === yearGroup);
    if (mealType) demoData = demoData.filter((r) => r.meal_type === mealType);
    if (fsmOnly) demoData = demoData.filter((r) => r.fsm_eligible);

    const total = demoData.length;
    const paged = demoData.slice((page - 1) * pageSize, page * pageSize);

    return apiSuccess({
      registrations: paged,
      total,
      page,
      pageSize,
      isDemo: true,
    });
  } catch (err: any) {
    console.error("[school-meals/registrations] Error:", err.message);
    const demoData = generateDemoRegistrations(organizationId);
    return apiSuccess({
      registrations: demoData.slice(0, pageSize),
      total: demoData.length,
      page: 1,
      pageSize,
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

      const registration = {
        organization_id: organizationId,
        pupil_name_pseudonymised: body.pupil_name_pseudonymised,
        year_group: body.year_group,
        meal_type: body.meal_type,
        fsm_eligible: body.fsm_eligible ?? false,
        ever_6_fsm: body.ever_6_fsm ?? false,
        uifsm_eligible: body.uifsm_eligible ?? false,
        dietary_requirement: body.dietary_requirement ?? "Standard",
        allergies: body.allergies ?? [],
        start_date: body.start_date ?? new Date().toISOString().split("T")[0],
        status: "active",
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("pupil_meal_registrations")
        .upsert(registration, {
          onConflict: "organization_id,pupil_name_pseudonymised",
        })
        .select()
        .single();

      if (error) {
        return apiError("Failed to save registration: " + error.message, 500);
      }

      return apiSuccess({ registration: data }, 201);
    } catch (err: any) {
      return apiError("Failed to create registration: " + err.message, 500);
    }
  },
  { requiredRole: "teacher" },
);
