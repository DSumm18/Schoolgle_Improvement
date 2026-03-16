import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

// GET /api/notices/schedule — list scheduled notices
export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const status = req.nextUrl.searchParams.get("status") || "pending";

  const { data, error } = await supabase
    .from("scheduled_notices")
    .select("*")
    .eq("organization_id", auth.organizationId)
    .eq("status", status)
    .order("scheduled_for", { ascending: true });

  if (error) return apiError(error.message, 500);
  return apiSuccess({ scheduled: data || [] });
});

// POST /api/notices/schedule — schedule a notice for future delivery
export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const body = await req.json();

  if (!body.scheduled_for) {
    return apiError("scheduled_for is required", 400);
  }

  // Get the creator's name
  const { data: user } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", auth.userId)
    .single();

  const { data, error } = await supabase
    .from("scheduled_notices")
    .insert({
      organization_id: auth.organizationId,
      notice_data: {
        title: body.title,
        body: body.body,
        notice_type: body.notice_type || "announcement",
        priority: body.priority || "normal",
        audience: body.audience || "all",
        show_on_display: body.show_on_display ?? true,
        show_on_dashboard: body.show_on_dashboard ?? true,
        display_style: body.display_style || "card",
        pin_to_top: body.pin_to_top || false,
        event_date: body.event_date,
        event_time: body.event_time,
        event_location: body.event_location,
      },
      scheduled_for: body.scheduled_for,
      recurrence: body.recurrence || "none",
      recurrence_end: body.recurrence_end || null,
      created_by: auth.userId,
      created_by_name: user?.full_name || auth.email,
    })
    .select()
    .single();

  if (error) return apiError(error.message, 500);
  return apiSuccess(data);
});
