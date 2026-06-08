/**
 * Website Scanner V2 — Phase 2 Assessment API
 *
 * POST /api/website-scan/v2/assess
 * Runs compliance assessment against previously scraped data.
 * Requires a valid session ID from Phase 1 (scrape).
 *
 * GET /api/website-scan/v2/assess?sessionId=xxx
 * Returns assessment results for a session.
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import {
  assessScrapedWebsite,
  type AssessResult,
} from "@/lib/website-compliance/phase2-assessor";

interface AssessRequest {
  sessionId: string;
  schoolType?: "maintained" | "academy";
  schoolPhase?: "primary" | "secondary" | "all_through" | "all";
  isChurchSchool?: boolean;
  useAI?: boolean;
  /** Only assess specific requirements (default: all applicable) */
  requirementKeys?: string[];
}

/**
 * POST /api/website-scan/v2/assess
 * Run Phase 2 assessment against scraped data.
 */
export const POST = protectedRoute(async (auth, request) => {
  try {
    const body: AssessRequest = await request.json();

    if (!body.sessionId) {
      return apiError("sessionId is required", 400);
    }

    // Verify the session belongs to the user's org
    const supabase = createServiceRoleClient();
    const { data: session } = await supabase
      .from("website_scan_sessions")
      .select("id, organization_id, status")
      .eq("id", body.sessionId)
      .maybeSingle();

    if (!session) {
      return apiError("Session not found", 404);
    }

    if (session.status !== "scraped" && session.status !== "assessed") {
      return apiError(
        `Session status is '${session.status}'. Must be 'scraped' or 'assessed' to run assessment.`,
        400,
      );
    }

    console.log(
      `[Website Scan V2] Starting assessment for session ${body.sessionId}`,
    );

    const result: AssessResult = await assessScrapedWebsite({
      sessionId: body.sessionId,
      schoolType: body.schoolType,
      schoolPhase: body.schoolPhase,
      isChurchSchool: body.isChurchSchool,
      useAI: body.useAI ?? true,
      requirementKeys: body.requirementKeys,
      onProgress: (message, current, total) => {
        console.log(`[Website Scan V2] [${current}/${total}] ${message}`);
      },
    });

    return apiSuccess({
      ...result,
      message: `Assessment complete: ${result.compliantCount}/${result.totalRequirements} compliant (${result.overallComplianceScore}%) in ${(result.durationMs / 1000).toFixed(1)}s. Synced ${result.ofstedDocumentChecksSynced} Ofsted evidence checks.`,
    });
  } catch (error) {
    console.error("[Website Scan V2 Assess] Error:", error);
    return apiError(
      error instanceof Error ? error.message : "Unknown error",
      500,
    );
  }
});

/**
 * GET /api/website-scan/v2/assess?sessionId=xxx
 * Get assessment results for a session.
 */
export const GET = protectedRoute(async (auth, request) => {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  // orgId MUST come from authenticated session — never from caller
  const organizationId = auth.organizationId;

  if (!sessionId && !organizationId) {
    return apiError("sessionId or organizationId is required", 400);
  }

  const supabase = createServiceRoleClient();

  // If no sessionId, find latest session for the org
  let resolvedSessionId = sessionId;
  if (!resolvedSessionId && organizationId) {
    const { data: session } = await supabase
      .from("website_scan_sessions")
      .select("id")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!session) {
      return apiSuccess({
        hasResults: false,
        message: "No scan session found",
      });
    }
    resolvedSessionId = session.id;
  }

  // Get assessments
  const { data: assessments, error } = await supabase
    .from("website_requirement_assessments")
    .select("*")
    .eq("session_id", resolvedSessionId)
    .order("category, requirement_key");

  if (error) {
    return apiError(error.message, 500);
  }

  if (!assessments || assessments.length === 0) {
    return apiSuccess({
      hasResults: false,
      sessionId: resolvedSessionId,
      message: "No assessment results found. Run Phase 2 assessment first.",
    });
  }

  // Calculate summary
  const compliant = assessments.filter((a) => a.status === "compliant").length;
  const partial = assessments.filter((a) => a.status === "partial").length;
  const notFound = assessments.filter((a) => a.status === "not_found").length;
  const outdated = assessments.filter((a) => a.status === "outdated").length;
  const avgCompliance = Math.round(
    assessments.reduce((sum, a) => sum + (a.compliance_score || 0), 0) /
      assessments.length,
  );

  // Group by category
  const categories: Record<string, typeof assessments> = {};
  for (const a of assessments) {
    if (!categories[a.category]) categories[a.category] = [];
    categories[a.category].push(a);
  }

  const categorySummary = Object.entries(categories).map(([cat, items]) => ({
    category: cat,
    total: items.length,
    compliant: items.filter((a) => a.status === "compliant").length,
    partial: items.filter((a) => a.status === "partial").length,
    notFound: items.filter((a) => a.status === "not_found").length,
    outdated: items.filter((a) => a.status === "outdated").length,
  }));

  return apiSuccess({
    hasResults: true,
    sessionId: resolvedSessionId,
    summary: {
      totalRequirements: assessments.length,
      compliantCount: compliant,
      partialCount: partial,
      notFoundCount: notFound,
      outdatedCount: outdated,
      overallComplianceScore: avgCompliance,
    },
    categorySummary,
    assessments: assessments.map((a) => ({
      requirementKey: a.requirement_key,
      requirementName: a.requirement_name,
      category: a.category,
      status: a.status,
      complianceScore: a.compliance_score,
      qualityScore: a.quality_score,
      clarityScore: a.clarity_score,
      currencyStatus: a.currency_status,
      legislationCurrent: a.legislation_current,
      evidenceUrls: a.evidence_urls,
      evidenceQuotes: a.evidence_quotes,
      gaps: a.gaps,
      recommendations: a.recommendations,
      redFlags: a.red_flags,
      confidence: a.confidence,
      aiModelUsed: a.ai_model_used,
      assessedAt: a.assessed_at,
    })),
  });
});
