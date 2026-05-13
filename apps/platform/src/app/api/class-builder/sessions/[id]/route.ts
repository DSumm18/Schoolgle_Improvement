import { protectedRoute, apiError, apiSuccess } from "@/lib/api-utils";
import { decryptPupilAccessToken } from "@/lib/pupil-pass";
import { createServiceRoleClient } from "@/lib/supabase-server";

function getSessionId(pathname: string) {
  return pathname.split("/class-builder/sessions/")[1]?.split("/")[0];
}

export const GET = protectedRoute(async (auth, request) => {
  const sessionId = getSessionId(request.nextUrl.pathname);
  if (!sessionId) return apiError("Session id is required", 400);

  const supabase = createServiceRoleClient();
  const { data: session, error: sessionError } = await supabase
    .from("class_builder_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("organization_id", auth.organizationId)
    .single();

  if (sessionError) throw sessionError;

  let pupilQuery = supabase
    .from("pupils")
    .select(
      "id, first_name, last_name, year_group, current_class, class_name, gender, send_status, sen_status, ehcp, primary_need, is_eal, is_pupil_premium, pass_codename, pass_colour, pass_animal, pass_badge, pupil_access_token_encrypted, pass_revoked_at",
    )
    .eq("organization_id", auth.organizationId)
    .eq("year_group", session.year_group)
    .eq("is_active", true)
    .order("last_name")
    .order("first_name");

  if (session.current_class) {
    pupilQuery = pupilQuery.or(
      `current_class.eq.${session.current_class},class_name.eq.${session.current_class}`,
    );
  }

  const { data: pupils, error: pupilsError } = await pupilQuery;
  if (pupilsError) throw pupilsError;

  const { data: responses, error: responsesError } = await supabase
    .from("class_builder_responses")
    .select(
      `
      *,
      class_builder_choices (*)
    `,
    )
    .eq("session_id", sessionId)
    .order("submitted_at", { ascending: false });

  if (responsesError) throw responsesError;

  const { data: groups, error: groupsError } = await supabase
    .from("generated_class_groups")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false });

  if (groupsError) throw groupsError;

  return apiSuccess({
    session,
    pupils: (pupils ?? []).map((pupil: any) =>
      mapPupil(pupil, request.nextUrl.origin),
    ),
    responses: responses ?? [],
    groups: groups ?? [],
  });
});

export const PATCH = protectedRoute(async (auth, request) => {
  const sessionId = getSessionId(request.nextUrl.pathname);
  if (!sessionId) return apiError("Session id is required", 400);

  const body = await request.json();
  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = String(body.title).trim();
  if (body.status !== undefined) {
    if (!["draft", "open", "closed"].includes(body.status)) {
      return apiError("Invalid session status", 400);
    }
    updates.status = body.status;
  }
  if (body.targetClassCount !== undefined) {
    const count = Number(body.targetClassCount);
    if (![2, 3].includes(count)) {
      return apiError("Target class count must be 2 or 3", 400);
    }
    updates.target_class_count = count;
  }
  if (body.closesAt !== undefined) updates.closes_at = body.closesAt || null;

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("class_builder_sessions")
    .update(updates)
    .eq("id", sessionId)
    .eq("organization_id", auth.organizationId)
    .select()
    .single();

  if (error) throw error;
  return apiSuccess(data);
});

function mapPupil(pupil: any, origin: string) {
  const token =
    pupil.pupil_access_token_encrypted && !pupil.pass_revoked_at
      ? decryptPupilAccessToken(pupil.pupil_access_token_encrypted)
      : null;
  return {
    id: pupil.id,
    first_name: pupil.first_name,
    last_name: pupil.last_name,
    year_group: pupil.year_group,
    current_class: pupil.current_class ?? pupil.class_name ?? null,
    gender: pupil.gender ?? null,
    send_status: pupil.send_status ?? pupil.sen_status ?? null,
    ehcp: pupil.ehcp ?? pupil.sen_status === "E",
    primary_need: pupil.primary_need ?? null,
    eal: Boolean(pupil.is_eal),
    pupil_premium: Boolean(pupil.is_pupil_premium),
    pass_codename: pupil.pass_codename ?? null,
    pass_colour: pupil.pass_colour ?? null,
    pass_animal: pupil.pass_animal ?? null,
    pass_badge: pupil.pass_badge ?? null,
    pass_url: token ? `${origin}/pupil/start?t=${encodeURIComponent(token)}` : null,
  };
}
