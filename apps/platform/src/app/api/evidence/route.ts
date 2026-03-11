import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { evidenceRequestSchema, validateRequest } from "@/lib/validations";
import { logger, createOperationLogger } from "@/lib/logger";

export const POST = protectedRoute(async (auth, request) => {
  const evidenceLogger = createOperationLogger("evidence-api", {
    endpoint: "/api/evidence",
  });

  // Parse and validate request body
  const body = await request.json();
  const validation = validateRequest(evidenceRequestSchema, body);

  if (!validation.success) {
    evidenceLogger.warn("Invalid request", undefined, undefined, {
      validationError: validation.error,
    });
    return apiError(validation.error || "Invalid request", 400);
  }

  const { userId, subcategoryId, evidenceItem } = validation.data;

  // Use the authenticated user's ID if not provided, or validate they match
  const effectiveUserId = userId || auth.userId;

  evidenceLogger.info(
    "Fetching evidence matches",
    {
      userId: effectiveUserId,
      subcategoryId,
    },
    { evidenceItem },
  );

  const supabase = createServiceRoleClient();

  let query = supabase
    .from("evidence_matches")
    .select(
      `
      *,
      document:documents!inner (
        name,
        web_view_link,
        folder_path,
        mime_type,
        user_id
      )
    `,
    )
    .eq("subcategory_id", subcategoryId)
    .eq("document.user_id", effectiveUserId)
    .order("confidence", { ascending: false });

  if (evidenceItem) {
    query = query.eq("evidence_item", evidenceItem);
  }

  const { data, error } = await query;

  if (error) {
    evidenceLogger.error(
      "Supabase query failed",
      { userId: effectiveUserId, subcategoryId },
      error,
    );
    throw error;
  }

  // Transform data for frontend
  const matches = data.map((match: any) => ({
    documentName: match.document?.name || "Unknown Document",
    documentLink: match.document?.web_view_link,
    confidence: match.confidence,
    relevanceExplanation: match.relevance_explanation,
    keyQuotes: match.key_quotes,
    folderPath: match.document?.folder_path,
  }));

  evidenceLogger.info(
    "Successfully fetched evidence matches",
    { userId: effectiveUserId, subcategoryId },
    { matchCount: matches.length },
  );

  return apiSuccess({ matches });
});
