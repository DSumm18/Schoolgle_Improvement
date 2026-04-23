import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { calculateThresholdAlert } from "@/lib/deal-finder/services/threshold-intelligence";

export const GET = protectedRoute(async (auth, request: NextRequest) => {
  try {
    const orgId = auth.organizationId;
    if (!orgId) {
      return apiError("Missing organization context", 400);
    }

    const supabase = createServiceRoleClient();

    // Query the aggregated view we created in the migration
    const { data: summaryData, error } = await supabase
      .from("dealfind_supplier_spend_summary")
      .select("*")
      .eq("organization_id", orgId)
      .order("total_spend", { ascending: false })
      .limit(5);

    if (error) {
      console.error("Error fetching spend summary:", error);
      return apiError("Failed to fetch threshold data", 500);
    }

    // Process the data through our threshold engine
    const alerts = (summaryData || []).map((row) => 
      calculateThresholdAlert(row.supplier_name, Number(row.total_spend))
    );

    // If we have no real data, we can return some synthetic data for demonstration purposes in the UI
    if (alerts.length === 0) {
      return apiSuccess({
        alerts: [
          calculateThresholdAlert("YPO", 38500),
          calculateThresholdAlert("Amazon Business", 12000),
          calculateThresholdAlert("ESPO", 8500),
        ]
      });
    }

    return apiSuccess({ alerts });
  } catch (err) {
    console.error("Threshold API error:", err);
    return apiError("Failed to process threshold data", 500);
  }
});
