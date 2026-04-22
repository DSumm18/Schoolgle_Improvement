import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

const VALID_KEY_STAGES = ["EYFS", "KS1", "KS2", "KS3", "KS4", "KS5"] as const;

function extractId(req: NextRequest): string | null {
  const parts = req.nextUrl.pathname.split("/").filter(Boolean);
  return parts[parts.length - 1] || null;
}

// PATCH /api/lesson-studio/classes/:id — update a class
export const PATCH = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const orgId = auth.organizationId;
  if (!orgId) return apiError("No organization", 400);

  const id = extractId(req);
  if (!id) return apiError("Missing id", 400);

  const body = (await req.json().catch(() => null)) as {
    year_group?: string;
    class_name?: string;
    key_stage?: string;
    room?: string | null;
    academic_year?: string;
  } | null;
  if (!body) return apiError("Invalid body", 400);

  const updates: Record<string, unknown> = {};
  if (body.year_group !== undefined) updates.year_group = body.year_group.trim();
  if (body.class_name !== undefined) updates.class_name = body.class_name.trim();
  if (body.key_stage !== undefined) {
    if (!(VALID_KEY_STAGES as readonly string[]).includes(body.key_stage)) {
      return apiError("Invalid key_stage", 400);
    }
    updates.key_stage = body.key_stage;
  }
  if (body.room !== undefined) updates.room = body.room?.trim() || null;
  if (body.academic_year !== undefined)
    updates.academic_year = body.academic_year.trim();

  if (Object.keys(updates).length === 0) {
    return apiError("Nothing to update", 400);
  }
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("ls_classes")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", orgId)
    .select("*")
    .single();

  if (error) return apiError(error.message, 400);
  if (!data) return apiError("Class not found", 404);
  return apiSuccess(data);
});

// DELETE /api/lesson-studio/classes/:id — delete a class
export const DELETE = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const orgId = auth.organizationId;
  if (!orgId) return apiError("No organization", 400);

  const id = extractId(req);
  if (!id) return apiError("Missing id", 400);

  // Safety: don't allow delete if the class has pupils or slots attached
  const [{ count: pupilCount }, { count: slotCount }] = await Promise.all([
    supabase
      .from("ls_pupils")
      .select("*", { count: "exact", head: true })
      .eq("class_id", id)
      .eq("organization_id", orgId),
    supabase
      .from("ls_timetable_slots")
      .select("*", { count: "exact", head: true })
      .eq("class_id", id)
      .eq("organization_id", orgId),
  ]);

  if ((pupilCount || 0) > 0 || (slotCount || 0) > 0) {
    return apiError(
      `Can't delete: class has ${pupilCount || 0} pupil(s) and ${slotCount || 0} timetable slot(s). Move them first.`,
      409,
    );
  }

  const { error } = await supabase
    .from("ls_classes")
    .delete()
    .eq("id", id)
    .eq("organization_id", orgId);

  if (error) return apiError(error.message, 400);
  return apiSuccess({ deleted: id });
});
