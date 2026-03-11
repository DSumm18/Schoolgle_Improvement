/**
 * Website Compliance Assessor
 *
 * Two-phase assessment:
 * 1. Structural checks (regex, keyword matching - fast, free)
 * 2. AI quality assessment (per requirement using Gemini - accurate, costs ~$0.01)
 *
 * Produces a compliance report with:
 * - Per-requirement status (found/not_found/partial)
 * - Quality score (1-5)
 * - Currency check (dates found vs expected review cycle)
 * - Clarity score (parent-friendliness)
 * - Evidence quotes
 * - Recommendations
 */

import OpenAI from "openai";
import { MODEL_CONFIG } from "../ai-evidence-matcher";
import { maskPII } from "../pii-masker";
import type { CrawledPage } from "../website-crawler";
import {
  type ComplianceRequirement,
  type RequirementCategory,
  type SchoolPhase,
  WEBSITE_COMPLIANCE_REQUIREMENTS,
  REQUIREMENT_CATEGORY_LABELS,
  getRequirementsForSchoolType,
} from "./requirements";
import { getExpert } from "./experts";
import type { StructuralMatch as ExpertStructuralMatch } from "./experts/base-expert";

// ─── Types ────────────────────────────────────────────────────────

export type ComplianceStatus =
  | "compliant"
  | "partial"
  | "not_found"
  | "outdated";

export interface RequirementAssessment {
  /** Requirement key */
  requirementKey: string;
  /** Requirement name */
  requirementName: string;
  /** Category */
  category: RequirementCategory;
  /** Overall status */
  status: ComplianceStatus;
  /** Compliance score 0-100 */
  complianceScore: number;
  /** Quality score 1-5 */
  qualityScore: number;
  /** Clarity for parents 1-5 */
  clarityScore: number;
  /** Currency: is the content up to date? */
  currencyStatus: "current" | "possibly_outdated" | "outdated" | "unknown";
  /** Dates found in the content */
  datesFound: string[];
  /** Pages where this requirement was found */
  pagesFound: { url: string; title: string }[];
  /** Evidence quotes from the website */
  evidenceQuotes: string[];
  /** What's missing or needs improvement */
  gaps: string[];
  /** Specific recommendations */
  recommendations: string[];
  /** Red flags detected */
  redFlags: string[];
  /** AI confidence in this assessment */
  confidence: number;
  /** Whether AI was used for this assessment (vs structural only) */
  aiAssessed: boolean;
}

export interface WebsiteComplianceReport {
  /** School website URL */
  websiteUrl: string;
  /** School name (if detected) */
  schoolName?: string;
  /** School type (maintained/academy - affects requirements) */
  schoolType: "maintained" | "academy";
  /** When the scan was performed */
  scannedAt: string;
  /** Overall compliance percentage */
  overallComplianceScore: number;
  /** Overall quality score 1-5 */
  overallQualityScore: number;
  /** Overall clarity score 1-5 */
  overallClarityScore: number;
  /** Total requirements checked */
  totalRequirements: number;
  /** Statutory requirements checked */
  statutoryRequirements: number;
  /** How many are compliant */
  compliantCount: number;
  /** How many are partial */
  partialCount: number;
  /** How many are missing */
  notFoundCount: number;
  /** How many are outdated */
  outdatedCount: number;
  /** Per-category summary */
  categorySummary: CategorySummary[];
  /** Per-requirement assessments */
  assessments: RequirementAssessment[];
  /** Pages scanned */
  pagesScanned: number;
  /** PDFs processed */
  pdfsProcessed: number;
  /** Scan duration (ms) */
  scanDuration: number;
  /** Priority actions (top gaps) */
  priorityActions: string[];
  /** Ofsted readiness impact */
  ofstedReadinessImpact: {
    websiteEvidenceCount: number;
    categoriesWithWebsiteEvidence: string[];
    criticalGaps: string[];
  };
}

export interface CategorySummary {
  category: RequirementCategory;
  categoryLabel: string;
  totalRequirements: number;
  compliantCount: number;
  partialCount: number;
  notFoundCount: number;
  outdatedCount: number;
  averageQuality: number;
  averageClarity: number;
  compliancePercent: number;
}

