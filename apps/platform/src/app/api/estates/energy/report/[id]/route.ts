/**
 * Single Energy Report API
 *
 * GET /api/estates/energy/report/[id] — Fetch a single generated energy report
 *
 * Returns body_html, subject, status, created_at, and placeholder_values
 * for displaying in the EnergyReportTab viewer.
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, request: NextRequest) => {
  const supabase = createServiceRoleClient();

  // Extract [id] from URL path
  const segments = request.nextUrl.pathname.split("/");
  const reportId = segments[segments.length - 1];

  if (!reportId) {
    return apiError("Report ID is required", 400);
  }

  // Use org from auth (fallback to query param for cross-org admin views)
  const orgId =
    auth.organizationId || request.nextUrl.searchParams.get("organizationId");

  if (!orgId) {
    return apiError("Organization ID could not be determined", 400);
  }

  const { data: report, error } = await supabase
    .from("generated_documents")
    .select(
      "id, subject, status, created_at, body_html, placeholder_values, created_by",
    )
    .eq("id", reportId)
    .eq("organization_id", orgId)
    .eq("module", "estates")
    .eq("category", "energy_report")
    .single();

  if (error) {
    console.error("[energy-report] Fetch error:", error.message);
    if (error.code === "PGRST116") {
      return apiError("Energy report not found", 404);
    }
    return apiError(`Failed to fetch report: ${error.message}`, 500);
  }

  return apiSuccess({ report });
});
