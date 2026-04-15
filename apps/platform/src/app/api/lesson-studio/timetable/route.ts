import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const classId = req.nextUrl.searchParams.get("classId");
  if (!classId) return apiError("classId required", 400);

  const { data, error } = await supabase
    .from("ls_timetable_slots")
    .select("*")
    .eq("class_id", classId)
    .order("day_of_week")
    .order("start_time");

  if (error) return apiError(error.message, 500);
  return apiSuccess(data);
});

export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const body = await req.json();
  const { classId, slots } = body;
  const orgId = auth.organizationId;

  if (!classId || !slots?.length) return apiError("classId and slots required", 400);

  // Replace existing timetable for this class
  await supabase
    .from("ls_timetable_slots")
    .delete()
    .eq("class_id", classId)
    .eq("organization_id", orgId);

  const records = slots.map((s: { day_of_week: number; start_time: string; end_time: string; subject: string }) => ({
    organization_id: orgId,
    class_id: classId,
    day_of_week: s.day_of_week,
    start_time: s.start_time,
    end_time: s.end_time,
    subject: s.subject,
  }));

  const { data, error } = await supabase
    .from("ls_timetable_slots")
    .insert(records)
    .select();

  if (error) return apiError(error.message, 500);
  return apiSuccess({ slots: data });
});