// ─── Date Detection ───────────────────────────────────────────────

const UK_DATE_PATTERNS = [
  // "15 March 2025", "1st January 2024"
  /(\d{1,2})\s*(?:st|nd|rd|th)?\s*(January|February|March|April|May|June|July|August|September|October|November|December)\s*(\d{4})/gi,
  // "March 2025", "September 2024"
  /(January|February|March|April|May|June|July|August|September|October|November|December)\s*(\d{4})/gi,
  // "15/03/2025", "01.09.2024"
  /(\d{1,2})[\/.](\d{1,2})[\/.](\d{2,4})/g,
  // "Reviewed: September 2024", "Updated: March 2025"
  /(?:reviewed|updated|approved|dated|published|version|adopted|ratified|last\s*(?:reviewed|updated))\s*:?\s*(\d{1,2}[\/.\s]\d{1,2}[\/.\s]\d{2,4}|\w+\s+\d{4})/gi,
  // "Review date: September 2025", "Next review: March 2026"
  /(?:review\s*date|next\s*review|due\s*for\s*review)\s*:?\s*(\d{1,2}[\/.\s]\d{1,2}[\/.\s]\d{2,4}|\w+\s+\d{4})/gi,
  // Academic years: "2024-25", "2024/25", "2024-2025"
  /(20\d{2})\s*[-/]\s*(20\d{2}|\d{2})/g,
];

/**
 * Extract all dates from text content
 */
function extractDates(text: string): string[] {
  const dates = new Set<string>();
  for (const pattern of UK_DATE_PATTERNS) {
    const matches = text.matchAll(new RegExp(pattern.source, pattern.flags));
    for (const match of matches) {
      dates.add(match[0].trim());
    }
  }
  return Array.from(dates);
}

/**
 * Check if content appears to be current (within expected timeframe)
 */
function assessCurrency(
  dates: string[],
  requirement: ComplianceRequirement,
): "current" | "possibly_outdated" | "outdated" | "unknown" {
  if (dates.length === 0) return "unknown";

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentAcademicYear =
    now.getMonth() >= 8 ? currentYear : currentYear - 1;

  // Check for current academic year references
  const hasCurrentYear = dates.some(
    (d) =>
      d.includes(String(currentYear)) ||
      d.includes(String(currentAcademicYear)) ||
      d.includes(`${currentAcademicYear}-${(currentAcademicYear + 1) % 100}`),
  );

  if (hasCurrentYear) return "current";

  // Check for previous year (might be ok depending on update frequency)
  const hasPreviousYear = dates.some(
    (d) =>
      d.includes(String(currentYear - 1)) ||
      d.includes(String(currentAcademicYear - 1)),
  );

  if (hasPreviousYear) {
    // For annually-updated items, previous year is borderline
    if (
      requirement.updateFrequency === "annually" ||
      requirement.updateFrequency === "by_date"
    ) {
      return "possibly_outdated";
    }
    return "current";
  }

  // Only older dates found
  return "outdated";
}

// ─── Structural Assessment (Phase 1) ─────────────────────────────

interface StructuralMatch {
  requirement: ComplianceRequirement;
  matchingPages: { url: string; title: string; content: string }[];
  keywordsFound: string[];
  datesFound: string[];
  documentLinksFound: string[];
}

/**
 * Phase 1: Fast structural keyword matching
 * Find which pages likely contain each requirement
 */
