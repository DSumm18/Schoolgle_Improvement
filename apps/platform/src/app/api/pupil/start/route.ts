import { apiError, apiSuccess } from "@/lib/api-utils";
import {
  classBuilderYearStorageAliases,
  parseClassBuilderSessionYearGroups,
} from "@/lib/class-builder";
import { hashPupilAccessToken } from "@/lib/pupil-pass";
import { createServiceRoleClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("t");
  if (!token) return apiError("Pupil pass token is required", 400);

  const supabase = createServiceRoleClient();
  const { data: pupil, error } = await supabase
    .from("pupils")
    .select("id,organization_id,year_group,current_class,class_name,pass_codename,pass_colour,pass_animal,pass_badge,is_active,pass_revoked_at")
    .eq("pupil_access_token_hash", hashPupilAccessToken(token))
    .maybeSingle();

  if (error) return apiError(error.message, 500);
  if (!pupil || pupil.pass_revoked_at || pupil.is_active === false) {
    return apiError("This pupil pass is not active. Ask your teacher for help.", 404);
  }

  await supabase
    .from("pupils")
    .update({ pass_last_used_at: new Date().toISOString() })
    .eq("id", pupil.id);

  const { data: sessions, error: sessionsError } = await supabase
    .from("class_builder_sessions")
    .select("id,title,survey_code,year_group,current_class,status")
    .eq("organization_id", pupil.organization_id)
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (sessionsError) return apiError(sessionsError.message, 500);

  const pupilYear = String(pupil.year_group || "");
  const origin = new URL(request.url).origin;
  const activities = (sessions ?? [])
    .filter((session) => {
      const aliases = classBuilderYearStorageAliases(
        parseClassBuilderSessionYearGroups(session.year_group),
      );
      const yearMatches = aliases.includes(pupilYear);
      const classMatches =
        !session.current_class ||
        session.current_class === pupil.current_class ||
        session.current_class === pupil.class_name;
      return yearMatches && classMatches;
    })
    .map((session) => ({
      id: session.id,
      type: "class_builder",
      title: session.title,
      description: "Class Builder friendship and learning choices",
      url: `${origin}/class-builder/s/${session.survey_code}?t=${encodeURIComponent(token)}`,
    }));

  return apiSuccess({
    pupil: {
      id: pupil.id,
      year_group: pupil.year_group,
      current_class: pupil.current_class ?? pupil.class_name,
      pass_codename: pupil.pass_codename,
      pass_colour: pupil.pass_colour,
      pass_animal: pupil.pass_animal,
      pass_badge: pupil.pass_badge,
    },
    activities,
  });
}
