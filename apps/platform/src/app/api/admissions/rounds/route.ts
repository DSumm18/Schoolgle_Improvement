import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * GET /api/admissions/rounds
 * List admission rounds for the organization
 */
export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status");
  const academicYear = searchParams.get("academic_year");

  let query = supabase
    .from("admissions_rounds")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }
  if (academicYear) {
    query = query.eq("academic_year", academicYear);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[Admissions Rounds GET]", error);
    return apiError("Failed to fetch admission rounds", 500);
  }

  return apiSuccess({ rounds: data || [] });
});

/**
 * POST /api/admissions/rounds
 * Create a new admission round
 */
export const POST = protectedRoute(
  async (auth, request) => {
    const { organizationId } = auth;
    const supabase = createServiceRoleClient();
    const body = await request.json();

    const {
      academic_year,
      entry_year_group,
      pan,
      application_deadline,
      offer_date,
      acceptance_deadline,
      status,
      oversubscription_criteria,
      notes,
    } = body;

    if (!academic_year || !entry_year_group || !pan) {
      return apiError(
        "academic_year, entry_year_group, and pan are required",
        400,
      );
    }

    const { data, error } = await supabase
      .from("admissions_rounds")
      .insert({
        organization_id: organizationId,
        academic_year,
        entry_year_group,
        pan: parseInt(pan, 10),
        application_deadline,
        offer_date,
        acceptance_deadline,
        status: status || "draft",
        oversubscription_criteria: oversubscription_criteria || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error("[Admissions Rounds POST]", error);
      return apiError("Failed to create admission round", 500);
    }

    return apiSuccess(data, 201);
  },
  { requiredRole: "slt" },
);
