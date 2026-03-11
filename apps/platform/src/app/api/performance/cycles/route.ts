import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

// ─── Demo Data ───────────────────────────────────────────────────────

const DEMO_CYCLES = [
  {
    id: "demo-cycle-2025",
    organization_id: "demo",
    name: "2025-26 Appraisal Cycle",
    academic_year: "2025-26",
    status: "active",
    objectives_due: "2025-10-31",
    mid_year_due: "2026-02-14",
    end_year_due: "2026-07-18",
    pay_review_due: "2026-09-01",
    created_at: "2025-09-01T00:00:00Z",
    updated_at: "2026-01-15T00:00:00Z",
  },
  {
    id: "demo-cycle-2024",
    organization_id: "demo",
    name: "2024-25 Appraisal Cycle",
    academic_year: "2024-25",
    status: "completed",
    objectives_due: "2024-10-31",
    mid_year_due: "2025-02-14",
    end_year_due: "2025-07-18",
    pay_review_due: "2025-09-01",
    created_at: "2024-09-01T00:00:00Z",
    updated_at: "2025-09-15T00:00:00Z",
  },
];

/**
 * GET /api/performance/cycles
 * Return appraisal cycles for an organization
 */
export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("appraisal_cycles")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Performance Cycles] DB error:", error);
  }

  // Return demo data if no real data
  if (!data || data.length === 0) {
    return apiSuccess({ cycles: DEMO_CYCLES, demo: true });
  }

  return apiSuccess({ cycles: data, demo: false });
});

/**
 * POST /api/performance/cycles
 * Create a new appraisal cycle
 */
export const POST = protectedRoute(async (auth, request) => {
  const { organizationId, userId } = auth;
  const body = await request.json();

  const {
    name,
    academic_year,
    objectives_due,
    mid_year_due,
    end_year_due,
    pay_review_due,
  } = body;

  if (!name || !academic_year) {
    return apiError("Name and academic year are required", 400);
  }

  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("appraisal_cycles")
    .insert({
      organization_id: organizationId,
      name,
      academic_year,
      status: "active",
      objectives_due: objectives_due || null,
      mid_year_due: mid_year_due || null,
      end_year_due: end_year_due || null,
      pay_review_due: pay_review_due || null,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error("[Performance Cycles] Create error:", error);
    return apiError("Failed to create cycle", 500);
  }

  return apiSuccess(data, 201);
});
