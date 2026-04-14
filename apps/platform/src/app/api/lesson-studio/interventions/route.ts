import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

/* ── GET: Fetch interventions for a pupil or class ────────────── */

export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const orgId = auth.organizationId;
  if (!orgId) return apiError("No organization", 400);

  const pupilId = req.nextUrl.searchParams.get("pupilId");
  const classId = req.nextUrl.searchParams.get("classId");
  const status = req.nextUrl.searchParams.get("status");

  if (!pupilId && !classId) {
    return apiError("pupilId or classId required", 400);
  }

  let query = supabase
    .from("ls_interventions")
    .select("*, sessions:ls_intervention_sessions(*), pupil:ls_pupils(id, pupil_ref, display_name_encrypted)")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (pupilId) query = query.eq("pupil_id", pupilId);
  if (classId) query = query.eq("class_id", classId);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;

  if (error) return apiError(error.message, 500);

  // Sort sessions within each intervention by session_number
  const interventions = (data ?? []).map((intervention) => ({
    ...intervention,
    sessions: Array.isArray(intervention.sessions)
      ? [...intervention.sessions].sort(
          (a: { session_number: number }, b: { session_number: number }) =>
            a.session_number - b.session_number,
        )
      : [],
  }));

  return apiSuccess({ interventions });
});

/* ── POST: Create or update an intervention ───────────────────── */

export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const orgId = auth.organizationId;
  if (!orgId) return apiError("No organization", 400);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const id = body.id as string | undefined;

  // Build the row
  const row: Record<string, unknown> = {
    organization_id: orgId,
    pupil_id: body.pupil_id,
    class_id: body.class_id ?? null,
    title: body.title,
    target: body.target,
    subject: body.subject,
    format: body.format,
    frequency: body.frequency ?? null,
    duration_weeks: body.duration_weeks ?? null,
    delivered_by: body.delivered_by ?? null,
    eef_strategy_id: body.eef_strategy_id ?? null,
    eef_strategy_name: body.eef_strategy_name ?? null,
    eef_impact_months: body.eef_impact_months ?? null,
    success_criteria: body.success_criteria ?? null,
    lesson_adaptations: body.lesson_adaptations ?? null,
    resources: body.resources ?? null,
    status: body.status ?? "active",
    started_at: body.started_at ?? null,
    target_end_date: body.target_end_date ?? null,
    completed_at: body.completed_at ?? null,
    updated_at: new Date().toISOString(),
  };

  if (id) {
    // Update existing
    const { data, error } = await supabase
      .from("ls_interventions")
      .update(row)
      .eq("id", id)
      .eq("organization_id", orgId)
      .select()
      .single();

    if (error) return apiError(error.message, 500);
    return apiSuccess({ intervention: data });
  } else {
    // Insert new
    row.created_by = auth.userId;
    const { data, error } = await supabase
      .from("ls_interventions")
      .insert(row)
      .select()
      .single();

    if (error) return apiError(error.message, 500);
    return apiSuccess({ intervention: data });
  }
});
