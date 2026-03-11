/**
 * Expert: SIAMS (Church School) Requirements
 *
 * Covers collective_worship, christian_vision, siams_report, diocesan_link.
 * These only apply to church schools (VA/VC/C of E/Catholic).
 */

import type {
  ComplianceExpert,
  StructuralMatch,
  ExpertResult,
} from "./base-expert";
import { createPolicyExpert } from "./policy-presence";

export const collectiveWorshipExpert = createPolicyExpert([
  "collective_worship",
]);
export const christianVisionExpert = createPolicyExpert(["christian_vision"]);
export const siamsReportExpert = createPolicyExpert(["siams_report"]);

export const diocesanLinkExpert: ComplianceExpert = {
  config: {
    requirementKeys: ["diocesan_link"],
    piiMode: "no_mask",
    needsAI: false,
  },

  async assess(match: StructuralMatch): Promise<ExpertResult> {
    let foundLink = false;
    let foundMention = false;
    let foundUrl = "";

    const diocesePatterns = [
      "diocese",
      "diocesan",
      "church of england",
      "c of e",
      "catholic diocese",
      "archdiocese",
    ];

    for (const page of match.matchingPages) {
      const contentLower = (page.content || "").toLowerCase();

      if (diocesePatterns.some((p) => contentLower.includes(p))) {
        foundMention = true;
        foundUrl = foundUrl || page.url;

        // Check for actual diocese website links
        if (
          contentLower.includes("diocese.") ||
          contentLower.includes("diocesan.") ||
          contentLower.includes("churchofengland.") ||
          contentLower.includes("catholic")
        ) {
          foundLink = true;
        }
      }
    }

    if (foundLink) {
      return {
        status: "compliant",
        complianceScore: 100,
        qualityScore: 4,
        clarityScore: 4,
        evidenceQuotes: [`Diocesan link found on ${foundUrl}`],
        gaps: [],
        recommendations: [],
        redFlags: [],
        confidence: 0.85,
      };
    }

    if (foundMention) {
      return {
        status: "partial",
        complianceScore: 50,
        qualityScore: 2,
        clarityScore: 2,
        evidenceQuotes: [`Diocese mentioned on ${foundUrl}`],
        gaps: ["Direct link to diocesan website not found"],
        recommendations: [
          "Add a direct link to the diocesan education website",
        ],
        redFlags: [],
        confidence: 0.7,
      };
    }

    return {
      status: "not_found",
      complianceScore: 0,
      qualityScore: 0,
      clarityScore: 0,
      evidenceQuotes: [],
      gaps: ["No diocesan link found"],
      recommendations: [
        "Add a link to the diocesan education website (expected for church schools)",
      ],
      redFlags: [],
      confidence: 0.8,
    };
  },
};
