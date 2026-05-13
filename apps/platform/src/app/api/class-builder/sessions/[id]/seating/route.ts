import { protectedRoute, apiError, apiSuccess } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

function getSessionId(pathname: string) {
  return pathname.split("/class-builder/sessions/")[1]?.split("/")[0];
}

export const PATCH = protectedRoute(async (auth, request) => {
  const sessionId = getSessionId(request.nextUrl.pathname);
  if (!sessionId) return apiError("Session id is required", 400);

  const body = await request.json();
  const seatingPlan = body.seatingPlan;
  if (!seatingPlan || !Array.isArray(seatingPlan.tables)) {
    return apiError("A seating plan with tables is required", 400);
  }

  const supabase = createServiceRoleClient();
  const { data: session, error: sessionError } = await supabase
    .from("class_builder_sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("organization_id", auth.organizationId)
    .single();

  if (sessionError || !session) return apiError("Session not found", 404);

  const { data: groups, error: groupsError } = await supabase
    .from("generated_class_groups")
    .select("id, summary")
    .eq("session_id", sessionId);

  if (groupsError) throw groupsError;
  if (!groups || groups.length === 0) {
    return apiError("Generate draft groups before locking a seating plan", 400);
  }

  const lockedPlan = {
    ...seatingPlan,
    locked: true,
    lockedAt: new Date().toISOString(),
    lockedBy: auth.userId,
  };

  for (const group of groups) {
    const summary =
      group.summary && typeof group.summary === "object" ? group.summary : {};
    const { error } = await supabase
      .from("generated_class_groups")
      .update({
        summary: {
          ...summary,
          seatingPlan: lockedPlan,
        },
      })
      .eq("id", group.id);

    if (error) throw error;
  }

  return apiSuccess({ seatingPlan: lockedPlan });
});
