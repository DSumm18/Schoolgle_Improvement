/**
 * Expert: Equality & Accessibility
 *
 * Covers equality_objectives, equality_information, accessibility_plan,
 * website_accessibility, send_information_report, academy_trust_info.
 */

import type {
  ComplianceExpert,
  StructuralMatch,
  ExpertResult,
} from "./base-expert";
import { createPolicyExpert } from "./policy-presence";

export const sendInformationReportExpert: ComplianceExpert = {
  config: {
    requirementKeys: ["send_information_report"],
    piiMode: "no_mask",
    needsAI: false,
  },

  async assess(match: StructuralMatch): Promise<ExpertResult> {
    let hasReport = false;
    let hasLocalOffer = false;
    let hasProvision = false;
    let foundUrl = "";
    const evidence: string[] = [];

    for (const page of match.matchingPages) {
      const contentLower = (page.content || "").toLowerCase();

      if (
        contentLower.includes("send") ||
        contentLower.includes("sen") ||
        contentLower.includes("special educational needs") ||
        contentLower.includes("inclusion")
      ) {
        foundUrl = foundUrl || page.url;

        if (
          contentLower.includes("sen information report") ||
          contentLower.includes("send information report") ||
          contentLower.includes("send report") ||
          contentLower.includes("sen report")
        ) {
          hasReport = true;
          evidence.push("SEN Information Report found");
        }

        if (contentLower.includes("local offer")) {
          hasLocalOffer = true;
          evidence.push("Local offer reference found");
        }

        if (
          contentLower.includes("provision") ||
          contentLower.includes("support") ||
          contentLower.includes("intervention")
        ) {
          hasProvision = true;
        }

        // Long SEND content is likely the actual report
        if (
          page.content &&
          page.content.length > 2000 &&
          (contentLower.includes("sen") || contentLower.includes("send"))
        ) {
          hasReport = true;
          evidence.push(
            `Substantial SEND content (${page.content.length} chars)`,
          );
        }
      }
    }

    if (hasReport) {
      const score = 70 + (hasLocalOffer ? 15 : 0) + (hasProvision ? 15 : 0);
      return {
        status: "compliant",
        complianceScore: score,
        qualityScore: score >= 90 ? 4 : 3,
        clarityScore: 3,
        evidenceQuotes: [...evidence, `Found on ${foundUrl}`],
        gaps: !hasLocalOffer ? ["Link to LA local offer not found"] : [],
        recommendations: [],
        redFlags: [],
        confidence: 0.8,
      };
    }

    if (foundUrl) {
      return {
        status: "partial",
        complianceScore: 40,
        qualityScore: 2,
        clarityScore: 2,
        evidenceQuotes: [`SEND page found at ${foundUrl}`],
        gaps: [
          "SEN Information Report not clearly published — should detail how the school identifies, assesses, and provides for SEND pupils",
        ],
        recommendations: [
          "Publish a comprehensive SEN Information Report covering all 14 areas from the SEND Code of Practice",
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
      gaps: ["No SEN Information Report found"],
      recommendations: [
        "Publish the SEN Information Report (statutory under SEND Code of Practice 2015)",
      ],
      redFlags: ["Missing statutory SEN Information Report"],
      confidence: 0.9,
    };
  },
};

export const websiteAccessibilityExpert: ComplianceExpert = {
  config: {
    requirementKeys: ["website_accessibility"],
    piiMode: "no_mask",
    needsAI: false,
  },

  async assess(match: StructuralMatch): Promise<ExpertResult> {
    let hasStatement = false;
    let foundUrl = "";

    for (const page of match.matchingPages) {
      const contentLower = (page.content || "").toLowerCase();
      const urlLower = page.url.toLowerCase();

      if (
        urlLower.includes("accessibility") ||
        contentLower.includes("accessibility statement") ||
        contentLower.includes("wcag")
      ) {
        hasStatement = true;
        foundUrl = page.url;
        break;
      }
    }

    if (hasStatement) {
      return {
        status: "compliant",
        complianceScore: 80,
        qualityScore: 3,
        clarityScore: 3,
        evidenceQuotes: [`Accessibility statement found on ${foundUrl}`],
        gaps: [],
        recommendations: [],
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
      gaps: ["No website accessibility statement found"],
      recommendations: [
        "Publish an accessibility statement (required under Public Sector Bodies Accessibility Regulations 2018)",
      ],
      redFlags: ["Missing accessibility statement"],
      confidence: 0.9,
    };
  },
};

export const equalityObjectivesExpert = createPolicyExpert([
  "equality_objectives",
]);
export const equalityInformationExpert = createPolicyExpert([
  "equality_information",
]);
export const accessibilityPlanExpert = createPolicyExpert([
  "accessibility_plan",
]);
export const academyTrustInfoExpert = createPolicyExpert([
  "academy_trust_info",
]);
