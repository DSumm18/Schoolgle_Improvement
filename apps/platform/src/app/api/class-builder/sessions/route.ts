import { protectedRoute, apiError, apiSuccess } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth) => {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("class_builder_sessions")
    .select(
      `
      *,
      class_builder_responses(count)
    `,
    )
    .eq("organization_id", auth.organizationId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return apiSuccess(
    (data ?? []).map((session: any) => ({
      ...session,
      response_count: session.class_builder_responses?.[0]?.count ?? 0,
    })),
  );
});

export const POST = protectedRoute(async (auth, request) => {
  const supabase = createServiceRoleClient();
  const body = await request.json();
  const yearGroup = String(body.yearGroup || "").trim();
  const title = String(body.title || "").trim();
  const targetClassCount = Number(body.targetClassCount || 2);

  if (!yearGroup) return apiError("Year group is required", 400);
  if (!title) return apiError("Title is required", 400);
  if (![2, 3].includes(targetClassCount)) {
    return apiError("Target class count must be 2 or 3", 400);
  }

  const { data, error } = await supabase
    .from("class_builder_sessions")
    .insert({
      organization_id: auth.organizationId,
      school_id: body.schoolId || null,
      year_group: yearGroup,
      current_class: body.currentClass || null,
      title,
      status: body.status || "draft",
      target_class_count: targetClassCount,
      created_by: auth.userId,
      closes_at: body.closesAt || null,
    })
    .select()
    .single();

  if (error) throw error;
  return apiSuccess(data, 201);
});
