import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

// GET /api/calendar — list calendar events with optional date filtering
export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const orgId = auth.organizationId;
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");
  const type = req.nextUrl.searchParams.get("type");

  let query = supabase
    .from("school_calendar_events")
    .select("*")
    .eq("organization_id", orgId)
    .order("start_date", { ascending: true });

  if (from) query = query.gte("start_date", from);
  if (to) query = query.lte("start_date", to);
  if (type) query = query.eq("event_type", type);

  const { data, error } = await query;
  if (error) return apiError(error.message, 500);

  return apiSuccess({ events: data || [] });
});

// POST /api/calendar — create a calendar event
export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const body = await req.json();

  if (!body.title || !body.start_date) {
    return apiError("title and start_date are required", 400);
  }

  const { data: user } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", auth.userId)
    .single();

  const { data, error } = await supabase
    .from("school_calendar_events")
    .insert({
      organization_id: auth.organizationId,
      title: body.title,
      description: body.description,
      event_type: body.event_type || "general",
      start_date: body.start_date,
      end_date: body.end_date || body.start_date,
      start_time: body.start_time,
      end_time: body.end_time,
      location: body.location,
      is_all_day: body.is_all_day ?? !body.start_time,
      audience: body.audience || "all",
      color: body.color,
      notify_parents: body.notify_parents || false,
      notify_staff: body.notify_staff || false,
      show_on_display: body.show_on_display || false,
      show_countdown: body.show_countdown || false,
      created_by: auth.userId,
      created_by_name: user?.full_name || auth.email,
      academic_year: body.academic_year,
      term: body.term,
    })
    .select()
    .single();

  if (error) return apiError(error.message, 500);
  return apiSuccess(data);
});
