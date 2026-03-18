/**
 * Quick Website Compliance Scan API
 *
 * POST /api/website-scan/quick
 * Fast (~30-60s) lightweight scan for the standalone £50/yr app.
 * No Playwright, no AI, no PDF extraction — just keyword matching.
 * Stores results against the org's website_compliance_scans.
 *
 * Requires auth — the school can only scan their own registered website.
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { lightweightScan } from "@/lib/website-compliance/lightweight-scanner";

export const POST = protectedRoute(async (auth, request) => {
  try {
    const supabase = createServiceRoleClient();

    // Get the org's registered website URL
    const { data: org } = await supabase
      .from("organizations")
      .select("id, name, website_url")
      .eq("id", auth.organizationId)
      .maybeSingle();

    if (!org?.website_url) {
      return apiError(
        "No website URL registered for your school. Please update your school settings.",
        400,
      );
    }

    console.log(
      `[Quick Scan] Starting lightweight scan of ${org.website_url} for ${org.name}`,
    );

    const result = await lightweightScan(org.website_url);

    // Store results in website_compliance_scans (V1 table, upsert by org)
    await supabase.from("website_compliance_scans").upsert(
      {
        organization_id: org.id,
        website_url: org.website_url,
        school_type: result.schoolType !== "unknown" ? result.schoolType : null,
        overall_compliance_score: result.compliancePercent,
        total_requirements: result.totalRequirements,
        compliant_count: result.foundCount,
        not_found_count: result.notFoundCount,
        partial_count: result.needsCheckingCount,
        outdated_count: 0,
        pages_scanned: result.results.length,
        scan_duration_ms: result.durationMs,
        full_report: result,
        scanned_at: result.scannedAt,
      },
      { onConflict: "organization_id" },
    );

    console.log(
      `[Quick Scan] Complete: ${result.foundCount}/${result.totalRequirements} found (${result.compliancePercent}%) in ${(result.durationMs / 1000).toFixed(1)}s`,
    );

    return apiSuccess(result);
  } catch (error) {
    console.error("[Quick Scan] Error:", error);
    return apiError(
      error instanceof Error ? error.message : "Scan failed",
      500,
    );
  }
});

/**
 * GET /api/website-scan/quick
 * Get the latest quick scan results for the authenticated org.
 */
export const GET = protectedRoute(async (auth) => {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("website_compliance_scans")
    .select("*")
    .eq("organization_id", auth.organizationId)
    .order("scanned_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return apiError(error.message, 500);
  }

  if (!data) {
    return apiSuccess({ hasResults: false });
  }

  return apiSuccess({
    hasResults: true,
    ...data.full_report,
    storedAt: data.scanned_at,
  });
});
