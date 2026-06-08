/**
 * Phase 2 Assessor — Requirement-by-Requirement Website Compliance Assessment
 *
 * Loads scraped data from the database (Phase 1 output), runs each
 * requirement through the expert system, checks legislation currency,
 * and stores results in website_requirement_assessments.
 *
 * This is deliberately separate from Phase 1 so we can:
 * - Re-assess without re-crawling
 * - Run different frameworks (Ofsted / SIAMS) against the same scraped data
 * - Add/update individual rubrics and re-run just those checks
 */

import OpenAI from "openai";
import { MODEL_CONFIG } from "../ai-evidence-matcher";
import { maskPII } from "../pii-masker";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { resolveAndSyncOfstedDocumentChecks } from "@/lib/ofsted-readiness/document-check-sync";
import { buildWebsiteFindingDraft } from "@/lib/ofsted-readiness/findings";
import {
  type ComplianceRequirement,
  WEBSITE_COMPLIANCE_REQUIREMENTS,
  getRequirementsForSchoolType,
} from "./requirements";
import { getExpert } from "./experts";
import type {
  StructuralMatch as ExpertStructuralMatch,
  ExpertResult,
} from "./experts/base-expert";
import type { ComplianceStatus } from "./assessor";
import {
  checkAllLegislationCurrency,
  getLegislationForCategory,
} from "./rubrics/legislation-registry";
import {
  getScrapedPages,
  getScrapedDocuments,
  getSessionInfo,
} from "./phase1-scraper";

// ─── Types ────────────────────────────────────────────────────────────

export interface AssessOptions {
  sessionId: string;

  /** Override school type (otherwise uses session's auto-detected value) */
  schoolType?: "maintained" | "academy";

  /** Override school phase */
  schoolPhase?: "primary" | "secondary" | "all_through" | "all";

  /** Override church school flag */
  isChurchSchool?: boolean;

  /** Whether to use AI assessment (default: true) */
  useAI?: boolean;

  /** Only assess these requirement keys (default: all applicable) */
  requirementKeys?: string[];

  /** Progress callback */
  onProgress?: (message: string, current: number, total: number) => void;
}

export interface AssessResult {
  sessionId: string;
  totalRequirements: number;
  compliantCount: number;
  partialCount: number;
  notFoundCount: number;
  outdatedCount: number;
  overallComplianceScore: number;
  overallQualityScore: number;
  priorityActions: string[];
  ofstedDocumentChecksSynced: number;
  durationMs: number;
}

// ─── Internal types ───────────────────────────────────────────────────

/** A page or document from the scraped DB, normalised for the assessor */
export interface ScrapedContent {
  id: string;
  url: string;
  title: string;
  content: string;
  contentType: "html" | "pdf" | "document";
  source: "school" | "trust";
  wordCount: number;
  headings: Array<{ level: number; text: string }>;
  links: string[];
  fileType?: string;
  linkText?: string;
  foundOnPageUrl?: string;
  datesFound?: string[];
}

// ─── Date Detection ───────────────────────────────────────────────────

const UK_DATE_PATTERNS = [
  /(\d{1,2})\s*(?:st|nd|rd|th)?\s*(January|February|March|April|May|June|July|August|September|October|November|December)\s*(\d{4})/gi,
  /(January|February|March|April|May|June|July|August|September|October|November|December)\s*(\d{4})/gi,
  /(\d{1,2})[\/.](\d{1,2})[\/.](\d{2,4})/g,
  /(?:reviewed|updated|approved|dated|published|version|adopted|ratified|last\s*(?:reviewed|updated))\s*:?\s*(\d{1,2}[\/.\s]\d{1,2}[\/.\s]\d{2,4}|\w+\s+\d{4})/gi,
  /(?:review\s*date|next\s*review|due\s*for\s*review)\s*:?\s*(\d{1,2}[\/.\s]\d{1,2}[\/.\s]\d{2,4}|\w+\s+\d{4})/gi,
  /\b(20\d{2})\s*[-–—/]\s*(20\d{2}|\d{2})\b/g,
  /\b([2-3]\d)\s*[-–—/]\s*([2-3]\d)\b/g,
];

export function extractDates(text: string): string[] {
  const dates = new Set<string>();
  for (const pattern of UK_DATE_PATTERNS) {
    const matches = text.matchAll(new RegExp(pattern.source, pattern.flags));
    for (const match of matches) {
      dates.add(match[0].trim());
    }
  }
  return Array.from(dates);
}

function isPresent<T>(value: T | null | undefined | false): value is T {
  return Boolean(value);
}

function extractYearSignals(dates: string[]): {
  academicYearStarts: number[];
  years: number[];
} {
  const academicYearStarts = new Set<number>();
  const years = new Set<number>();

  for (const date of dates) {
    const rangeMatches = date.matchAll(
      /\b(20\d{2})\s*[-–—/]\s*(20\d{2}|\d{2})\b/g,
    );
    for (const match of rangeMatches) {
      academicYearStarts.add(Number(match[1]));
    }

    const shorthandRangeMatches = date.matchAll(
      /\b([2-3]\d)\s*[-–—/]\s*([2-3]\d)\b/g,
    );
    for (const match of shorthandRangeMatches) {
      const start = Number(match[1]);
      const end = Number(match[2]);
      if (end === start + 1) {
        academicYearStarts.add(2000 + start);
        years.add(2000 + start);
        years.add(2000 + end);
      }
    }

    const yearMatches = date.matchAll(/\b(20\d{2})\b/g);
    for (const match of yearMatches) {
      years.add(Number(match[1]));
    }
  }

  return {
    academicYearStarts: [...academicYearStarts],
    years: [...years],
  };
}

