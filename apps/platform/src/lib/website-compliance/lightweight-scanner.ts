/**
 * Lightweight Website Compliance Scanner
 *
 * Fast scan (~30-60s) for the standalone £50/year micro-app.
 * Uses fetch (no Playwright, no AI, no PDF extraction).
 *
 * IMPORTANT: Uses the SAME structural matching engine as the deep scan
 * (phase2-assessor.ts runStructuralMatching). The only difference is:
 * - Crawl: fetch-based (not Playwright)
 * - Assessment: structural scoring only (no AI, no expert modules)
 * - Output: simple found/not_found/needs_checking checklist
 *
 * This means the £50 app and the £1,500 Ofsted readiness product
 * share the same matching logic — one codebase, tested once.
 */

import {
  WEBSITE_COMPLIANCE_REQUIREMENTS as REQUIREMENTS,
  type ComplianceRequirement,
  type RequirementCategory,
  type SchoolPhase,
} from "./requirements";
import {
  runStructuralMatching,
  type ScrapedContent,
  type ContentMatch,
} from "./phase2-assessor";

// ─── Types ────────────────────────────────────────────────────

export type LightweightStatus = "found" | "not_found" | "needs_checking";

export interface DocumentQuality {
  /** 0-100 score based on how many compliance/quality criteria are evidenced */
  score: number;
  /** Compliance criteria found in the document */
  criteriaMet: string[];
  /** Compliance criteria NOT found — actionable gaps */
  criteriaMissing: string[];
  /** Year the document appears to be dated */
  documentYear?: number;
  /** Number of pages in the document */
  pageCount?: number;
  /** Word count of the document */
  wordCount?: number;
}

export interface LightweightCheckResult {
  requirementKey: string;
  requirementName: string;
  category: RequirementCategory;
  status: LightweightStatus;
  /** Where we found evidence (URL) */
  foundOnUrl?: string;
  /** The link text or page title that matched */
  matchedText?: string;
  /** Why it needs checking (e.g. "filename suggests 2022 version") */
  checkingReason?: string;
  /** Human-readable summary of what was found/not found */
  summary?: string;
  /** Document quality assessment (if PDF was readable) */
  quality?: DocumentQuality;
  /** Legislation reference for the requirement */
  legislation: string[];
}

export interface LightweightScanResult {
  websiteUrl: string;
  scannedAt: string;
  durationMs: number;
  totalRequirements: number;
  foundCount: number;
  notFoundCount: number;
  needsCheckingCount: number;
  compliancePercent: number;
  schoolType: "maintained" | "academy" | "unknown";
  schoolPhase: SchoolPhase;
  /** Trust website URL if detected (academies only) */
  trustUrl?: string;
  results: LightweightCheckResult[];
}

// ─── PDF first-page extraction ───────────────────────────────
//
// For the £50 app we still read the ACTUAL document to validate
// its date — URL upload paths are meaningless (schools migrate
// content). We fetch the PDF and extract the first 3 pages which
// is where the title, date, and version info always appear.

let pdfjsLib: any = null;

async function getPdfjs() {
  if (!pdfjsLib) {
    pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
    pdfjsLib.GlobalWorkerOptions.workerSrc = "";
  }
  return pdfjsLib;
}

interface ExtractedPdf {
  text: string;
  pageCount: number;
  wordCount: number;
}

/** Fetch a PDF and extract full text content */
async function extractPdf(
  url: string,
  timeout = 15000,
): Promise<ExtractedPdf | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; SchoolgleBot/1.0; +https://schoolgle.co.uk)",
      },
      redirect: "follow",
    });
    clearTimeout(timer);

    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("pdf") && !url.toLowerCase().endsWith(".pdf")) {
      return null;
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    const pdfjs = await getPdfjs();
    const data = new Uint8Array(buffer);
    const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;

    let text = "";
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item: any) => item.str || "").join(" ") + "\n";
    }

    const trimmed = text.trim();
    return {
      text: trimmed,
      pageCount: doc.numPages,
      wordCount: trimmed.split(/\s+/).filter(Boolean).length,
    };
  } catch {
    // PDF fetch/parse failed — not fatal, just skip validation
    return null;
  }
}