function structuralAssessment(
  pages: CrawledPage[],
  requirements: ComplianceRequirement[],
): StructuralMatch[] {
  const results: StructuralMatch[] = [];

  for (const req of requirements) {
    const scoredPages: {
      page: CrawledPage;
      score: number;
      matchedKeywords: string[];
    }[] = [];
    const keywordsFound = new Set<string>();
    const datesFound = new Set<string>();
    const documentLinksFound: string[] = [];

    for (const page of pages) {
      const contentLower = (page.content || "").toLowerCase();
      const titleLower = (page.title || "").toLowerCase();
      const urlLower = page.url.toLowerCase();
      const isPDF = page.contentType === "pdf";

      // Check URL patterns (also match PDF filenames)
      const urlMatch = req.urlPatterns.some((pattern) => {
        if (pattern === "/") {
          // Special case: homepage match — check if URL path is exactly /
          try {
            return new URL(page.url).pathname === "/";
          } catch {
            return false;
          }
        }
        return urlLower.includes(pattern.toLowerCase());
      });

      // For PDFs: also match document patterns against the URL/filename
      // e.g. "behaviour-policy.pdf" should match documentPattern "Behaviour Policy"
      const pdfFilenameMatch =
        isPDF &&
        req.documentPatterns.some((p) => {
          const normalised = p.toLowerCase().replace(/\s+/g, "[-_ ]?");
          return new RegExp(normalised).test(urlLower);
        });

      // Check keywords in content + title
      const matchedKeywords = req.searchKeywords.filter(
        (kw) =>
          contentLower.includes(kw.toLowerCase()) ||
          titleLower.includes(kw.toLowerCase()),
      );

      // Check document patterns (in headings, titles, link text, content)
      const docMatches = req.documentPatterns.filter((pattern) => {
        const patternLower = pattern.toLowerCase();
        return (
          titleLower.includes(patternLower) ||
          contentLower.includes(patternLower) ||
          page.headings.some((h) => h.text.toLowerCase().includes(patternLower))
        );
      });

      // Check for PDF links that match document patterns
      if (page.links) {
        for (const link of page.links) {
          const linkLower = link.toLowerCase();
          if (
            linkLower.endsWith(".pdf") &&
            req.documentPatterns.some((p) =>
              linkLower.includes(p.toLowerCase().replace(/\s+/g, "-")),
            )
          ) {
            documentLinksFound.push(link);
          }
        }
      }

      // Score this page — balance PDF documents (policy content) with HTML pages (staff names, contact info)
      let score =
        matchedKeywords.length * 2 + docMatches.length * 3 + (urlMatch ? 5 : 0);

      // PDF filename match is very strong signal — the document IS the requirement
      if (pdfFilenameMatch) score += 10;

      // PDFs with matching keywords are more likely to be the actual policy document
      if (isPDF && matchedKeywords.length >= 1) score += 3;

      // HTML pages with URL match are important — they often contain staff names,
      // contact details, and other structured info that PDFs lack
      if (!isPDF && urlMatch && matchedKeywords.length >= 1) score += 4;

      // Trust-sourced pages get a boost for trust-level requirements (academies)
      // Many academy policies (complaints, whistleblowing, accounts) live on the trust site
      const isTrustPage = (page.metadata as any)?.source === "trust";
      if (isTrustPage && req.typicallyTrustLevel) score += 5;

      if (score >= 2) {
        scoredPages.push({
          page,
          score,
          matchedKeywords,
        });
        matchedKeywords.forEach((kw) => keywordsFound.add(kw));

        // Extract dates from this page
        const pageDates = extractDates(page.content);
        pageDates.forEach((d) => datesFound.add(d));
      }
    }

    // Sort by score descending so the best matches come first
    scoredPages.sort((a, b) => b.score - a.score);

    // Deduplicate by URL (same page can appear multiple times from different crawl sources)
    const seenUrls = new Set<string>();
    const uniqueScoredPages = scoredPages.filter((sp) => {
      if (seenUrls.has(sp.page.url)) return false;
      seenUrls.add(sp.page.url);
      return true;
    });

    // Take top 8 matches to ensure HTML pages with staff names aren't pushed out by PDFs
    // Give PDFs more content space since they ARE the actual policy documents
    const matchingPages = uniqueScoredPages.slice(0, 8).map((sp) => {
      const contentLimit = sp.page.contentType === "pdf" ? 12000 : 5000;
      return {
        url: sp.page.url,
        title: sp.page.title,
        content: sp.page.content.substring(0, contentLimit),
      };
    });

    results.push({
      requirement: req,
      matchingPages,
      keywordsFound: Array.from(keywordsFound),
      datesFound: Array.from(datesFound),
      documentLinksFound,
    });
  }

  return results;
}

// ─── AI Assessment (Phase 2) ─────────────────────────────────────

interface AIAssessmentResult {
  status: ComplianceStatus;
  complianceScore: number;
  qualityScore: number;
  clarityScore: number;
  evidenceQuotes: string[];
  gaps: string[];
  recommendations: string[];
  redFlags: string[];
  confidence: number;
}

