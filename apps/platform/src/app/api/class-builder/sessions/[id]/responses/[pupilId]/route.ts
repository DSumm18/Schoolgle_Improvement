import { protectedRoute, apiError, apiSuccess } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

function pathParts(pathname: string) {
  const [, rest] = pathname.split("/class-builder/sessions/");
  const parts = rest?.split("/") ?? [];
  return { sessionId: parts[0], pupilId: parts[2] };
}

export const DELETE = protectedRoute(async (auth, request) => {
  const { sessionId, pupilId } = pathParts(request.nextUrl.pathname);
  if (!sessionId || !pupilId) {
    return apiError("Session id and pupil id are required", 400);
  }

  const supabase = createServiceRoleClient();
  const { data: session, error: sessionError } = await supabase
    .from("class_builder_sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("organization_id", auth.organizationId)
    .single();

  if (sessionError || !session) return apiError("Session not found", 404);

  const { error } = await supabase
    .from("class_builder_responses")
    .delete()
    .eq("session_id", sessionId)
    .eq("pupil_id", pupilId);

  if (error) throw error;
  return apiSuccess({ ok: true });
});
