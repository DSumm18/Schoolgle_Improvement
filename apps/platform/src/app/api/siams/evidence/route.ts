import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import type {
  SiamsEvidenceMatch,
  SiamsStrandId,
  SiamsQuestionId,
  GetSiamsEvidenceRequest,
  GetSiamsEvidenceResponse,
  ConfidenceLevel,
} from "@/lib/siams";

/**
 * GET /api/siams/evidence
 * Get SIAMS evidence matches for an organization
 */
export const GET = protectedRoute(async (auth, req) => {
  const { searchParams } = new URL(req.url);
  // orgId MUST come from authenticated session — never from caller
  const organizationId = auth.organizationId;
  const strandId = searchParams.get("strandId") as SiamsStrandId | null;
  const questionId = searchParams.get("questionId") as SiamsQuestionId | null;
  const documentId = searchParams.get("documentId");
  const limit = parseInt(searchParams.get("limit") || "100");

  if (!organizationId) {
    return apiError("Missing organizationId parameter", 400);
  }

  const supabase = createServiceRoleClient();

  let query = supabase
    .from("siams_evidence_matches")
    .select(
      `
            *,
            document:documents (
                id,
                name,
                web_view_link,
                folder_path
            )
        `,
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (strandId) {
    query = query.eq("strand_id", strandId);
  }
  if (questionId) {
    query = query.eq("question_id", questionId);
  }
  if (documentId) {
    query = query.eq("document_id", documentId);
  }

  const { data: evidence, error } = await query;

  if (error) {
    console.error("Error fetching SIAMS evidence:", error);
    return apiError("Failed to fetch evidence", 500);
  }

  // Flatten and enrich results
  const enrichedEvidence = (evidence || []).map((item: any) => ({
    ...item,
    document_name: item.document?.name || "Unknown",
    document_link: item.document?.web_view_link || item.document_link,
    folder_path: item.document?.folder_path || null,
  }));

  // Group by strand
  const byStrand = enrichedEvidence.reduce(
    (acc: any, ev: any) => {
      acc[ev.strand_id] = (acc[ev.strand_id] || 0) + 1;
      return acc;
    },
    {} as Record<SiamsStrandId, number>,
  );

  // Group by confidence
  const byConfidence = enrichedEvidence.reduce(
    (acc: any, ev: any) => {
      acc[ev.confidence] = (acc[ev.confidence] || 0) + 1;
      return acc;
    },
    {} as Record<ConfidenceLevel, number>,
  );

  const response: GetSiamsEvidenceResponse = {
    evidence: enrichedEvidence,
    total: enrichedEvidence.length,
    by_strand: byStrand,
    by_confidence: byConfidence,
  };

  return apiSuccess(response);
});

/**
 * POST /api/siams/evidence
 * Manually link evidence to SIAMS questions
 */
export const POST = protectedRoute(async (auth, req) => {
  const body = await req.json();
  const {
    documentId,
    questionIds,
    confidence,
    relevance_explanation,
    key_quotes,
  } = body as {
    documentId: string;
    questionIds: SiamsQuestionId[];
    confidence: ConfidenceLevel;
    relevance_explanation: string;
    key_quotes: string[];
  };

  // orgId MUST come from authenticated session — never from caller
  const orgId = auth.organizationId;

  if (!orgId || !documentId || !questionIds || questionIds.length === 0) {
    return apiError(
      "Missing required fields: organizationId, documentId, questionIds",
      400,
    );
  }

  const supabase = createServiceRoleClient();

  // Get document info
  const { data: document } = await supabase
    .from("documents")
    .select("id, name, web_view_link, organization_id")
    .eq("id", documentId)
    .single();

  if (!document) {
    return apiError("Document not found", 404);
  }

  // Get strand_id for each question
  const { SIAMS_QUESTIONS } = await import("@/lib/siams");

  // Create evidence matches
  const records = questionIds.map((questionId) => {
    const questionInfo = SIAMS_QUESTIONS[questionId];
    return {
      id: crypto.randomUUID(),
      organization_id: orgId,
      document_id: documentId,
      strand_id: questionInfo?.strand || "",
      question_id: questionId,
      confidence,
      matched_keywords: [],
      relevance_explanation,
      key_quotes,
      document_link: document.web_view_link || "",
    };
  });

  const { data, error } = await supabase
    .from("siams_evidence_matches")
    .upsert(records, {
      onConflict: "organization_id,document_id,question_id",
    })
    .select();

  if (error) {
    console.error("Error linking SIAMS evidence:", error);
    return apiError("Failed to link evidence", 500);
  }

  return apiSuccess({
    success: true,
    linked: records.length,
    evidence: data,
  });
});

/**
 * DELETE /api/siams/evidence
 * Delete SIAMS evidence matches
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
    .from("siams_evidence_matches")
    .delete()
    .in("id", ids)
    .eq("organization_id", organizationId);

  if (error) {
    console.error("Error deleting SIAMS evidence:", error);
    return apiError("Failed to delete evidence", 500);
  }

  return apiSuccess({ success: true, deleted: ids.length });
});
