import { NextRequest } from "next/server";
import { protectedRoute, apiError, apiSuccess } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const incidentId = req.nextUrl.pathname.split("/").at(-2);
  const body = await req.json();
  const note = String(body.note || "").trim();
  const actorName = body.actor_name || auth.email || "Signed-in user";

  if (!incidentId) return apiError("Incident ID is required", 400, "MISSING_ID");
  if (!note) return apiError("note is required", 400, "MISSING_FIELDS");

  const supabase = createServiceRoleClient();

  const { data: incident, error: incidentError } = await supabase
    .from("incidents")
    .select("id")
    .eq("organization_id", auth.organizationId)
    .eq("id", incidentId)
    .single();

  if (incidentError || !incident) {
    return apiError("Incident not found", 404, "NOT_FOUND");
  }

  const { data: savedNote, error } = await supabase
    .from("incident_notes")
    .insert({
      incident_id: incidentId,
      organization_id: auth.organizationId,
      author_user_id: auth.userId,
      author_name: actorName,
      note,
    })
    .select()
    .single();

  if (error || !savedNote) {
    return apiError(error?.message || "Failed to add note", 500);
  }

  const { data: chronologyEntry, error: chronologyError } = await supabase
    .from("incident_chronology")
    .insert({
      incident_id: incidentId,
      organization_id: auth.organizationId,
      actor_user_id: auth.userId,
      actor_name: actorName,
      action: "Note added",
      detail: note,
    })
    .select()
    .single();

  if (chronologyError) return apiError(chronologyError.message, 500);

  return apiSuccess({ note: savedNote, chronologyEntry }, 201);
});

