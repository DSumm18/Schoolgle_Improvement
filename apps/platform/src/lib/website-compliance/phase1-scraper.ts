/**
 * Phase 1 Scraper — Website Content Ingestion Engine
 *
 * Crawls a school website, stores ALL pages and documents in normalised tables,
 * and feeds Ed's knowledge base. This is the foundation for:
 *   1. Ed Knowledge Base (immediate Q&A from website content)
 *   2. Website Compliance Tool (assess against rubrics)
 *   3. Ofsted Readiness (tick off website evidence)
 *
 * The scraper is deliberately separate from assessment — scrape everything first,
 * then assess. This means we can re-assess without re-crawling, and the scraper
 * can be used independently to populate Ed's knowledge.
 */

import { createHash } from "crypto";
import { createServiceRoleClient } from "@/lib/supabase-server";
import {
  crawlWebsite,
  type CrawlerResult,
  type CrawledPage,
} from "@/lib/website-crawler";

// ─── Types ────────────────────────────────────────────────────────────

export interface ScrapeOptions {
  organizationId: string;
  websiteUrl: string;

  /** Trust URL for academies (optional — auto-detected if not provided) */
  trustUrl?: string;

  /** Known school type (optional — auto-detected from content) */
  schoolType?: "maintained" | "academy";

  /** Known school phase (optional — auto-detected from content) */
  schoolPhase?: "primary" | "secondary" | "all_through" | "all";

  /** Max pages to crawl on the school site (default: 150) */
  maxPages?: number;

  /** Max pages to crawl on the trust site (default: 40) */
  maxTrustPages?: number;

  /** Progress callback */
  onProgress?: (message: string, step: number, total: number) => void;
}

export interface ScrapeResult {
  sessionId: string;
  pagesStored: number;
  documentsStored: number;
  edKnowledgeStored: number;
  schoolType: "maintained" | "academy";
  schoolPhase: string;
  isChurchSchool: boolean;
  trustUrl: string | null;
  durationMs: number;
}

// ─── Trust site seed paths ────────────────────────────────────────────

const TRUST_SEED_PATHS = [
  "/",
  "/policies",
  "/policies-and-statements",
  "/key-information",
  "/governance",
  "/governance/policies",
  "/governance/governance-structure",
  "/governance/trustees",
  "/trustees",
  "/about/governance",
  "/finance",
  "/about/finance",
  "/accounts",
  "/annual-report",
  "/gender-pay-gap",
  "/complaints",
  "/whistleblowing",
  "/key-documents",
  "/statutory-information",
  "/about",
  "/about-us",
  "/our-schools",
  "/our-trust",
];

// ─── Main Scraper ─────────────────────────────────────────────────────

