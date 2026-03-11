import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import type { TaskTimeEntryForm, TaskTimeSummary } from "@/lib/tasks";
import { v4 as uuidv4 } from "uuid";

/**
 * GET /api/tasks/[id]/time
 * Get time entries for a task
 */
export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const organizationId =
    searchParams.get("organizationId") || auth.organizationId;
  const segments = req.nextUrl.pathname.split("/");
  const taskId = segments[segments.indexOf("tasks") + 1];

  const supabase = createServiceRoleClient();

  const { data: timeEntries, error } = await supabase
    .from("task_time_entries")
    .select(
      `
            *,
            user:users!task_time_entries_user_id_fkey (
                id,
                email,
                raw_user_meta_data->>'full_name' as full_name
            )
        `,
    )
    .eq("organization_id", organizationId)
    .eq("task_id", taskId)
    .order("date", { ascending: false });

  if (error) {
    console.error("Error fetching time entries:", error);
    return apiError("Failed to fetch time entries", 500);
  }

  // Enrich with user info
  const enrichedEntries = (timeEntries || []).map((entry: any) => ({
    ...entry,
    user_name: entry.user?.full_name || entry.user?.email || "Unknown",
    user_email: entry.user?.email || null,
  }));

  // Calculate summary
  const totalMinutes = enrichedEntries.reduce(
    (sum: number, e: any) => sum + e.minutes,
    0,
  );
  const totalHours = totalMinutes / 60;

  const byUser = enrichedEntries.reduce((acc: any, entry: any) => {
    if (!acc[entry.user_id]) {
      acc[entry.user_id] = {
        user_id: entry.user_id,
        user_name: entry.user_name,
        minutes: 0,
        entries: 0,
      };
    }
    acc[entry.user_id].minutes += entry.minutes;
    acc[entry.user_id].entries += 1;
    return acc;
  }, {});

  const summary: TaskTimeSummary = {
    task_id: taskId,
    total_minutes: totalMinutes,
    total_hours: Math.round(totalHours * 100) / 100,
    entries: enrichedEntries.length,
    by_user: Object.values(byUser).map((u: any) => ({
      user_id: u.user_id,
      user_name: u.user_name,
      minutes: u.minutes,
      hours: Math.round((u.minutes / 60) * 100) / 100,
    })),
  };

  return apiSuccess({
    time_entries: enrichedEntries,
    summary,
  });
});

/**
 * POST /api/tasks/[id]/time
 * Add a time entry to a task
 */
export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const body = await req.json();
  const { organizationId, taskSource, minutes, description, date, userId } =
    body as TaskTimeEntryForm & { organizationId: string; userId?: string };

  const orgId = organizationId || auth.organizationId;
  const segments = req.nextUrl.pathname.split("/");
  const taskId = segments[segments.indexOf("tasks") + 1];

  if (!minutes || minutes <= 0 || !date) {
    return apiError(
      "Missing required fields: minutes (positive number), date",
      400,
    );
  }

  const supabase = createServiceRoleClient();

  const { data: timeEntry, error } = await supabase
    .from("task_time_entries")
    .insert({
      id: uuidv4(),
      organization_id: orgId,
      task_id: taskId,
      task_source: taskSource || "actions",
      user_id: userId || auth.userId,
      minutes,
      description: description || null,
      date,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating time entry:", error);
    return apiError("Failed to create time entry", 500);
  }

  // Update task's actual_hours if in actions table
  if (taskSource !== "estates_compliance_tasks") {
    const { data: existingEntries } = await supabase
      .from("task_time_entries")
      .select("minutes")
      .eq("organization_id", orgId)
      .eq("task_id", taskId);

    const totalMinutes =
      existingEntries?.reduce(
        (sum: number, e: any) => sum + e.minutes,
        minutes,
      ) || 0;
    const totalHours = totalMinutes / 60;

    await supabase
      .from("actions")
      .update({ actual_hours: totalHours })
      .eq("id", taskId)
      .eq("organization_id", orgId);
  }

  return apiSuccess({ time_entry: timeEntry }, 201);
});

/**
 * PATCH /api/tasks/[id]/time
 * Update a time entry
 */
export const PATCH = protectedRoute(async (auth, req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const organizationId =
    searchParams.get("organizationId") || auth.organizationId;
  const timeEntryId = searchParams.get("timeEntryId");
  const body = await req.json();
  const segments = req.nextUrl.pathname.split("/");
  const taskId = segments[segments.indexOf("tasks") + 1];

  if (!timeEntryId) {
    return apiError("Missing required parameters: timeEntryId", 400);
  }

  const supabase = createServiceRoleClient();

  const { data: timeEntry, error } = await supabase
    .from("task_time_entries")
    .update({
      ...body,
    })
    .eq("id", timeEntryId)
    .eq("organization_id", organizationId)
    .select()
    .single();

  if (error || !timeEntry) {
    return apiError("Time entry not found or update failed", 404);
  }

  // Recalculate task's actual_hours
  if (timeEntry.task_source !== "estates_compliance_tasks") {
    const { data: allEntries } = await supabase
      .from("task_time_entries")
      .select("minutes")
      .eq("organization_id", organizationId)
      .eq("task_id", timeEntry.task_id);

    const totalMinutes =
      allEntries?.reduce((sum: number, e: any) => sum + e.minutes, 0) || 0;
    const totalHours = Math.round((totalMinutes / 60) * 100) / 100;

    await supabase
      .from("actions")
      .update({ actual_hours: totalHours })
      .eq("id", timeEntry.task_id)
      .eq("organization_id", organizationId);
  }

  return apiSuccess({ time_entry: timeEntry });
});

/**
 * DELETE /api/tasks/[id]/time
 * Delete a time entry
 */
export const DELETE = protectedRoute(async (auth, req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const organizationId =
    searchParams.get("organizationId") || auth.organizationId;
  const timeEntryId = searchParams.get("timeEntryId");

  if (!timeEntryId) {
    return apiError("Missing required parameters: timeEntryId", 400);
  }

  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("task_time_entries")
    .delete()
    .eq("id", timeEntryId)
    .eq("organization_id", organizationId);

  if (error) {
    console.error("Error deleting time entry:", error);
    return apiError("Failed to delete time entry", 500);
  }

  return apiSuccess({ success: true });
});