// ─── Date detection ──────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();

/** Get the appropriate max age threshold based on update frequency */
function getMaxAge(freq: string | undefined): number {
  switch (freq) {
    case "annually":
      return 2; // Flag if >2 years old (generous — allows 1 year grace)
    case "every_4_years":
      return 4;
    case "by_date":
      return 2;
    default:
      // "as_needed" or undefined — flag if very old (5+ years)
      return 5;
  }
}

/** Extract the most recent year from document text */
function extractDocumentYear(text: string): number | null {
  const yearPattern = /\b(20[12]\d)\b/g;
  const years: number[] = [];
  let m;
  while ((m = yearPattern.exec(text)) !== null) {
    years.push(parseInt(m[1]));
  }
  if (years.length === 0) return null;
  return Math.max(...years);
}

// ─── Fetch a page's HTML ──────────────────────────────────────

async function fetchPage(
  url: string,
  timeout = 10000,
): Promise<{ html: string; ok: boolean }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; SchoolgleBot/1.0; +https://schoolgle.co.uk)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    clearTimeout(timer);
    if (!res.ok) return { html: "", ok: false };
    const html = await res.text();
    return { html, ok: true };
  } catch {
    return { html: "", ok: false };
  }
}

// ─── Extract links and text from HTML ─────────────────────────

interface PageInfo {
  url: string;
  text: string;
  links: { href: string; text: string }[];
  title: string;
  headings: Array<{ level: number; text: string }>;
}

