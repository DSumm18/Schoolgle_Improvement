/**
 * Data Validation Stats API
 *
 * GET /api/data-validation/stats - Aggregated counts and metrics
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * GET /api/data-validation/stats
 * Returns:
 * - counts_by_status: { pending_review, confirmed, edited_and_confirmed, rejected, expired }
 * - counts_by_document_type: { [type]: number }
 * - average_confidence: number | null
 */
export const GET = protectedRoute(async (auth) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();

  // Fetch all extracted_data for this org (only id, status, document_type, confidence)
  const { data: records, error } = await supabase
    .from("extracted_data")
    .select("status, document_type, confidence_score")
    .eq("organization_id", organizationId);

  if (error) {
    console.error("[data-validation/stats] GET error:", error);
    return apiError("Failed to fetch stats", 500);
  }

  const items = records || [];

  // Counts by status
  const countsByStatus: Record<string, number> = {
    pending_review: 0,
    confirmed: 0,
    edited_and_confirmed: 0,
    rejected: 0,
    expired: 0,
  };

  // Counts by document_type
  const countsByDocumentType: Record<string, number> = {};

  // Confidence accumulator
  let confidenceSum = 0;
  let confidenceCount = 0;

  for (const item of items) {
    // Status counts
    if (item.status in countsByStatus) {
      countsByStatus[item.status]++;
    }

    // Document type counts
    if (item.document_type) {
      countsByDocumentType[item.document_type] =
        (countsByDocumentType[item.document_type] || 0) + 1;
    }

    // Confidence
    if (item.confidence_score != null) {
      confidenceSum += item.confidence_score;
      confidenceCount++;
    }
  }

  return apiSuccess({
    total: items.length,
    counts_by_status: countsByStatus,
    counts_by_document_type: countsByDocumentType,
    average_confidence:
      confidenceCount > 0
        ? Math.round((confidenceSum / confidenceCount) * 100) / 100
        : null,
  });
});
