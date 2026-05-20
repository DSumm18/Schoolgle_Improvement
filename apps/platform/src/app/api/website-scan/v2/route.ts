/**
 * Website Scanner V2 API
 *
 * POST /api/website-scan/v2  — Phase 1: Scrape school website
 * GET  /api/website-scan/v2  — Get latest scrape session for an org
 *
 * This is the two-phase architecture:
 *   Phase 1 (this endpoint): Scrape everything → store in normalised tables → feed Ed
 *   Phase 2 (separate endpoint): Load scraped data → assess against rubrics → store results
 *
 * The scrape can be triggered independently of assessment.
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import {
  scrapeSchoolWebsite,
  type ScrapeResult,
} from "@/lib/website-compliance/phase1-scraper";
import {
  routeWebsiteEvidenceItems,
  summariseWebsiteEvidenceRoutes,
  type WebsiteEvidenceInput,
} from "@/lib/website-compliance/evidence-routing";

interface ScrapeRequest {
  websiteUrl: string;
  organizationId?: string;
  schoolType?: "maintained" | "academy";
  schoolPhase?: "primary" | "secondary" | "all_through" | "all";
  trustUrl?: string;
  maxPages?: number;
}

/**
 * POST /api/website-scan/v2
 * Start a full website scrape. Stores all pages and documents,
 * feeds Ed's knowledge base. Returns session ID for Phase 2 assessment.
 */
export const POST = protectedRoute(async (auth, request) => {
  try {
    const body: ScrapeRequest = await request.json();

    const websiteUrl = body.websiteUrl;
    // orgId MUST come from authenticated session — never from caller
    const organizationId = auth.organizationId;

    if (!websiteUrl || !organizationId) {
      return apiError("websiteUrl and organizationId are required", 400);
    }

    // Validate URL
    try {
      new URL(websiteUrl);
    } catch {
      return apiError("Invalid URL format", 400);
    }

    // Verify org exists
    const supabase = createServiceRoleClient();
    const { data: org } = await supabase
      .from("organizations")
      .select("id, name")
      .eq("id", organizationId)
      .maybeSingle();

    if (!org) {
      return apiError("Organization not found", 404);
    }

    console.log(
      `[Website Scan V2] Starting scrape of ${websiteUrl} for ${org.name}`,
    );

    const result: ScrapeResult = await scrapeSchoolWebsite({
      organizationId,
      websiteUrl,
      schoolType: body.schoolType,
      schoolPhase: body.schoolPhase,
      trustUrl: body.trustUrl,
      maxPages: body.maxPages || 150,
      onProgress: (message, step, total) => {
        console.log(`[Website Scan V2] [${step}/${total}] ${message}`);
      },
    });

    return apiSuccess({
      sessionId: result.sessionId,
      pagesStored: result.pagesStored,
      documentsStored: result.documentsStored,
      edKnowledgeStored: result.edKnowledgeStored,
      schoolType: result.schoolType,
      schoolPhase: result.schoolPhase,
      isChurchSchool: result.isChurchSchool,
      trustUrl: result.trustUrl,
      evidenceRouting: result.evidenceRouting,
      durationMs: result.durationMs,
      message: `Scraped ${result.pagesStored} pages and ${result.documentsStored} documents in ${(result.durationMs / 1000).toFixed(1)}s. Ed knowledge base updated with ${result.edKnowledgeStored} entries. Ready for Phase 2 assessment.`,
    });
  } catch (error) {
    console.error("[Website Scan V2] Error:", error);
    return apiError(
      error instanceof Error ? error.message : "Unknown error",
      500,
    );
  }
});

/**
 * GET /api/website-scan/v2?organizationId=xxx
 * Get the latest scrape session info for an organization.
 * Includes page/document counts and status.
 */
