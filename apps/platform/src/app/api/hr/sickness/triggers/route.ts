import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * GET /api/hr/sickness/triggers
 * Get organization trigger configuration.
 */
export const GET = protectedRoute(async (auth) => {
  const supabase = createServiceRoleClient();

  const { data: triggers, error } = await supabase
    .from("sickness_trigger_config")
    .select("*")
    .eq("organization_id", auth.organizationId)
    .order("trigger_name");

  if (error) {
    console.error("Error fetching triggers:", error);
    return apiError("Failed to fetch trigger config", 500);
  }

  return apiSuccess({ triggers: triggers || [] });
});

/**
 * PUT /api/hr/sickness/triggers
 * Update trigger thresholds for an organization.
 * Body: { triggers: Array<{ trigger_name, trigger_value, review_period_months, action_required, is_active }> }
 */
export const PUT = protectedRoute(
  async (auth, request: NextRequest) => {
    const body = await request.json();
    const { triggers } = body;

    if (!Array.isArray(triggers) || triggers.length === 0) {
      return apiError("triggers array is required", 400);
    }

    const supabase = createServiceRoleClient();
    const results: any[] = [];

    for (const t of triggers) {
      if (!t.trigger_name || t.trigger_value == null) {
        continue;
      }

      const { data, error } = await supabase
        .from("sickness_trigger_config")
        .upsert(
          {
            organization_id: auth.organizationId,
            trigger_name: t.trigger_name,
            trigger_value: t.trigger_value,
            review_period_months: t.review_period_months ?? 12,
            action_required: t.action_required ?? "informal_review",
            is_active: t.is_active ?? true,
          },
          { onConflict: "organization_id,trigger_name" },
        )
        .select()
        .single();

      if (error) {
        console.error("Error upserting trigger:", error);
      } else if (data) {
        results.push(data);
      }
    }

    return apiSuccess({ triggers: results });
  },
  { requiredRole: "slt" },
);
