import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { fireTrigger, TRIGGER_EVENTS } from "@/lib/document-engine";

/**
 * GET /api/hr/sickness
 * List sickness absence records for an organization.
 * Query params: organizationId, staffId, status (active/resolved), limit, offset
 */
export const GET = protectedRoute(async (auth, request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const staffId = searchParams.get("staffId");
  const status = searchParams.get("status"); // "active" | "resolved"
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  const supabase = createServiceRoleClient();

  let query = supabase
    .from("sickness_absence_records")
    .select(
      "*, staff_directory!inner(id, display_name, job_title, role_category)",
      { count: "exact" },
    )
    .eq("organization_id", auth.organizationId)
    .order("start_date", { ascending: false })
    .range(offset, offset + limit - 1);

  if (staffId) {
    query = query.eq("staff_id", staffId);
  }

  if (status === "active") {
    query = query.is("end_date", null);
  } else if (status === "resolved") {
    query = query.not("end_date", "is", null);
  }

  const { data: records, error, count } = await query;

  if (error) {
    console.error("Error fetching sickness records:", error);
    return apiError("Failed to fetch sickness records", 500);
  }

  const formatted = (records || []).map((r: any) => ({
    ...r,
    staff_name: r.staff_directory?.display_name || "Unknown",
    staff_role: r.staff_directory?.job_title || null,
    staff_department: r.staff_directory?.role_category || null,
    staff_directory: undefined,
  }));

  // Get Bradford Factor for each unique staff member
  const uniqueStaffIds = [
    ...new Set(formatted.map((r: any) => r.staff_id)),
  ] as string[];

  const bradfordMap: Record<string, any> = {};
  for (const sid of uniqueStaffIds) {
    try {
      const { data: bf } = await supabase.rpc("calculate_bradford_factor", {
        staff_id_param: sid,
        org_id_param: auth.organizationId,
        period_months: 12,
      });
      if (bf && bf.length > 0) {
        bradfordMap[sid] = bf[0];
      }
    } catch {
      // Bradford calc may fail if no records, continue
    }
  }

  return apiSuccess({
    records: formatted,
    bradford: bradfordMap,
    total: count || 0,
    limit,
    offset,
  });
});

/**
 * POST /api/hr/sickness
 * Record a new sickness absence.
 * Accepts both camelCase and snake_case field names.
 */
export const POST = protectedRoute(async (auth, request: NextRequest) => {
  const body = await request.json();

  // Accept both camelCase and snake_case
  const staffMemberId =
    body.staffMemberId || body.staff_member_id || body.staff_id;
  const startDate = body.startDate || body.start_date;
  const endDate = body.endDate || body.end_date;
  const reasonCategory = body.reasonCategory || body.reason_category;
  const reasonDetail = body.reasonDetail || body.reason_detail || body.reason;
  const notes = body.notes;
  const reportedBy = body.reportedBy || body.reported_by;
  const selfCertified = body.selfCertified ?? body.self_certified ?? true;
  const fitNoteReceived =
    body.fitNoteReceived ?? body.fit_note_received ?? false;
  const workingDaysLost =
    body.workingDaysLost || body.working_days_lost || null;

  if (!staffMemberId || !startDate || !reasonCategory) {
    return apiError(
      "Missing required fields: staffMemberId/staff_member_id, startDate/start_date, reasonCategory/reason_category",
      400,
    );
  }

  const supabase = createServiceRoleClient();

  // Verify staff member belongs to this org
  const { data: staff, error: staffError } = await supabase
    .from("staff_directory")
    .select("id, display_name")
    .eq("id", staffMemberId)
    .eq("organization_id", auth.organizationId)
    .single();

  if (staffError || !staff) {
    return apiError("Staff member not found in this organization", 404);
  }

  const { data: record, error } = await supabase
    .from("sickness_absence_records")
    .insert({
      organization_id: auth.organizationId,
      staff_id: staffMemberId,
      start_date: startDate,
      end_date: endDate || null,
      working_days_lost: workingDaysLost,
      reason_category: reasonCategory,
      reason_detail: reasonDetail || null,
      self_certified: selfCertified,
      fit_note_received: fitNoteReceived,
      notes: notes || null,
      created_by: reportedBy || auth.email,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating sickness record:", error);
    return apiError("Failed to create sickness record: " + error.message, 500);
  }

  // Calculate updated Bradford Factor
  let bradford = null;
  try {
    const { data: bf } = await supabase.rpc("calculate_bradford_factor", {
      staff_id_param: staffMemberId,
      org_id_param: auth.organizationId,
      period_months: 12,
    });
    bradford = bf?.[0] || null;

    if (
      bradford &&
      bradford.trigger_level &&
      bradford.trigger_level !== "none"
    ) {
      await supabase
        .from("sickness_absence_records")
        .update({ trigger_hit: bradford.trigger_level })
        .eq("id", record.id);

      // Fire Bradford threshold trigger for auto-document generation
      fireTrigger(
        supabase,
        TRIGGER_EVENTS.SICKNESS_BRADFORD_THRESHOLD,
        auth.organizationId,
        {
          staffId: staffMemberId,
          trigger_level: bradford.trigger_level,
          bradford_score: bradford.bradford_score,
          occasions: bradford.occasions,
          total_days: bradford.total_days,
          absenceId: record.id,
          contextType: "sickness",
          contextId: record.id,
          triggeredBy: auth.userId,
        },
      ).catch(() => {}); // Fire-and-forget
    }

    // Fire absence recorded trigger
    fireTrigger(
      supabase,
      TRIGGER_EVENTS.SICKNESS_ABSENCE_RECORDED,
      auth.organizationId,
      {
        staffId: staffMemberId,
        absenceId: record.id,
        reason_category: reasonCategory,
        contextType: "sickness",
        contextId: record.id,
        triggeredBy: auth.userId,
      },
    ).catch(() => {}); // Fire-and-forget
  } catch {
    // Bradford calc non-critical
  }

  return apiSuccess(
    {
      ...record,
      bradford,
      staff_name: staff.display_name,
    },
    201,
  );
});
