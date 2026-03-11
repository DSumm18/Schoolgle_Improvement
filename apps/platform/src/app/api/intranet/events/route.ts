import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, req) => {
  const supabase = createServiceRoleClient();
  const orgId =
    req.nextUrl.searchParams.get("organizationId") || auth.organizationId;

  // Get events for the next 7 days by default
  const days = parseInt(req.nextUrl.searchParams.get("days") || "7");
  const today = new Date().toISOString().split("T")[0];
  const endDate = new Date(Date.now() + days * 86400000)
    .toISOString()
    .split("T")[0];

  const { data, error } = await supabase
    .from("school_events")
    .select("*")
    .eq("organization_id", orgId)
    .gte("event_date", today)
    .lte("event_date", endDate)
    .order("event_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    return apiError(error.message, 500);
  }

  return apiSuccess(data);
});

export const POST = protectedRoute(async (auth, req) => {
  const supabase = createServiceRoleClient();
  const body = await req.json();
  const {
    organizationId,
    title,
    description,
    eventDate,
    startTime,
    endTime,
    location,
    eventType,
    allDay,
    recurring,
    createdBy,
  } = body;

  const orgId = organizationId || auth.organizationId;

  if (!title || !eventDate) {
    return apiError("Missing required fields", 400);
  }

  const { data, error } = await supabase
    .from("school_events")
    .insert({
      organization_id: orgId,
      title,
      description,
      event_date: eventDate,
      start_time: startTime,
      end_time: endTime,
      location,
      event_type: eventType || "general",
      all_day: allDay || false,
      recurring: recurring || "none",
      created_by: createdBy || auth.userId,
    })
    .select()
    .single();

  if (error) {
    return apiError(error.message, 500);
  }

  return apiSuccess(data);
});

export const DELETE = protectedRoute(async (auth, req) => {
  const supabase = createServiceRoleClient();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return apiError("Missing id", 400);
  }

  const { error } = await supabase.from("school_events").delete().eq("id", id);

  if (error) {
    return apiError(error.message, 500);
  }

  return apiSuccess({ success: true });
});
