import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * GET /api/admissions/applications
 * List applications with optional filters by round, status, criteria
 */
export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();
  const searchParams = request.nextUrl.searchParams;

  const roundId = searchParams.get("round_id");
  const status = searchParams.get("status");
  const criterionTag = searchParams.get("criterion");
  const sortBy = searchParams.get("sort_by") || "preference_rank";
  const sortDir = searchParams.get("sort_dir") === "desc" ? false : true;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("page_size") || "50", 10);

  let query = supabase
    .from("admissions_applications")
    .select("*", { count: "exact" })
    .eq("organization_id", organizationId);

  if (roundId) {
    query = query.eq("round_id", roundId);
  }
  if (status) {
    query = query.eq("status", status);
  }
  if (criterionTag) {
    query = query.eq("oversubscription_criterion", criterionTag);
  }

  // Sorting
  const validSortFields = [
    "preference_rank",
    "distance_miles",
    "child_name",
    "status",
    "created_at",
    "waiting_list_position",
  ];
  const sortField = validSortFields.includes(sortBy)
    ? sortBy
    : "preference_rank";
  query = query.order(sortField, { ascending: sortDir });

  // Pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error("[Admissions Applications GET]", error);
    return apiError("Failed to fetch applications", 500);
  }

  return apiSuccess({
    applications: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  });
});

/**
 * POST /api/admissions/applications
 * Create a new application
 */
export const POST = protectedRoute(
  async (auth, request) => {
    const { organizationId } = auth;
    const supabase = createServiceRoleClient();
    const body = await request.json();

    const {
      round_id,
      child_name,
      child_dob,
      parent_name,
      parent_email,
      parent_phone,
      address,
      postcode,
      preference_rank,
      distance_miles,
      oversubscription_criterion,
      sibling_at_school,
      looked_after_child,
      ehcp_naming_school,
      faith_evidence,
      notes,
    } = body;

    if (!round_id || !child_name || !child_dob) {
      return apiError("round_id, child_name, and child_dob are required", 400);
    }

    // Verify the round belongs to this org
    const { data: round } = await supabase
      .from("admissions_rounds")
      .select("id")
      .eq("id", round_id)
      .eq("organization_id", organizationId)
      .single();

    if (!round) {
      return apiError("Admission round not found", 404);
    }

    const { data, error } = await supabase
      .from("admissions_applications")
      .insert({
        organization_id: organizationId,
        round_id,
        child_name,
        child_dob,
        parent_name: parent_name || null,
        parent_email: parent_email || null,
        parent_phone: parent_phone || null,
        address: address || null,
        postcode: postcode || null,
        preference_rank: preference_rank || 1,
        distance_miles:
          distance_miles != null ? parseFloat(distance_miles) : null,
        oversubscription_criterion: oversubscription_criterion || null,
        sibling_at_school: sibling_at_school || false,
        looked_after_child: looked_after_child || false,
        ehcp_naming_school: ehcp_naming_school || false,
        faith_evidence: faith_evidence || null,
        status: "received",
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error("[Admissions Applications POST]", error);
      return apiError("Failed to create application", 500);
    }

    return apiSuccess(data, 201);
  },
  { requiredRole: "slt" },
);
