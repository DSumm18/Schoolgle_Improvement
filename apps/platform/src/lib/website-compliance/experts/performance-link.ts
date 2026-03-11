/**
 * Expert: Link to Compare School Performance
 *
 * Pure structural check — scans page links for the DfE performance comparison service.
 * No AI needed. Deterministic result.
 */

import type {
  ComplianceExpert,
  StructuralMatch,
  ExpertResult,
} from "./base-expert";

const NEW_SERVICE = "compare-school-performance.service.gov.uk";
const FIND_SERVICE = "find-school-performance-data.service.gov.uk";
const OLD_SERVICE = "schools-financial-benchmarking.service.gov.uk";

export const performanceLinkExpert: ComplianceExpert = {
  config: {
    requirementKeys: ["school_performance_link"],
    piiMode: "no_mask",
    needsAI: false,
  },

  async assess(match: StructuralMatch): Promise<ExpertResult> {
    let foundNew = false;
    let foundOld = false;
    let foundUrl = "";

    for (const page of match.matchingPages) {
      const content = (page.content || "").toLowerCase();
      // Check both content and URL patterns
      if (content.includes(NEW_SERVICE) || content.includes(FIND_SERVICE)) {
        foundNew = true;
        foundUrl = page.url;
      }
      if (content.includes(OLD_SERVICE)) {
        foundOld = true;
      }
      // Also check if the URL itself is the performance link page
      if (
        content.includes("compare school performance") ||
        content.includes("school performance data")
      ) {
        foundNew = true;
        foundUrl = foundUrl || page.url;
      }
    }

    if (foundNew) {
      return {
        status: "compliant",
        complianceScore: 100,
        qualityScore: 4,
        clarityScore: 4,
        evidenceQuotes: [
          `Link to DfE school performance service found on ${foundUrl}`,
        ],
        gaps: [],
        recommendations: [],
        redFlags: [],
        confidence: 0.95,
      };
    }

    if (foundOld) {
      return {
        status: "partial",
        complianceScore: 50,
        qualityScore: 2,
        clarityScore: 3,
        evidenceQuotes: [
          "Link found but points to old financial benchmarking service",
        ],
        gaps: [
          "Link should point to the new Compare School Performance service",
        ],
        recommendations: [
          `Update the link to ${NEW_SERVICE} (the old service has been replaced)`,
        ],
        redFlags: ["Outdated government service link"],
        confidence: 0.9,
      };
    }

    return {
      status: "not_found",
      complianceScore: 0,
      qualityScore: 0,
      clarityScore: 0,
      evidenceQuotes: [],
      gaps: ["No link to DfE school performance comparison service found"],
      recommendations: [
        `Add a link to https://${NEW_SERVICE} so parents can compare school performance data`,
      ],
      redFlags: ["Missing statutory link to school performance data"],
      confidence: 0.9,
    };
  },
};
