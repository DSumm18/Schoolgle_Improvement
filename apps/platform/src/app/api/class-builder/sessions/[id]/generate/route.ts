import { protectedRoute, apiError, apiSuccess } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import {
  buildDefaultDestinationClasses,
  classBuilderYearStorageAliases,
  generateClassGroups,
  parseClassBuilderSessionYearGroups,
  type ClassBuilderPupil,
} from "@/lib/class-builder";

function getSessionId(pathname: string) {
  return pathname.split("/class-builder/sessions/")[1]?.split("/")[0];
}

export const POST = protectedRoute(async (auth, request) => {
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

  const cohortYearGroups = parseClassBuilderSessionYearGroups(session.year_group);
  const yearAliases = classBuilderYearStorageAliases(cohortYearGroups);

  let pupilQuery = supabase
    .from("pupils")
    .select(
      "id, first_name, last_name, year_group, current_class, class_name, gender, send_status, sen_status, ehcp, is_eal",
    )
    .eq("organization_id", auth.organizationId)
    .in("year_group", yearAliases)
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

  const { data: responses, error: choicesError } = await supabase
    .from("class_builder_responses")
    .select("class_builder_choices(*)")
    .eq("session_id", sessionId);

  if (choicesError) throw choicesError;

  const choices = (responses ?? []).flatMap(
    (response: any) => response.class_builder_choices ?? [],
  );
  const result = generateClassGroups({
    pupils: (pupils ?? []).map(mapPupil),
    choices,
    targetClassCount: session.target_class_count,
    destinationClasses:
      Array.isArray(session.destination_structure) &&
      session.destination_structure.length > 0
        ? session.destination_structure
        : buildDefaultDestinationClasses(
            session.year_group,
            session.target_class_count,
          ),
  });

  await supabase.from("generated_class_groups").delete().eq("session_id", sessionId);

  const { data: stored, error: insertError } = await supabase
    .from("generated_class_groups")
    .insert(
      result.groups.map((group) => ({
        session_id: sessionId,
        name: group.name,
        pupil_ids: group.pupilIds,
        summary: { ...group.summary, explanation: result.summary },
      })),
    )
    .select();

  if (insertError) throw insertError;
  return apiSuccess({ groups: stored ?? [], summary: result.summary });
});

function mapPupil(pupil: any): ClassBuilderPupil {
  return {
    id: pupil.id,
    first_name: pupil.first_name,
    last_name: pupil.last_name,
    year_group: pupil.year_group,
    current_class: pupil.current_class ?? pupil.class_name ?? null,
    gender: pupil.gender ?? null,
    send_status: pupil.send_status ?? pupil.sen_status ?? null,
    ehcp: pupil.ehcp ?? pupil.sen_status === "E",
    is_eal: pupil.is_eal ?? null,
  };
}
