/**
 * ICFP (Integrated Curriculum Financial Planning) Snapshot API
 *
 * GET  /api/icfp - Get latest ICFP snapshot for an organization
 * POST /api/icfp - Create a new ICFP snapshot
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, request) => {
  const searchParams = request.nextUrl.searchParams;
  const organizationId =
    searchParams.get("organizationId") || auth.organizationId;
  const academicYear = searchParams.get("academic_year");

  const supabase = createServiceRoleClient();

  let query = supabase
    .from("icfp_snapshots")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (academicYear) {
    query = query.eq("academic_year", academicYear);
  }

  // If no year filter, return the latest snapshot only
  if (!academicYear) {
    query = query.limit(1);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching ICFP snapshot:", error);
    return apiError("Failed to fetch ICFP snapshot", 500);
  }

  if (!academicYear) {
    // Return single latest snapshot
    return apiSuccess({
      snapshot: data && data.length > 0 ? data[0] : null,
    });
  }

  return apiSuccess({ snapshots: data || [] });
});

export const POST = protectedRoute(async (auth, request) => {
  const body = await request.json();
  const {
    organization_id,
    academic_year,
    // Magnificent Seven
    total_income,
    total_expenditure,
    staff_costs,
    pupil_count,
    teacher_count,
    teaching_assistant_count,
    total_staff_fte,
    // Derived metrics (can be computed or provided)
    staff_cost_ratio,
    teacher_contact_ratio,
    pupil_teacher_ratio,
    average_teacher_cost,
    average_class_size,
    income_per_pupil,
    expenditure_per_pupil,
    // Supporting data
    non_staff_costs,
    premises_costs,
    supply_costs,
    agency_costs,
    curriculum_hours_taught,
    curriculum_hours_available,
    in_year_balance,
    revenue_reserve,
    notes,
    created_by,
  } = body;

  const orgId = organization_id || auth.organizationId;

  if (!academic_year) {
    return apiError("academic_year is required", 400);
  }
  if (
    total_income == null ||
    total_expenditure == null ||
    staff_costs == null
  ) {
    return apiError(
      "total_income, total_expenditure, and staff_costs are required",
      400,
    );
  }
  if (!pupil_count || !teacher_count) {
    return apiError("pupil_count and teacher_count are required", 400);
  }

  // Compute derived metrics if not provided
  const computedStaffCostRatio =
    staff_cost_ratio ??
    (total_expenditure > 0 ? staff_costs / total_expenditure : 0);
  const computedPupilTeacherRatio =
    pupil_teacher_ratio ??
    (teacher_count > 0 ? pupil_count / teacher_count : 0);
  const computedAverageTeacherCost =
    average_teacher_cost ??
    (teacher_count > 0 ? staff_costs / teacher_count : 0);
  const computedIncomePerPupil =
    income_per_pupil ?? (pupil_count > 0 ? total_income / pupil_count : 0);
  const computedExpenditurePerPupil =
    expenditure_per_pupil ??
    (pupil_count > 0 ? total_expenditure / pupil_count : 0);
  const computedTeacherContactRatio =
    teacher_contact_ratio ??
    (curriculum_hours_available && curriculum_hours_available > 0
      ? (curriculum_hours_taught ?? 0) / curriculum_hours_available
      : null);

  const supabase = createServiceRoleClient();

  const insertData: Record<string, any> = {
    organization_id: orgId,
    academic_year,
    total_income,
    total_expenditure,
    staff_costs,
    pupil_count,
    teacher_count,
    teaching_assistant_count,
    total_staff_fte,
    staff_cost_ratio: computedStaffCostRatio,
    teacher_contact_ratio: computedTeacherContactRatio,
    pupil_teacher_ratio: computedPupilTeacherRatio,
    average_teacher_cost: computedAverageTeacherCost,
    average_class_size,
    income_per_pupil: computedIncomePerPupil,
    expenditure_per_pupil: computedExpenditurePerPupil,
    non_staff_costs,
    premises_costs,
    supply_costs,
    agency_costs,
    curriculum_hours_taught,
    curriculum_hours_available,
    in_year_balance,
    revenue_reserve,
    notes,
    created_by: created_by || auth.userId,
  };

  // Remove undefined values
  Object.keys(insertData).forEach((key) => {
    if (insertData[key] === undefined) delete insertData[key];
  });

  const { data, error } = await supabase
    .from("icfp_snapshots")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error("Error creating ICFP snapshot:", error);
    return apiError("Failed to create ICFP snapshot", 500);
  }

  return apiSuccess({ snapshot: data }, 201);
});