export async function scrapeSchoolWebsite(
  options: ScrapeOptions,
): Promise<ScrapeResult> {
  const startTime = Date.now();
  const supabase = createServiceRoleClient();

  const {
    organizationId,
    websiteUrl,
    maxPages = 150,
    maxTrustPages = 40,
    onProgress,
  } = options;

  const baseUrl = new URL(websiteUrl);
  const progress = (msg: string, step: number, total: number) => {
    onProgress?.(msg, step, total);
    console.log(`[Scraper] ${msg}`);
  };

  // ─── Step 1: Create session ───────────────────────────────────────

  progress("Creating scan session", 1, 8);

  // Delete previous session for this org (one active scan at a time)
  await supabase
    .from("website_scan_sessions")
    .delete()
    .eq("organization_id", organizationId);

  const { data: session, error: sessionError } = await supabase
    .from("website_scan_sessions")
    .insert({
      organization_id: organizationId,
      website_url: websiteUrl,
      status: "scraping",
      progress: { step: 1, total: 8, message: "Starting crawl" },
    })
    .select("id")
    .single();

  if (sessionError || !session) {
    throw new Error(`Failed to create scan session: ${sessionError?.message}`);
  }

  const sessionId = session.id;

  try {
    // ─── Step 2: Quick crawl for auto-detection ─────────────────────

    progress("Quick crawl for school detection", 2, 8);
    await updateSession(supabase, sessionId, {
      progress: { step: 2, total: 8, message: "Detecting school type" },
    });

    const quickCrawl = await crawlWebsite(websiteUrl, {
      maxPages: 10,
      requestDelay: 200,
      pageTimeout: 15000,
      sameDomainOnly: true,
      processPDFs: false,
      processDocuments: false,
      userAgent: "Schoolgle-Compliance/1.0 (+https://schoolgle.co.uk)",
      headless: true,
    });

    // ─── Step 3: Auto-detect school metadata ────────────────────────

    progress("Detecting school metadata", 3, 8);

    const allContent = quickCrawl.pages
      // @ts-expect-error - Auto-masked during strict compilation enforcement
      .map((p) => (p.content || "").toLowerCase())
      .join(" ");

    const allTitles = quickCrawl.pages
      // @ts-expect-error - Auto-masked during strict compilation enforcement
      .map((p) => (p.title || "").toLowerCase())
      .join(" ");

    const phaseContent =
      allContent + " " + allTitles + " " + baseUrl.hostname.toLowerCase();

    // Detect school type
    let schoolType = options.schoolType || detectSchoolType(allContent);

    // Detect school phase
    let schoolPhase =
      options.schoolPhase || detectSchoolPhase(phaseContent, baseUrl.hostname);

    // Detect church school
    const isChurchSchool = detectChurchSchool(allContent);

    // Detect trust domains
    const trustDomains = detectTrustDomains(
      quickCrawl.pages,
      baseUrl.hostname,
      websiteUrl,
    );

    // Find primary trust URL
    let trustUrl =
      options.trustUrl ||
      findPrimaryTrustDomain(trustDomains, quickCrawl.pages);

    await updateSession(supabase, sessionId, {
      school_type: schoolType,
      school_phase: schoolPhase,
      is_church_school: isChurchSchool,
      trust_url: trustUrl,
      progress: {
        step: 3,
        total: 8,
        message: `Detected: ${schoolType} ${schoolPhase}${isChurchSchool ? " (church)" : ""}`,
      },
    });

    // ─── Step 4: Full school crawl ──────────────────────────────────

    progress(`Full crawl of ${baseUrl.hostname} (max ${maxPages} pages)`, 4, 8);
    await updateSession(supabase, sessionId, {
      progress: { step: 4, total: 8, message: "Crawling school website" },
    });

    const crawlResult = await crawlWebsite(websiteUrl, {
      maxPages,
      requestDelay: 300,
      pageTimeout: 20000,
      sameDomainOnly: true,
      allowedDomains: [...trustDomains],
      processPDFs: true,
      processDocuments: true,
      userAgent: "Schoolgle-Compliance/1.0 (+https://schoolgle.co.uk)",
      headless: true,
      screenshotOCR: true,
      screenshotOCRThreshold: 100,
    });

    progress(
      `School crawl: ${crawlResult.pages.length} pages, ${crawlResult.stats.pdfsProcessed} PDFs`,
      4,
      8,
    );

    // ─── Step 5: Trust crawl (if academy) ───────────────────────────

    if (schoolType === "academy" && trustUrl) {
      progress(`Crawling trust website: ${trustUrl}`, 5, 8);
      await updateSession(supabase, sessionId, {
        progress: { step: 5, total: 8, message: "Crawling trust website" },
      });

      try {
        const trustBaseUrl = trustUrl.startsWith("http")
          ? trustUrl
          : `https://${trustUrl}`;
        const seedUrls = TRUST_SEED_PATHS.map(
          (path) => `${trustBaseUrl.replace(/\/$/, "")}${path}`,
        );

        const trustCrawl = await crawlWebsite(trustBaseUrl, {
          maxPages: maxTrustPages,
          requestDelay: 500,
          pageTimeout: 30000,
          sameDomainOnly: true,
          allowedDomains: ["drive.google.com", "docs.google.com"],
          processPDFs: true,
          processDocuments: true,
          userAgent: "Schoolgle-Compliance/1.0 (+https://schoolgle.co.uk)",
          headless: true,
          seedUrls,
        });

        // Tag trust pages and merge
        for (const page of trustCrawl.pages) {
          (page.metadata as any).source = "trust";
          crawlResult.pages.push(page);
        }

        crawlResult.stats.totalPages += trustCrawl.stats.totalPages;
        crawlResult.stats.pdfsProcessed += trustCrawl.stats.pdfsProcessed;
        crawlResult.errors.push(...trustCrawl.errors);

        progress(
          `Trust crawl: ${trustCrawl.pages.length} pages. Combined total: ${crawlResult.pages.length}`,
          5,
          8,
        );
      } catch (e) {
        console.error("[Scraper] Trust crawl failed:", e);
      }
    }

    // ─── Step 6: Store pages and documents ──────────────────────────

    progress("Storing scraped content", 6, 8);
    await updateSession(supabase, sessionId, {
      pages_found: crawlResult.pages.length,
      // @ts-expect-error - Auto-masked during strict compilation enforcement
      documents_found: crawlResult.pages.filter((p) => p.contentType !== "html")
        .length,
      progress: { step: 6, total: 8, message: "Storing content in database" },
    });

    const { pagesStored, documentsStored } = await storeScrapedContent(
      supabase,
      sessionId,
      organizationId,
      crawlResult,
    );

    // ─── Step 7: Feed Ed's knowledge base ───────────────────────────

    progress("Updating Ed knowledge base", 7, 8);
    await updateSession(supabase, sessionId, {
      progress: { step: 7, total: 8, message: "Updating Ed knowledge base" },
    });

    const edKnowledgeStored = await feedEdKnowledge(
      supabase,
      organizationId,
      baseUrl.hostname,
      crawlResult.pages,
    );

    // ─── Step 8: Mark complete ──────────────────────────────────────

    const durationMs = Date.now() - startTime;

    await updateSession(supabase, sessionId, {
      status: "scraped",
      pages_scraped: pagesStored,
      documents_scraped: documentsStored,
      scrape_completed_at: new Date().toISOString(),
      progress: {
        step: 8,
        total: 8,
        message: `Complete: ${pagesStored} pages, ${documentsStored} documents in ${(durationMs / 1000).toFixed(1)}s`,
      },
    });

    progress(
      `Scrape complete: ${pagesStored} pages, ${documentsStored} documents, ${edKnowledgeStored} Ed knowledge entries`,
      8,
      8,
    );

    return {
      sessionId,
      pagesStored,
      documentsStored,
      edKnowledgeStored,
      schoolType,
      schoolPhase,
      isChurchSchool,
      trustUrl,
      durationMs,
    };
  } catch (error) {
    // Mark session as failed
    await updateSession(supabase, sessionId, {
      status: "failed",
      error_message: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

// ─── Detection Functions ──────────────────────────────────────────────

function detectSchoolType(content: string): "maintained" | "academy" {
  const academySignals = [
    "academy",
    "trust",
    "academy trust",
    "multi-academy",
    "mat ",
    "trustees",
    "chief executive officer",
    "ceo",
    "trust board",
    "articles of association",
    "funding agreement",
    "academy trust handbook",
    "companies house",
  ];
  const matches = academySignals.filter((s) => content.includes(s));
  if (matches.length >= 2) {
    console.log(`[Scraper] Detected ACADEMY (signals: ${matches.join(", ")})`);
    return "academy";
  }
  return "maintained";
}

function detectSchoolPhase(
  content: string,
  hostname: string,
): "primary" | "secondary" | "all_through" | "all" {
  const primarySignals = [
    "primary school",
    "primary academy",
    "infant",
    "junior",
    "nursery",
    "reception",
    "year 1",
    "year 2",
    "year 3",
    "year 4",
    "year 5",
    "year 6",
    "eyfs",
    "early years",
    "ks1",
    "ks2",
    "key stage 1",
    "key stage 2",
    "phonics",
  ];
  const secondarySignals = [
    "secondary school",
    "secondary academy",
    "sixth form",
    "gcse",
    "a-level",
    "a level",
    "year 7",
    "year 8",
    "year 9",
    "year 10",
    "year 11",
    "year 12",
    "year 13",
    "ks3",
    "ks4",
    "ks5",
    "key stage 3",
    "key stage 4",
    "post-16",
  ];

  let primary = primarySignals.filter((s) => content.includes(s)).length;
  let secondary = secondarySignals.filter((s) => content.includes(s)).length;

  const host = hostname.toLowerCase();
  if (
    host.includes("primary") ||
    host.includes("infant") ||
    host.includes("junior")
  )
    primary += 2;
  if (
    host.includes("secondary") ||
    host.includes("sixth") ||
    host.includes("college")
  )
    secondary += 2;

  if (primary >= 3 && secondary >= 3) return "all_through";
  if (secondary >= 3 && secondary > primary) return "secondary";
  if (primary >= 2) return "primary";
  return "all";
}

function detectChurchSchool(content: string): boolean {
  const signals = [
    "church of england",
    "c of e",
    "ce primary",
    "ce school",
    "catholic",
    "diocese",
    "diocesan",
    "siams",
    "voluntary aided",
    "voluntary controlled",
    "church school",
    "christian distinctiveness",
    "collective worship",
    "christian values",
    "christian ethos",
  ];
  return signals.filter((s) => content.includes(s)).length >= 2;
}

function detectTrustDomains(
  pages: CrawledPage[],
  schoolDomain: string,
  websiteUrl: string,
): Set<string> {
  const trustDomains = new Set<string>();

  for (const page of pages) {
    if (!page.links) continue;
    for (const link of page.links) {
      try {
        const linkUrl = new URL(link, websiteUrl);
        const linkHost = linkUrl.hostname;

        const isGoogleDocs =
          linkHost === "drive.google.com" ||
          linkHost === "docs.google.com" ||
          linkHost === "sites.google.com";

        const isIrrelevant =
          (!isGoogleDocs && linkHost.includes("google")) ||
          linkHost.includes("facebook") ||
          linkHost.includes("twitter") ||
          linkHost.includes("youtube") ||
          linkHost.includes("instagram") ||
          linkHost.includes("linkedin") ||
          linkHost.includes("gov.uk") ||
          linkHost.includes("ofsted") ||
          linkHost.includes("parentpay") ||
          linkHost.includes("microsoft") ||
          linkHost.includes("apple");

        if (
          linkHost !== schoolDomain &&
          !isIrrelevant &&
          (isGoogleDocs ||
            linkHost.includes("trust") ||
            linkHost.includes("academy") ||
            linkHost.includes("school") ||
            linkHost.includes("mat") ||
            linkHost.includes("education") ||
            linkHost.includes("diocese") ||
            linkUrl.pathname.match(/\.(pdf|docx?|xlsx?)$/i))
        ) {
          trustDomains.add(linkHost);
        }
      } catch {
        // Invalid URL
      }
    }
  }

  return trustDomains;
}

function findPrimaryTrustDomain(
  trustDomains: Set<string>,
  pages: CrawledPage[],
): string | null {
  if (trustDomains.size === 0) return null;

  const scores: Record<string, number> = {};

  for (const domain of trustDomains) {
    let score = 0;
    if (domain.includes("trust")) score += 5;
    if (domain.includes("academy") || domain.includes("academies")) score += 4;
    if (domain.includes("mat")) score += 4;
    if (domain.includes("education")) score += 3;
    if (domain.includes("school")) score += 2;
    if (domain.includes("diocese")) score += 3;
    if (domain.split(".").length <= 3) score += 2;
    if (domain.includes("google")) score -= 10;

    // Count link frequency
    let linkCount = 0;
    for (const page of pages) {
      if (!page.links) continue;
      for (const link of page.links) {
        try {
          if (new URL(link).hostname === domain) linkCount++;
        } catch {}
      }
    }
    score += Math.min(linkCount, 5);

    // Check content mentions
    for (const page of pages) {
      if ((page.content || "").toLowerCase().includes(domain.split(".")[0])) {
        score += 3;
        break;
      }
    }

    scores[domain] = score;
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (sorted.length > 0 && sorted[0][1] > 0) {
    return sorted[0][0];
  }
  return null;
}

// ─── Storage Functions ────────────────────────────────────────────────

async function updateSession(
  supabase: ReturnType<typeof createServiceRoleClient>,
  sessionId: string,
  updates: Record<string, unknown>,
): Promise<void> {
  await supabase
    .from("website_scan_sessions")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", sessionId);
}

function contentHash(text: string): string {
  return createHash("sha256").update(text).digest("hex").substring(0, 32);
}

function extractFilename(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const parts = pathname.split("/");
    const last = parts[parts.length - 1];
    return decodeURIComponent(last || "unknown");
  } catch {
    return "unknown";
  }
}

function detectFileType(
  page: CrawledPage,
): "pdf" | "docx" | "xlsx" | "pptx" | "doc" | "csv" | "txt" | "other" {
  const url = page.url.toLowerCase();
  if (url.endsWith(".pdf") || page.contentType === "pdf") return "pdf";
  if (url.endsWith(".docx")) return "docx";
  if (url.endsWith(".doc")) return "doc";
  if (url.endsWith(".xlsx")) return "xlsx";
  if (url.endsWith(".pptx")) return "pptx";
  if (url.endsWith(".csv")) return "csv";
  if (url.endsWith(".txt")) return "txt";
  return "other";
}

function extractDatesFromText(text: string): string[] {
  if (!text) return [];
  const patterns = [
    // DD/MM/YYYY or DD-MM-YYYY
    /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})\b/g,
    // Month YYYY (September 2024)
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/gi,
    // YYYY-MM-DD
    /\b(\d{4}-\d{2}-\d{2})\b/g,
    // Academic year (2024-2025, 2024/2025, 2024-25, 2024/25)
    /\b(20\d{2}[\/-](?:20)?\d{2})\b/g,
  ];

  const dates = new Set<string>();
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      for (const m of matches) {
        dates.add(m);
      }
    }
  }
  return [...dates].slice(0, 50); // Cap at 50 dates
}