export function assessCurrency(
  dates: string[],
  requirement: ComplianceRequirement,
): "current" | "due_soon" | "possibly_outdated" | "outdated" | "unknown" {
  if (dates.length === 0) return "unknown";

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentAcademicYear =
    now.getMonth() >= 8 ? currentYear : currentYear - 1;
  const { academicYearStarts, years } = extractYearSignals(dates);
  const latestAcademicYearStart =
    academicYearStarts.length > 0 ? Math.max(...academicYearStarts) : null;
  const latestYear = years.length > 0 ? Math.max(...years) : null;

  if (
    latestAcademicYearStart !== null &&
    latestAcademicYearStart >= currentAcademicYear
  ) {
    return "current";
  }

  if (latestAcademicYearStart !== null) {
    if (latestAcademicYearStart === currentAcademicYear - 1) {
      const deadlineStatus = assessPreviousAcademicYearDeadlineStatus(
        requirement,
        now,
      );
      if (deadlineStatus) return deadlineStatus;

      return requirement.updateFrequency === "annually" ||
        requirement.updateFrequency === "by_date"
        ? "possibly_outdated"
        : "current";
    }
    return "outdated";
  }

  const hasCurrentYear = dates.some(
    (d) =>
      d.includes(String(currentYear)) ||
      d.includes(String(currentAcademicYear)) ||
      d.includes(`${currentAcademicYear}-${(currentAcademicYear + 1) % 100}`),
  );
  if (hasCurrentYear) return "current";

  if (latestYear !== null && latestYear < currentAcademicYear - 1) {
    return "outdated";
  }

  const hasPreviousYear = dates.some(
    (d) =>
      d.includes(String(currentYear - 1)) ||
      d.includes(String(currentAcademicYear - 1)),
  );
  if (hasPreviousYear) {
    const deadlineStatus = assessPreviousAcademicYearDeadlineStatus(
      requirement,
      now,
    );
    if (deadlineStatus) return deadlineStatus;

    if (
      requirement.updateFrequency === "annually" ||
      requirement.updateFrequency === "by_date"
    ) {
      return "possibly_outdated";
    }
    return "current";
  }

  return "outdated";
}

