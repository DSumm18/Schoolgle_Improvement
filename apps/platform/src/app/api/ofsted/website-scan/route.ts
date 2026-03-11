/**
 * Website Compliance Scanner API
 *
 * POST /api/ofsted/website-scan
 * Crawls a school website and assesses it against 35+ statutory requirements.
 * Returns a full compliance report with per-requirement scores.
 *
 * GET /api/ofsted/website-scan?organizationId=xxx
 * Returns the most recent scan report for an organization.
 */

import { NextRequest, NextResponse } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { crawlWebsite } from "@/lib/website-crawler";
import {
  assessWebsiteCompliance,
  type WebsiteComplianceReport,
} from "@/lib/website-compliance";

interface ScanRequest {
  websiteUrl: string;
  organizationId: string;
  schoolType?: "maintained" | "academy";
  schoolPhase?: "primary" | "secondary" | "all_through";
  trustUrl?: string; // Optional: trust website URL for academies
  useAI?: boolean;
  maxPages?: number;
}

/** Common trust website paths where policies/governance/finance info lives */
const TRUST_SEED_PATHS = [
  "/",
  "/policies",
  "/policies-and-statements",
  "/key-information",
  "/governance",
  "/governance/policies",
  "/governance/policies-and-statements",
  "/governance/governance-structure",
  "/governance/trustees",
  "/governance/members",
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

/**
 * POST /api/ofsted/website-scan
 */
export const POST = protectedRoute(async (auth, request) => {
  const startTime = Date.now();

  try {
    const body: ScanRequest = await request.json();

    const websiteUrl = body.websiteUrl;
    const organizationId = body.organizationId || auth.organizationId;

    if (!websiteUrl || !organizationId) {
      return apiError("websiteUrl and organizationId are required", 400);
    }

    const {
      schoolType: requestedSchoolType,
      useAI = true,
      maxPages = 100,
    } = body;

    // schoolType and phase will be auto-detected from website content if not explicitly set
    let schoolType: "maintained" | "academy" =
      requestedSchoolType || "maintained";
    let schoolPhase: "primary" | "secondary" | "all_through" | "all" =
      body.schoolPhase || "all";
    let isChurchSchool = false;

    // Validate URL
    let baseUrl: URL;
    try {
      baseUrl = new URL(websiteUrl);
    } catch {
      return apiError("Invalid URL", 400);
    }

    const supabase = createServiceRoleClient();

    // Verify organization exists
    const { data: org } = await supabase
      .from("organizations")
      .select("id, name")
      .eq("id", organizationId)
      .maybeSingle();

    if (!org) {
      return apiError("Organization not found", 404);
    }

    console.log(
      `[Website Scan] Starting compliance scan of ${baseUrl.hostname} for ${org.name}`,
    );

    // Phase 1: Crawl the website
    // Allow PDFs/documents from trust domains (schools often host policies on trust site)
    // We detect trust domains from links found during crawl
    console.log(
      `[Website Scan] Phase 1: Crawling website (max ${maxPages} pages)`,
    );

    // First pass: quick crawl to detect trust/partner domains from links
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

    // Extract likely trust/partner domains from outbound links
    const schoolDomain = baseUrl.hostname;
    const trustDomains = new Set<string>();
    for (const page of quickCrawl.pages) {
      if (!page.links) continue;
      for (const link of page.links) {
        try {
          const linkUrl = new URL(link, websiteUrl);
          const linkHost = linkUrl.hostname;
          // Include domains that look like trust/academy/school partner sites
          // but exclude social media, Google, gov.uk, etc.
          // Allow Google Drive/Docs (schools host policies there)
          // but exclude other Google services
          const isGoogleDocs =
            linkHost === "drive.google.com" ||
            linkHost === "docs.google.com" ||
            linkHost === "sites.google.com";

          const isSocialOrIrrelevant =
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
            !isSocialOrIrrelevant &&
            // Google Drive/Docs links to documents are always allowed
            (isGoogleDocs ||
              // Trust/academy domains often share naming patterns
              linkHost.includes("trust") ||
              linkHost.includes("academy") ||
              linkHost.includes("school") ||
              linkHost.includes("mat") ||
              linkHost.includes("education") ||
              linkHost.includes("diocese") ||
              linkHost.includes("dixons") ||
              // Or link is to a PDF/document on any external site
              linkUrl.pathname.match(/\.(pdf|docx?|xlsx?)$/i))
          ) {
            trustDomains.add(linkHost);
          }
        } catch {
          // Invalid URL, skip
        }
      }
    }

    // Build content string from quick crawl for auto-detection
    const allQuickContent = quickCrawl.pages
      .map((p) => (p.content || "").toLowerCase())
      .join(" ");

    // Auto-detect school type from website content if not explicitly provided
    if (!requestedSchoolType) {
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
      const academyMatches = academySignals.filter((s) =>
        allQuickContent.includes(s),
      );
      if (academyMatches.length >= 2) {
        schoolType = "academy";
        console.log(
          `[Website Scan] Auto-detected school type: ACADEMY (signals: ${academyMatches.join(", ")})`,
        );
      } else {
        console.log(
          `[Website Scan] Auto-detected school type: MAINTAINED (no strong academy signals found)`,
        );
      }
    }

    // Detect if this is a church school (VA/VC) — affects which checks apply
    const churchSignals = [
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
    const churchMatches = churchSignals.filter((s) =>
      allQuickContent.includes(s),
    );
    if (churchMatches.length >= 2) {
      isChurchSchool = true;
      console.log(
        `[Website Scan] Also detected as CHURCH SCHOOL (signals: ${churchMatches.join(", ")}) — SIAMS requirements will be checked`,
      );
    }

    // Auto-detect school phase if not explicitly set
    if (!body.schoolPhase) {
      // Include page titles and the URL hostname for stronger signal detection
      const allTitles = quickCrawl.pages
        .map((p) => (p.title || "").toLowerCase())
        .join(" ");
      const phaseContent =
        allQuickContent +
        " " +
        allTitles +
        " " +
        baseUrl.hostname.toLowerCase();

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

      let primaryHits = primarySignals.filter((s) =>
        phaseContent.includes(s),
      ).length;
      let secondaryHits = secondarySignals.filter((s) =>
        phaseContent.includes(s),
      ).length;

      // URL hostname is a strong signal — "primary" or "secondary" in the domain name
      const hostname = baseUrl.hostname.toLowerCase();
      if (
        hostname.includes("primary") ||
        hostname.includes("infant") ||
        hostname.includes("junior")
      ) {
        primaryHits += 2; // Strong boost — school chose "primary" in their domain
      }
      if (
        hostname.includes("secondary") ||
        hostname.includes("sixth") ||
        hostname.includes("college")
      ) {
        secondaryHits += 2;
      }

      if (primaryHits >= 3 && secondaryHits >= 3) {
        schoolPhase = "all_through";
        console.log(
          `[Website Scan] Auto-detected phase: ALL-THROUGH (primary: ${primaryHits}, secondary: ${secondaryHits} signals)`,
        );
      } else if (secondaryHits >= 3 && secondaryHits > primaryHits) {
        schoolPhase = "secondary";
        console.log(
          `[Website Scan] Auto-detected phase: SECONDARY (${secondaryHits} signals)`,
        );
      } else if (primaryHits >= 2) {
        schoolPhase = "primary";
        console.log(
          `[Website Scan] Auto-detected phase: PRIMARY (${primaryHits} signals)`,
        );
      } else {
        console.log(
          `[Website Scan] Phase not confidently detected (primary: ${primaryHits}, secondary: ${secondaryHits}) — checking all requirements`,
        );
      }
    }

    if (trustDomains.size > 0) {
      console.log(
        `[Website Scan] Detected ${trustDomains.size} trust/partner domains: ${[...trustDomains].join(", ")}`,
      );
    }

    // Full crawl with trust domains allowed
    // Enable screenshot OCR for pages where HTML extraction fails (dynamic CMS widgets)
    const crawlResult = await crawlWebsite(websiteUrl, {
      maxPages,
      requestDelay: 500,
      pageTimeout: 30000,
      sameDomainOnly: true,
      allowedDomains: [...trustDomains],
      processPDFs: true,
      processDocuments: true,
      userAgent: "Schoolgle-Compliance/1.0 (+https://schoolgle.co.uk)",
      headless: true,
      screenshotOCR: true,
      screenshotOCRThreshold: 100,
    });

    console.log(
      `[Website Scan] School crawl complete: ${crawlResult.pages.length} pages, ${crawlResult.stats.pdfsProcessed} PDFs`,
    );

    if (crawlResult.pages.length === 0) {
      return apiError("No pages could be crawled from the website", 422);
    }

    // Phase 1b: For ACADEMIES — crawl the trust website for trust-level policies
    // Many statutory items (complaints, whistleblowing, accounts, governance, register of interests)
    // are published on the trust website, not the individual school site.
    if (schoolType === "academy" && trustDomains.size > 0) {
      // Find the primary trust domain (the one that looks most like a MAT website)
      const trustUrl =
        body.trustUrl ||
        findPrimaryTrustDomain([...trustDomains], quickCrawl.pages);

      if (trustUrl) {
        console.log(
          `[Website Scan] Phase 1b: Crawling trust website ${trustUrl} for academy-level policies`,
        );

        try {
          // Generate seed URLs for the trust site
          const trustBaseUrl = trustUrl.startsWith("http")
            ? trustUrl
            : `https://${trustUrl}`;
          const seedUrls = TRUST_SEED_PATHS.map(
            (path) => `${trustBaseUrl.replace(/\/$/, "")}${path}`,
          );

          // Crawl trust site (limited pages, focused on policy/governance/finance)
          const trustCrawl = await crawlWebsite(trustBaseUrl, {
            maxPages: 40,
            requestDelay: 500,
            pageTimeout: 30000,
            sameDomainOnly: true,
            allowedDomains: ["drive.google.com", "docs.google.com"],
            processPDFs: true,
            processDocuments: true,
            userAgent: "Schoolgle-Compliance/1.0 (+https://schoolgle.co.uk)",
            headless: true,
            seedUrls: seedUrls,
          });

          console.log(
            `[Website Scan] Trust crawl complete: ${trustCrawl.pages.length} pages, ${trustCrawl.stats.pdfsProcessed} PDFs from ${trustBaseUrl}`,
          );

          // Merge trust pages into main crawl results
          // Tag them so the assessor can see they're from the trust
          for (const page of trustCrawl.pages) {
            page.metadata = {
              ...page.metadata,
              source: "trust",
            };
            crawlResult.pages.push(page);
          }

          // Update stats
          crawlResult.stats.totalPages += trustCrawl.stats.totalPages;
          crawlResult.stats.successfulPages += trustCrawl.stats.successfulPages;
          crawlResult.stats.pdfsProcessed += trustCrawl.stats.pdfsProcessed;
          crawlResult.stats.uniqueDomains += 1;
          crawlResult.errors.push(...trustCrawl.errors);
        } catch (trustError) {
          console.error(
            "[Website Scan] Trust crawl failed (continuing with school-only data):",
            trustError,
          );
        }

        console.log(
          `[Website Scan] Combined total: ${crawlResult.pages.length} pages`,
        );
      }
    }

    // Phase 2: Assess compliance
    console.log(`[Website Scan] Phase 2: Assessing compliance`);
    const report = await assessWebsiteCompliance(
      crawlResult.pages,
      websiteUrl,
      {
        schoolType,
        schoolPhase,
        isChurchSchool,
        useAI,
        onProgress: (current, total, name) => {
          console.log(`[Website Scan] Assessing ${current}/${total}: ${name}`);
        },
      },
    );

    // Phase 3: Store results
    console.log(`[Website Scan] Phase 3: Storing results`);

    // Store the full report
    const { error: insertError } = await supabase
      .from("website_compliance_scans")
      .upsert(
        {
          organization_id: organizationId,
          website_url: websiteUrl,
          school_type: schoolType,
          overall_compliance_score: report.overallComplianceScore,
          overall_quality_score: report.overallQualityScore,
          overall_clarity_score: report.overallClarityScore,
          total_requirements: report.totalRequirements,
          compliant_count: report.compliantCount,
          partial_count: report.partialCount,
          not_found_count: report.notFoundCount,
          outdated_count: report.outdatedCount,
          pages_scanned: report.pagesScanned,
          pdfs_processed: report.pdfsProcessed,
          scan_duration_ms: report.scanDuration,
          priority_actions: report.priorityActions,
          category_summary: report.categorySummary,
          full_report: report,
          scanned_at: report.scannedAt,
        },
        {
          onConflict: "organization_id",
        },
      );

    if (insertError) {
      console.error("[Website Scan] Failed to store report:", insertError);
      // Don't fail — still return the report
    }

    // Also store website content in ed_website_knowledge for Ed's RAG
    await storeForEdKnowledge(
      supabase,
      organizationId,
      baseUrl.hostname,
      crawlResult.pages,
    );

    // Store website evidence matches for Ofsted readiness
    await storeOfstedEvidence(supabase, organizationId, report);

    // Store expert findings as structured Ed knowledge (Q&A pairs)
    await storeExpertKnowledgeForEd(
      supabase,
      organizationId,
      baseUrl.hostname,
      report,
    );

    const totalDuration = Date.now() - startTime;
    console.log(
      `[Website Scan] Complete in ${totalDuration}ms. Score: ${report.overallComplianceScore}%`,
    );

    return apiSuccess({
      report,
      schoolPhase,
      crawlStats: crawlResult.stats,
      duration: totalDuration,
    });
  } catch (error) {
    console.error("[Website Scan] Error:", error);
    return apiError(
      error instanceof Error ? error.message : "Unknown error",
      500,
    );
  }
});

/**
 * GET /api/ofsted/website-scan?organizationId=xxx
 */
export const GET = protectedRoute(async (auth, request) => {
  const { searchParams } = new URL(request.url);
  const organizationId =
    searchParams.get("organizationId") || auth.organizationId;

  if (!organizationId) {
    return apiError("organizationId is required", 400);
  }

  const supabase = createServiceRoleClient();

  const { data: scan, error } = await supabase
    .from("website_compliance_scans")
    .select("*")
    .eq("organization_id", organizationId)
    .order("scanned_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return apiError(error.message, 500);
  }

  if (!scan) {
    return apiSuccess({
      success: true,
      hasReport: false,
      message: "No website compliance scan found for this organization",
    });
  }

  return apiSuccess({
    success: true,
    hasReport: true,
    scan: {
      websiteUrl: scan.website_url,
      schoolType: scan.school_type,
      overallComplianceScore: scan.overall_compliance_score,
      overallQualityScore: scan.overall_quality_score,
      overallClarityScore: scan.overall_clarity_score,
      totalRequirements: scan.total_requirements,
      compliantCount: scan.compliant_count,
      partialCount: scan.partial_count,
      notFoundCount: scan.not_found_count,
      outdatedCount: scan.outdated_count,
      pagesScanned: scan.pages_scanned,
      priorityActions: scan.priority_actions,
      categorySummary: scan.category_summary,
      scannedAt: scan.scanned_at,
    },
    fullReport: scan.full_report,
  });
});

// ─── Helper: Store content for Ed's RAG ──────────────────────────

async function storeForEdKnowledge(
  supabase: ReturnType<typeof createServiceRoleClient>,
  organizationId: string,
  domain: string,
  pages: Awaited<ReturnType<typeof crawlWebsite>>["pages"],
): Promise<void> {
  try {
    for (const page of pages) {
      if (!page.content || page.content.length < 50) continue;

      const contentHash = Buffer.from(page.content)
        .toString("base64")
        .substring(0, 32);

      // Upsert into ed_website_knowledge
      await supabase.from("ed_website_knowledge").upsert(
        {
          organization_id: organizationId,
          domain,
          page_url: page.url,
          page_title: page.title,
          content: page.content.substring(0, 50000), // Limit content size
          meta_description: page.metadata.description,
          headings: page.headings.map((h) => h.text),
          links: page.links?.slice(0, 100),
          content_type: page.contentType === "pdf" ? "policy" : "page",
          content_hash: contentHash,
          last_scanned: new Date().toISOString(),
        },
        {
          onConflict: "organization_id,page_url",
        },
      );
    }
  } catch (error) {
    console.error("[Website Scan] Error storing Ed knowledge:", error);
  }
}

// ─── Helper: Store Ofsted evidence from website ──────────────────

async function storeOfstedEvidence(
  supabase: ReturnType<typeof createServiceRoleClient>,
  organizationId: string,
  report: WebsiteComplianceReport,
): Promise<void> {
  try {
    const { WEBSITE_COMPLIANCE_REQUIREMENTS } =
      await import("@/lib/website-compliance/requirements");

    for (const assessment of report.assessments) {
      // Only store compliant/partial items as evidence
      if (
        assessment.status !== "compliant" &&
        assessment.status !== "partial"
      ) {
        continue;
      }

      // Only store items that map to Ofsted categories
      const requirement = WEBSITE_COMPLIANCE_REQUIREMENTS.find(
        (r) => r.key === assessment.requirementKey,
      );

      if (!requirement?.ofstedCategory) continue;

      const primaryPage = assessment.pagesFound[0];
      const externalId = `website-${assessment.requirementKey}`;

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
            name: `Website: ${assessment.requirementName}`,
            content:
              assessment.evidenceQuotes.join("\n\n") ||
              `Compliance score: ${assessment.complianceScore}/100. Status: ${assessment.status}.`,
            file_type: "text/html",
            provider: "website",
            web_view_link: primaryPage?.url,
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
            name: `Website: ${assessment.requirementName}`,
            content:
              assessment.evidenceQuotes.join("\n\n") ||
              `Compliance score: ${assessment.complianceScore}/100. Status: ${assessment.status}.`,
            file_type: "text/html",
            provider: "website",
            web_view_link: primaryPage?.url,
            external_id: externalId,
            scanned_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (docError || !newDoc) {
          console.error(
            `[Website Scan] Failed to insert document for ${assessment.requirementKey}:`,
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
            relevance_explanation: `Website compliance scan: ${assessment.status} (score ${assessment.complianceScore}/100)`,
            key_quotes: assessment.evidenceQuotes.slice(0, 5),
            gaps: assessment.gaps.slice(0, 10),
            suggestions: assessment.recommendations.slice(0, 10),
            document_link: primaryPage?.url,
          },
          {
            onConflict: "organization_id,document_id,subcategory_id",
          },
        );

      if (matchError) {
        console.error(
          `[Website Scan] Failed to upsert evidence match for ${assessment.requirementKey}:`,
          matchError,
        );
      }
    }
  } catch (error) {
    console.error("[Website Scan] Error storing Ofsted evidence:", error);
  }
}

// ─── Helper: Store expert findings as Ed knowledge Q&A pairs ─────

/**
 * Converts expert findings into structured Q&A pairs that Ed can use
 * to answer parent/staff questions instantly.
 *
 * e.g. "Who is the SENCO?" → "The SENCO is Miss Wade (found on /send)"
 *      "Does the school have a behaviour policy?" → "Yes, compliant (score 100/100)"
 */
async function storeExpertKnowledgeForEd(
  supabase: ReturnType<typeof createServiceRoleClient>,
  organizationId: string,
  domain: string,
  report: WebsiteComplianceReport,
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

    for (const assessment of report.assessments) {
      const questions = questionMap[assessment.requirementKey];
      if (!questions) continue;

      // Build a clear answer from the expert's findings
      const parts: string[] = [];
      if (assessment.evidenceQuotes.length > 0) {
        parts.push(assessment.evidenceQuotes.join(". "));
      }
      if (assessment.status === "compliant") {
        parts.push(
          `Status: compliant (score ${assessment.complianceScore}/100).`,
        );
      } else if (assessment.status === "partial") {
        parts.push(
          `Status: partially compliant (score ${assessment.complianceScore}/100).`,
        );
        if (assessment.gaps.length > 0) {
          parts.push(`Note: ${assessment.gaps[0]}`);
        }
      } else if (assessment.status === "not_found") {
        parts.push(
          "This information was not found on the school website during the last scan.",
        );
      }

      const pageUrl = assessment.pagesFound?.[0]?.url;
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
      `[Website Scan] Stored expert knowledge for Ed (${Object.keys(questionMap).length} requirement types)`,
    );
  } catch (error) {
    console.error("[Website Scan] Error storing Ed knowledge:", error);
  }
}

