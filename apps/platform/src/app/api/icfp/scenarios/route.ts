/**
 * ICFP Scenarios API
 *
 * GET  /api/icfp/scenarios - List what-if scenarios for an organization
 * POST /api/icfp/scenarios - Create a what-if scenario with projected metrics
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, request) => {
  const searchParams = request.nextUrl.searchParams;
  // orgId MUST come from authenticated session — never from caller
  const organizationId = auth.organizationId;
  const snapshotId = searchParams.get("icfp_snapshot_id");

  const supabase = createServiceRoleClient();

  let query = supabase
    .from("icfp_scenarios")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (snapshotId) {
    query = query.eq("icfp_snapshot_id", snapshotId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching ICFP scenarios:", error);
    return apiError("Failed to fetch ICFP scenarios", 500);
  }

  return apiSuccess({ scenarios: data || [] });
});

export const POST = protectedRoute(async (auth, request) => {
  const body = await request.json();
  const {
    icfp_snapshot_id,
    name,
    description,
    changes,
    created_by,
  } = body;

  // orgId MUST come from authenticated session — never from caller
  const orgId = auth.organizationId;

  if (!icfp_snapshot_id) {
    return apiError("icfp_snapshot_id is required", 400);
  }
  if (!name) {
    return apiError("name is required", 400);
  }
  if (!changes || typeof changes !== "object") {
    return apiError("changes object is required", 400);
  }

  const supabase = createServiceRoleClient();

  // Fetch the base snapshot to compute projected metrics
  const { data: snapshot, error: snapError } = await supabase
    .from("icfp_snapshots")
    .select("*")
    .eq("id", icfp_snapshot_id)
    .single();

  if (snapError || !snapshot) {
    return apiError("ICFP snapshot not found", 404);
  }

  // Apply changes to base snapshot to compute projected metrics
  const projected = computeProjectedMetrics(snapshot, changes);

  const insertData: Record<string, any> = {
    organization_id: orgId,
    icfp_snapshot_id,
    name,
    description,
    changes,
    projected_metrics: projected,
    created_by: created_by || auth.userId,
  };

  // Remove undefined values
  Object.keys(insertData).forEach((key) => {
    if (insertData[key] === undefined) delete insertData[key];
  });

  const { data, error } = await supabase
    .from("icfp_scenarios")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error("Error creating ICFP scenario:", error);
    return apiError("Failed to create ICFP scenario", 500);
  }

  return apiSuccess({ scenario: data }, 201);
});

/**
 * Compute projected ICFP metrics by applying scenario changes to the base snapshot.
 *
 * Changes can include deltas (e.g., { teacher_count: -2, supply_costs: 15000 })
 * or absolute overrides (e.g., { pupil_count: 420 }).
 *
 * The `_delta` suffix indicates additive change; bare keys are absolute overrides.
 */
function computeProjectedMetrics(
  base: Record<string, any>,
  changes: Record<string, any>,
): Record<string, any> {
  // Start from base values
  const p: Record<string, number> = {
    total_income: base.total_income ?? 0,
    total_expenditure: base.total_expenditure ?? 0,
    staff_costs: base.staff_costs ?? 0,
    pupil_count: base.pupil_count ?? 0,
    teacher_count: base.teacher_count ?? 0,
    teaching_assistant_count: base.teaching_assistant_count ?? 0,
    total_staff_fte: base.total_staff_fte ?? 0,
    non_staff_costs: base.non_staff_costs ?? 0,
    premises_costs: base.premises_costs ?? 0,
    supply_costs: base.supply_costs ?? 0,
    agency_costs: base.agency_costs ?? 0,
    curriculum_hours_taught: base.curriculum_hours_taught ?? 0,
    curriculum_hours_available: base.curriculum_hours_available ?? 0,
  };

  // Apply changes: _delta keys are additive, bare keys are absolute overrides
  for (const [key, value] of Object.entries(changes)) {
    if (typeof value !== "number") continue;

    if (key.endsWith("_delta")) {
      const baseKey = key.replace(/_delta$/, "");
      if (baseKey in p) {
        p[baseKey] += value;
      }
    } else if (key in p) {
      p[key] = value;
    }
  }

  // Recompute derived Magnificent Seven metrics
  const staffCostRatio =
    p.total_expenditure > 0 ? p.staff_costs / p.total_expenditure : 0;
  const pupilTeacherRatio =
    p.teacher_count > 0 ? p.pupil_count / p.teacher_count : 0;
  const averageTeacherCost =
    p.teacher_count > 0 ? p.staff_costs / p.teacher_count : 0;
  const incomePerPupil = p.pupil_count > 0 ? p.total_income / p.pupil_count : 0;
  const expenditurePerPupil =
    p.pupil_count > 0 ? p.total_expenditure / p.pupil_count : 0;
  const teacherContactRatio =
    p.curriculum_hours_available > 0
      ? p.curriculum_hours_taught / p.curriculum_hours_available
      : null;
  const inYearBalance = p.total_income - p.total_expenditure;

  return {
    ...p,
    staff_cost_ratio: Math.round(staffCostRatio * 10000) / 10000,
    pupil_teacher_ratio: Math.round(pupilTeacherRatio * 100) / 100,
    average_teacher_cost: Math.round(averageTeacherCost * 100) / 100,
    income_per_pupil: Math.round(incomePerPupil * 100) / 100,
    expenditure_per_pupil: Math.round(expenditurePerPupil * 100) / 100,
    teacher_contact_ratio:
      teacherContactRatio != null
        ? Math.round(teacherContactRatio * 10000) / 10000
        : null,
    in_year_balance: Math.round(inYearBalance * 100) / 100,
  };
}