function parsePage(url: string, html: string): PageInfo {
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim() : "";

  // Extract headings
  const headings: Array<{ level: number; text: string }> = [];
  const headingPattern = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let hMatch;
  while ((hMatch = headingPattern.exec(html)) !== null) {
    headings.push({
      level: parseInt(hMatch[1]),
      text: hMatch[2]
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim(),
    });
  }

  // Strip HTML tags for text content
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();

  // Extract links
  const linkPattern = /<a\s[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const links: { href: string; text: string }[] = [];
  let match;
  while ((match = linkPattern.exec(html)) !== null) {
    const href = match[1].trim();
    const linkText = match[2]
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (href && !href.startsWith("#") && !href.startsWith("javascript:")) {
      try {
        const resolved = new URL(href, url).href;
        links.push({ href: resolved, text: linkText });
      } catch {
        links.push({ href, text: linkText });
      }
    }
  }

  return { url, text, links, title, headings };
}

// ─── Detect school type from content ──────────────────────────

function detectSchoolType(
  pages: PageInfo[],
): "maintained" | "academy" | "unknown" {
  const allText = pages.map((p) => p.text).join(" ");
  const academySignals = [
    "academy",
    "trust",
    "academy trust",
    "mat ",
    "multi-academy",
  ];
  const maintainedSignals = [
    "local authority",
    "community school",
    "maintained school",
  ];

  const academyScore = academySignals.filter((s) => allText.includes(s)).length;
  const maintainedScore = maintainedSignals.filter((s) =>
    allText.includes(s),
  ).length;

  if (academyScore > maintainedScore) return "academy";
  if (maintainedScore > academyScore) return "maintained";
  return "unknown";
}

function detectPhase(pages: PageInfo[]): SchoolPhase {
  const allText = pages.map((p) => p.text + " " + p.title).join(" ");
  const primarySignals = ["primary", "infant", "junior", "eyfs", "ks1", "ks2"];
  const secondarySignals = [
    "secondary",
    "sixth form",
    "ks3",
    "ks4",
    "gcse",
    "a-level",
  ];

  const primaryScore = primarySignals.filter((s) => allText.includes(s)).length;
  const secondaryScore = secondarySignals.filter((s) =>
    allText.includes(s),
  ).length;

  if (primaryScore >= 2 && secondaryScore >= 2) return "all_through";
  if (secondaryScore >= 2) return "secondary";
  if (primaryScore >= 2) return "primary";
  return "all";
}

/** Detect the trust website URL from school pages (academies link to their trust) */
function detectTrustUrl(
  pages: PageInfo[],
  schoolOrigin: string,
): string | null {
  // Common trust link text patterns
  const trustPatterns = [
    /academy\s*trust/i,
    /academies/i,
    /multi.?academy/i,
    /trust\s*website/i,
    /our\s*trust/i,
    /part\s*of/i,
    /\bMAT\b/,
    /\btrust\b/i,
  ];

  for (const page of pages) {
    for (const link of page.links) {
      try {
        const linkUrl = new URL(link.href);
        // Skip same-origin links
        if (linkUrl.origin === schoolOrigin) continue;
        // Skip non-http
        if (!linkUrl.protocol.startsWith("http")) continue;
        // Skip social media, government, etc
        const host = linkUrl.hostname.toLowerCase();
        if (
          host.includes("twitter") ||
          host.includes("facebook") ||
          host.includes("instagram") ||
          host.includes("youtube") ||
          host.includes("gov.uk") ||
          host.includes("ofsted") ||
          host.includes("google")
        )
          continue;

        // Check if link text suggests trust
        const textLower = link.text.toLowerCase();
        if (trustPatterns.some((p) => p.test(textLower))) {
          return linkUrl.origin;
        }
        // Check if link URL contains trust-like patterns
        if (
          host.includes("trust") ||
          host.includes("academy") ||
          host.includes("academies")
        ) {
          return linkUrl.origin;
        }
      } catch {
        continue;
      }
    }
  }
  return null;
}

// Trust website paths to crawl for trust-level requirements
const TRUST_SEED_PATHS = [
  "/",
  "/governance",
  "/governance/policies-and-statements",
  "/governance/trustees",
  "/about",
  "/about-us",
  "/our-trust",
  "/our-trust/about-us",
  "/key-information",
  "/policies",
  "/finance",
  "/financial-information",
  "/equality",
  "/gender-pay-gap",
  "/transparency",
  "/trust-information",
  "/statutory-information",
];

// ─── Convert PageInfo to ScrapedContent for shared matching ───
//
// The deep scan's runStructuralMatching() works on ScrapedContent.
// We convert our fetched pages into the same format so we get
// identical matching behaviour.

function pageToScrapedContent(page: PageInfo): ScrapedContent {
  return {
    id: page.url, // no DB id for lightweight scan
    url: page.url,
    title: page.title,
    content: page.text,
    contentType: "html",
    source: "school",
    wordCount: page.text.split(/\s+/).length,
    headings: page.headings,
    links: page.links.map((l) => l.href),
  };
}

// Also create ScrapedContent entries for document links found on pages.
// This lets the structural matcher score PDF/doc links the same way
// the deep scan does (filename matching, link text matching).

function extractDocumentLinks(pages: PageInfo[]): ScrapedContent[] {
  const docs: ScrapedContent[] = [];
  const seen = new Set<string>();

  for (const page of pages) {
    for (const link of page.links) {
      const hrefLower = link.href.toLowerCase();
      const isDocument =
        hrefLower.endsWith(".pdf") ||
        hrefLower.endsWith(".docx") ||
        hrefLower.endsWith(".doc") ||
        hrefLower.includes("drive.google.com/file") ||
        hrefLower.includes("/file/d/");

      if (!isDocument || seen.has(link.href)) continue;
      seen.add(link.href);

      docs.push({
        id: link.href,
        url: link.href,
        title: link.text || "",
        content: "", // populated later by validateDocumentDates()
        contentType: "pdf",
        source: "school",
        wordCount: 0,
        headings: [],
        links: [],
        linkText: link.text,
        foundOnPageUrl: page.url,
      });
    }
  }

  return docs;
}

// ─── Convert ContentMatch to LightweightCheckResult ───────────

function matchToCheckResult(match: ContentMatch): LightweightCheckResult {
  const req = match.requirement;

  const result: LightweightCheckResult = {
    requirementKey: req.key,
    requirementName: req.name,
    category: req.category,
    status: "not_found",
    legislation: req.legislation,
  };

  if (match.matchingContent.length === 0) {
    // Tell the user what we were looking for so they know what to fix
    const docExamples = req.documentPatterns.slice(0, 2).join(" or ");
    const keywordExamples = req.searchKeywords.slice(0, 3).join(", ");
    if (docExamples && keywordExamples) {
      result.summary = `Not found — looked for documents like "${docExamples}" and keywords: ${keywordExamples}`;
    } else if (docExamples) {
      result.summary = `Not found — looked for documents like "${docExamples}"`;
    } else if (keywordExamples) {
      result.summary = `Not found — looked for: ${keywordExamples}`;
    } else {
      result.summary = `Not found on website`;
    }
    return result;
  }

  // The structural matcher already scored and ranked content.
  // If it found matching content, trust it — mark as found.
  const best = match.matchingContent[0];
  result.status = "found";
  result.foundOnUrl = best.url;

  // Pick the best display text: prefer link text > longest keyword > page title
  if (best.linkText) {
    result.matchedText = best.linkText;
  } else if (match.keywordsFound.length > 0) {
    // Use the longest keyword (most specific)
    result.matchedText = match.keywordsFound.sort(
      (a, b) => b.length - a.length,
    )[0];
  } else {
    result.matchedText = best.title || undefined;
  }

  // Build a human-readable summary of what we found
  const isPdf = best.contentType === "pdf" || best.contentType === "document";
  const displayName = best.linkText || best.title || "";
  if (isPdf && displayName) {
    result.summary = `Found document: "${displayName}"`;
  } else if (displayName) {
    result.summary = `Found on page: "${displayName}"`;
  } else {
    result.summary = `Found at ${best.url}`;
  }
  if (match.keywordsFound.length > 0) {
    result.summary += ` (matched: ${match.keywordsFound.slice(0, 3).join(", ")})`;
  }

  // Date validation happens in validateDocumentDates() after PDF extraction
  return result;
}

// ─── PDF validation & quality assessment ─────────────────────
//
// After structural matching, we fetch each matched PDF in full,
// read the actual document content, and:
// 1. Check the real document date (not the URL upload date)
// 2. Assess quality by checking content against compliance criteria
// 3. Report what's covered and what's missing
//
// This is the key differentiator for the £50 app — it reads the
// documents and tells you what's good and what needs work.

/** Check document text against requirement criteria */
function assessDocumentQuality(
  text: string,
  requirement: ComplianceRequirement,
  pdf: ExtractedPdf,
): DocumentQuality {
  const textLower = text.toLowerCase();

  // Combine compliance + quality criteria for checking
  const allCriteria = [
    ...(requirement.complianceCriteria || []),
    ...(requirement.qualityCriteria || []),
  ];

  const criteriaMet: string[] = [];
  const criteriaMissing: string[] = [];

  for (const criterion of allCriteria) {
    // Extract key phrases from the criterion to search for
    const found = criterionMatchesText(criterion, textLower);
    if (found) {
      criteriaMet.push(criterion);
    } else {
      criteriaMissing.push(criterion);
    }
  }

  const total = allCriteria.length;
  const score = total > 0 ? Math.round((criteriaMet.length / total) * 100) : 0;

  return {
    score,
    criteriaMet,
    criteriaMissing,
    documentYear: extractDocumentYear(text) || undefined,
    pageCount: pdf.pageCount,
    wordCount: pdf.wordCount,
  };
}

/**
 * Check whether a compliance criterion is evidenced in the document text.
 * Extracts meaningful phrases from the criterion and checks for them.
 * More forgiving than exact matching — looks for key concepts.
 */
function criterionMatchesText(criterion: string, textLower: string): boolean {
  const criterionLower = criterion.toLowerCase();

  // Extract the key noun phrases / concepts from the criterion
  // e.g. "Complaints procedure is published" → check for "complaints procedure"
  // e.g. "Named contact or role" → check for "contact" or role-like patterns
  // e.g. "Multi-stage process described" → check for "stage" or "informal" + "formal"

  const keyPhrases = extractKeyPhrases(criterionLower);

  // If we found key phrases, check if at least one appears in the text
  if (keyPhrases.length > 0) {
    return keyPhrases.some((phrase) => textLower.includes(phrase));
  }

  // Fallback: check if significant words from the criterion appear
  const words = criterionLower
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 4); // Only meaningful words
  const stopWords = new Set([
    "should",
    "would",
    "could",
    "about",
    "their",
    "there",
    "where",
    "which",
    "these",
    "those",
    "being",
    "other",
    "after",
    "before",
    "between",
    "through",
    "during",
    "under",
    "above",
    "below",
    "described",
    "published",
    "included",
    "identified",
    "provided",
    "stated",
    "shown",
    "clear",
  ]);
  const significant = words.filter((w) => !stopWords.has(w));

  // Need at least half the significant words to match
  if (significant.length === 0) return false;
  const matchCount = significant.filter((w) => textLower.includes(w)).length;
  return matchCount >= Math.ceil(significant.length * 0.5);
}

