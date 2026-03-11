import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { fireTrigger, TRIGGER_EVENTS } from "@/lib/document-engine";

/**
 * GET /api/hr/sickness/[id]
 * Get a single sickness absence record.
 */
export const GET = protectedRoute(async (auth, request: NextRequest) => {
  const id = request.nextUrl.pathname.split("/").pop();
  if (!id) return apiError("Missing record ID", 400);

  const supabase = createServiceRoleClient();

  const { data: record, error } = await supabase
    .from("sickness_absence_records")
    .select(
      "*, staff_directory!inner(id, display_name, job_title, role_category)",
    )
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .single();

  if (error || !record) {
    return apiError("Sickness record not found", 404);
  }

  const formatted = {
    ...record,
    staff_name: record.staff_directory?.display_name || "Unknown",
    staff_role: record.staff_directory?.job_title || null,
    staff_department: record.staff_directory?.role_category || null,
    staff_directory: undefined,
  };

  // Get Bradford Factor
  const { data: bf } = await supabase.rpc("calculate_bradford_factor", {
    staff_id_param: record.staff_id,
    org_id_param: auth.organizationId,
    period_months: 12,
  });

  return apiSuccess({
    record: formatted,
    bradford: bf?.[0] || null,
  });
});

/**
 * PUT /api/hr/sickness/[id]
 * Update a sickness absence record.
 */
export const PUT = protectedRoute(async (auth, request: NextRequest) => {
  const id = request.nextUrl.pathname.split("/").pop();
  if (!id) return apiError("Missing record ID", 400);

  const body = await request.json();
  const {
    endDate,
    reasonCategory,
    reasonDetail,
    notes,
    formalStage,
    workingDaysLost,
    selfCertified,
    fitNoteReceived,
    fitNoteExpiry,
    occupationalHealthReferral,
    returnDate,
    phasedReturn,
    phasedReturnPlan,
  } = body;

  const supabase = createServiceRoleClient();

  // Verify record belongs to this org
  const { data: existing } = await supabase
    .from("sickness_absence_records")
    .select("id, staff_id")
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .single();

  if (!existing) {
    return apiError("Sickness record not found", 404);
  }

  const updates: Record<string, any> = { updated_at: new Date().toISOString() };

  if (endDate !== undefined) updates.end_date = endDate;
  if (reasonCategory !== undefined) updates.reason_category = reasonCategory;
  if (reasonDetail !== undefined) updates.reason_detail = reasonDetail;
  if (notes !== undefined) updates.notes = notes;
  if (formalStage !== undefined) updates.formal_stage = formalStage;
  if (workingDaysLost !== undefined)
    updates.working_days_lost = workingDaysLost;
  if (selfCertified !== undefined) updates.self_certified = selfCertified;
  if (fitNoteReceived !== undefined)
    updates.fit_note_received = fitNoteReceived;
  if (fitNoteExpiry !== undefined) updates.fit_note_expiry = fitNoteExpiry;
  if (occupationalHealthReferral !== undefined)
    updates.occupational_health_referral = occupationalHealthReferral;
  if (returnDate !== undefined) updates.return_date = returnDate;
  if (phasedReturn !== undefined) updates.phased_return = phasedReturn;
  if (phasedReturnPlan !== undefined)
    updates.phased_return_plan = phasedReturnPlan;

  const { data: record, error } = await supabase
    .from("sickness_absence_records")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating sickness record:", error);
    return apiError("Failed to update sickness record", 500);
  }

  // Recalculate Bradford Factor
  const { data: bf } = await supabase.rpc("calculate_bradford_factor", {
    staff_id_param: existing.staff_id,
    org_id_param: auth.organizationId,
    period_months: 12,
  });

  // Fire return-to-work trigger if end_date was just set
  if (endDate && endDate !== null) {
    fireTrigger(
      supabase,
      TRIGGER_EVENTS.SICKNESS_RETURN_TO_WORK,
      auth.organizationId,
      {
        staffId: existing.staff_id,
        absenceId: id,
        contextType: "sickness",
        contextId: id,
        triggeredBy: auth.userId,
      },
    ).catch(() => {});
  }

  return apiSuccess({ record, bradford: bf?.[0] || null });
});

/**
 * DELETE /api/hr/sickness/[id]
 * Delete a sickness absence record.
 */
export const DELETE = protectedRoute(
  async (auth, request: NextRequest) => {
    const id = request.nextUrl.pathname.split("/").pop();
    if (!id) return apiError("Missing record ID", 400);

    const supabase = createServiceRoleClient();

    const { error } = await supabase
      .from("sickness_absence_records")
      .delete()
      .eq("id", id)
      .eq("organization_id", auth.organizationId);

    if (error) {
      console.error("Error deleting sickness record:", error);
      return apiError("Failed to delete sickness record", 500);
    }

    return apiSuccess({ deleted: true });
  },
  { requiredRole: "slt" },
);
