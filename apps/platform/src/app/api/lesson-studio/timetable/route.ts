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
