import { apiError, apiSuccess } from "@/lib/api-utils";
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
    activities: [],
  });
}
