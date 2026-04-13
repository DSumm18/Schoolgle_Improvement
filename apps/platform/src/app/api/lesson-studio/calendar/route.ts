import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

/* ── GET: Fetch calendar events for a date range ──────────────────── */

export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const orgId = auth.organizationId;
  if (!orgId) return apiError("No organization", 400);

  const startDate = req.nextUrl.searchParams.get("startDate");
  const endDate = req.nextUrl.searchParams.get("endDate");
  const classId = req.nextUrl.searchParams.get("classId");

  if (!startDate) return apiError("startDate required", 400);
  if (!endDate) return apiError("endDate required", 400);

  let query = supabase
    .from("ls_calendar_events")
    .select("*, lesson_plan:ls_lesson_plans(id, title, status, learning_objective)")
    .eq("organization_id", orgId)
    .gte("event_date", startDate)
    .lte("event_date", endDate)
    .order("event_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (classId) {
    query = query.eq("class_id", classId);
  }

  const { data, error } = await query;

  if (error) return apiError(error.message, 500);
  return apiSuccess({ events: data });
});

/* ── POST: Create or update a calendar event ──────────────────────── */

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

  const { id, classId, title, subject, eventDate, startTime, endTime, room, lessonPlanId, notes } = body as {
    id?: string;
    classId?: string;
    title?: string;
    subject?: string;
    eventDate?: string;
    startTime?: string;
    endTime?: string;
    room?: string;
    lessonPlanId?: string;
    notes?: string;
  };

  if (!classId) return apiError("classId required", 400);
  if (!title) return apiError("title required", 400);
  if (!subject) return apiError("subject required", 400);
  if (!eventDate) return apiError("eventDate required", 400);
  if (!startTime) return apiError("startTime required", 400);
  if (!endTime) return apiError("endTime required", 400);

  if (id) {
    // Update existing event — verify org match first
    const { data: existing, error: fetchError } = await supabase
      .from("ls_calendar_events")
      .select("id, organization_id")
      .eq("id", id)
      .eq("organization_id", orgId)
      .single();

    if (fetchError || !existing) return apiError("Event not found", 404);

    const { data: updated, error: updateError } = await supabase
      .from("ls_calendar_events")
      .update({
        class_id: classId,
        title,
        subject,
        event_date: eventDate,
        start_time: startTime,
        end_time: endTime,
        room: room ?? null,
        lesson_plan_id: lessonPlanId ?? null,
        notes: notes ?? null,
        teacher_user_id: auth.userId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*, lesson_plan:ls_lesson_plans(id, title, status, learning_objective)")
      .single();

    if (updateError) return apiError(updateError.message, 500);
    return apiSuccess({ event: updated });
  }

  // Create — upsert on conflict (class_id, event_date, start_time)
  const { data: created, error: upsertError } = await supabase
    .from("ls_calendar_events")
    .upsert(
      {
        organization_id: orgId,
        class_id: classId,
        title,
        subject,
        event_date: eventDate,
        start_time: startTime,
        end_time: endTime,
        room: room ?? null,
        lesson_plan_id: lessonPlanId ?? null,
        notes: notes ?? null,
        teacher_user_id: auth.userId,
      },
      { onConflict: "class_id,event_date,start_time" },
    )
    .select("*, lesson_plan:ls_lesson_plans(id, title, status, learning_objective)")
    .single();

  if (upsertError) return apiError(upsertError.message, 500);
  return apiSuccess({ event: created });
});

/* ── DELETE: Remove a calendar event ─────────────────────────────── */

export const DELETE = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const orgId = auth.organizationId;
  if (!orgId) return apiError("No organization", 400);

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return apiError("id required", 400);

  const { error } = await supabase
    .from("ls_calendar_events")
    .delete()
    .eq("id", id)
    .eq("organization_id", orgId);

  if (error) return apiError(error.message, 500);
  return apiSuccess({ deleted: true });
});
