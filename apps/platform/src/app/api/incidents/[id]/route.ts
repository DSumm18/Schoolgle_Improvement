import { NextRequest } from "next/server";
import { protectedRoute, apiError, apiSuccess } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const id = req.nextUrl.pathname.split("/").at(-1);
  const supabase = createServiceRoleClient();

  const { data: incident, error } = await supabase
    .from("incidents")
    .select("*")
    .eq("organization_id", auth.organizationId)
    .eq("id", id)
    .single();

  if (error || !incident) return apiError("Incident not found", 404, "NOT_FOUND");

  const { data: chronology, error: chronologyError } = await supabase
    .from("incident_chronology")
    .select("*")
    .eq("organization_id", auth.organizationId)
    .eq("incident_id", id)
    .order("created_at", { ascending: false });

  if (chronologyError) return apiError(chronologyError.message, 500);

  return apiSuccess({ incident: { ...incident, chronology: chronology || [] } });
});

export const PATCH = protectedRoute(async (auth, req: NextRequest) => {
  const id = req.nextUrl.pathname.split("/").at(-1);
  const body = await req.json();
  const supabase = createServiceRoleClient();

  const { data: existing, error: existingError } = await supabase
    .from("incidents")
    .select("*")
    .eq("organization_id", auth.organizationId)
    .eq("id", id)
    .single();

  if (existingError || !existing) {
    return apiError("Incident not found", 404, "NOT_FOUND");
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof body.owner_label === "string") updates.owner_label = body.owner_label;
  if (typeof body.waiting_for === "string") updates.waiting_for = body.waiting_for;
  if (typeof body.status === "string") updates.status = body.status;
  if (typeof body.next_action === "string") updates.next_action = body.next_action;

  const { data: incident, error } = await supabase
    .from("incidents")
    .update(updates)
    .eq("organization_id", auth.organizationId)
    .eq("id", id)
    .select()
    .single();

  if (error || !incident) return apiError(error?.message || "Failed to update incident", 500);

  const actor = body.actor_name || auth.email || "Signed-in user";
  const changedOwner =
    typeof body.owner_label === "string" && body.owner_label !== existing.owner_label;

  if (changedOwner) {
    await supabase.from("incident_chronology").insert({
      incident_id: id,
      organization_id: auth.organizationId,
      actor_user_id: auth.userId,
      actor_name: actor,
      action: "Owner reassigned",
      detail: `Incident moved from ${existing.owner_label || "unassigned"} to ${body.owner_label}.`,
    });
  }

  const { data: chronology } = await supabase
    .from("incident_chronology")
    .select("*")
    .eq("organization_id", auth.organizationId)
    .eq("incident_id", id)
    .order("created_at", { ascending: false });

  return apiSuccess({ incident: { ...incident, chronology: chronology || [] } });
});
