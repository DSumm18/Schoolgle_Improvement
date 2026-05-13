import { protectedRoute, apiError, apiSuccess } from "@/lib/api-utils";
import {
  buildPassIdentity,
  createPupilAccessToken,
  encryptPupilAccessToken,
  hashPupilAccessToken,
} from "@/lib/pupil-pass";
import { createServiceRoleClient } from "@/lib/supabase-server";

function getPupilId(pathname: string) {
  return pathname.split("/data-upload/pupils/")[1]?.split("/")[0];
}

export const PATCH = protectedRoute(async (auth, request) => {
  const pupilId = getPupilId(request.nextUrl.pathname);
  if (!pupilId) return apiError("Pupil id is required", 400);

  const body = await request.json().catch(() => ({}));
  const supabase = createServiceRoleClient();
  const { data: pupil, error: fetchError } = await supabase
    .from("pupils")
    .select("id,pupil_id,organization_id,pass_codename")
    .eq("id", pupilId)
    .eq("organization_id", auth.organizationId)
    .single();

  if (fetchError || !pupil) return apiError("Pupil not found", 404);

  const updates: Record<string, unknown> = {};
  if (body.regenerateToken) {
    const token = createPupilAccessToken();
    updates.pupil_access_token_hash = hashPupilAccessToken(token);
    updates.pupil_access_token_encrypted = encryptPupilAccessToken(token);
    updates.pass_revoked_at = null;
  }

  if (body.passColour !== undefined || body.passAnimal !== undefined || body.passBadge !== undefined) {
    const identity = buildPassIdentity({
      pupil_id: pupil.pupil_id,
      pass_colour: body.passColour || null,
      pass_animal: body.passAnimal || null,
      pass_badge: body.passBadge || null,
    });
    updates.pass_colour = identity.colour;
    updates.pass_animal = identity.animal;
    updates.pass_badge = identity.badge;
    updates.pass_codename = identity.codename;
  }

  if (Object.keys(updates).length === 0) {
    return apiError("No pass changes requested", 400);
  }
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("pupils")
    .update(updates)
    .eq("id", pupilId)
    .eq("organization_id", auth.organizationId)
    .select("id,pass_colour,pass_animal,pass_badge,pass_codename")
    .single();

  if (error) return apiError(error.message, 500);
  return apiSuccess(data);
}, { requiredRole: "slt" });