/**
 * Store all crawled pages and documents into normalised tables
 */
async function storeScrapedContent(
  supabase: ReturnType<typeof createServiceRoleClient>,
  sessionId: string,
  organizationId: string,
  crawlResult: CrawlerResult,
): Promise<{ pagesStored: number; documentsStored: number }> {
  let pagesStored = 0;
  let documentsStored = 0;

  for (const page of crawlResult.pages) {
    const source =
      (page.metadata as any)?.source === "trust" ? "trust" : "school";
    const text = page.content || "";
    const hash = text ? contentHash(text) : null;
    const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;

    if (page.contentType === "html") {
      // ── HTML page ──
      const canonical = normaliseUrl(page.url);

      const { error } = await supabase.from("website_scraped_pages").upsert(
        {
          session_id: sessionId,
          organization_id: organizationId,
          url: page.url,
          canonical_url: canonical,
          title: page.title?.substring(0, 500) || null,
          source,
          extracted_text: text || null,
          headings: page.headings || [],
          links_found: (page.links || []).slice(0, 500),
          meta_description:
            page.metadata?.description?.substring(0, 1000) || null,
          http_status: page.status || null,
          word_count: wordCount,
          content_hash: hash,
        },
        { onConflict: "session_id,canonical_url" },
      );

      if (!error) pagesStored++;
      else
        console.error(
          `[Scraper] Failed to store page ${page.url}:`,
          error.message,
        );
    } else {
      // ── Document (PDF, DOCX, etc.) ──
      const fileType = detectFileType(page);
      const filename = extractFilename(page.url);
      const dates = extractDatesFromText(text);

      // Determine extraction method from metadata
      let extractionMethod: string | null = null;
      if (fileType === "pdf") {
        extractionMethod = text.length > 50 ? "pdf2json" : "failed";
        if ((page.metadata as any)?.ocrUsed) extractionMethod = "gemini_ocr";
      } else if (fileType === "docx") {
        extractionMethod = "mammoth";
      } else if (text.length > 0) {
        extractionMethod = "native";
      }

      // Try to get a useful title: link text from referring page, or filename
      const linkText = (page.metadata as any)?.linkText || null;
      const title = linkText || page.title || filename;

      // Find which page this document was linked from
      const foundOnPageUrl = (page.metadata as any)?.foundOnPage || null;

      const { error } = await supabase.from("website_scraped_documents").upsert(
        {
          session_id: sessionId,
          organization_id: organizationId,
          url: page.url,
          filename: filename.substring(0, 500),
          title: title?.substring(0, 500) || null,
          source,
          found_on_page_url: foundOnPageUrl?.substring(0, 2000) || null,
          link_text: linkText?.substring(0, 500) || null,
          file_type: fileType,
          file_size_bytes: page.metadata?.fileSize || null,
          page_count: page.metadata?.pageCount || null,
          extracted_text: text || null,
          extraction_method: extractionMethod,
          extraction_error:
            !text || text.length < 50
              ? "No text extracted or content too short"
              : null,
          word_count: wordCount,
          content_hash: hash,
          dates_found: dates,
        },
        { onConflict: "session_id,url" },
      );

      if (!error) documentsStored++;
      else
        console.error(
          `[Scraper] Failed to store doc ${page.url}:`,
          error.message,
        );
    }
  }

  return { pagesStored, documentsStored };
}