/** Extract searchable key phrases from a criterion description */
function extractKeyPhrases(criterion: string): string[] {
  const phrases: string[] = [];

  // Common patterns in compliance criteria
  const extractors: Array<{
    pattern: RegExp;
    extract: (m: RegExpMatchArray) => string[];
  }> = [
    // "X procedure" / "X policy" / "X plan"
    {
      pattern:
        /(\w[\w\s-]+?)\s+(procedure|policy|plan|statement|report|objectives|information|strategy)\b/g,
      extract: (m) => [m[0].trim()],
    },
    // "named X" patterns
    { pattern: /named\s+(\w+)/g, extract: (m) => [m[1]] },
    // "timescales" / "timelines"
    {
      pattern: /\b(timescale|timeline|deadline|target date|review date)\b/g,
      extract: (m) => [m[1]],
    },
    // "WCAG" / "DfE" / specific acronyms
    {
      pattern: /\b(WCAG|DfE|GDPR|KCSIE|EYFS|SEND|SEN|Ofsted|DSL)\b/gi,
      extract: (m) => [m[1].toLowerCase()],
    },
    // Quoted terms
    { pattern: /"([^"]+)"/g, extract: (m) => [m[1]] },
  ];

  for (const { pattern, extract } of extractors) {
    let m;
    const re = new RegExp(pattern.source, pattern.flags);
    while ((m = re.exec(criterion)) !== null) {
      phrases.push(...extract(m));
    }
  }

  return phrases;
}

