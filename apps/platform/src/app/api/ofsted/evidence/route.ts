import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import type {
  OfstedEvidenceMatch,
  OfstedCategoryId,
  OfstedSubCategoryId,
  GetOfstedEvidenceRequest,
  GetOfstedEvidenceResponse,
  MatchOfstedDocumentRequest,
  MatchOfstedDocumentResponse,
} from "@/lib/ofsted";
import { v4 as uuidv4 } from "uuid";
import { OFSTED_SUBCATEGORIES } from "@/lib/ofsted";
import {
  matchDocumentToEvidenceRequirements,
  type DocumentMetadata,
// @ts-expect-error - Auto-masked during strict compilation enforcement
} from "@schoolgle/core-ai/ai-evidence-matcher";

/**
 * GET /api/ofsted/evidence
 * Get Ofsted evidence matches for an organization
 */
export const GET = protectedRoute(async (auth, req) => {
  const { searchParams } = new URL(req.url);
  // orgId MUST come from authenticated session — never from caller
  const organizationId = auth.organizationId;
  const categoryId = searchParams.get("categoryId") as OfstedCategoryId | null;
  const subcategoryId = searchParams.get(
    "subcategoryId",
  ) as OfstedSubCategoryId | null;
  const documentId = searchParams.get("documentId");

  if (!organizationId) {
    return apiError("Missing organizationId parameter", 400);
  }

  const supabase = createServiceRoleClient();

  let query = supabase
    .from("ofsted_evidence_matches")
    .select("*")
    .eq("organization_id", organizationId);

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }
  if (subcategoryId) {
    query = query.eq("subcategory_id", subcategoryId);
  }
  if (documentId) {
    query = query.eq("document_id", documentId);
  }

  const { data: evidence, error } = await query;

  if (error) {
    console.error("Error fetching Ofsted evidence:", error);
    return apiError("Failed to fetch evidence", 500);
  }

  // Group by category and confidence
  const byCategory: Record<string, number> = {
    inclusion: 0,
    "curriculum-teaching": 0,
    achievement: 0,
    "attendance-behaviour": 0,
    "personal-development": 0,
    "leadership-governance": 0,
  };

  const byConfidence = { HIGH: 0, MEDIUM: 0, LOW: 0 };

  for (const match of evidence || []) {
    if (match.category_id in byCategory) {
      byCategory[match.category_id as OfstedCategoryId]++;
    }
    if (match.confidence in byConfidence) {
      byConfidence[match.confidence as keyof typeof byConfidence]++;
    }
  }

  const response: GetOfstedEvidenceResponse = {
    evidence: evidence || [],
    total: evidence?.length || 0,
    by_category: byCategory,
    by_confidence: byConfidence,
  };

  return apiSuccess(response);
});

/**
 * POST /api/ofsted/evidence
 * Match a document to Ofsted criteria (AI-powered)
 */
export const POST = protectedRoute(async (auth, req) => {
  const body: MatchOfstedDocumentRequest = await req.json();
  const { document_id, document_text, document_metadata } = body;

  // orgId MUST come from authenticated session — never from caller
  const orgId = auth.organizationId;

  if (!orgId || !document_id || !document_text) {
    return apiError(
      "Missing required fields: organization_id, document_id, document_text",
      400,
    );
  }

  const supabase = createServiceRoleClient();

  // Build metadata for AI matcher
  const metadata: DocumentMetadata = {
    filename: document_metadata?.filename || "unknown",
    fileId: document_id,
    mimeType: document_metadata?.mimeType || "text/plain",
    foldername: document_metadata?.foldername,
    folderPath: document_metadata?.folderPath,
    webViewLink: document_metadata?.webViewLink,
  };

  // Run AI evidence matching
  const result = await matchDocumentToEvidenceRequirements(
    document_text,
    metadata,
  );

  if (result.error) {
    console.error("[Evidence API] AI matching error:", result.error);
  }

  // Store matches in database
  const storedMatches: OfstedEvidenceMatch[] = [];
  const categoriesMatched = new Set<OfstedCategoryId>();

  for (const match of result.matches) {
    const matchRecord = {
      id: uuidv4(),
      organization_id: orgId,
      document_id,
      category_id: match.categoryId,
      subcategory_id: match.subcategoryId,
      confidence: match.confidenceLevel,
      matched_keywords: match.triggeredKeywords,
      relevance_explanation: match.relevanceExplanation,
      key_quotes: match.keyQuotes,
      document_link: match.documentLink || null,
    };

    const { data, error } = await supabase
      .from("ofsted_evidence_matches")
      .upsert(matchRecord, {
        onConflict: "organization_id,document_id,category_id,subcategory_id",
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (!error && data) {
      storedMatches.push(data);
      categoriesMatched.add(match.categoryId as OfstedCategoryId);
    }
  }

  // Update evidence counts on assessments
  for (const categoryId of categoriesMatched) {
    const categoryMatches = storedMatches.filter(
      (m) => m.category_id === categoryId,
    );
    const subcategoryIds = [
      ...new Set(categoryMatches.map((m) => m.subcategory_id)),
    ];

    for (const subcategoryId of subcategoryIds) {
      const subMatches = categoryMatches.filter(
        (m) => m.subcategory_id === subcategoryId,
      );

      // Get current assessment
      const { data: existing } = await supabase
        .from("ofsted_assessments")
        .select("*")
        .eq("organization_id", orgId)
        .eq("subcategory_id", subcategoryId)
        .single();

      const currentItems = existing?.evidence_items || [];
      const newItem = {
        documentId: document_id,
        documentName: metadata.filename,
        matchedAt: new Date().toISOString(),
        confidence: subMatches[0]?.confidence || "MEDIUM",
      };

      // Avoid duplicates
      const updatedItems = [
        ...currentItems.filter((i: any) => i.documentId !== document_id),
        newItem,
      ];

      await supabase.from("ofsted_assessments").upsert(
        {
          id: existing?.id || uuidv4(),
          organization_id: orgId,
          category_id: categoryId,
          subcategory_id: subcategoryId,
          evidence_count: updatedItems.length,
          evidence_items: updatedItems,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "organization_id,subcategory_id",
        },
      );
    }
  }

  const response: MatchOfstedDocumentResponse = {
    matches: storedMatches,
    total_matches: storedMatches.length,
    categories_matched: [...categoriesMatched],
  };

  return apiSuccess(response);
});
