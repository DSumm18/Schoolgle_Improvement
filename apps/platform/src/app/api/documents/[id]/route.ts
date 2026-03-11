import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * GET /api/documents/[id]
 * Get a generated document by ID
 */
export const GET = protectedRoute(async (auth, request) => {
  const supabase = createServiceRoleClient();
  const id = request.nextUrl.pathname.split("/").at(-1);

  if (!id) {
    return apiError("Document ID is required", 400, "MISSING_ID");
  }

  const { data: document, error } = await supabase
    .from("generated_documents")
    .select("*, document_templates(id, name, module, category, document_type)")
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .single();

  if (error) {
    console.error("Error fetching document:", error);
    return apiError("Document not found", 404, "NOT_FOUND");
  }

  return apiSuccess(document);
});

/**
 * PUT /api/documents/[id]
 * Update a draft document (only status='draft')
 */
export const PUT = protectedRoute(async (auth, request) => {
  const supabase = createServiceRoleClient();
  const id = request.nextUrl.pathname.split("/").at(-1);

  if (!id) {
    return apiError("Document ID is required", 400, "MISSING_ID");
  }

  // Check document exists and is a draft
  const { data: existing, error: fetchError } = await supabase
    .from("generated_documents")
    .select("id, status, organization_id")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return apiError("Document not found", 404, "NOT_FOUND");
  }

  if (existing.organization_id !== auth.organizationId) {
    return apiError("Access denied", 403, "FORBIDDEN");
  }

  if (existing.status !== "draft") {
    return apiError("Only draft documents can be edited", 400, "NOT_DRAFT");
  }

  const body = await request.json();
  const {
    subject,
    body_html,
    placeholder_values,
    recipient_name,
    recipient_email,
  } = body;

  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };
  if (subject !== undefined) updateData.subject = subject;
  if (body_html !== undefined) updateData.body_html = body_html;
  if (placeholder_values !== undefined)
    updateData.placeholder_values = placeholder_values;
  if (recipient_name !== undefined) updateData.recipient_name = recipient_name;
  if (recipient_email !== undefined)
    updateData.recipient_email = recipient_email;

  const { data: document, error } = await supabase
    .from("generated_documents")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating document:", error);
    return apiError(error.message, 500);
  }

  return apiSuccess(document);
});

/**
 * DELETE /api/documents/[id]
 * Delete a draft document
 */
export const DELETE = protectedRoute(async (auth, request) => {
  const supabase = createServiceRoleClient();
  const id = request.nextUrl.pathname.split("/").at(-1);

  if (!id) {
    return apiError("Document ID is required", 400, "MISSING_ID");
  }

  // Check document exists and is a draft
  const { data: existing, error: fetchError } = await supabase
    .from("generated_documents")
    .select("id, status, organization_id")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return apiError("Document not found", 404, "NOT_FOUND");
  }

  if (existing.organization_id !== auth.organizationId) {
    return apiError("Access denied", 403, "FORBIDDEN");
  }

  if (existing.status !== "draft") {
    return apiError("Only draft documents can be deleted", 400, "NOT_DRAFT");
  }

  const { error } = await supabase
    .from("generated_documents")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting document:", error);
    return apiError(error.message, 500);
  }

  return apiSuccess({ success: true });
});
