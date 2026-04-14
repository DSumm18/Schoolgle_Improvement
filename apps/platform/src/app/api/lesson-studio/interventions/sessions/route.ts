import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

/* ── GET: Fetch sessions for an intervention ──────────────────── */

export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const orgId = auth.organizationId;
  if (!orgId) return apiError("No organization", 400);

  const interventionId = req.nextUrl.searchParams.get("interventionId");
  if (!interventionId) return apiError("interventionId required", 400);

  // Verify the intervention belongs to the org
  const { data: intervention, error: intError } = await supabase
    .from("ls_interventions")
    .select("id")
    .eq("id", interventionId)
    .eq("organization_id", orgId)
    .single();

  if (intError || !intervention) {
    return apiError("Intervention not found", 404);
  }

  const { data, error } = await supabase
    .from("ls_intervention_sessions")
    .select("*")
    .eq("intervention_id", interventionId)
    .order("session_number", { ascending: true });

  if (error) return apiError(error.message, 500);
  return apiSuccess({ sessions: data ?? [] });
});

/* ── POST: Log a new session ──────────────────────────────────── */

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

  const interventionId = body.interventionId as string | undefined;
  if (!interventionId) return apiError("interventionId required", 400);

  // Verify ownership
  const { data: intervention, error: intError } = await supabase
    .from("ls_interventions")
    .select("id")
    .eq("id", interventionId)
    .eq("organization_id", orgId)
    .single();

  if (intError || !intervention) {
    return apiError("Intervention not found", 404);
  }

  // Compute session_number: max existing + 1
  const { data: existing } = await supabase
    .from("ls_intervention_sessions")
    .select("session_number")
    .eq("intervention_id", interventionId)
    .order("session_number", { ascending: false })
    .limit(1);

  const nextNumber =
    existing && existing.length > 0 ? existing[0].session_number + 1 : 1;

  const row = {
    intervention_id: interventionId,
    session_number: nextNumber,
    session_date: (body.session_date as string) ?? new Date().toISOString().split("T")[0],
    duration_minutes: (body.durationMinutes as number) ?? (body.duration_minutes as number) ?? null,
    delivered_by: (body.deliveredBy as string) ?? (body.delivered_by as string) ?? null,
    focus: body.focus as string,
    observation: (body.observation as string) ?? null,
    next_session_plan: (body.nextSessionPlan as string) ?? (body.next_session_plan as string) ?? null,
    progress_note: (body.progressNote as string) ?? (body.progress_note as string) ?? null,
    stage: (body.stage as string) ?? null,
  };

  if (!row.focus) return apiError("focus is required", 400);

  const { data, error } = await supabase
    .from("ls_intervention_sessions")
    .insert(row)
    .select()
    .single();

  if (error) return apiError(error.message, 500);
  return apiSuccess({ session: data });
});
