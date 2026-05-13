/**
 * Energy Anomalies API
 *
 * GET /api/estates/energy/anomalies — detected anomalies from real data, demo fallback
 */

import { protectedRoute, apiSuccess } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth) => {
  const supabase = createServiceRoleClient();
  const orgId = auth.organizationId;

  const { data: anomalies, error } = await supabase
    .from("energy_anomalies")
    .select(
      "id, anomaly_type, title, description, detected_date, estimated_waste_kwh, estimated_waste_cost, estimated_annual_cost, meter_id, status, evidence, task_id, created_at",
    )
    .eq("organization_id", orgId)
    .order("detected_date", { ascending: false });

  if (error) throw error;

  if (!anomalies || anomalies.length === 0) {
    return apiSuccess({
      demo: false,
      anomalies: [],
      total_annual_waste_cost: 0,
    });
  }

  const totalAnnualWaste = anomalies
    .filter((a) => a.status !== "resolved")
    .reduce((s, a) => s + (Number(a.estimated_annual_cost) || 0), 0);

  // Add severity based on waste cost
  const enriched = anomalies.map((a) => {
    const wasteCost = Number(a.estimated_waste_cost) || 0;
    const evidence = a.evidence as { multiplier?: number } | null;
    const multiplier = evidence?.multiplier ?? 1;
    let severity: string = "medium";
    if (multiplier >= 4 || wasteCost >= 150) severity = "critical";
    else if (multiplier >= 3 || wasteCost >= 50) severity = "high";
    else if (wasteCost < 25) severity = "low";
    return { ...a, severity };
  });

  return apiSuccess({
    demo: false,
    anomalies: enriched,
    total_annual_waste_cost: totalAnnualWaste,
  });
});