/**
 * Phase 2: AI-powered quality assessment for a single requirement
 */
async function aiAssessRequirement(
  match: StructuralMatch,
  openai: OpenAI,
): Promise<AIAssessmentResult | null> {
  if (match.matchingPages.length === 0) {
    return null; // No content to assess — definitely not found
  }

  const req = match.requirement;

  // Combine content from matching pages
  const combinedContent = match.matchingPages
    .map((p) => `--- Page: ${p.title} (${p.url}) ---\n${p.content}`)
    .join("\n\n");

  // PII mask before sending to AI
  // Allow more content for thorough assessment — PDFs especially need more space
  const { maskedText } = maskPII(combinedContent.substring(0, 25000));

  const prompt = `You are assessing a UK school website for DfE statutory compliance.

REQUIREMENT: "${req.name}"
DESCRIPTION: "${req.description}"
STATUTORY BASIS: ${req.legislation.join("; ")}

COMPLIANCE CRITERIA (what MUST be present):
${req.complianceCriteria.map((c, i) => `${i + 1}. ${c}`).join("\n")}

QUALITY CRITERIA (what SHOULD be present for high quality):
${req.qualityCriteria.map((c, i) => `${i + 1}. ${c}`).join("\n")}

RED FLAGS:
${req.redFlags.map((r) => `- ${r}`).join("\n")}
${req.subItems ? `\nSUB-ITEMS that should be covered:\n${req.subItems.map((s, i) => `${i + 1}. ${s}`).join("\n")}` : ""}

DATES FOUND ON PAGES: ${match.datesFound.length > 0 ? match.datesFound.join(", ") : "None detected"}

WEBSITE CONTENT (from ${match.matchingPages.length} source(s) — may include HTML pages AND PDF policy documents):
${maskedText}

IMPORTANT: Assess the ACTUAL CONTENT of each source. If a PDF document contains the full policy text, assess the policy itself for completeness and quality — not just whether a link to it exists. A school that publishes a comprehensive, well-written policy document should score highly even if the document is a PDF rather than an HTML page.

Assess this requirement and respond with JSON only:
{
  "status": "compliant" | "partial" | "not_found" | "outdated",
  "compliance_score": 0-100,
  "quality_score": 1-5,
  "clarity_score": 1-5,
  "evidence_quotes": ["exact quotes from content that demonstrate compliance"],
  "gaps": ["specific things that are missing"],
  "recommendations": ["actionable recommendations to improve"],
  "red_flags": ["any red flags detected from the list above"],
  "confidence": 0.0-1.0
}

Rules:
- "compliant" = all mandatory compliance criteria met
- "partial" = some criteria met but gaps remain
- "not_found" = requirement not adequately addressed
- "outdated" = content exists but dates suggest it's not current
- quality_score: 1=poor, 2=below standard, 3=adequate, 4=good, 5=excellent
- clarity_score: 1=technical jargon, 2=unclear, 3=adequate, 4=clear, 5=exemplary parent-friendly
- Be specific in gaps and recommendations`;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL_CONFIG.primary.id,
      messages: [
        {
          role: "system",
          content:
            "You are a UK school website compliance assessor. Return JSON only, no markdown.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 2000,
    });

    const text = response.choices[0]?.message?.content || "";
    let jsonText = text.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```json?\n?/g, "").replace(/```\n?/g, "");
    }

    const parsed = JSON.parse(jsonText);

    return {
      status: parsed.status || "not_found",
      complianceScore: Math.min(100, Math.max(0, parsed.compliance_score || 0)),
      qualityScore: Math.min(5, Math.max(1, parsed.quality_score || 1)),
      clarityScore: Math.min(5, Math.max(1, parsed.clarity_score || 1)),
      evidenceQuotes: parsed.evidence_quotes || [],
      gaps: parsed.gaps || [],
      recommendations: parsed.recommendations || [],
      redFlags: parsed.red_flags || [],
      confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
    };
  } catch (error) {
    const errMsg =
      error instanceof Error ? error.message : JSON.stringify(error);
    console.error(
      `[Website Compliance] AI assessment failed for ${req.key}: ${errMsg}`,
    );
    return null;
  }
}