/** Full document validation: date check + quality assessment */
async function validateAndAssessDocuments(
  matches: ContentMatch[],
  results: LightweightCheckResult[],
): Promise<void> {
  // Collect all unique PDF URLs that matched a requirement
  const pdfUrlSet = new Set<string>();

  for (let i = 0; i < matches.length; i++) {
    if (results[i].status !== "found") continue;
    for (const content of matches[i].matchingContent) {
      if (content.contentType === "pdf" || content.contentType === "document") {
        pdfUrlSet.add(content.url);
      }
    }
  }

  if (pdfUrlSet.size === 0) return;

  const pdfUrls = Array.from(pdfUrlSet);
  console.log(
    `[LightweightScan] Fetching ${pdfUrls.length} PDFs for content validation...`,
  );

  // Fetch PDFs in parallel (batches of 4 to avoid hammering the server)
  const pdfData = new Map<string, ExtractedPdf>();
  const batchSize = 4;

  for (let i = 0; i < pdfUrls.length; i += batchSize) {
    const batch = pdfUrls.slice(i, i + batchSize);
    const fetched = await Promise.all(
      batch.map(async (url) => {
        const pdf = await extractPdf(url);
        return { url, pdf };
      }),
    );
    for (const { url, pdf } of fetched) {
      if (pdf) pdfData.set(url, pdf);
    }
  }

  console.log(
    `[LightweightScan] Extracted text from ${pdfData.size}/${pdfUrls.length} PDFs`,
  );

  // Now validate and assess each matched document
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    if (results[i].status !== "found") continue;

    const req = match.requirement;
    const maxAge = getMaxAge(req.updateFrequency);

    for (const content of match.matchingContent) {
      if (content.contentType !== "pdf" && content.contentType !== "document") {
        continue;
      }

      const pdf = pdfData.get(content.url);
      if (!pdf || !pdf.text) continue;

      // 1. Quality assessment — check content against criteria
      const quality = assessDocumentQuality(pdf.text, req, pdf);
      results[i].quality = quality;

      // 2. Date validation — check actual document year
      if (quality.documentYear) {
        const age = CURRENT_YEAR - quality.documentYear;
        if (age > maxAge) {
          results[i].status = "needs_checking";
          results[i].checkingReason =
            `Document dated ${quality.documentYear} (${age} years old) — review recommended`;
        }
      }

      // 3. Build comprehensive summary
      const docName = content.linkText || content.title || "Document";
      const parts: string[] = [];

      if (quality.documentYear) {
        const age = CURRENT_YEAR - quality.documentYear;
        if (age > maxAge) {
          parts.push(
            `"${docName}" dated ${quality.documentYear} — ${age} years old`,
          );
        } else {
          parts.push(`"${docName}" (${quality.documentYear})`);
        }
      } else {
        parts.push(`"${docName}"`);
      }

      parts.push(`${quality.pageCount} pages, ${quality.wordCount} words`);
      parts.push(
        `Quality: ${quality.score}% — ${quality.criteriaMet.length}/${quality.criteriaMet.length + quality.criteriaMissing.length} criteria met`,
      );

      if (
        quality.criteriaMissing.length > 0 &&
        quality.criteriaMissing.length <= 3
      ) {
        parts.push(`Missing: ${quality.criteriaMissing.join("; ")}`);
      } else if (quality.criteriaMissing.length > 3) {
        parts.push(`Missing ${quality.criteriaMissing.length} criteria`);
      }

      results[i].summary = parts.join(" · ");

      // Only process the first matched PDF per requirement
      break;
    }
  }
}

