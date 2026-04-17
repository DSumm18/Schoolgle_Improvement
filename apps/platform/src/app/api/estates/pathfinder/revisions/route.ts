import { apiError, apiSuccess, protectedRoute } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

const MODEL_SELECT =
  "id, organization_id, name, status, source_document_id, source_document_provider, source_document_path, source_page_number, generated_image_url, extraction_mode, extraction_timestamp, parent_model_id, revision_number, is_live, superseded_by, source_document_url, source_document_name, extraction_result, metrics, approved_at, published_at, created_at, updated_at";

function stringFrom(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export const POST = protectedRoute(
  async (auth, request) => {
    const body = await request.json().catch(() => ({}));
    const parentModelId = stringFrom(body?.parentModelId);
    if (!parentModelId) {
      return apiError("parentModelId is required", 400);
    }

    const supabase = createServiceRoleClient();
    const { data: parent, error: parentError } = await supabase
      .from("estates_pathfinder_models")
      .select(MODEL_SELECT)
      .eq("organization_id", auth.organizationId)
      .eq("id", parentModelId)
      .single();

    if (parentError || !parent) {
      return apiError("Parent Pathfinder model not found", 404);
    }

    // Idempotency: if a non-published draft revision already exists for this
    // parent, return it rather than creating yet another one.
    const { data: existingDraft } = await supabase
      .from("estates_pathfinder_models")
      .select(MODEL_SELECT)
      .eq("organization_id", auth.organizationId)
      .eq("parent_model_id", parentModelId)
      .in("status", ["draft", "school_review"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingDraft) {
      return apiSuccess({ model: existingDraft, created: false });
    }

    const name = stringFrom(body?.name) ?? `${parent.name} (revision)`;

    const row = {
      organization_id: auth.organizationId,
      name,
      status: "draft" as const,
      source_document_provider: "upload",
      parent_model_id: parentModelId,
      revision_number: (parent.revision_number ?? 1) + 1,
      is_live: false,
      extraction_result: parent.extraction_result, // start from the live model, let extraction overwrite later
      metrics: parent.metrics ?? {},
      created_by: auth.userId,
      updated_by: auth.userId,
    };

    const { data, error } = await supabase
      .from("estates_pathfinder_models")
      .insert(row)
      .select(MODEL_SELECT)
      .single();

    if (error || !data) {
      console.error("Failed to scaffold Pathfinder revision:", error);
      return apiError("Failed to scaffold revision", 500);
    }

    return apiSuccess({ model: data, created: true });
  },
  { requiredRole: "caretaker" },
);
