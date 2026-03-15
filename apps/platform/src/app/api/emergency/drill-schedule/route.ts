import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

// GET /api/emergency/drill-schedule — list upcoming and past scheduled drills
export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const orgId = auth.organizationId;
  const view = req.nextUrl.searchParams.get("view") || "upcoming";

  if (view === "reports") {
    const { data, error } = await supabase
      .from("emergency_drill_reports")
      .select("*")
      .eq("organization_id", orgId)
      .order("drill_date", { ascending: false })
      .limit(50);

    if (error) return apiError(error.message, 500);
    return apiSuccess({ reports: data || [] });
  }

  let query = supabase
    .from("emergency_drill_schedule")
    .select("*")
    .eq("organization_id", orgId);

  if (view === "upcoming") {
    query = query.in("status", ["scheduled"]).order("scheduled_date", { ascending: true });
  } else {
    query = query.order("scheduled_date", { ascending: false });
  }

  const { data, error } = await query;
  if (error) return apiError(error.message, 500);

  const now = new Date();
  const drills = (data || []).map((d: any) => ({
    ...d,
    is_overdue: d.status === "scheduled" && new Date(d.scheduled_date) < now,
  }));

  return apiSuccess({ drills });
});

// POST /api/emergency/drill-schedule — schedule a new drill
export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const body = await req.json();

  if (!body.drill_type || !body.scheduled_date) {
    return apiError("drill_type and scheduled_date are required", 400);
  }

  const title = body.title || `${body.drill_type.replace(/_/g, " ")} drill`;

  const { data, error } = await supabase
    .from("emergency_drill_schedule")
    .insert({
      organization_id: auth.organizationId,
      drill_type: body.drill_type,
      title: title.charAt(0).toUpperCase() + title.slice(1),
      description: body.description,
      scheduled_date: body.scheduled_date,
      scheduled_time: body.scheduled_time,
      duration_minutes: body.duration_minutes || 15,
      lead_person: body.lead_person,
    })
    .select()
    .single();

  if (error) return apiError(error.message, 500);
  return apiSuccess(data);
});

// PATCH /api/emergency/drill-schedule — complete or cancel a drill
export const PATCH = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const body = await req.json();

  if (!body.drill_id) return apiError("drill_id is required", 400);

  if (body.action === "cancel") {
    await supabase
      .from("emergency_drill_schedule")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", body.drill_id)
      .eq("organization_id", auth.organizationId);

    return apiSuccess({ cancelled: true });
  }

  // Complete with report
  await supabase
    .from("emergency_drill_schedule")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      broadcast_id: body.broadcast_id || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", body.drill_id)
    .eq("organization_id", auth.organizationId);

  if (body.report) {
    await supabase.from("emergency_drill_reports").insert({
      organization_id: auth.organizationId,
      drill_schedule_id: body.drill_id,
      broadcast_id: body.broadcast_id || null,
      drill_type: body.report.drill_type,
      drill_date: body.report.drill_date || new Date().toISOString().split("T")[0],
      start_time: body.report.start_time || new Date().toISOString(),
      end_time: body.report.end_time,
      evacuation_time_seconds: body.report.evacuation_time_seconds,
      total_acknowledged: body.report.total_acknowledged || 0,
      total_headcount: body.report.total_headcount,
      zones_covered: body.report.zones_covered || [],
      issues_found: body.report.issues_found,
      actions_required: body.report.actions_required,
      weather_conditions: body.report.weather_conditions,
      was_announced: body.report.was_announced ?? true,
      assessor_name: body.report.assessor_name,
      assessor_notes: body.report.assessor_notes,
      compliance_rating: body.report.compliance_rating,
    });
  }

  return apiSuccess({ completed: true });
});
