import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const classId = req.nextUrl.searchParams.get("classId");
  const weekCommencing = req.nextUrl.searchParams.get("week");
  if (!classId || !weekCommencing) return apiError("classId and week required", 400);

  const { data, error } = await supabase
    .from("ls_lesson_plans")
    .select("*")
    .eq("class_id", classId)
    .eq("week_commencing", weekCommencing)
    .order("day_of_week")
    .order("subject");

  if (error) return apiError(error.message, 500);
  return apiSuccess(data);
});

export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const orgId = auth.organizationId;
  if (!orgId) return apiError("No organization", 400);

  const body = await req.json();
  const plan = { ...body, organization_id: orgId };

  const { data, error } = await supabase
    .from("ls_lesson_plans")
    .upsert(plan, { onConflict: "class_id,week_commencing,day_of_week,subject" })
    .select()
    .single();

  if (error) return apiError(error.message, 500);
  return apiSuccess(data);
});
