import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import type {
  GovernorTraining,
  GovernorTrainingForm,
  TrainingType,
} from "@/lib/governance";
import { v4 as uuidv4 } from "uuid";

/**
 * GET /api/governance/training
 * Get training records for governors
 */
export const GET = protectedRoute(async (auth, req) => {
  const { searchParams } = new URL(req.url);
  // orgId MUST come from authenticated session — never from caller
  const organizationId = auth.organizationId;
  const governorId = searchParams.get("governorId");
  const trainingType = searchParams.get("trainingType") as TrainingType | null;
  const includeExpired = searchParams.get("includeExpired") === "true";

  if (!organizationId) {
    return apiError("Missing organizationId parameter", 400);
  }

  const supabase = createServiceRoleClient();

  let query = supabase
    .from("governor_training")
    .select(
      `
            *,
            governor:governors (
                id,
                full_name,
                email,
                photo_url
            )
        `,
    )
    .eq("organization_id", organizationId)
    .order("completed_date", { ascending: false });

  if (governorId) {
    query = query.eq("governor_id", governorId);
  }
  if (trainingType) {
    query = query.eq("training_type", trainingType);
  }

  const { data: training, error } = await query;

  if (error) {
    console.error("Error fetching training:", error);
    return apiError("Failed to fetch training records", 500);
  }

  const today = new Date();
  const expired =
    training?.filter(
      (t: GovernorTraining) => t.expiry_date && new Date(t.expiry_date) < today,
    ) || [];

  return apiSuccess({
    training: training || [],
    total: training?.length || 0,
    expired: expired.length,
    completion_rate: 0, // Will be calculated based on required training
  });
});

/**
 * POST /api/governance/training
 * Create a new training record
 */
export const POST = protectedRoute(async (auth, req) => {
  const body = await req.json();
  const {
    organizationId,
    governorId,
    title,
    provider,
    training_type,
    completed_date,
    expiry_date,
    duration_hours,
    certificate_url,
    notes,
  } = body as {
    organizationId: string;
    governorId: string;
    title: string;
    provider?: string;
    training_type: TrainingType;
    completed_date?: string;
    expiry_date?: string;
    duration_hours?: number;
    certificate_url?: string;
    notes?: string;
  };

  // orgId MUST come from authenticated session — never from caller
  const orgId = auth.organizationId;

  if (!orgId || !governorId || !title || !training_type) {
    return apiError(
      "Missing required fields: organizationId, governorId, title, training_type",
      400,
    );
  }

  const supabase = createServiceRoleClient();

  const { data: training, error } = await supabase
    .from("governor_training")
    .insert({
      id: uuidv4(),
      organization_id: orgId,
      governor_id: governorId,
      title,
      provider: provider || null,
      training_type,
      completed_date: completed_date || null,
      expiry_date: expiry_date || null,
      duration_hours: duration_hours || null,
      certificate_url: certificate_url || null,
      notes: notes || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating training record:", error);
    return apiError("Failed to create training record", 500);
  }

  return apiSuccess({ training }, 201);
});

/**
 * PATCH /api/governance/training
 * Bulk update training records
 */
export const PATCH = protectedRoute(async (auth, req) => {
  const body = await req.json();
  const { organizationId, updates } = body as {
    organizationId: string;
    updates: Array<{
      id: string;
      changes: Partial<GovernorTrainingForm>;
    }>;
  };

  // orgId MUST come from authenticated session — never from caller
  const orgId = auth.organizationId;

  if (!orgId || !updates || !Array.isArray(updates)) {
    return apiError(
      "Missing required fields: organizationId, updates (array)",
      400,
    );
  }

  const supabase = createServiceRoleClient();

  const results = await Promise.all(
    updates.map(async ({ id, changes }) => {
      const { data, error } = await supabase
        .from("governor_training")
        .update({
          ...changes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("organization_id", orgId)
        .select()
        .single();

      return { training: data, error };
    }),
  );

  const successCount = results.filter((r) => !r.error).length;
  const errors = results.filter((r) => r.error).map((r) => r.error);

  return apiSuccess({
    updated: successCount,
    failed: results.length - successCount,
    errors: errors.length > 0 ? errors : undefined,
  });
});

/**
 * DELETE /api/governance/training
 * Delete training records
 */
export const DELETE = protectedRoute(async (auth, req) => {
  const { searchParams } = new URL(req.url);
  // orgId MUST come from authenticated session — never from caller
  const organizationId = auth.organizationId;
  const ids = searchParams.get("ids")?.split(",");

  if (!organizationId || !ids || ids.length === 0) {
    return apiError("Missing required parameters: organizationId, ids", 400);
  }

  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("governor_training")
    .delete()
    .in("id", ids)
    .eq("organization_id", organizationId);

  if (error) {
    console.error("Error deleting training records:", error);
    return apiError("Failed to delete training records", 500);
  }

  return apiSuccess({ success: true, deleted: ids.length });
});
