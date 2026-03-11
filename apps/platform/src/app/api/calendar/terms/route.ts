/**
 * Academic Terms API
 *
 * GET  /api/calendar/terms - List terms for an academic year
 * POST /api/calendar/terms - Create or update term dates
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

// ── Demo Data ────────────────────────────────────────────────────────

const DEMO_TERMS = [
  {
    id: "demo-term-1",
    organization_id: "demo",
    academic_year: "2025-26",
    name: "Autumn 1",
    start_date: "2025-09-03",
    end_date: "2025-10-24",
    half_term_start: null,
    half_term_end: null,
    school_days: 38,
    order_index: 1,
    created_at: "2025-09-01T00:00:00Z",
  },
  {
    id: "demo-term-2",
    organization_id: "demo",
    academic_year: "2025-26",
    name: "Autumn 2",
    start_date: "2025-11-03",
    end_date: "2025-12-19",
    half_term_start: null,
    half_term_end: null,
    school_days: 35,
    order_index: 2,
    created_at: "2025-09-01T00:00:00Z",
  },
  {
    id: "demo-term-3",
    organization_id: "demo",
    academic_year: "2025-26",
    name: "Spring 1",
    start_date: "2026-01-06",
    end_date: "2026-02-13",
    half_term_start: null,
    half_term_end: null,
    school_days: 29,
    order_index: 3,
    created_at: "2025-09-01T00:00:00Z",
  },
  {
    id: "demo-term-4",
    organization_id: "demo",
    academic_year: "2025-26",
    name: "Spring 2",
    start_date: "2026-02-23",
    end_date: "2026-04-01",
    half_term_start: null,
    half_term_end: null,
    school_days: 28,
    order_index: 4,
    created_at: "2025-09-01T00:00:00Z",
  },
  {
    id: "demo-term-5",
    organization_id: "demo",
    academic_year: "2025-26",
    name: "Summer 1",
    start_date: "2026-04-20",
    end_date: "2026-05-22",
    half_term_start: null,
    half_term_end: null,
    school_days: 24,
    order_index: 5,
    created_at: "2025-09-01T00:00:00Z",
  },
  {
    id: "demo-term-6",
    organization_id: "demo",
    academic_year: "2025-26",
    name: "Summer 2",
    start_date: "2026-06-01",
    end_date: "2026-07-22",
    half_term_start: null,
    half_term_end: null,
    school_days: 36,
    order_index: 6,
    created_at: "2025-09-01T00:00:00Z",
  },
];

export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const searchParams = request.nextUrl.searchParams;
  const academicYear = searchParams.get("academic_year") || "2025-26";

  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("academic_terms")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("academic_year", academicYear)
    .order("order_index", { ascending: true });

  if (error) {
    console.error("[Calendar Terms] DB error:", error.message);
  }

  // Return demo data if no real data exists
  if (!data || data.length === 0) {
    return apiSuccess({
      terms: DEMO_TERMS,
      academic_year: academicYear,
      total_school_days: DEMO_TERMS.reduce((sum, t) => sum + t.school_days, 0),
      is_demo: true,
    });
  }

  return apiSuccess({
    terms: data,
    academic_year: academicYear,
    total_school_days: data.reduce(
      (sum: number, t: any) => sum + (t.school_days || 0),
      0,
    ),
    is_demo: false,
  });
});

export const POST = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const body = await request.json();

  if (!body.terms || !Array.isArray(body.terms)) {
    return apiError("terms array is required", 400);
  }

  const supabase = createServiceRoleClient();

  // Upsert all terms
  const termsToUpsert = body.terms.map((term: any, index: number) => ({
    id: term.id || undefined,
    organization_id: organizationId,
    academic_year: term.academic_year || "2025-26",
    name: term.name,
    start_date: term.start_date,
    end_date: term.end_date,
    half_term_start: term.half_term_start || null,
    half_term_end: term.half_term_end || null,
    school_days: term.school_days || 0,
    order_index: term.order_index ?? index + 1,
  }));

  const { data, error } = await supabase
    .from("academic_terms")
    .upsert(termsToUpsert, { onConflict: "id" })
    .select();

  if (error) {
    console.error("[Calendar Terms] Upsert error:", error.message);
    return apiError("Failed to save term dates", 500);
  }

  return apiSuccess({ terms: data, saved: true }, 201);
});