// ─── Main Assessment Engine ──────────────────────────────────────

export interface AssessmentOptions {
  /** School type (affects which requirements are checked) */
  schoolType: "maintained" | "academy";
  /** School phase — primary, secondary, all_through (affects which checks apply) */
  schoolPhase?: SchoolPhase;
  /** Whether this is a church school (VA/VC/C of E/Catholic) — adds SIAMS requirements */
  isChurchSchool?: boolean;
  /** Whether to run AI assessment (default: true) */
  useAI?: boolean;
  /** Progress callback */
  onProgress?: (
    current: number,
    total: number,
    requirementName: string,
  ) => void;
}

/**
 * Run full website compliance assessment
 */
export async function assessWebsiteCompliance(
  pages: CrawledPage[],
  websiteUrl: string,
  options: AssessmentOptions,
): Promise<WebsiteComplianceReport> {
  const startTime = Date.now();
  const {
    schoolType,
    schoolPhase = "all",
    isChurchSchool = false,
    useAI = true,
    onProgress,
  } = options;

  // Get applicable requirements (filtered by type, phase, and church status)
  const requirements = getRequirementsForSchoolType(
    schoolType,
    isChurchSchool,
    schoolPhase,
  );

  // Phase 1: Structural assessment
  console.log(
    `[Website Compliance] Phase 1: Structural assessment of ${requirements.length} requirements across ${pages.length} pages`,
  );
  const structuralMatches = structuralAssessment(pages, requirements);

  // Phase 2: AI assessment
  const assessments: RequirementAssessment[] = [];
  let openai: OpenAI | null = null;

  if (useAI) {
    const apiKey =
      process.env.OPENROUTER_API_KEY ||
      process.env.VITE_OPENROUTER_API_KEY ||
      process.env.OPENAI_API_KEY;
    console.log(
      `[Website Compliance] AI enabled. API key available: ${!!apiKey}, model: ${MODEL_CONFIG.primary.id}`,
    );
    openai = new OpenAI({
      apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://schoolgle.co.uk",
        "X-Title": "Schoolgle - Website Compliance",
      },
    });
  }

  for (let i = 0; i < structuralMatches.length; i++) {
    const match = structuralMatches[i];
    const req = match.requirement;

    if (onProgress) {
      onProgress(i + 1, structuralMatches.length, req.name);
    }

    // Determine currency from dates
    const currencyStatus = assessCurrency(match.datesFound, req);

    // If no pages matched, mark as not found without AI
    if (match.matchingPages.length === 0) {
      assessments.push({
        requirementKey: req.key,
        requirementName: req.name,
        category: req.category,
        status: "not_found",
        complianceScore: 0,
        qualityScore: 0,
        clarityScore: 0,
        currencyStatus: "unknown",
        datesFound: [],
        pagesFound: [],
        evidenceQuotes: [],
        gaps: [`${req.name} was not found on the school website`],
        recommendations: [
          `Publish ${req.name} on the school website to meet statutory requirements (${req.legislation.join(", ")})`,
        ],
        redFlags:
          req.severity === "statutory"
            ? [`Missing statutory requirement: ${req.name}`]
            : [],
        confidence: 0.9,
        aiAssessed: false,
      });
      continue;
    }

    // Try dedicated expert first, then fall back to generic AI
    let aiResult: AIAssessmentResult | null = null;
    const expert = getExpert(req.key);

    if (expert) {
      try {
        // Convert local StructuralMatch to expert StructuralMatch
        const expertMatch: ExpertStructuralMatch = {
          requirement: {
            key: req.key,
            name: req.name,
            description: req.description,
            legislation: req.legislation,
            searchKeywords: req.searchKeywords,
            urlPatterns: req.urlPatterns,
            documentPatterns: req.documentPatterns,
            complianceCriteria: req.complianceCriteria,
            qualityCriteria: req.qualityCriteria,
            redFlags: req.redFlags,
            subItems: req.subItems,
            category: req.category,
            severity: req.severity,
            typicallyTrustLevel: req.typicallyTrustLevel,
          },
          matchingPages: match.matchingPages,
          keywordsFound: match.keywordsFound,
          datesFound: match.datesFound,
          documentLinksFound: match.documentLinksFound,
        };
        const expertResult = await expert.assess(expertMatch, openai);
        if (expertResult) {
          aiResult = {
            status: expertResult.status,
            complianceScore: expertResult.complianceScore,
            qualityScore: expertResult.qualityScore,
            clarityScore: expertResult.clarityScore,
            evidenceQuotes: expertResult.evidenceQuotes,
            gaps: expertResult.gaps,
            recommendations: expertResult.recommendations,
            redFlags: expertResult.redFlags,
            confidence: expertResult.confidence,
          };
        }
      } catch (err) {
        console.error(
          `[Website Compliance] Expert failed for ${req.key}:`,
          err,
        );
      }
    }

    // Fall back to generic AI if no expert or expert returned null
    if (!aiResult && useAI && openai) {
      aiResult = await aiAssessRequirement(match, openai);
      // Brief delay between AI calls
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    if (aiResult) {
      assessments.push({
        requirementKey: req.key,
        requirementName: req.name,
        category: req.category,
        status: aiResult.status,
        complianceScore: aiResult.complianceScore,
        qualityScore: aiResult.qualityScore,
        clarityScore: aiResult.clarityScore,
        currencyStatus:
          aiResult.status === "outdated" ? "outdated" : currencyStatus,
        datesFound: match.datesFound,
        pagesFound: match.matchingPages.map((p) => ({
          url: p.url,
          title: p.title,
        })),
        evidenceQuotes: aiResult.evidenceQuotes,
        gaps: aiResult.gaps,
        recommendations: aiResult.recommendations,
        redFlags: aiResult.redFlags,
        confidence: aiResult.confidence,
        aiAssessed: true,
      });
    } else {
      // Structural-only assessment
      const keywordScore = Math.min(
        match.keywordsFound.length / req.searchKeywords.length,
        1,
      );
      const hasDocuments = match.documentLinksFound.length > 0;
      const structuralScore = Math.round(
        keywordScore * 60 +
          (hasDocuments ? 20 : 0) +
          (currencyStatus === "current" ? 20 : 0),
      );

      assessments.push({
        requirementKey: req.key,
        requirementName: req.name,
        category: req.category,
        status: structuralScore >= 60 ? "compliant" : "partial",
        complianceScore: structuralScore,
        qualityScore: 3, // Default when not AI-assessed
        clarityScore: 3,
        currencyStatus,
        datesFound: match.datesFound,
        pagesFound: match.matchingPages.map((p) => ({
          url: p.url,
          title: p.title,
        })),
        evidenceQuotes: [],
        gaps: [],
        recommendations: [],
        redFlags: [],
        confidence: 0.5,
        aiAssessed: false,
      });
    }
  }

  // Calculate summary statistics
  const compliantCount = assessments.filter(
    (a) => a.status === "compliant",
  ).length;
  const partialCount = assessments.filter((a) => a.status === "partial").length;
  const notFoundCount = assessments.filter(
    (a) => a.status === "not_found",
  ).length;
  const outdatedCount = assessments.filter(
    (a) => a.status === "outdated",
  ).length;

  const totalReqs = assessments.length;
  const overallCompliance =
    totalReqs > 0
      ? Math.round(
          assessments.reduce((sum, a) => sum + a.complianceScore, 0) /
            totalReqs,
        )
      : 0;

  const assessedWithQuality = assessments.filter((a) => a.qualityScore > 0);
  const overallQuality =
    assessedWithQuality.length > 0
      ? Math.round(
          (assessedWithQuality.reduce((sum, a) => sum + a.qualityScore, 0) /
            assessedWithQuality.length) *
            10,
        ) / 10
      : 0;

  const assessedWithClarity = assessments.filter((a) => a.clarityScore > 0);
  const overallClarity =
    assessedWithClarity.length > 0
      ? Math.round(
          (assessedWithClarity.reduce((sum, a) => sum + a.clarityScore, 0) /
            assessedWithClarity.length) *
            10,
        ) / 10
      : 0;

  // Category summaries
  const categorySummary: CategorySummary[] = [];
  const categories = [
    ...new Set(assessments.map((a) => a.category)),
  ] as RequirementCategory[];

  for (const cat of categories) {
    const catAssessments = assessments.filter((a) => a.category === cat);
    const catCompliant = catAssessments.filter(
      (a) => a.status === "compliant",
    ).length;
    const catPartial = catAssessments.filter(
      (a) => a.status === "partial",
    ).length;
    const catNotFound = catAssessments.filter(
      (a) => a.status === "not_found",
    ).length;
    const catOutdated = catAssessments.filter(
      (a) => a.status === "outdated",
    ).length;
    const catWithQuality = catAssessments.filter((a) => a.qualityScore > 0);
    const catWithClarity = catAssessments.filter((a) => a.clarityScore > 0);

    categorySummary.push({
      category: cat,
      categoryLabel: REQUIREMENT_CATEGORY_LABELS[cat],
      totalRequirements: catAssessments.length,
      compliantCount: catCompliant,
      partialCount: catPartial,
      notFoundCount: catNotFound,
      outdatedCount: catOutdated,
      averageQuality:
        catWithQuality.length > 0
          ? Math.round(
              (catWithQuality.reduce((sum, a) => sum + a.qualityScore, 0) /
                catWithQuality.length) *
                10,
            ) / 10
          : 0,
      averageClarity:
        catWithClarity.length > 0
          ? Math.round(
              (catWithClarity.reduce((sum, a) => sum + a.clarityScore, 0) /
                catWithClarity.length) *
                10,
            ) / 10
          : 0,
      compliancePercent:
        catAssessments.length > 0
          ? Math.round((catCompliant / catAssessments.length) * 100)
          : 0,
    });
  }

  // Priority actions (top missing/partial statutory items)
  const priorityActions = assessments
    .filter(
      (a) =>
        (a.status === "not_found" || a.status === "outdated") &&
        requirements.find((r) => r.key === a.requirementKey)?.severity ===
          "statutory",
    )
    .sort((a, b) => a.complianceScore - b.complianceScore)
    .slice(0, 10)
    .map((a) => {
      const req = requirements.find((r) => r.key === a.requirementKey);
      return `${a.requirementName}: ${a.gaps[0] || "Not found on website"} (${req?.legislation[0] || "Statutory"})`;
    });

  // Ofsted readiness impact
  const ofstedRelevant = assessments.filter((a) => {
    const req = requirements.find((r) => r.key === a.requirementKey);
    return req?.ofstedCategory;
  });
  const websiteEvidenceCount = ofstedRelevant.filter(
    (a) => a.status === "compliant" || a.status === "partial",
  ).length;
  const categoriesWithEvidence = [
    ...new Set(
      ofstedRelevant
        .filter((a) => a.status === "compliant" || a.status === "partial")
        .map((a) => {
          const req = requirements.find((r) => r.key === a.requirementKey);
          return req?.ofstedCategory || "";
        })
        .filter(Boolean),
    ),
  ];
  const criticalGaps = ofstedRelevant
    .filter((a) => a.status === "not_found")
    .map((a) => a.requirementName);

  // Detect school name from pages
  const homePage = pages.find(
    (p) => new URL(p.url).pathname === "/" || new URL(p.url).pathname === "",
  );
  const schoolName = homePage?.title?.replace(/\s*[-|].*$/, "").trim();

  return {
    websiteUrl,
    schoolName,
    schoolType,
    scannedAt: new Date().toISOString(),
    overallComplianceScore: overallCompliance,
    overallQualityScore: overallQuality,
    overallClarityScore: overallClarity,
    totalRequirements: totalReqs,
    statutoryRequirements: requirements.filter(
      (r) => r.severity === "statutory",
    ).length,
    compliantCount,
    partialCount,
    notFoundCount,
    outdatedCount,
    categorySummary,
    assessments,
    pagesScanned: pages.length,
    pdfsProcessed: pages.filter((p) => p.contentType === "pdf").length,
    scanDuration: Date.now() - startTime,
    priorityActions,
    ofstedReadinessImpact: {
      websiteEvidenceCount,
      categoriesWithWebsiteEvidence: categoriesWithEvidence,
      criticalGaps,
    },
  };
}