// ─── Helper: Find primary trust domain from detected domains ─────

function findPrimaryTrustDomain(
  trustDomains: string[],
  quickCrawlPages: Awaited<ReturnType<typeof crawlWebsite>>["pages"],
): string | null {
  if (trustDomains.length === 0) return null;

  // Score each domain based on how likely it is to be the actual trust website
  const scores: Record<string, number> = {};

  for (const domain of trustDomains) {
    let score = 0;

    // Trust/academy/education domains are more likely to be the MAT website
    if (domain.includes("trust")) score += 5;
    if (domain.includes("academy") || domain.includes("academies")) score += 4;
    if (domain.includes("mat")) score += 4;
    if (domain.includes("education")) score += 3;
    if (domain.includes("school")) score += 2;
    if (domain.includes("diocese")) score += 3;

    // Short, clean domains are more likely to be the main trust site
    if (domain.split(".").length <= 3) score += 2;

    // Google Drive/Docs is NOT a trust website
    if (domain.includes("google")) score -= 10;

    // Count how many times this domain appears in links across crawled pages
    let linkCount = 0;
    for (const page of quickCrawlPages) {
      if (!page.links) continue;
      for (const link of page.links) {
        try {
          if (new URL(link).hostname === domain) linkCount++;
        } catch {
          // Skip invalid URLs
        }
      }
    }
    score += Math.min(linkCount, 5); // Cap at 5 bonus points

    // Check if the domain was explicitly mentioned in page content (e.g. "Part of XYZ Trust")
    for (const page of quickCrawlPages) {
      if ((page.content || "").toLowerCase().includes(domain.split(".")[0])) {
        score += 3;
        break;
      }
    }

    scores[domain] = score;
  }

  // Return the highest-scoring domain
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  if (sorted.length > 0 && sorted[0][1] > 0) {
    const winner = sorted[0][0];
    console.log(
      `[Website Scan] Selected primary trust domain: ${winner} (score: ${sorted[0][1]})`,
    );
    return winner;
  }

  return null;
}
