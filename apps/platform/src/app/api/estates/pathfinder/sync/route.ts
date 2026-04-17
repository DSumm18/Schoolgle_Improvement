import { protectedRoute, apiError, apiSuccess } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import {
  buildLocationPayloads,
  getPathfinderPin,
  mergePathfinderPin,
} from "@/lib/pathfinder/estates-integration";
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

function collectValidPinTargets(model: PathfinderExtractionResult): Set<string> {
  const ids = new Set<string>();
  for (const room of model.rooms ?? []) ids.add(room.id);
  for (const feature of model.siteContext?.features ?? []) ids.add(feature.id);
  return ids;
}

/**
 * When a new model is published, find any asset pins that reference the
 * previously-live model but whose room/site feature no longer exists in the
 * new model. Mark those pins as needs_review on the asset — never delete.
 */
async function flagOrphanAssetPins(
  organizationId: string,
  previousModelId: string,
  nextModel: PathfinderExtractionResult,
  userId: string,
): Promise<{ flagged: number }> {
  const supabase = createServiceRoleClient();
  const { data: assets, error } = await supabase
    .from("estates_assets")
    .select("id, location_details")
    .eq("organization_id", organizationId);

  if (error || !assets) {
    console.error("Error loading assets for orphan pin check:", error);
    return { flagged: 0 };
  }

  const validTargets = collectValidPinTargets(nextModel);
  let flagged = 0;

  for (const asset of assets) {
    const pin = getPathfinderPin(asset.location_details as Record<string, unknown> | null);
    if (!pin || pin.modelId !== previousModelId) continue;

    const roomOk = pin.roomId ? validTargets.has(pin.roomId) : true;
    const featureOk = pin.siteFeatureId ? validTargets.has(pin.siteFeatureId) : true;
    if (roomOk && featureOk) continue;

    const merged = mergePathfinderPin(asset.location_details as Record<string, unknown> | null, {
      ...pin,
      confidence: Math.min(pin.confidence ?? 0.5, 0.2),
      status: "needs_review",
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
    });
    const { error: updateError } = await supabase
      .from("estates_assets")
      .update({
        location_details: merged,
        updated_at: new Date().toISOString(),
      })
      .eq("id", asset.id)
      .eq("organization_id", organizationId);

    if (!updateError) flagged += 1;
  }

  return { flagged };
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

    let orphansFlagged = 0;

    if (body.modelId) {
      const now = new Date().toISOString();
      const isPublish = Boolean(body.publish);

      if (isPublish) {
        // Find any currently-live model so we can supersede it atomically.
        const { data: currentLive } = await supabase
          .from("estates_pathfinder_models")
          .select("id")
          .eq("organization_id", auth.organizationId)
          .eq("is_live", true)
          .maybeSingle();

        if (currentLive?.id && currentLive.id !== body.modelId) {
          // Demote the previous live model first (unique index won't allow two live).
          await supabase
            .from("estates_pathfinder_models")
            .update({
              is_live: false,
              superseded_by: body.modelId,
              updated_by: auth.userId,
            })
            .eq("organization_id", auth.organizationId)
            .eq("id", currentLive.id);

          // Orphan-flag assets whose pins still reference the demoted model.
          const result = await flagOrphanAssetPins(
            auth.organizationId,
            currentLive.id,
            model,
            auth.userId,
          );
          orphansFlagged = result.flagged;
        }

        await supabase
          .from("estates_pathfinder_models")
          .update({
            status: "published",
            is_live: true,
            published_at: now,
            approved_at: now,
            updated_by: auth.userId,
          })
          .eq("organization_id", auth.organizationId)
          .eq("id", body.modelId);
      } else {
        // Approve (not publish): leave is_live untouched.
        await supabase
          .from("estates_pathfinder_models")
          .update({
            status: "approved",
            approved_at: now,
            updated_by: auth.userId,
          })
          .eq("organization_id", auth.organizationId)
          .eq("id", body.modelId);
      }
    }

    return apiSuccess({
      created: rowsToInsert.length,
      skipped: payloads.length - rowsToInsert.length,
      total: payloads.length,
      orphansFlagged,
    });
  },
  { requiredRole: "caretaker" },
);
