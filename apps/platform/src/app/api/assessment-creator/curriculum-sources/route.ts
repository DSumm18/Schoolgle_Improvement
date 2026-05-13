import { NextRequest } from "next/server";
import { apiError, apiSuccess, protectedRoute } from "@/lib/api-utils";
import { harvestCurriculumSources } from "@/lib/assessment-creator/curriculum-harvester";
import { createServiceRoleClient } from "@/lib/supabase-server";

type ScanSessionRow = {
  id: string;
  website_url: string;
  status: string;
  scrape_completed_at: string | null;
  created_at: string;
};

export const GET = protectedRoute(async (auth, _req: NextRequest) => {
  const organizationId = auth.organizationId;
  if (!organizationId) return apiError("No organization", 400);

  const supabase = createServiceRoleClient();
  const { data: session, error: sessionError } = await supabase
    .from("website_scan_sessions")
    .select("id, website_url, status, scrape_completed_at, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sessionError && !isMissingWebsiteScanTable(sessionError.message)) {
    return apiError(sessionError.message, 500);
  }

  if (!session) {
    return apiSuccess({
      organizationId,
      hasWebsiteScan: false,
      session: null,
      harvest: harvestCurriculumSources({ pages: [], documents: [] }),
      sourceSummary: {
        pageSource: sessionError ? "missing:website_scraped_pages" : "none",
        documentSource: sessionError ? "missing:website_scraped_documents" : "none",
      },
    });
  }

  const scanSession = session as ScanSessionRow;
  const [pagesResult, documentsResult] = await Promise.all([
    supabase
      .from("website_scraped_pages")
      .select("id, url, title, extracted_text, headings, crawled_at")
      .eq("session_id", scanSession.id)
      .order("word_count", { ascending: false })
      .limit(300),
    supabase
      .from("website_scraped_documents")
      .select("id, url, filename, title, link_text, found_on_page_url, file_type, extracted_text, crawled_at")
      .eq("session_id", scanSession.id)
      .order("word_count", { ascending: false })
      .limit(300),
  ]);

  if (pagesResult.error && !isMissingWebsiteScanTable(pagesResult.error.message)) {
    return apiError(pagesResult.error.message, 500);
  }
  if (documentsResult.error && !isMissingWebsiteScanTable(documentsResult.error.message)) {
    return apiError(documentsResult.error.message, 500);
  }

  const harvest = harvestCurriculumSources({
    pages: pagesResult.error ? [] : pagesResult.data || [],
    documents: documentsResult.error ? [] : documentsResult.data || [],
  });

  return apiSuccess({
    organizationId,
    hasWebsiteScan: true,
    session: {
      id: scanSession.id,
      websiteUrl: scanSession.website_url,
      status: scanSession.status,
      scrapeCompletedAt: scanSession.scrape_completed_at,
      createdAt: scanSession.created_at,
    },
    harvest,
    sourceSummary: {
      pageSource: pagesResult.error ? "missing:website_scraped_pages" : "website_scraped_pages",
      documentSource: documentsResult.error ? "missing:website_scraped_documents" : "website_scraped_documents",
      sourceRule: "Original website pages/documents remain source of truth. Schoolgle stores extracted metadata, signals and review status only.",
    },
  });
}, { requiredRole: "teacher", rateLimit: false });

function isMissingWebsiteScanTable(message: string) {
  return message.includes("does not exist") || message.includes("Could not find the table") || message.includes("schema cache");
}
