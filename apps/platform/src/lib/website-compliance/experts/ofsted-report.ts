/**
 * Expert: Ofsted Report Link
 *
 * Checks for a link to the school's latest Ofsted report.
 * Structural check — no AI needed.
 */

import type {
  ComplianceExpert,
  StructuralMatch,
  ExpertResult,
} from "./base-expert";

const OFSTED_DOMAINS = [
  "reports.ofsted.gov.uk",
  "ofsted.gov.uk",
  "files.ofsted.gov.uk",
];

export const ofstedReportExpert: ComplianceExpert = {
  config: {
    requirementKeys: ["ofsted_report"],
    piiMode: "no_mask",
    needsAI: false,
  },

  async assess(match: StructuralMatch): Promise<ExpertResult> {
    let hasOfstedLink = false;
    let hasOfstedMention = false;
    let foundUrl = "";

    for (const page of match.matchingPages) {
      const content = (page.content || "").toLowerCase();

      // Check for direct Ofsted report links
      if (OFSTED_DOMAINS.some((d) => content.includes(d))) {
        hasOfstedLink = true;
        foundUrl = page.url;
        break;
      }

      // Check for Ofsted mentions
      if (
        content.includes("ofsted") &&
        (content.includes("report") ||
          content.includes("inspection") ||
          content.includes("rating") ||
          content.includes("judgement") ||
          content.includes("graded") ||
          content.includes("outstanding") ||
          content.includes("good"))
      ) {
        hasOfstedMention = true;
        foundUrl = foundUrl || page.url;
      }
    }

    // Also check document links
    if (
      !hasOfstedLink &&
      match.documentLinksFound.some((l) =>
        OFSTED_DOMAINS.some((d) => l.toLowerCase().includes(d)),
      )
    ) {
      hasOfstedLink = true;
    }

    // Check for local Ofsted report PDFs (schools often host a copy)
    if (!hasOfstedLink) {
      for (const page of match.matchingPages) {
        const urlLower = page.url.toLowerCase();
        const titleLower = (page.title || "").toLowerCase();
        if (
          (urlLower.includes("ofsted") && urlLower.endsWith(".pdf")) ||
          (titleLower.includes("ofsted") && titleLower.includes("report"))
        ) {
          hasOfstedLink = true;
          foundUrl = foundUrl || page.url;
          break;
        }
      }
    }

    if (hasOfstedLink) {
      return {
        status: "compliant",
        complianceScore: 100,
        qualityScore: 4,
        clarityScore: 4,
        evidenceQuotes: [`Link to Ofsted report found on ${foundUrl}`],
        gaps: [],
        recommendations: [],
        redFlags: [],
        confidence: 0.95,
      };
    }

    if (hasOfstedMention) {
      return {
        status: "partial",
        complianceScore: 50,
        qualityScore: 2,
        clarityScore: 2,
        evidenceQuotes: [
          `Ofsted mentioned on ${foundUrl} but no direct link to the report`,
        ],
        gaps: ["Direct link to the latest Ofsted report not found"],
        recommendations: [
          "Add a direct link to the latest Ofsted inspection report on reports.ofsted.gov.uk",
        ],
        redFlags: [],
        confidence: 0.8,
      };
    }

    return {
      status: "not_found",
      complianceScore: 0,
      qualityScore: 0,
      clarityScore: 0,
      evidenceQuotes: [],
      gaps: ["No link to the school's Ofsted report found"],
      recommendations: [
        "Add a link to the latest Ofsted inspection report — most schools display this on the homepage or an About/Ofsted page",
      ],
      redFlags: ["Missing statutory Ofsted report link"],
      confidence: 0.9,
    };
  },
};
