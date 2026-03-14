import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

// GET /api/connectors/compliance - Get statutory connector compliance overview
export const GET = protectedRoute(async (auth) => {
  const supabase = createServiceRoleClient();

  // Get all statutory connector types
  const { data: types, error: typesError } = await supabase
    .from("connector_types")
    .select("*")
    .eq("is_statutory", true)
    .order("sort_order", { ascending: true });

  if (typesError) {
    console.error("Error fetching connector types:", typesError);
    return apiError(typesError.message, 500);
  }

  // Get all active connectors for this org
  const { data: connectors, error: connectorsError } = await supabase
    .from("staff_connectors")
    .select(`
      id, staff_id, connector_type_id, is_primary, scope, status,
      training_completed, training_expiry_date
    `)
    .eq("organization_id", auth.organizationId)
    .eq("status", "active");

  if (connectorsError) {
    console.error("Error fetching connectors:", connectorsError);
    return apiError(connectorsError.message, 500);
  }

  // Build compliance status for each statutory type
  const now = new Date();
  const ninetyDaysFromNow = new Date();
  ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

  const compliance = (types || []).map((type: any) => {
    const typeConnectors = (connectors || []).filter(
      (c: any) => c.connector_type_id === type.id
    );
    const activeCount = typeConnectors.length;
    const expiredTraining = typeConnectors.filter(
      (c: any) => c.training_expiry_date && new Date(c.training_expiry_date) < now
    ).length;
    const expiringSoon = typeConnectors.filter(
      (c: any) =>
        c.training_expiry_date &&
        new Date(c.training_expiry_date) >= now &&
        new Date(c.training_expiry_date) <= ninetyDaysFromNow
    ).length;

    let status: string;
    if (type.min_count && activeCount < type.min_count) {
      status = "non_compliant";
    } else if (activeCount === 0 && type.min_count > 0) {
      status = "non_compliant";
    } else if (expiredTraining > 0) {
      status = "at_risk";
    } else if (expiringSoon > 0) {
      status = "expiring_soon";
    } else {
      status = "compliant";
    }

    return {
      connector_type: type,
      active_count: activeCount,
      expired_training_count: expiredTraining,
      expiring_soon_count: expiringSoon,
      compliance_status: status,
      holders: typeConnectors,
    };
  });

  // Summary counts
  const summary = {
    total_statutory: types?.length || 0,
    compliant: compliance.filter((c: any) => c.compliance_status === "compliant").length,
    at_risk: compliance.filter((c: any) => c.compliance_status === "at_risk").length,
    expiring_soon: compliance.filter((c: any) => c.compliance_status === "expiring_soon").length,
    non_compliant: compliance.filter((c: any) => c.compliance_status === "non_compliant").length,
  };

  return apiSuccess({ summary, compliance });
});