function assessPreviousAcademicYearDeadlineStatus(
  requirement: ComplianceRequirement,
  now: Date,
): "current" | "due_soon" | "outdated" | null {
  if (requirement.key !== "pe_sport_premium") return null;
  if (!requirement.deadline) return null;

  const deadline = deadlineForCurrentReportingCycle(requirement.deadline, now);
  if (!deadline) return null;

  if (now.getTime() > deadline.getTime()) return "outdated";

  const daysUntilDeadline = Math.ceil(
    (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  return daysUntilDeadline <= 90 ? "due_soon" : "current";
}

function deadlineForCurrentReportingCycle(
  deadline: string,
  now: Date,
): Date | null {
  const match = deadline.match(/^(\d{1,2})\s+([A-Za-z]+)$/);
  if (!match) return null;

  const monthByName: Record<string, number> = {
    january: 0,
    february: 1,
    march: 2,
    april: 3,
    may: 4,
    june: 5,
    july: 6,
    august: 7,
    september: 8,
    october: 9,
    november: 10,
    december: 11,
  };

  const day = Number(match[1]);
  const month = monthByName[match[2].toLowerCase()];
  if (!Number.isFinite(day) || month === undefined) return null;

  const currentAcademicYear =
    now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  const deadlineYear = month >= 8 ? currentAcademicYear : currentAcademicYear + 1;
  return new Date(deadlineYear, month, day, 23, 59, 59, 999);
}

// ─── Main Assessment Engine ───────────────────────────────────────────

export async function assessScrapedWebsite(
  options: AssessOptions,
): Promise<AssessResult> {
  const startTime = Date.now();
  const supabase = createServiceRoleClient();
  const { sessionId, useAI = true, onProgress } = options;

  const progress = (msg: string, current: number, total: number) => {
    onProgress?.(msg, current, total);
    console.log(`[Assessor] [${current}/${total}] ${msg}`);
  };

  // ─── Load session metadata ────────────────────────────────────────

  const session = await getSessionInfo(sessionId);
  if (!session) throw new Error(`Session not found: ${sessionId}`);
  if (session.status !== "scraped" && session.status !== "assessed") {
    throw new Error(
      `Session status is '${session.status}', expected 'scraped' or 'assessed'`,
    );
  }

  const schoolType =
    options.schoolType || (session.school_type as "maintained" | "academy");
  const schoolPhase =
    options.schoolPhase ||
    (session.school_phase as AssessOptions["schoolPhase"]) ||
    "all";
  const isChurchSchool = options.isChurchSchool ?? session.is_church_school;
  const preservedEvidenceRouting = session.progress?.evidenceRouting;

  // ─── Mark session as assessing ────────────────────────────────────

  await supabase
    .from("website_scan_sessions")
    .update({
      status: "assessing",
      assess_started_at: new Date().toISOString(),
      progress: {
        step: 1,
        total: 3,
        message: "Loading scraped content",
        ...(preservedEvidenceRouting
          ? { evidenceRouting: preservedEvidenceRouting }
          : {}),
      },
    })
    .eq("id", sessionId);

  // ─── Load scraped data ────────────────────────────────────────────

  progress("Loading scraped content from database", 1, 3);

  const [dbPages, dbDocs] = await Promise.all([
    getScrapedPages(sessionId),
    getScrapedDocuments(sessionId),
  ]);

  // Normalise into a unified content array for the matching engine
  const allContent: ScrapedContent[] = [];

  for (const page of dbPages) {
    allContent.push({
      id: page.id,
      url: page.url,
      title: page.title || "",
      content: page.extracted_text || "",
      contentType: "html",
      source: (page.source as "school" | "trust") || "school",
      wordCount: page.word_count || 0,
      headings: (page.headings as Array<{ level: number; text: string }>) || [],
      links: Array.isArray(page.links_found) ? page.links_found : [],
    });
  }

  for (const doc of dbDocs) {
    allContent.push({
      id: doc.id,
      url: doc.url,
      title: doc.title || doc.filename || "",
      content: doc.extracted_text || "",
      contentType: doc.file_type === "pdf" ? "pdf" : "document",
      source: (doc.source as "school" | "trust") || "school",
      wordCount: doc.word_count || 0,
      headings: [],
      links: [],
      fileType: doc.file_type,
      linkText: doc.link_text || undefined,
      foundOnPageUrl: doc.found_on_page_url || undefined,
      datesFound: doc.dates_found || [],
    });
  }

  console.log(
    `[Assessor] Loaded ${dbPages.length} pages + ${dbDocs.length} documents = ${allContent.length} total`,
  );

  // ─── Get applicable requirements ──────────────────────────────────

  let requirements = getRequirementsForSchoolType(
    schoolType,
    isChurchSchool,
    schoolPhase,
  );

  // Filter to specific keys if requested
  if (options.requirementKeys && options.requirementKeys.length > 0) {
    const keySet = new Set(options.requirementKeys);
    requirements = requirements.filter((r) => keySet.has(r.key));
  }

  progress(`Assessing ${requirements.length} requirements`, 2, 3);

  await supabase
    .from("website_scan_sessions")
    .update({
      progress: {
        step: 2,
        total: 3,
        message: `Assessing ${requirements.length} requirements against ${allContent.length} sources`,
        ...(preservedEvidenceRouting
          ? { evidenceRouting: preservedEvidenceRouting }
          : {}),
      },
    })
    .eq("id", sessionId);

  // ─── Structural matching ──────────────────────────────────────────

  const structuralMatches = runStructuralMatching(allContent, requirements);

  // ─── Expert + AI assessment ───────────────────────────────────────

  let openai: OpenAI | null = null;
  if (useAI) {
    const apiKey =
      process.env.OPENROUTER_API_KEY ||
      process.env.VITE_OPENROUTER_API_KEY ||
      process.env.OPENAI_API_KEY;
    openai = new OpenAI({
      apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://schoolgle.co.uk",
        "X-Title": "Schoolgle - Website Compliance V2",
      },
    });
  }

  const assessments: StorableAssessment[] = [];

  for (let i = 0; i < structuralMatches.length; i++) {
    const match = structuralMatches[i];
    const req = match.requirement;

    progress(req.name, i + 1, structuralMatches.length);

    // Currency from dates
    const dateCurrency = assessCurrency(match.datesFound, req);

    // Legislation currency check
    const legislationChecks = checkAllLegislationCurrency(
      match.combinedContent,
      req.category,
    );
    const legislationRefsFound = legislationChecks
      .filter((l) => l.status !== "unknown")
      .map((l) => `${l.title} ${l.currentVersion}`);
    const legislationCurrent = legislationChecks.every(
      (l) => l.status === "current" || l.status === "unknown",
    );

    // If no content matched, mark not_found
    if (match.matchingContent.length === 0) {
      assessments.push({
        requirement_key: req.key,
        requirement_name: req.name,
        category: req.category,
        status: "not_found",
        compliance_score: 0,
        quality_score: 0,
        clarity_score: 0,
        evidence_page_ids: [],
        evidence_doc_ids: [],
        evidence_urls: [],
        evidence_quotes: [],
        currency_status: "unknown",
        legislation_refs_found: [],
        legislation_current: null,
        review_date_found: null,
        gaps: [`${req.name} was not found on the school website`],
        recommendations: [
          `Publish ${req.name} on the school website (${req.legislation[0] || "Statutory requirement"})`,
        ],
        red_flags:
          req.severity === "statutory"
            ? [`Missing statutory requirement: ${req.name}`]
            : [],
        ai_model_used: null,
        ai_tokens_used: 0,
        confidence: 0.9,
      });
      continue;
    }

    // Try expert first
    let result: ExpertResult | null = null;
    const expert = getExpert(req.key);

    if (expert) {
      try {
        const expertMatch = buildExpertMatch(match);
        result = await expert.assess(expertMatch, openai);
      } catch (err) {
        console.error(`[Assessor] Expert failed for ${req.key}:`, err);
      }
    }

    // Fall back to AI
    let aiModel: string | null = null;
    let aiTokens = 0;

    if (!result && useAI && openai) {
      const aiResult = await aiAssessRequirement(match, openai);
      if (aiResult) {
        result = aiResult.result;
        aiModel = aiResult.model;
        aiTokens = aiResult.tokensUsed;
      }
      await new Promise((r) => setTimeout(r, 200));
    }

    // Fall back to structural-only scoring
    if (!result) {
      result = structuralOnlyScore(match);
    }

    // Determine final currency — combine date-based + legislation-based
    let finalCurrency = dateCurrency;
    if (result.status === "outdated") finalCurrency = "outdated";
    else if (!legislationCurrent && dateCurrency !== "current")
      finalCurrency = "possibly_outdated";

    const isDateControlledRequirement =
      req.updateFrequency === "annually" || req.updateFrequency === "by_date";
    const currencyMakesAssessmentOutdated =
      result.status === "outdated" ||
      (isDateControlledRequirement &&
        (finalCurrency === "outdated" ||
          finalCurrency === "possibly_outdated"));
    const finalStatus: ComplianceStatus =
      result.status !== "not_found" && currencyMakesAssessmentOutdated
        ? "outdated"
        : result.status;
    const dueSoonRecommendation =
      finalCurrency === "due_soon" && req.deadline
        ? `${req.name} is currently acceptable, but the next update deadline is ${req.deadline}; prepare the new report before that date`
        : null;
    const storedCurrency =
      finalCurrency === "due_soon" ? "current" : finalCurrency;
    const currencyGap =
      finalStatus === "outdated"
        ? `${req.name} appears out of date based on detected date evidence${
            match.datesFound.length > 0
              ? ` (${match.datesFound.slice(0, 5).join(", ")})`
              : ""
          }`
        : null;
    const currencyRecommendation =
      finalStatus === "outdated"
        ? `Review and republish ${req.name} for the current academic year or current statutory version`
        : null;
    const currencyRedFlag =
      finalStatus === "outdated" && req.severity === "statutory"
        ? `Outdated statutory requirement: ${req.name}`
        : null;

    // Separate page IDs and doc IDs from matched content
    const pageIds: string[] = [];
    const docIds: string[] = [];
    for (const mc of match.matchingContent) {
      if (mc.contentType === "html") pageIds.push(mc.id);
      else docIds.push(mc.id);
    }
    const matchingPageUrls = match.matchingContent.map((c) => c.url);
    const preferredPageUrls = match.matchingContent
      .filter((c) => isPreferredEvidencePage(c, req))
      .map((c) => c.url);
    const evidencePageUrls =
      preferredPageUrls.length > 0
        ? preferredPageUrls
        : matchingPageUrls.slice(0, 3);
    const evidenceUrls = sortEvidenceUrlsForRequirement(
      Array.from(
        new Set([
          ...match.documentLinksFound.slice(0, 5),
          ...evidencePageUrls,
        ]),
      ),
      req,
    ).slice(0, 10);

    assessments.push({
      requirement_key: req.key,
      requirement_name: req.name,
      category: req.category,
      status: finalStatus,
      compliance_score:
        finalStatus === "outdated"
          ? Math.min(result.complianceScore, 55)
          : result.complianceScore,
      quality_score: result.qualityScore,
      clarity_score: result.clarityScore,
      evidence_page_ids: pageIds,
      evidence_doc_ids: docIds,
      evidence_urls: evidenceUrls,
      evidence_quotes: result.evidenceQuotes.slice(0, 10),
      currency_status: storedCurrency,
      legislation_refs_found: legislationRefsFound,
      legislation_current: legislationCurrent,
      review_date_found: null, // TODO: extract actual review date
      gaps: [currencyGap, ...result.gaps].filter(isPresent).slice(0, 20),
      recommendations: [
        dueSoonRecommendation,
        currencyRecommendation,
        ...result.recommendations,
      ]
        .filter(isPresent)
        .slice(0, 20),
      red_flags: [currencyRedFlag, ...result.redFlags]
        .filter(isPresent)
        .slice(0, 10),
      ai_model_used: aiModel,
      ai_tokens_used: aiTokens,
      confidence: result.confidence,
    });
  }

  // ─── Store results ────────────────────────────────────────────────

  progress("Storing assessment results", 3, 3);

  // Clear previous assessments for this session
  await supabase
    .from("website_requirement_assessments")
    .delete()
    .eq("session_id", sessionId);

  // Insert all assessments
  for (const assessment of assessments) {
    const { error } = await supabase
      .from("website_requirement_assessments")
      .insert({
        session_id: sessionId,
        organization_id: session.organization_id,
        ...assessment,
        assessed_at: new Date().toISOString(),
      });

    if (error) {
      console.error(
        `[Assessor] Failed to store assessment for ${assessment.requirement_key}:`,
        error.message,
      );
    }
  }

  // ─── Store Ofsted evidence from compliant/partial assessments ─────

  await storeOfstedEvidence(supabase, session.organization_id, assessments);
  await storeOfstedFindings(
    supabase,
    session.organization_id,
    sessionId,
    assessments,
  );

  const ofstedDocumentChecksSynced =
    await syncLatestWebsiteEvidenceIntoOfstedChecks({
      organizationId: session.organization_id,
      sessionId,
    });

  // ─── Store Ed knowledge Q&A pairs ──────────────────────────────────

  const domain = new URL(session.website_url).hostname;
  await storeEdKnowledgeQAPairs(
    supabase,
    session.organization_id,
    domain,
    assessments,
  );

  // ─── Update session status ────────────────────────────────────────

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

  const overallCompliance =
    assessments.length > 0
      ? Math.round(
          assessments.reduce((sum, a) => sum + a.compliance_score, 0) /
            assessments.length,
        )
      : 0;

  const withQuality = assessments.filter((a) => a.quality_score > 0);
  const overallQuality =
    withQuality.length > 0
      ? Math.round(
          (withQuality.reduce((sum, a) => sum + a.quality_score, 0) /
            withQuality.length) *
            10,
        ) / 10
      : 0;

  const priorityActions = assessments
    .filter((a) => a.status === "not_found" || a.status === "outdated")
    .sort((a, b) => a.compliance_score - b.compliance_score)
    .slice(0, 10)
    .map((a) => `${a.requirement_name}: ${a.gaps[0] || "Not found"}`);

  const durationMs = Date.now() - startTime;

  await supabase
    .from("website_scan_sessions")
    .update({
      status: "assessed",
      assess_completed_at: new Date().toISOString(),
      progress: {
        step: 3,
        total: 3,
        message: `Assessment complete: ${compliantCount}/${assessments.length} compliant (${overallCompliance}%)`,
        ...(preservedEvidenceRouting
          ? { evidenceRouting: preservedEvidenceRouting }
          : {}),
      },
    })
    .eq("id", sessionId);

  return {
    sessionId,
    totalRequirements: assessments.length,
    compliantCount,
    partialCount,
    notFoundCount,
    outdatedCount,
    overallComplianceScore: overallCompliance,
    overallQualityScore: overallQuality,
    priorityActions,
    ofstedDocumentChecksSynced,
    durationMs,
  };
}

async function syncLatestWebsiteEvidenceIntoOfstedChecks({
  organizationId,
  sessionId,
}: {
  organizationId: string;
  sessionId: string;
}): Promise<number> {
  try {
    const { savedDocumentChecksCount } = await resolveAndSyncOfstedDocumentChecks({
      organizationId,
      sessionId,
    });
    return savedDocumentChecksCount;
  } catch (error) {
    console.error(
      "[Assessor] Failed to sync website evidence into Ofsted document checks:",
      error,
    );
    return 0;
  }
}

// ─── Structural Matching (adapted for DB content) ─────────────────────

const FINANCIAL_BENCHMARKING_HOSTS = [
  "financial-benchmarking-and-insights-tool.education.gov.uk",
  "financial-benchmarking-and-insights-tool.service.gov.uk",
  "schools-financial-benchmarking.service.gov.uk",
];

function normaliseMatcherText(value: string): string {
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    decoded = value;
  }

  return decoded
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/[-_%20]+/g, " ")
    .replace(/[^\w\s.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function addUniqueLink(target: string[], link: string): void {
  if (!target.includes(link)) target.push(link);
}

function linkMatchesRequirement(
  link: string,
  req: ComplianceRequirement,
): boolean {
  const linkLower = link.toLowerCase();
  const normalisedLink = normaliseMatcherText(link);

  if (req.key === "financial_benchmarking_link") {
    return FINANCIAL_BENCHMARKING_HOSTS.some((host) =>
      linkLower.includes(host),
    );
  }

  const keywordMatch = req.searchKeywords.some((kw) => {
    const keyword = kw.toLowerCase();
    const slugKeyword = keyword.replace(/\s+/g, "-");
    return (
      normalisedLink.includes(normaliseMatcherText(keyword)) ||
      linkLower.includes(slugKeyword)
    );
  });

  const urlPatternMatch = req.urlPatterns.some((pattern) => {
    if (pattern === "/") return false;
    const patternLower = pattern.toLowerCase();
    return (
      linkLower.includes(patternLower) ||
      normalisedLink.includes(normaliseMatcherText(patternLower))
    );
  });

  const documentPatternMatch = req.documentPatterns.some((pattern) => {
    const normalisedPattern = normaliseMatcherText(pattern);
    const slugPattern = pattern.toLowerCase().replace(/\s+/g, "-");
    return (
      normalisedLink.includes(normalisedPattern) ||
      linkLower.includes(slugPattern)
    );
  });

  return keywordMatch || urlPatternMatch || documentPatternMatch;
}

function isHomepageUrl(value: string): boolean {
  try {
    return new URL(value).pathname === "/";
  } catch {
    return false;
  }
}

function isPreferredEvidencePage(
  content: ScrapedContent,
  req: ComplianceRequirement,
): boolean {
  if (content.contentType !== "html") return true;
  if (isHomepageUrl(content.url)) return true;

  const urlLower = content.url.toLowerCase();
  return req.urlPatterns.some((pattern) => {
    if (pattern === "/") return false;
    return urlLower.includes(pattern.toLowerCase());
  });
}

function normaliseEvidenceUrlForMatch(value: string): string {
  return value.toLowerCase().replace(/[-_]+/g, " ");
}

function scoreEvidenceUrlForRequirement(
  url: string,
  req: Pick<ComplianceRequirement, "key" | "urlPatterns" | "documentPatterns">,
): number {
  const normalisedUrl = normaliseEvidenceUrlForMatch(url);
  const urlLower = url.toLowerCase();
  let score = 0;

  for (const pattern of req.urlPatterns) {
    if (pattern === "/") continue;
    const normalisedPattern = normaliseEvidenceUrlForMatch(pattern);
    if (normalisedUrl.includes(normalisedPattern)) score += 35;
  }

  for (const pattern of req.documentPatterns) {
    const normalisedPattern = normaliseEvidenceUrlForMatch(pattern);
    if (normalisedUrl.includes(normalisedPattern)) score += 30;
  }

  if (normalisedUrl.includes("wp json/oembed")) score -= 100;

  if (req.key === "phonics_reading") {
    if (normalisedUrl.includes("learning/phonics")) score += 140;
    else if (normalisedUrl.includes("phonics")) score += 100;
    if (normalisedUrl.includes("read write inc")) score += 80;
    if (normalisedUrl.includes("reading")) score += 20;
  }

  if (req.key === "curriculum_content") {
    try {
      const pathname = new URL(url).pathname.toLowerCase();
      if (
        /^\/(?:curriculum|the-[^/]*curriculum)\/?$/.test(pathname) ||
        pathname.includes("/the-grove-house-curriculum")
      ) {
        score += 170;
      }
    } catch {
      // URL ranking should never fail an assessment.
    }
    if (normalisedUrl.includes("curriculum")) score += 80;
    if (urlLower.includes("/wp-content/") || urlLower.endsWith(".pdf")) {
      score -= 30;
    }
    if (
      /\/(?:reading|phonics|writing|maths|science|history|geography|art|music|computing|physical education|religious education)(?:\/|$)/.test(
        normalisedUrl,
      )
    ) {
      score += 35;
    }
  }

  return score;
}

function sortEvidenceUrlsForRequirement(
  urls: string[],
  req: Pick<ComplianceRequirement, "key" | "urlPatterns" | "documentPatterns">,
): string[] {
  return urls
    .map((url, index) => ({
      url,
      index,
      score: scoreEvidenceUrlForRequirement(url, req),
    }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map((item) => item.url);
}

export interface ContentMatch {
  requirement: ComplianceRequirement;
  matchingContent: ScrapedContent[];
  keywordsFound: string[];
  datesFound: string[];
  documentLinksFound: string[];
  /** Pre-joined text from all matching sources (for legislation checks) */
  combinedContent: string;
}

export function runStructuralMatching(
  allContent: ScrapedContent[],
  requirements: ComplianceRequirement[],
): ContentMatch[] {
  const results: ContentMatch[] = [];

  for (const req of requirements) {
    const scored: {
      content: ScrapedContent;
      score: number;
      matchedKeywords: string[];
      hasStrongEvidence: boolean;
    }[] = [];
    const keywordsFound = new Set<string>();
    const documentLinksFound: string[] = [];

    for (const item of allContent) {
      const contentLower = item.content.toLowerCase();
      const titleLower = item.title.toLowerCase();
      const urlLower = item.url.toLowerCase();
      const isPDF = item.contentType === "pdf";
      const isDoc = item.contentType === "document";
      const matchedLinks = (item.links || []).filter((link) =>
        linkMatchesRequirement(link, req),
      );

      // URL pattern matching
      const urlMatch = req.urlPatterns.some((pattern) => {
        if (pattern === "/") {
          try {
            return new URL(item.url).pathname === "/";
          } catch {
            return false;
          }
        }
        return urlLower.includes(pattern.toLowerCase());
      });

      // PDF/doc filename matching
      const filenameMatch =
        (isPDF || isDoc) &&
        req.documentPatterns.some((p) => {
          const normalised = p.toLowerCase().replace(/\s+/g, "[-_ ]?");
          return (
            new RegExp(normalised).test(urlLower) ||
            new RegExp(normalised).test(titleLower)
          );
        });

      // Link text matching (for documents discovered via anchor text)
      const linkTextMatch =
        item.linkText &&
        req.documentPatterns.some((p) =>
          item.linkText!.toLowerCase().includes(p.toLowerCase()),
        );
      const documentTitleKeywordMatch =
        (isPDF || isDoc) &&
        req.searchKeywords.some((kw) => {
          const keyword = kw.toLowerCase();
          const slugKeyword = keyword.replace(/\s+/g, "-");
          return (
            titleLower.includes(keyword) ||
            urlLower.includes(keyword) ||
            urlLower.includes(slugKeyword) ||
            item.linkText?.toLowerCase().includes(keyword)
          );
        });

      // Keyword matching in content + title
      const matchedKeywords = req.searchKeywords.filter(
        (kw) =>
          contentLower.includes(kw.toLowerCase()) ||
          titleLower.includes(kw.toLowerCase()),
      );

      // Document pattern matching in headings and content
      const docMatches = req.documentPatterns.filter((pattern) => {
        const pl = pattern.toLowerCase();
        return (
          titleLower.includes(pl) ||
          contentLower.includes(pl) ||
          item.headings.some((h) => h.text.toLowerCase().includes(pl))
        );
      });

      // Score — URL pattern alone is not enough evidence.
      // A page must also have keyword, document pattern, filename, or link text
      // match to count. Otherwise generic pages like /governance or /policies
      // would match every requirement that lists them.
      const hasContentEvidence =
        matchedKeywords.length > 0 ||
        docMatches.length > 0 ||
        filenameMatch ||
        linkTextMatch ||
        matchedLinks.length > 0;

      let score = matchedKeywords.length * 2 + docMatches.length * 3;
      if (urlMatch && hasContentEvidence) score += 5;
      if (filenameMatch) score += 10;
      if (linkTextMatch) score += 8;
      if (matchedLinks.length > 0) score += Math.min(12, matchedLinks.length * 8);
      if (isPDF && matchedKeywords.length >= 1) score += 3;
      if (!isPDF && urlMatch && matchedKeywords.length >= 1) score += 4;
      if (item.source === "trust" && req.typicallyTrustLevel) score += 5;

      if (score >= 2) {
        const hasStrongEvidence =
          filenameMatch ||
          Boolean(linkTextMatch) ||
          Boolean(documentTitleKeywordMatch) ||
          matchedLinks.length > 0 ||
          (!(isPDF || isDoc) && docMatches.length > 0) ||
          (urlMatch && matchedKeywords.length > 0);
        scored.push({ content: item, score, matchedKeywords, hasStrongEvidence });
        matchedKeywords.forEach((kw) => keywordsFound.add(kw));
        matchedLinks.forEach((link) => addUniqueLink(documentLinksFound, link));
      }
    }

    // Sort by score, deduplicate by URL
    scored.sort((a, b) => b.score - a.score);
    const seenUrls = new Set<string>();
    const unique = scored.filter((s) => {
      if (seenUrls.has(s.content.url)) return false;
      seenUrls.add(s.content.url);
      return true;
    });

    const strongEvidence = unique.filter((s) => s.hasStrongEvidence);
    const evidenceCandidates =
      strongEvidence.length > 0 ? strongEvidence : unique;
    const matchingContent = evidenceCandidates.slice(0, 8).map((s) => s.content);
    const datesFound = new Set<string>();
    for (const content of matchingContent) {
      const dates = content.datesFound || extractDates(content.content);
      dates.forEach((date) => datesFound.add(date));
    }

    // Combined content for legislation checks
    const combinedContent = matchingContent
      .map((c) =>
        [
          c.content.substring(0, 15000),
          ...(c.links.length > 0 ? ["LINKS:", ...c.links] : []),
        ].join("\n"),
      )
      .join("\n");

    results.push({
      requirement: req,
      matchingContent,
      keywordsFound: Array.from(keywordsFound),
      datesFound: Array.from(datesFound),
      documentLinksFound,
      combinedContent,
    });
  }

  return results;
}

// ─── Build ExpertStructuralMatch from ContentMatch ────────────────────

function buildExpertMatch(match: ContentMatch): ExpertStructuralMatch {
  const req = match.requirement;
  return {
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
    matchingPages: match.matchingContent.map((c) => ({
      url: c.url,
      title: c.title,
      contentType: c.contentType,
      content:
        c.contentType === "pdf"
          ? c.content.substring(0, 12000)
          : c.content.substring(0, 5000),
      links: c.links,
    })),
    keywordsFound: match.keywordsFound,
    datesFound: match.datesFound,
    documentLinksFound: match.documentLinksFound,
  };
}

// ─── AI Assessment ────────────────────────────────────────────────────

async function aiAssessRequirement(
  match: ContentMatch,
  openai: OpenAI,
): Promise<{ result: ExpertResult; model: string; tokensUsed: number } | null> {
  const req = match.requirement;

  const combinedContent = match.matchingContent
    .map(
      (c) =>
        `--- ${c.contentType.toUpperCase()}: ${c.title} (${c.url}) ---\n${c.content.substring(0, 12000)}${
          c.links.length > 0 ? `\n\nLINKS:\n${c.links.join("\n")}` : ""
        }`,
    )
    .join("\n\n");

  const { maskedText } = maskPII(combinedContent.substring(0, 25000));

  // Include legislation currency info in the prompt
  const legislationInfo = getLegislationForCategory(req.category);
  const legislationContext =
    legislationInfo.length > 0
      ? `\nCURRENT LEGISLATION:\n${legislationInfo.map((l) => `- ${l.title}: current version is ${l.currentVersion}. Superseded versions: ${l.supersededVersions.join(", ") || "none"}`).join("\n")}`
      : "";

  const prompt = `You are assessing a UK school website for DfE statutory compliance.

REQUIREMENT: "${req.name}"
DESCRIPTION: "${req.description}"
STATUTORY BASIS: ${req.legislation.join("; ")}
${legislationContext}

COMPLIANCE CRITERIA (what MUST be present):
${req.complianceCriteria.map((c, i) => `${i + 1}. ${c}`).join("\n")}

QUALITY CRITERIA (what SHOULD be present for high quality):
${req.qualityCriteria.map((c, i) => `${i + 1}. ${c}`).join("\n")}

RED FLAGS:
${req.redFlags.map((r) => `- ${r}`).join("\n")}
${req.subItems ? `\nSUB-ITEMS that should be covered:\n${req.subItems.map((s, i) => `${i + 1}. ${s}`).join("\n")}` : ""}

DATES FOUND: ${match.datesFound.length > 0 ? match.datesFound.join(", ") : "None detected"}

WEBSITE CONTENT (from ${match.matchingContent.length} source(s)):
${maskedText}

IMPORTANT: Assess the ACTUAL CONTENT. If a PDF contains the full policy text, assess the policy itself for completeness — not just whether a link exists. Check legislation references are current (see CURRENT LEGISLATION above).

Respond with JSON only:
{
  "status": "compliant" | "partial" | "not_found" | "outdated",
  "compliance_score": 0-100,
  "quality_score": 1-5,
  "clarity_score": 1-5,
  "evidence_quotes": ["exact quotes from content"],
  "gaps": ["specific things missing"],
  "recommendations": ["actionable improvements"],
  "red_flags": ["any red flags"],
  "confidence": 0.0-1.0
}

Rules:
- "compliant" = all mandatory criteria met
- "partial" = some criteria met, gaps remain
- "not_found" = requirement not adequately addressed
- "outdated" = content exists but references superseded legislation or dates are stale
- Check legislation versions — referencing KCSIE 2023 when current is 2025 = outdated
- quality: 1=poor, 3=adequate, 5=excellent
- clarity: 1=jargon, 3=adequate, 5=parent-friendly`;

  try {
    const model = MODEL_CONFIG.primary.id;
    const response = await openai.chat.completions.create({
      model,
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
    const tokensUsed = response.usage?.total_tokens || 0;

    return {
      result: {
        status: parsed.status || "not_found",
        complianceScore: Math.min(
          100,
          Math.max(0, parsed.compliance_score || 0),
        ),
        qualityScore: Math.min(5, Math.max(1, parsed.quality_score || 1)),
        clarityScore: Math.min(5, Math.max(1, parsed.clarity_score || 1)),
        evidenceQuotes: parsed.evidence_quotes || [],
        gaps: parsed.gaps || [],
        recommendations: parsed.recommendations || [],
        redFlags: parsed.red_flags || [],
        confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
      },
      model,
      tokensUsed,
    };
  } catch (error) {
    console.error(`[Assessor] AI failed for ${req.key}:`, error);
    return null;
  }
}

// ─── Structural-only fallback scoring ─────────────────────────────────

function structuralOnlyScore(match: ContentMatch): ExpertResult {
  const req = match.requirement;
  const keywordScore = Math.min(
    match.keywordsFound.length / Math.max(req.searchKeywords.length, 1),
    1,
  );
  const hasDocuments =
    match.documentLinksFound.length > 0 ||
    match.matchingContent.some((c) => c.contentType !== "html");
  const currency = assessCurrency(match.datesFound, req);

  const score = Math.round(
    keywordScore * 60 +
      (hasDocuments ? 20 : 0) +
      (currency === "current" ? 20 : 0),
  );

  return {
    status: score >= 60 ? "compliant" : "partial",
    complianceScore: score,
    qualityScore: 3,
    clarityScore: 3,
    evidenceQuotes: [],
    gaps: [],
    recommendations: [],
    redFlags: [],
    confidence: 0.5,
  };
}

// ─── DB storage type ──────────────────────────────────────────────────

interface StorableAssessment {
  requirement_key: string;
  requirement_name: string;
  category: string;
  status: ComplianceStatus;
  compliance_score: number;
  quality_score: number;
  clarity_score: number;
  evidence_page_ids: string[];
  evidence_doc_ids: string[];
  evidence_urls: string[];
  evidence_quotes: string[];
  currency_status: string;
  legislation_refs_found: string[];
  legislation_current: boolean | null;
  review_date_found: string | null;
  gaps: string[];
  recommendations: string[];
  red_flags: string[];
  ai_model_used: string | null;
  ai_tokens_used: number;
  confidence: number;
}

// ─── Helper: Store Ofsted evidence from V2 assessments ────────────────

async function storeOfstedEvidence(
  supabase: ReturnType<typeof createServiceRoleClient>,
  organizationId: string,
  assessments: StorableAssessment[],
): Promise<void> {
  try {
    for (const assessment of assessments) {
      // Only store compliant/partial items as evidence
      if (
        assessment.status !== "compliant" &&
        assessment.status !== "partial"
      ) {
        continue;
      }

      // Only store items that map to Ofsted categories
      const requirement = WEBSITE_COMPLIANCE_REQUIREMENTS.find(
        (r) => r.key === assessment.requirement_key,
      );
      if (!requirement?.ofstedCategory) continue;

      const primaryUrl = assessment.evidence_urls[0];
      const externalId = `website-${assessment.requirement_key}`;

      // Check if document already exists for this external_id
      const { data: existingDoc } = await supabase
        .from("documents")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("external_id", externalId)
        .maybeSingle();

      let documentId: number;

      if (existingDoc) {
        // Update existing document
        await supabase
          .from("documents")
          .update({
            name: `Website: ${assessment.requirement_name}`,
            content:
              assessment.evidence_quotes.join("\n\n") ||
              `Compliance score: ${assessment.compliance_score}/100. Status: ${assessment.status}.`,
            file_type: "text/html",
            provider: "website",
            web_view_link: primaryUrl,
            scanned_at: new Date().toISOString(),
          })
          .eq("id", existingDoc.id);
        documentId = existingDoc.id;
      } else {
        // Insert new document
        const { data: newDoc, error: docError } = await supabase
          .from("documents")
          .insert({
            organization_id: organizationId,
            name: `Website: ${assessment.requirement_name}`,
            content:
              assessment.evidence_quotes.join("\n\n") ||
              `Compliance score: ${assessment.compliance_score}/100. Status: ${assessment.status}.`,
            file_type: "text/html",
            provider: "website",
            web_view_link: primaryUrl,
            external_id: externalId,
            scanned_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (docError || !newDoc) {
          console.error(
            `[Assessor] Failed to insert document for ${assessment.requirement_key}:`,
            docError,
          );
          continue;
        }
        documentId = newDoc.id;
      }

      // Store evidence match (upsert to avoid duplicates on re-scan)
      const { error: matchError } = await supabase
        .from("evidence_matches")
        .upsert(
          {
            organization_id: organizationId,
            document_id: documentId,
            framework_type: "ofsted",
            category_id: requirement.ofstedCategory,
            subcategory_id:
              requirement.ofstedSubcategory || requirement.ofstedCategory,
            confidence: assessment.confidence,
            relevance_explanation: `Website compliance scan: ${assessment.status} (score ${assessment.compliance_score}/100)`,
            key_quotes: assessment.evidence_quotes.slice(0, 5),
            gaps: assessment.gaps.slice(0, 10),
            suggestions: assessment.recommendations.slice(0, 10),
            document_link: primaryUrl,
          },
          {
            onConflict: "organization_id,document_id,subcategory_id",
          },
        );

      if (matchError) {
        console.error(
          `[Assessor] Failed to upsert evidence match for ${assessment.requirement_key}:`,
          matchError,
        );
      }
    }
  } catch (error) {
    console.error("[Assessor] Error storing Ofsted evidence:", error);
  }
}

// ─── Helper: Store expert findings as Ed knowledge Q&A pairs ──────────

async function storeOfstedFindings(
  supabase: ReturnType<typeof createServiceRoleClient>,
  organizationId: string,
  sessionId: string,
  assessments: StorableAssessment[],
): Promise<void> {
  try {
    const rows = assessments
      .map((assessment) => {
        const requirement = WEBSITE_COMPLIANCE_REQUIREMENTS.find(
          (item) => item.key === assessment.requirement_key,
        );
        if (!requirement) return null;

        const draft = buildWebsiteFindingDraft({
          sessionId,
          assessment: {
            requirement_key: assessment.requirement_key,
            requirement_name: assessment.requirement_name,
            category: assessment.category,
            status: assessment.status,
            compliance_score: assessment.compliance_score,
            quality_score: assessment.quality_score,
            clarity_score: assessment.clarity_score,
            evidence_urls: assessment.evidence_urls,
            evidence_quotes: assessment.evidence_quotes,
            gaps: assessment.gaps,
            recommendations: assessment.recommendations,
            red_flags: assessment.red_flags,
            confidence: assessment.confidence,
          },
          requirement,
        });

        if (!draft) return null;

        return {
          organization_id: organizationId,
          ...draft,
          source_url: draft.evidence_url,
          updated_at: new Date().toISOString(),
        };
      })
      .filter(Boolean);

    if (rows.length === 0) return;

    const { data, error } = await supabase
      .from("ofsted_findings")
      .upsert(rows, { onConflict: "organization_id,source_key" })
      .select("id, status, source_key, source_type");

    if (error) {
      console.error("[Assessor] Failed to store Ofsted findings:", error);
      return;
    }

    if (data && data.length > 0) {
      await supabase.from("ofsted_finding_events").insert(
        data.map(
          (finding: {
            id: string;
            status: string;
            source_key: string;
            source_type: string;
          }) => ({
          organization_id: organizationId,
          finding_id: finding.id,
          event_type: "scan_upserted",
          new_status: finding.status,
          metadata: {
            source_key: finding.source_key,
            source_type: finding.source_type,
          },
        })),
      );
    }
  } catch (error) {
    console.error("[Assessor] Error storing Ofsted findings:", error);
  }
}

/**
 * Converts V2 assessment findings into structured Q&A pairs that Ed can
 * use to answer parent/staff questions instantly.
 *
 * e.g. "Who is the SENCO?" -> "The SENCO is Miss Wade (found on /send)"
 *      "Does the school have a behaviour policy?" -> "Yes, compliant (score 100/100)"
 */
async function storeEdKnowledgeQAPairs(
  supabase: ReturnType<typeof createServiceRoleClient>,
  organizationId: string,
  domain: string,
  assessments: StorableAssessment[],
): Promise<void> {
  try {
    // Clear old website compliance knowledge for this org (will be replaced)
    await supabase
      .from("ed_knowledge_patterns")
      .delete()
      .eq("organization_id", organizationId)
      .eq("domain", "compliance")
      .eq("source", "imported");

    // Map requirement keys to natural questions parents/staff would ask Ed
    const questionMap: Record<string, string[]> = {
      senco_details: [
        "Who is the SENCO?",
        "How do I contact the SENCO?",
        "Who is the SEN coordinator?",
      ],
      headteacher_name: [
        "Who is the headteacher?",
        "Who is the head teacher?",
        "Who is the principal?",
      ],
      contact_details: [
        "What is the school phone number?",
        "What is the school email?",
        "What is the school address?",
      ],
      safeguarding_policy: [
        "Who is the designated safeguarding lead?",
        "Who is the DSL?",
        "Where is the safeguarding policy?",
      ],
      admission_arrangements: [
        "How do I apply for a school place?",
        "What are the admission criteria?",
        "What is the PAN?",
      ],
      behaviour_policy: [
        "Where is the behaviour policy?",
        "What is the school behaviour policy?",
      ],
      complaints_procedure: [
        "How do I make a complaint?",
        "Where is the complaints procedure?",
      ],
      uniform_policy: [
        "What is the school uniform?",
        "Where can I find the uniform policy?",
      ],
      send_information_report: [
        "What SEND support does the school offer?",
        "Where is the SEN information report?",
      ],
      ofsted_report: [
        "What is the school's Ofsted rating?",
        "Where is the Ofsted report?",
        "When was the last Ofsted inspection?",
      ],
      curriculum_content: [
        "What subjects does the school teach?",
        "What is the school curriculum?",
      ],
      pupil_premium_strategy: [
        "How does the school spend pupil premium?",
        "Where is the pupil premium strategy?",
      ],
      rse_policy: [
        "What RSE does the school teach?",
        "Where is the relationships and sex education policy?",
      ],
    };

    for (const assessment of assessments) {
      const questions = questionMap[assessment.requirement_key];
      if (!questions) continue;

      // Build a clear answer from the assessment findings
      const parts: string[] = [];
      if (assessment.evidence_quotes.length > 0) {
        parts.push(assessment.evidence_quotes.join(". "));
      }
      if (assessment.status === "compliant") {
        parts.push(
          `Status: compliant (score ${assessment.compliance_score}/100).`,
        );
      } else if (assessment.status === "partial") {
        parts.push(
          `Status: partially compliant (score ${assessment.compliance_score}/100).`,
        );
        if (assessment.gaps.length > 0) {
          parts.push(`Note: ${assessment.gaps[0]}`);
        }
      } else if (assessment.status === "not_found") {
        parts.push(
          "This information was not found on the school website during the last scan.",
        );
      }

      const pageUrl = assessment.evidence_urls?.[0];
      if (pageUrl) {
        parts.push(`Source: ${pageUrl}`);
      }

      const answer = parts.join(" ");
      if (!answer) continue;

      // Store as Ed knowledge pattern for each question variant
      for (const question of questions) {
        await supabase.from("ed_knowledge_patterns").insert({
          organization_id: organizationId,
          domain: "compliance",
          source: "imported",
          trigger_phrases: questions,
          question_pattern: question,
          answer,
          confidence: assessment.confidence,
          source_url: pageUrl || `https://${domain}`,
        });
      }
    }

    console.log(
      `[Assessor] Stored Ed knowledge Q&A pairs (${Object.keys(questionMap).length} requirement types)`,
    );
  } catch (error) {
    console.error("[Assessor] Error storing Ed knowledge:", error);
  }
}

export const __phase2AssessorTestables = {
  sortEvidenceUrlsForRequirement,
};
