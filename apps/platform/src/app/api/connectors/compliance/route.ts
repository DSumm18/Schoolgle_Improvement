import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

// GET /api/connectors/compliance - Get statutory connector compliance overview
// SLT+ only — contains per-staff training detail
export const GET = protectedRoute(async (auth) => {
  const supabase = createServiceRoleClient();

  // Run both queries in parallel
  const [typesResult, connectorsResult] = await Promise.all([
    supabase
      .from("connector_types")
      .select("*")
      .eq("is_statutory", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("staff_connectors")
      .select(`
        id, staff_id, connector_type_id, is_primary, scope, status,
        training_completed, training_expiry_date
      `)
      .eq("organization_id", auth.organizationId)
      .eq("status", "active"),
  ]);

  if (typesResult.error) {
    console.error("Error fetching connector types:", typesResult.error);
    return apiError("Failed to fetch compliance data", 500);
  }

  if (connectorsResult.error) {
    console.error("Error fetching connectors:", connectorsResult.error);
    return apiError("Failed to fetch compliance data", 500);
  }

  const types = typesResult.data || [];
  const connectors = connectorsResult.data || [];

  // Pre-parse expiry dates once and group connectors by type
  const now = new Date();
  const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const connectorsByType = new Map<string, typeof connectors>();
  for (const c of connectors) {
    const arr = connectorsByType.get(c.connector_type_id);
    if (arr) arr.push(c);
    else connectorsByType.set(c.connector_type_id, [c]);
  }

  // Build compliance + summary in a single pass
  const summary = { total_statutory: types.length, compliant: 0, at_risk: 0, expiring_soon: 0, non_compliant: 0 };

  const compliance = types.map((type: any) => {
    const typeConnectors = connectorsByType.get(type.id) || [];
    const activeCount = typeConnectors.length;
    let expiredTraining = 0;
    let expiringSoon = 0;

    // Single pass over connectors for this type — parse dates once
    for (const c of typeConnectors) {
      if (!c.training_expiry_date) continue;
      const expiry = new Date(c.training_expiry_date);
      if (expiry < now) expiredTraining++;
      else if (expiry <= ninetyDaysFromNow) expiringSoon++;
    }

    let status: string;
    if ((type.min_count && activeCount < type.min_count) || (activeCount === 0 && type.min_count > 0)) {
      status = "non_compliant";
    } else if (expiredTraining > 0) {
      status = "at_risk";
    } else if (expiringSoon > 0) {
      status = "expiring_soon";
    } else {
      status = "compliant";
    }

    // Accumulate summary counts inline
    summary[status as keyof typeof summary]++;

    return {
      connector_type: type,
      active_count: activeCount,
      expired_training_count: expiredTraining,
      expiring_soon_count: expiringSoon,
      compliance_status: status,
      holders: typeConnectors,
    };
  });

  return apiSuccess({ summary, compliance });
}, { requiredRole: "slt" });
