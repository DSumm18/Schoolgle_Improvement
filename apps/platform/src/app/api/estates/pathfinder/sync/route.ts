import { protectedRoute, apiError, apiSuccess } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { buildLocationPayloads } from "@/lib/pathfinder/estates-integration";
import type { PathfinderExtractionResult } from "@/lib/pathfinder/prototype";

async function loadModel(
  organizationId: string,
  modelId: string,
): Promise<PathfinderExtractionResult | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("estates_pathfinder_models")
    .select("extraction_result")
    .eq("organization_id", organizationId)
    .eq("id", modelId)
    .single();

  if (error) {
    console.error("Error loading Pathfinder model for sync:", error);
    return null;
  }

  return data?.extraction_result as PathfinderExtractionResult;
}

export const POST = protectedRoute(
  async (auth, request) => {
    const body = await request.json();
    const model = body.modelId
      ? await loadModel(auth.organizationId, body.modelId)
      : (body.model as PathfinderExtractionResult | undefined);

    if (!model?.rooms?.length) {
      return apiError("A saved modelId or model payload with rooms is required", 400);
    }

    const supabase = createServiceRoleClient();
    const payloads = buildLocationPayloads(model);
    const { data: existing, error: existingError } = await supabase
      .from("estates_locations")
      .select("id, name, room_code, location_type")
      .eq("organization_id", auth.organizationId);

    if (existingError) {
      console.error("Error loading Estates locations:", existingError);
      return apiError("Failed to load Estates locations", 500);
    }

    const existingRows = existing ?? [];
    const rowsToInsert = payloads.filter((payload) => {
      return !existingRows.some((row) => {
        if (payload.roomCode && row.room_code === payload.roomCode) return true;
        return row.name === payload.name && row.location_type === payload.locationType;
      });
    });

    if (rowsToInsert.length > 0) {
      const { error: insertError } = await supabase.from("estates_locations").insert(
        rowsToInsert.map((payload) => ({
          organization_id: auth.organizationId,
          name: payload.name,
          location_type: payload.locationType,
          room_code: payload.roomCode ?? null,
          current_use: payload.currentUse ?? null,
          area_sqm: payload.areaSqm ?? null,
          accessibility: "full",
          hazards: [],
          hazard_details: {
            pathfinderId: payload.pathfinderId,
            pathfinderSource: payload.source,
          },
        })),
      );

      if (insertError) {
        console.error("Error syncing Pathfinder locations:", insertError);
        return apiError("Failed to create Estates locations from Pathfinder", 500);
      }
    }

    if (body.modelId) {
      await supabase
        .from("estates_pathfinder_models")
        .update({
          status: body.publish ? "published" : "approved",
          published_at: body.publish ? new Date().toISOString() : null,
          approved_at: new Date().toISOString(),
          updated_by: auth.userId,
        })
        .eq("organization_id", auth.organizationId)
        .eq("id", body.modelId);
    }

    return apiSuccess({
      created: rowsToInsert.length,
      skipped: payloads.length - rowsToInsert.length,
      total: payloads.length,
    });
  },
  { requiredRole: "caretaker" },
);