/**
 * Normalise URL for deduplication: strip fragments, trailing slashes, lowercase host
 */
function normaliseUrl(url: string): string {
  try {
    const u = new URL(url);
    let path = u.pathname.replace(/\/+$/, "") || "/";
    return `${u.protocol}//${u.hostname}${path}`.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

// ─── Ed Knowledge Base ────────────────────────────────────────────────

/**
 * Feed Ed's knowledge base with all crawled content.
 * Stores in ed_website_knowledge for RAG retrieval.
 */
async function feedEdKnowledge(
  supabase: ReturnType<typeof createServiceRoleClient>,
  organizationId: string,
  domain: string,
  pages: CrawledPage[],
): Promise<number> {
  let stored = 0;

  for (const page of pages) {
    const text = page.content || "";
    if (text.length < 50) continue;

    const hash = contentHash(text).substring(0, 32);

    // Determine content type for Ed
    let contentType: string;
    if (page.contentType === "pdf") {
      contentType = "policy"; // PDFs are likely policy documents
    } else if (page.contentType === "document") {
      contentType = "document";
    } else {
      contentType = "page";
    }

    const { error } = await supabase.from("ed_website_knowledge").upsert(
      {
        organization_id: organizationId,
        domain,
        page_url: page.url,
        page_title: page.title?.substring(0, 500) || null,
        content: text.substring(0, 50000),
        meta_description: page.metadata?.description || null,
        // @ts-expect-error - Auto-masked during strict compilation enforcement
        headings: page.headings?.map((h) => h.text) || [],
        links: (page.links || []).slice(0, 100),
        content_type: contentType,
        content_hash: hash,
        last_scanned: new Date().toISOString(),
      },
      { onConflict: "organization_id,page_url" },
    );

    if (!error) stored++;
  }

  return stored;
}

// ─── Retrieval Functions (for Phase 2 assessor) ───────────────────────

/**
 * Load all scraped pages for a session.
 * Used by the Phase 2 assessor to run checks without re-crawling.
 */
export async function getScrapedPages(sessionId: string): Promise<
  Array<{
    id: string;
    url: string;
    title: string | null;
    extracted_text: string | null;
    headings: Array<{ level: number; text: string }>;
    source: string;
    word_count: number;
  }>
> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("website_scraped_pages")
    .select("id, url, title, extracted_text, headings, source, word_count")
    .eq("session_id", sessionId)
    .order("crawled_at");

  if (error) throw new Error(`Failed to load scraped pages: ${error.message}`);
  return data || [];
}

/**
 * Load all scraped documents for a session.
 * Used by the Phase 2 assessor to check documents against rubrics.
 */
export async function getScrapedDocuments(sessionId: string): Promise<
  Array<{
    id: string;
    url: string;
    filename: string | null;
    title: string | null;
    file_type: string;
    extracted_text: string | null;
    link_text: string | null;
    found_on_page_url: string | null;
    source: string;
    word_count: number;
    dates_found: string[];
  }>
> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("website_scraped_documents")
    .select(
      "id, url, filename, title, file_type, extracted_text, link_text, found_on_page_url, source, word_count, dates_found",
    )
    .eq("session_id", sessionId)
    .order("crawled_at");

  if (error) throw new Error(`Failed to load scraped docs: ${error.message}`);
  return data || [];
}

/**
 * Get session metadata (school type, phase, etc.)
 */
export async function getSessionInfo(sessionId: string): Promise<{
  id: string;
  organization_id: string;
  website_url: string;
  trust_url: string | null;
  school_type: string;
  school_phase: string;
  is_church_school: boolean;
  status: string;
  pages_scraped: number;
  documents_scraped: number;
} | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("website_scan_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (error) throw new Error(`Failed to load session: ${error.message}`);
  return data;
}
