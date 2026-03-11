/**
 * School Meals Configuration API
 *
 * GET  /api/school-meals/config?organizationId=xxx — Get meals config
 * PUT  /api/school-meals/config — Update meals config
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

// Default configuration for demo mode
const DEFAULT_CONFIG = {
  id: "demo",
  organization_id: "demo",
  meal_price: 2.65,
  uifsm_enabled: true,
  uifsm_year_groups: ["R", "1", "2"],
  catering_provider: "School Kitchen",
  dietary_options: [
    "Standard",
    "Vegetarian",
    "Vegan",
    "Halal",
    "Kosher",
    "Gluten-Free",
    "Dairy-Free",
  ],
  allergy_tracking_enabled: true,
  waste_tracking_enabled: true,
  fsm_funding_per_meal: 2.53,
  uifsm_funding_per_meal: 2.53,
  academic_year: "2025-2026",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const GET = protectedRoute(async (auth) => {
  const { organizationId } = auth;

  try {
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from("school_meals_config")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[school-meals/config] DB error:", error.message);
    }

    // Return real data or demo config
    return apiSuccess({
      config: data || { ...DEFAULT_CONFIG, organization_id: organizationId },
      isDemo: !data,
    });
  } catch (err: any) {
    console.error("[school-meals/config] Error:", err.message);
    return apiSuccess({
      config: { ...DEFAULT_CONFIG, organization_id: organizationId },
      isDemo: true,
    });
  }
});

export const PUT = protectedRoute(
  async (auth, request: NextRequest) => {
    const { organizationId } = auth;

    try {
      const body = await request.json();
      const supabase = createServiceRoleClient();

      const configData = {
        organization_id: organizationId,
        meal_price: body.meal_price,
        uifsm_enabled: body.uifsm_enabled ?? true,
        uifsm_year_groups: body.uifsm_year_groups ?? ["R", "1", "2"],
        catering_provider: body.catering_provider,
        dietary_options: body.dietary_options,
        allergy_tracking_enabled: body.allergy_tracking_enabled ?? true,
        waste_tracking_enabled: body.waste_tracking_enabled ?? true,
        fsm_funding_per_meal: body.fsm_funding_per_meal ?? 2.53,
        uifsm_funding_per_meal: body.uifsm_funding_per_meal ?? 2.53,
        academic_year: body.academic_year ?? "2025-2026",
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("school_meals_config")
        .upsert(configData, { onConflict: "organization_id" })
        .select()
        .single();

      if (error) {
        return apiError("Failed to save config: " + error.message, 500);
      }

      return apiSuccess({ config: data });
    } catch (err: any) {
      return apiError("Failed to update config: " + err.message, 500);
    }
  },
  { requiredRole: "slt" },
);
