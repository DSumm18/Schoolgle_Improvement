import { NextRequest, NextResponse } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { generateEmbedding } from "@/lib/embeddings";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { searchRequestSchema, validateRequest } from "@/lib/validations";
import { logger, createOperationLogger } from "@/lib/logger";

export const POST = protectedRoute(async (auth, req) => {
  const searchLogger = createOperationLogger("search-api", {
    endpoint: "/api/search",
  });

  // Parse and validate request body
  const body = await req.json();
  const validation = validateRequest(searchRequestSchema, body);

  if (!validation.success) {
    searchLogger.warn("Invalid search request", undefined, undefined, {
      validationError: validation.error,
    });
    return apiError(validation.error!, 400);
  }

  const { query, matchThreshold, matchCount } = validation.data;

  searchLogger.info("Processing search query", undefined, {
    query,
    matchThreshold,
    matchCount,
  });

  // Generate embedding for the search query
  let embedding: number[];
  try {
    embedding = await searchLogger.measureTime("embedding generation", () =>
      generateEmbedding(query),
    );
  } catch (embeddingError) {
    searchLogger.error(
      "Failed to generate search embedding",
      undefined,
      embeddingError,
    );
    return apiError("Failed to process search query", 500);
  }

  const supabase = createServiceRoleClient();

  // Search in Supabase using the match_documents RPC function
  searchLogger.debug("Querying Supabase for matching documents");

  const { data: documents, error } = await supabase.rpc("match_documents", {
    query_embedding: embedding,
    match_threshold: matchThreshold,
    match_count: matchCount,
  });

  if (error) {
    searchLogger.error("Supabase search query failed", undefined, error);
    return apiError("Search query failed", 500);
  }

  searchLogger.info("Search completed successfully", undefined, {
    resultCount: documents?.length || 0,
  });

  return apiSuccess({
    results: documents || [],
    metadata: {
      query,
      matchThreshold,
      matchCount,
      resultCount: documents?.length || 0,
    },
  });
});
