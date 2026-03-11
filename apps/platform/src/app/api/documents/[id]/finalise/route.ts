import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * POST /api/documents/[id]/finalise
 * Move a document from draft to finalised (locks content)
 */
export const POST = protectedRoute(async (auth, request) => {
  const supabase = createServiceRoleClient();

  // Extract ID from URL path: /api/documents/[id]/finalise
  const segments = request.nextUrl.pathname.split("/");
  const finaliseIdx = segments.indexOf("finalise");
  const id = finaliseIdx > 0 ? segments[finaliseIdx - 1] : null;

  if (!id) {
    return apiError("Document ID is required", 400, "MISSING_ID");
  }

  // Fetch the document
  const { data: document, error: fetchError } = await supabase
    .from("generated_documents")
    .select("id, status, organization_id, subject, body_html")
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .single();

  if (fetchError || !document) {
    return apiError("Document not found", 404, "NOT_FOUND");
  }

  if (document.status !== "draft") {
    return apiError(`Document is already ${document.status}`, 400, "NOT_DRAFT");
  }

  // Validate the document has content
  if (!document.body_html) {
    return apiError(
      "Cannot finalise a document without body content",
      400,
      "EMPTY_CONTENT",
    );
  }

  // Update status to finalised
  const { data: updated, error: updateError } = await supabase
    .from("generated_documents")
    .update({
      status: "finalised",
      approved_at: new Date().toISOString(),
      approved_by: auth.userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    console.error("Error finalising document:", updateError);
    return apiError(updateError.message, 500);
  }

  return apiSuccess(updated);
});
