/**
 * Expert: Financial Benchmarking Link
 *
 * Pure structural check — scans for the DfE financial benchmarking service link.
 * No AI needed. Deterministic result.
 */

import type {
  ComplianceExpert,
  StructuralMatch,
  ExpertResult,
} from "./base-expert";

const FBIT = "financial-benchmarking-and-insights-tool.service.gov.uk";
const OLD_SERVICE = "schools-financial-benchmarking.service.gov.uk";

export const financialLinkExpert: ComplianceExpert = {
  config: {
    requirementKeys: ["financial_benchmarking_link"],
    piiMode: "no_mask",
    needsAI: false,
  },

  async assess(match: StructuralMatch): Promise<ExpertResult> {
    let foundNew = false;
    let foundOld = false;
    let foundUrl = "";

    for (const page of match.matchingPages) {
      const content = (page.content || "").toLowerCase();
      if (content.includes(FBIT)) {
        foundNew = true;
        foundUrl = page.url;
      }
      if (content.includes(OLD_SERVICE)) {
        foundOld = true;
        foundUrl = foundUrl || page.url;
      }
      if (content.includes("financial benchmarking")) {
        // Mentioned but need to check if link is present
        if (foundNew || foundOld) continue;
        foundUrl = foundUrl || page.url;
      }
    }

    if (foundNew) {
      return {
        status: "compliant",
        complianceScore: 100,
        qualityScore: 4,
        clarityScore: 4,
        evidenceQuotes: [`Link to FBIT found on ${foundUrl}`],
        gaps: [],
        recommendations: [],
        redFlags: [],
        confidence: 0.95,
      };
    }

    if (foundOld) {
      return {
        status: "partial",
        complianceScore: 60,
        qualityScore: 2,
        clarityScore: 3,
        evidenceQuotes: [
          `Link to old financial benchmarking service found on ${foundUrl}`,
        ],
        gaps: [
          "Link should point to the new Financial Benchmarking and Insights Tool (FBIT)",
        ],
        recommendations: [
          `Update the link to https://${FBIT} — the old service has been replaced`,
        ],
        redFlags: [],
        confidence: 0.9,
      };
    }

    return {
      status: "not_found",
      complianceScore: 0,
      qualityScore: 0,
      clarityScore: 0,
      evidenceQuotes: [],
      gaps: ["No link to DfE financial benchmarking service found"],
      recommendations: [
        `Add a link to https://${FBIT} so stakeholders can compare financial data`,
      ],
      redFlags: ["Missing statutory financial benchmarking link"],
      confidence: 0.9,
    };
  },
};