// ─── Common school website paths to always try ──────────────

const PRIORITY_PATHS = [
  // These are common school website paths. The scanner also follows
  // all links from the homepage nav, so non-standard paths get found too.
  "/about-us",
  "/about",
  "/key-information",
  "/key-info",
  "/policies",
  "/policies-and-documents",
  "/our-policies",
  "/statutory-information",
  "/statutory-info",
  "/governors",
  "/governance",
  "/send",
  "/sen",
  "/special-educational-needs",
  "/inclusion",
  "/admissions",
  "/curriculum",
  "/parents",
  "/parents/policies",
  "/parents/key-information",
  "/safeguarding",
  "/home/safeguarding",
  "/contact",
  "/contact-us",
  "/staff",
  "/our-team",
  "/our-staff",
  "/meet-the-team",
  "/pupil-premium",
  "/pe-sport-premium",
  "/sport-premium",
  "/pe-premium",
  "/sports-premium",
  "/pe-sports-premium",
  "/current-year-pe-sports-premium",
  "/physical-education",
  "/funding",
  "/results",
  "/performance",
  "/ofsted",
  "/accessibility",
  "/complaints",
  "/charging",
  "/uniform",
  "/behaviour",
];

// Pages likely to contain links to policy PDFs — crawl their links too
const LINK_HUB_PATTERNS = [
  "policies",
  "key-information",
  "key-info",
  "statutory",
  "parents",
  "about",
  "governance",
  "governors",
  "send",
  "safeguarding",
  "curriculum",
  "admissions",
  "premium",
  "funding",
  "sport",
  "pupil-premium",
  "pe-",
  "physical-education",
  "inclusion",
];

// ─── Main: Lightweight scan ───────────────────────────────────

