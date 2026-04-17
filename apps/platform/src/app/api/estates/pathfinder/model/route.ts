import { protectedRoute, apiError, apiSuccess } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import type { PathfinderExtractionResult } from "@/lib/pathfinder/prototype";
import type { PathfinderModelStatus } from "@/lib/pathfinder/estates-integration";

const MODEL_SELECT =
  "id, organization_id, name, status, source_document_id, source_document_provider, source_document_path, source_page_number, generated_image_url, extraction_mode, extraction_timestamp, parent_model_id, revision_number, is_live, superseded_by, source_document_url, source_document_name, extraction_result, metrics, approved_at, published_at, created_at, updated_at";

const STATUS_VALUES: PathfinderModelStatus[] = ["draft", "school_review", "approved", "published"];

function toStatus(value: unknown): PathfinderModelStatus {
  return STATUS_VALUES.includes(value as PathfinderModelStatus)
    ? (value as PathfinderModelStatus)
    : "school_review";
}

export const GET = protectedRoute(async (auth, request) => {
  const searchParams = request.nextUrl.searchParams;
  const modelId = searchParams.get("modelId");
  const live = searchParams.get("live") === "true";
  const supabase = createServiceRoleClient();

  if (modelId) {
    const { data, error } = await supabase
      .from("estates_pathfinder_models")
      .select(MODEL_SELECT)
      .eq("organization_id", auth.organizationId)
      .eq("id", modelId)
      .single();
    if (error) {
      console.error("Error loading Pathfinder model:", error);
      return apiError("Failed to load Pathfinder model", 500);
    }
    return apiSuccess({ model: data ?? null });
  }

  if (live) {
    const { data, error } = await supabase
      .from("estates_pathfinder_models")
      .select(MODEL_SELECT)
      .eq("organization_id", auth.organizationId)
      .eq("is_live", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error("Error loading live Pathfinder model:", error);
      return apiError("Failed to load live Pathfinder model", 500);
    }
    return apiSuccess({ model: data ?? null });
  }

  const { data, error } = await supabase
    .from("estates_pathfinder_models")
    .select(MODEL_SELECT)
    .eq("organization_id", auth.organizationId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error loading Pathfinder model:", error);
    return apiError("Failed to load Pathfinder model", 500);
  }
  return apiSuccess({ model: data ?? null });
});

export const POST = protectedRoute(
  async (auth, request) => {
    const body = await request.json();
    const extractionResult = body.extractionResult as PathfinderExtractionResult | undefined;

    if (!extractionResult?.rooms?.length) {
      return apiError("extractionResult with rooms is required", 400);
    }

    const status = toStatus(body.status);
    const now = new Date().toISOString();
    const supabase = createServiceRoleClient();
    const row = {
      organization_id: auth.organizationId,
      name:
        typeof body.name === "string" && body.name.trim()
          ? body.name.trim()
          : extractionResult.image.title,
      status,
      source_document_url:
        typeof body.sourceDocumentUrl === "string" ? body.sourceDocumentUrl : null,
      source_document_name:
        typeof body.sourceDocumentName === "string"
          ? body.sourceDocumentName
          : extractionResult.image.title,
      extraction_result: extractionResult,
      metrics: extractionResult.metrics ?? {},
      updated_by: auth.userId,
      approved_at: status === "approved" || status === "published" ? now : null,
      published_at: status === "published" ? now : null,
    };

    const modelId =
      typeof body.modelId === "string" && body.modelId.trim() ? body.modelId.trim() : null;
    const query = modelId
      ? supabase
          .from("estates_pathfinder_models")
          .update(row)
          .eq("id", modelId)
          .eq("organization_id", auth.organizationId)
          .select(MODEL_SELECT)
          .single()
      : supabase
          .from("estates_pathfinder_models")
          .insert({ ...row, created_by: auth.userId })
          .select(MODEL_SELECT)
          .single();

    const { data, error } = await query;
    if (error) {
      console.error("Error saving Pathfinder model:", error);
      return apiError("Failed to save Pathfinder model", 500);
    }

    return apiSuccess({ model: data });
  },
  { requiredRole: "caretaker" },
);
