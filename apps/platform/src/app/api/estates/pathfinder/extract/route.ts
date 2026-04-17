import { apiError, apiSuccess, protectedRoute } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { runVisionExtractionAgainstImage } from "@/lib/pathfinder/vision-extractor";
import type { PathfinderExtractionResult } from "@/lib/pathfinder/prototype";

export const runtime = "nodejs";

const BUCKET = "pathfinder-sources";
const MODEL_SELECT =
  "id, organization_id, name, status, source_document_id, source_document_provider, source_document_path, source_page_number, generated_image_url, extraction_mode, extraction_timestamp, parent_model_id, revision_number, is_live, superseded_by, source_document_url, source_document_name, extraction_result, metrics, approved_at, published_at, created_at, updated_at";

function numberFrom(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : undefined;
}

function stringFrom(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export const POST = protectedRoute(
  async (auth, request) => {
    const body = await request.json().catch(() => ({}));

    const sourceImageUrl = stringFrom(body?.sourceImageUrl);
    const sourceImagePath = stringFrom(body?.sourceImagePath);
    if (!sourceImageUrl && !sourceImagePath) {
      return apiError("sourceImageUrl or sourceImagePath is required", 400);
    }

    const width = numberFrom(body?.sourceImageWidth) ?? 2400;
    const height = numberFrom(body?.sourceImageHeight) ?? 1700;
    const sourceDocumentName = stringFrom(body?.sourceDocumentName) ?? "Site plan";
    const sourceDocumentProvider = stringFrom(body?.sourceDocumentProvider) ?? "upload";
    const sourceDocumentId = stringFrom(body?.sourceDocumentId);
    const sourceDocumentPath = stringFrom(body?.sourceDocumentPath);
    const sourcePageNumber = numberFrom(body?.sourcePageNumber);
    const parentModelId = stringFrom(body?.parentModelId);
    const modelName = stringFrom(body?.name) ?? sourceDocumentName;

    const supabase = createServiceRoleClient();

    // Resolve the image URL to something the vision extractor can download.
    // If the client only gave a storage path, sign it for read access.
    let resolvedImageUrl = sourceImageUrl ?? "";
    const resolvedImagePath = sourceImagePath;
    if (!resolvedImageUrl && resolvedImagePath) {
      if (!resolvedImagePath.startsWith(`${auth.organizationId}/`)) {
        return apiError("Source image path is outside your organisation", 403);
      }
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(resolvedImagePath, 60 * 60);
      if (error || !data?.signedUrl) {
        console.error("Failed to sign source image URL:", error);
        return apiError("Failed to sign source image URL", 500);
      }
      resolvedImageUrl = data.signedUrl;
    }

    const extractionTimestamp = new Date().toISOString();
    const extractionMode: string = "vision";

    const extractionResult: PathfinderExtractionResult = await runVisionExtractionAgainstImage({
      image: {
        src: resolvedImageUrl,
        width,
        height,
        title: sourceDocumentName,
      },
    });

    // If vision returned zero rooms, still save the draft row so the UI has
    // something to attach the source document to — the school can re-run
    // extraction later without re-uploading.
    let revisionNumber = 1;
    if (parentModelId) {
      const { data: parent } = await supabase
        .from("estates_pathfinder_models")
        .select("revision_number")
        .eq("organization_id", auth.organizationId)
        .eq("id", parentModelId)
        .maybeSingle();
      if (parent?.revision_number) {
        revisionNumber = parent.revision_number + 1;
      }
    }

    const row = {
      organization_id: auth.organizationId,
      name: modelName,
      status: "draft" as const,
      source_document_id: sourceDocumentId ?? null,
      source_document_provider: sourceDocumentProvider,
      source_document_path: sourceDocumentPath ?? null,
      source_document_name: sourceDocumentName,
      source_document_url: null,
      source_page_number: sourcePageNumber ?? null,
      generated_image_url: resolvedImagePath ?? null,
      extraction_mode: extractionMode,
      extraction_timestamp: extractionTimestamp,
      parent_model_id: parentModelId ?? null,
      revision_number: revisionNumber,
      is_live: false,
      extraction_result: extractionResult,
      metrics: extractionResult.metrics ?? {},
      created_by: auth.userId,
      updated_by: auth.userId,
    };

    const { data, error } = await supabase
      .from("estates_pathfinder_models")
      .insert(row)
      .select(MODEL_SELECT)
      .single();

    if (error || !data) {
      console.error("Failed to persist Pathfinder draft:", error);
      return apiError("Failed to persist Pathfinder draft", 500);
    }

    return apiSuccess({ model: data, extractionResult });
  },
  { requiredRole: "caretaker" },
);