export async function lightweightScan(
  websiteUrl: string,
): Promise<LightweightScanResult> {
  const startTime = Date.now();

  // Normalise URL
  let baseUrl = websiteUrl.trim();
  if (!baseUrl.startsWith("http")) baseUrl = "https://" + baseUrl;
  const origin = new URL(baseUrl).origin;

  // Step 1: Fetch homepage
  const { html: homeHtml, ok: homeOk } = await fetchPage(baseUrl);
  if (!homeOk) {
    throw new Error(`Could not reach ${baseUrl}`);
  }

  const homePage = parsePage(baseUrl, homeHtml);

  // Step 2: Build URL set — priority paths FIRST, then homepage links
  // Priority paths must be added first so they don't get cut off by the cap.
  const visited = new Set<string>([baseUrl, baseUrl + "/"]);
  const urlQueue: string[] = [];

  // Add priority paths FIRST (common school website patterns — must always be crawled)
  for (const path of PRIORITY_PATHS) {
    const url = origin + path;
    const normalized = url.split("?")[0].split("#")[0];
    if (!visited.has(normalized)) {
      visited.add(normalized);
      urlQueue.push(url);
    }
  }

  // Then add internal links from homepage (for non-standard paths)
  const homeInternalLinks = homePage.links
    .filter((l) => {
      try {
        return new URL(l.href).origin === origin;
      } catch {
        return false;
      }
    })
    .map((l) => l.href);

  for (const href of homeInternalLinks) {
    const normalized = href.split("?")[0].split("#")[0];
    if (!visited.has(normalized)) {
      visited.add(normalized);
      urlQueue.push(href);
    }
  }

  // Cap first-level crawl at 80 pages (priority paths + homepage links)
  const firstLevelUrls = urlQueue.slice(0, 80);

  // Step 3: Fetch all first-level pages in parallel (batches of 8)
  const pages: PageInfo[] = [homePage];
  const batchSize = 8;

  for (let i = 0; i < firstLevelUrls.length; i += batchSize) {
    const batch = firstLevelUrls.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (url) => {
        const { html, ok } = await fetchPage(url);
        if (!ok) return null;
        return parsePage(url, html);
      }),
    );
    pages.push(...(results.filter(Boolean) as PageInfo[]));
  }

  // Step 4: Follow links from "hub" pages (policies, key-info, etc.)
  const secondLevelUrls: string[] = [];
  for (const page of pages) {
    const isHub = LINK_HUB_PATTERNS.some((p) =>
      page.url.toLowerCase().includes(p),
    );
    if (!isHub) continue;

    for (const link of page.links) {
      try {
        if (new URL(link.href).origin !== origin) continue;
      } catch {
        continue;
      }
      const normalized = link.href.split("?")[0].split("#")[0];
      if (!visited.has(normalized)) {
        visited.add(normalized);
        secondLevelUrls.push(link.href);
      }
    }
  }

  // Fetch second-level pages (cap at 30 more)
  const secondBatch = secondLevelUrls.slice(0, 30);
  for (let i = 0; i < secondBatch.length; i += batchSize) {
    const batch = secondBatch.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (url) => {
        const { html, ok } = await fetchPage(url);
        if (!ok) return null;
        return parsePage(url, html);
      }),
    );
    pages.push(...(results.filter(Boolean) as PageInfo[]));
  }

  console.log(`[LightweightScan] Crawled ${pages.length} pages from ${origin}`);

  // Step 5: Detect school type and phase
  const schoolType = detectSchoolType(pages);
  const schoolPhase = detectPhase(pages);

  // Step 6: If academy, detect and crawl trust website
  let trustUrl: string | null = null;
  if (schoolType === "academy") {
    trustUrl = detectTrustUrl(pages, origin);
    if (trustUrl) {
      console.log(`[LightweightScan] Detected trust website: ${trustUrl}`);

      // Crawl trust seed pages (for trust-level requirements like gender pay gap)
      const trustUrls = TRUST_SEED_PATHS.map((p) => trustUrl + p);
      const trustVisited = new Set<string>();

      for (let i = 0; i < trustUrls.length; i += batchSize) {
        const batch = trustUrls.slice(i, i + batchSize);
        const trustResults = await Promise.all(
          batch.map(async (url) => {
            const normalized = url.split("?")[0].split("#")[0];
            if (trustVisited.has(normalized)) return null;
            trustVisited.add(normalized);
            const { html, ok } = await fetchPage(url);
            if (!ok) return null;
            return parsePage(url, html);
          }),
        );
        pages.push(...(trustResults.filter(Boolean) as PageInfo[]));
      }

      console.log(
        `[LightweightScan] Crawled trust site, now ${pages.length} total pages`,
      );
    } else {
      console.log(
        `[LightweightScan] Academy detected but no trust website found`,
      );
    }
  }

  // Step 7: Filter requirements by school type and phase
  const applicableRequirements = REQUIREMENTS.filter((req) => {
    if (req.appliesTo !== "both") {
      if (schoolType === "maintained" && req.appliesTo === "academy")
        return false;
      if (schoolType === "academy" && req.appliesTo === "maintained")
        return false;
    }
    if (req.churchOnly) return false;
    if (req.phase && req.phase !== "all") {
      if (schoolPhase === "primary" && req.phase === "secondary") return false;
      if (schoolPhase === "secondary" && req.phase === "primary") return false;
    }
    return true;
  });

  // Step 8: Convert pages to ScrapedContent for the shared matching engine
  // Trust pages are tagged with source: "trust" so the structural matcher
  // gives bonus score to typicallyTrustLevel requirements
  const allContent: ScrapedContent[] = [
    ...pages.map((page) => {
      const sc = pageToScrapedContent(page);
      if (trustUrl && page.url.startsWith(trustUrl)) {
        sc.source = "trust";
      }
      return sc;
    }),
    ...extractDocumentLinks(pages),
  ];

  console.log(
    `[LightweightScan] ${allContent.length} content items (${pages.length} pages + ${allContent.length - pages.length} doc links)`,
  );

  // Step 9: Run the SAME structural matching used by the deep scan
  const matches = runStructuralMatching(allContent, applicableRequirements);

  // Step 10: Convert deep scan matches to lightweight checklist results
  const results = matches.map(matchToCheckResult);

  // Step 11: Fetch matched PDFs, validate dates, and assess quality
  // Reads each PDF in full — checks actual document date and content
  // against compliance/quality criteria for the requirement
  await validateAndAssessDocuments(matches, results);

  // Step 12: For trust-level requirements not found, add helpful context
  if (schoolType === "academy") {
    for (let i = 0; i < results.length; i++) {
      const req = applicableRequirements[i];
      if (req.typicallyTrustLevel && results[i].status === "not_found") {
        if (trustUrl) {
          results[i].status = "needs_checking";
          results[i].checkingReason =
            `Typically published on trust website (${trustUrl.replace(/^https?:\/\//, "")}) — not found on school or trust site`;
          results[i].summary =
            `Not found on school or trust website — may need publishing`;
        } else {
          results[i].checkingReason =
            `Typically published on trust website — could not detect trust site`;
          results[i].summary =
            `Academy trust requirement — check your trust website`;
        }
      }
    }
  }

  const foundCount = results.filter((r) => r.status === "found").length;
  const notFoundCount = results.filter((r) => r.status === "not_found").length;
  const needsCheckingCount = results.filter(
    (r) => r.status === "needs_checking",
  ).length;

  return {
    websiteUrl: baseUrl,
    scannedAt: new Date().toISOString(),
    durationMs: Date.now() - startTime,
    totalRequirements: results.length,
    foundCount,
    notFoundCount,
    needsCheckingCount,
    compliancePercent:
      results.length > 0
        ? Math.round(
            ((foundCount + needsCheckingCount * 0.5) / results.length) * 100,
          )
        : 0,
    schoolType,
    schoolPhase,
    trustUrl: trustUrl || undefined,
    results,
  };
}