export const GET = protectedRoute(async (auth, request) => {
  const { searchParams } = new URL(request.url);
  const includeEvidenceRoutes =
    searchParams.get("includeEvidenceRoutes") === "true";
  // orgId MUST come from authenticated session — never from caller
  const organizationId = auth.organizationId;

  if (!organizationId) {
    return apiError("organizationId is required", 400);
  }

  const supabase = createServiceRoleClient();

  // Get latest session
  const { data: session, error } = await supabase
    .from("website_scan_sessions")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return apiError(error.message, 500);
  }

  if (!session) {
    return apiSuccess({
      hasSession: false,
      message: "No website scan session found for this organization",
    });
  }

  // Get page/doc summary counts
  const [pagesResult, docsResult] = await Promise.all([
    supabase
      .from("website_scraped_pages")
      .select("id", { count: "exact", head: true })
      .eq("session_id", session.id),
    supabase
      .from("website_scraped_documents")
      .select("id, file_type", { count: "exact" })
      .eq("session_id", session.id),
  ]);

  // Count documents by type
  const docsByType: Record<string, number> = {};
  if (docsResult.data) {
    for (const doc of docsResult.data) {
      docsByType[doc.file_type] = (docsByType[doc.file_type] || 0) + 1;
    }
  }

  let evidenceRouting:
    | ReturnType<typeof summariseWebsiteEvidenceRoutes>
    | undefined;

  if (includeEvidenceRoutes) {
    const [pagesForRouting, docsForRouting] = await Promise.all([
      supabase
        .from("website_scraped_pages")
        .select("url, title, extracted_text, headings, source")
        .eq("session_id", session.id),
      supabase
        .from("website_scraped_documents")
        .select(
          "url, filename, title, extracted_text, link_text, found_on_page_url, source",
        )
        .eq("session_id", session.id),
    ]);

    const pageTitleByUrl = new Map<string, string>();
    const evidenceInputs: WebsiteEvidenceInput[] = [];

    for (const page of pagesForRouting.data || []) {
      if (page.title) pageTitleByUrl.set(page.url, page.title);
      evidenceInputs.push({
        url: page.url,
        title: page.title,
        headings: Array.isArray(page.headings)
          ? page.headings
              .map((heading: unknown) =>
                typeof heading === "string"
                  ? heading
                  : typeof heading === "object" &&
                      heading !== null &&
                      "text" in heading
                    ? String(heading.text)
                    : "",
              )
              .filter(Boolean)
          : [],
        text: page.extracted_text,
        source: page.source,
      });
    }

    for (const doc of docsForRouting.data || []) {
      evidenceInputs.push({
        url: doc.url,
        title: doc.title || doc.filename,
        linkText: doc.link_text,
        foundOnPageUrl: doc.found_on_page_url,
        foundOnPageTitle: doc.found_on_page_url
          ? pageTitleByUrl.get(doc.found_on_page_url) || null
          : null,
        text: doc.extracted_text,
        source: doc.source,
      });
    }

    const routes = routeWebsiteEvidenceItems(evidenceInputs);
    evidenceRouting = summariseWebsiteEvidenceRoutes(routes);
  }

  return apiSuccess({
    hasSession: true,
    session: {
      id: session.id,
      websiteUrl: session.website_url,
      trustUrl: session.trust_url,
      schoolType: session.school_type,
      schoolPhase: session.school_phase,
      isChurchSchool: session.is_church_school,
      status: session.status,
      progress: session.progress,
      pagesFound: session.pages_found,
      documentsFound: session.documents_found,
      pagesScraped: session.pages_scraped,
      documentsScraped: session.documents_scraped,
      scrapeStartedAt: session.scrape_started_at,
      scrapeCompletedAt: session.scrape_completed_at,
      assessStartedAt: session.assess_started_at,
      assessCompletedAt: session.assess_completed_at,
    },
    stats: {
      totalPages: pagesResult.count || 0,
      totalDocuments: docsResult.count || 0,
      documentsByType: docsByType,
    },
    evidenceRouting:
      evidenceRouting ||
      (session.progress as { evidenceRouting?: unknown } | null)
        ?.evidenceRouting ||
      null,
  });
});
