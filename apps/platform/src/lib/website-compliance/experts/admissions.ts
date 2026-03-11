/**
 * Expert: Admissions (arrangements, appeals, in-year)
 *
 * Structural check for admissions-related requirements.
 * Covers admission_arrangements, appeals_timetable, in_year_admissions.
 */

import type {
  ComplianceExpert,
  StructuralMatch,
  ExpertResult,
} from "./base-expert";
import { createPolicyExpert } from "./policy-presence";

export const admissionArrangementsExpert: ComplianceExpert = {
  config: {
    requirementKeys: ["admission_arrangements"],
    piiMode: "no_mask",
    needsAI: false,
  },

  async assess(match: StructuralMatch): Promise<ExpertResult> {
    const pages = match.matchingPages;
    let hasArrangements = false;
    let hasPAN = false;
    let hasOversubscription = false;
    let foundUrl = "";
    const evidence: string[] = [];

    for (const page of pages) {
      const contentLower = (page.content || "").toLowerCase();

      if (
        contentLower.includes("admission") ||
        contentLower.includes("admissions")
      ) {
        foundUrl = foundUrl || page.url;
        hasArrangements = true;

        if (
          contentLower.includes("pan") ||
          contentLower.includes("published admission number") ||
          contentLower.includes("intake") ||
          /\b\d{2,3}\s*(?:places?|pupils?)\b/.test(contentLower)
        ) {
          hasPAN = true;
          evidence.push("Published admission number (PAN) found");
        }

        if (
          contentLower.includes("oversubscri") ||
          contentLower.includes("criteria") ||
          contentLower.includes("priority")
        ) {
          hasOversubscription = true;
          evidence.push("Oversubscription criteria found");
        }
      }
    }

    if (hasArrangements && (hasPAN || hasOversubscription)) {
      const score = 70 + (hasPAN ? 15 : 0) + (hasOversubscription ? 15 : 0);
      return {
        status: "compliant",
        complianceScore: score,
        qualityScore: score >= 90 ? 4 : 3,
        clarityScore: 3,
        evidenceQuotes: [...evidence, `Found on ${foundUrl}`],
        gaps: [
          ...(!hasPAN
            ? ["Published Admission Number (PAN) not clearly stated"]
            : []),
          ...(!hasOversubscription
            ? ["Oversubscription criteria not found"]
            : []),
        ],
        recommendations: [],
        redFlags: [],
        confidence: 0.8,
      };
    }

    if (hasArrangements) {
      return {
        status: "partial",
        complianceScore: 40,
        qualityScore: 2,
        clarityScore: 2,
        evidenceQuotes: [`Admissions page found at ${foundUrl}`],
        gaps: [
          "Admissions arrangements lack detail — PAN and oversubscription criteria should be published",
        ],
        recommendations: [
          "Publish full admission arrangements including PAN, oversubscription criteria, and catchment area details",
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
      gaps: ["No admission arrangements found on the website"],
      recommendations: [
        "Publish admission arrangements including PAN, oversubscription criteria, and application process",
      ],
      redFlags: ["Missing statutory admission arrangements"],
      confidence: 0.9,
    };
  },
};

export const appealsTimetableExpert = createPolicyExpert(["appeals_timetable"]);
export const inYearAdmissionsExpert = createPolicyExpert([
  "in_year_admissions",
]);
