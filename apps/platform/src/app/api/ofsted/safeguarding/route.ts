import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * GET /api/ofsted/safeguarding
 * Fetch all safeguarding checks for an organization
 */
export const GET = protectedRoute(async (auth, req) => {
  // orgId MUST come from authenticated session — never from caller
  const organizationId = auth.organizationId;

  if (!organizationId) {
    return apiError("Missing organizationId parameter", 400);
  }

  const supabase = createServiceRoleClient();

  const { data: checks, error } = await supabase
    .from("ofsted_safeguarding_checks")
    .select("check_item, is_met, notes, evidence_link, checked_at")
    .eq("organization_id", organizationId)
    .order("check_item");

  if (error) {
    console.error("Error fetching safeguarding checks:", error);
    return apiError("Failed to fetch safeguarding checks", 500);
  }

  const totalChecks = checks?.length || 0;
  const metChecks = checks?.filter((c) => c.is_met).length || 0;
  const safeguardingMet = totalChecks > 0 && metChecks === totalChecks;

  return apiSuccess({
    checks: checks || [],
    safeguarding_met: safeguardingMet,
    total_checks: totalChecks,
    met_checks: metChecks,
  });
});

/**
 * POST /api/ofsted/safeguarding
 * Upsert safeguarding check items for an organization
 */
export const POST = protectedRoute(async (auth, req) => {
  const body = await req.json();
  const { checks, user_id } = body;

  // orgId MUST come from authenticated session — never from caller
  const orgId = auth.organizationId;

  if (!orgId) {
    return apiError("Missing organization_id", 400);
  }

  if (!checks || !Array.isArray(checks) || checks.length === 0) {
    return apiError("Missing or empty checks array", 400);
  }

  const supabase = createServiceRoleClient();

  const now = new Date().toISOString();
  const upsertRows = checks.map(
    (check: {
      check_item: string;
      is_met: boolean;
      notes?: string;
      evidence_link?: string;
    }) => ({
      organization_id: orgId,
      check_item: check.check_item,
      is_met: check.is_met,
      notes: check.notes || null,
      evidence_link: check.evidence_link || null,
      checked_by: user_id || auth.userId || null,
      checked_at: now,
    }),
  );

  const { data, error } = await supabase
    .from("ofsted_safeguarding_checks")
    .upsert(upsertRows, {
      onConflict: "organization_id,check_item",
    })
    .select("check_item, is_met, notes, evidence_link, checked_at");

  if (error) {
    console.error("Error upserting safeguarding checks:", error);
    return apiError("Failed to save safeguarding checks", 500);
  }

  const totalChecks = data?.length || 0;
  const metChecks = data?.filter((c) => c.is_met).length || 0;
  const safeguardingMet = totalChecks > 0 && metChecks === totalChecks;

  return apiSuccess({
    checks: data || [],
    safeguarding_met: safeguardingMet,
    total_checks: totalChecks,
    met_checks: metChecks,
  });
});
