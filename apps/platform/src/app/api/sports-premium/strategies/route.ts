/**
 * Sports Premium Strategies API
 *
 * GET  /api/sports-premium/strategies — Get strategy for org/year
 * POST /api/sports-premium/strategies — Create a new strategy
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

// ─── Demo Data ────────────────────────────────────────────────────────

const DEMO_STRATEGY = {
  id: "demo-strategy-2025-26",
  organization_id: "demo",
  academic_year: "2025-26",
  total_funding: 17100,
  base_funding: 16000,
  per_pupil_funding: 10,
  pupil_count: 210,
  headteacher_name: "Mrs Sarah Johnson",
  pe_lead_name: "Mr James Williams",
  swimming_25m_percent: 72,
  swimming_strokes_percent: 68,
  swimming_self_rescue_percent: 85,
  publication_date: "2025-09-01",
  review_date: "2026-07-20",
  status: "active",
  sustainability_statement:
    "We ensure sustainability by embedding CPD into staff development plans, maintaining community partnerships, and investing in long-term equipment and facilities that will continue to benefit pupils beyond the funding period.",
  created_at: "2025-09-01T00:00:00Z",
  updated_at: "2025-09-01T00:00:00Z",
};

export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const url = new URL(request.url);
  const year = url.searchParams.get("year") || "2025-26";

  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("sports_premium_strategies")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("academic_year", year)
    .maybeSingle();

  if (error) {
    console.error("[Sports Premium] Strategy fetch error:", error);
  }

  // Return demo data when no real data exists
  if (!data) {
    return apiSuccess({
      ...DEMO_STRATEGY,
      organization_id: organizationId,
      _demo: true,
    });
  }

  return apiSuccess(data);
});

export const POST = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const body = await request.json();

  const supabase = createServiceRoleClient();

  const strategy = {
    organization_id: organizationId,
    academic_year: body.academic_year || "2025-26",
    total_funding: body.total_funding || 0,
    base_funding: body.base_funding || 16000,
    per_pupil_funding: body.per_pupil_funding || 10,
    pupil_count: body.pupil_count || 0,
    headteacher_name: body.headteacher_name || "",
    pe_lead_name: body.pe_lead_name || "",
    swimming_25m_percent: body.swimming_25m_percent || 0,
    swimming_strokes_percent: body.swimming_strokes_percent || 0,
    swimming_self_rescue_percent: body.swimming_self_rescue_percent || 0,
    publication_date: body.publication_date || null,
    review_date: body.review_date || null,
    status: body.status || "draft",
    sustainability_statement: body.sustainability_statement || "",
  };

  const { data, error } = await supabase
    .from("sports_premium_strategies")
    .insert(strategy)
    .select()
    .single();

  if (error) {
    console.error("[Sports Premium] Strategy create error:", error);
    return apiError("Failed to create strategy: " + error.message, 500);
  }

  return apiSuccess(data, 201);
});
