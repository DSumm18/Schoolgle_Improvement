/**
 * Data Validation Pipeline API
 *
 * GET  /api/data-validation - List extracted_data for the user's org
 * POST /api/data-validation - Create new extracted_data record (from AI extraction)
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * GET /api/data-validation
 * List extracted_data for the user's organization.
 * Query params: status, document_type, limit, offset
 */
export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const documentType = searchParams.get("document_type");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  let query = supabase
    .from("extracted_data")
    .select("*", { count: "exact" })
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("status", status);
  }

  if (documentType) {
    query = query.eq("document_type", documentType);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("[data-validation] GET error:", error);
    return apiError("Failed to fetch extracted data", 500);
  }

  return apiSuccess({
    items: data || [],
    total: count || 0,
    limit,
    offset,
  });
});

/**
 * POST /api/data-validation
 * Create a new extracted_data record from AI extraction.
 * Automatically logs 'auto_extracted' to data_validation_log.
 */
export const POST = protectedRoute(async (auth, request) => {
  const { organizationId, userId } = auth;
  const supabase = createServiceRoleClient();

  const body = await request.json();

  const {
    document_id,
    document_type,
    source_file_name,
    extracted_fields,
    confidence_score,
    extraction_model,
    extraction_metadata,
  } = body;

  if (!document_type || !extracted_fields) {
    return apiError(
      "document_type and extracted_fields are required",
      400,
      "VALIDATION_ERROR",
    );
  }

  // Insert extracted_data record
  const { data: extracted, error: insertError } = await supabase
    .from("extracted_data")
    .insert({
      organization_id: organizationId,
      document_id: document_id || null,
      document_type,
      source_file_name: source_file_name || null,
      extracted_fields,
      confidence_score: confidence_score ?? null,
      extraction_model: extraction_model || null,
      extraction_metadata: extraction_metadata || null,
      status: "pending_review",
      extracted_by: userId,
    })
    .select()
    .single();

  if (insertError) {
    console.error("[data-validation] POST insert error:", insertError);
    return apiError("Failed to create extracted data record", 500);
  }

  // Log the auto_extracted action
  const { error: logError } = await supabase
    .from("data_validation_log")
    .insert({
      extracted_data_id: extracted.id,
      action: "auto_extracted",
      performed_by: userId,
      details: {
        confidence_score,
        extraction_model: extraction_model || null,
        document_type,
      },
    });

  if (logError) {
    console.error("[data-validation] POST log error:", logError);
    // Non-fatal: record was created, log failed
  }

  return apiSuccess(extracted, 201);
});
