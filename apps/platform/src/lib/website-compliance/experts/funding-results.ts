/**
 * Expert: Funding & Results
 *
 * Covers pupil_premium_strategy, pe_sport_premium, ks2_results,
 * ks4_results, ks5_results, high_pay_disclosure, academy_accounts,
 * gender_pay_gap, off_payroll_disclosure, family_relationships_register.
 */

import type {
  ComplianceExpert,
  StructuralMatch,
  ExpertResult,
} from "./base-expert";
import { createPolicyExpert } from "./policy-presence";

export const pupilPremiumExpert: ComplianceExpert = {
  config: {
    requirementKeys: ["pupil_premium_strategy"],
    piiMode: "no_mask",
    needsAI: false,
  },

  async assess(match: StructuralMatch): Promise<ExpertResult> {
    let hasStrategy = false;
    let hasAmount = false;
    let hasSpending = false;
    let hasOutcomes = false;
    let foundUrl = "";
    const evidence: string[] = [];

    for (const page of match.matchingPages) {
      const contentLower = (page.content || "").toLowerCase();

      if (
        contentLower.includes("pupil premium") ||
        contentLower.includes("disadvantaged")
      ) {
        hasStrategy = true;
        foundUrl = foundUrl || page.url;

        if (/£[\d,]+/.test(page.content || "")) {
          hasAmount = true;
          evidence.push("Funding amount(s) found");
        }

        if (
          contentLower.includes("spending") ||
          contentLower.includes("expenditure") ||
          contentLower.includes("strategy") ||
          contentLower.includes("allocation")
        ) {
          hasSpending = true;
          evidence.push("Spending/strategy details found");
        }

        if (
          contentLower.includes("impact") ||
          contentLower.includes("outcome") ||
          contentLower.includes("progress") ||
          contentLower.includes("attainment")
        ) {
          hasOutcomes = true;
          evidence.push("Outcomes/impact information found");
        }
      }
    }

    if (hasStrategy && hasSpending) {
      const score = 60 + (hasAmount ? 15 : 0) + (hasOutcomes ? 25 : 0);
      return {
        status: "compliant",
        complianceScore: score,
        qualityScore: score >= 90 ? 4 : 3,
        clarityScore: 3,
        evidenceQuotes: [...evidence, `Found on ${foundUrl}`],
        gaps: [
          ...(!hasAmount ? ["Total pupil premium allocation not stated"] : []),
          ...(!hasOutcomes
            ? ["Impact/outcomes of pupil premium spending not detailed"]
            : []),
        ],
        recommendations: [],
        redFlags: [],
        confidence: 0.8,
      };
    }

    if (hasStrategy) {
      return {
        status: "partial",
        complianceScore: 40,
        qualityScore: 2,
        clarityScore: 2,
        evidenceQuotes: [`Pupil premium mentioned on ${foundUrl}`],
        gaps: [
          "Pupil premium strategy needs more detail — allocation, spending breakdown, and impact",
        ],
        recommendations: [
          "Use the DfE pupil premium strategy statement template to ensure all statutory elements are covered",
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
      gaps: ["No pupil premium strategy found"],
      recommendations: [
        "Publish a pupil premium strategy statement using the DfE template",
      ],
      redFlags: ["Missing statutory pupil premium strategy"],
      confidence: 0.9,
    };
  },
};

export const peSportPremiumExpert: ComplianceExpert = {
  config: {
    requirementKeys: ["pe_sport_premium"],
    piiMode: "no_mask",
    needsAI: false,
  },

  async assess(match: StructuralMatch): Promise<ExpertResult> {
    let hasContent = false;
    let hasAmount = false;
    let hasSpending = false;
    let foundUrl = "";
    const evidence: string[] = [];

    for (const page of match.matchingPages) {
      const contentLower = (page.content || "").toLowerCase();

      if (
        contentLower.includes("sport premium") ||
        contentLower.includes("sports premium") ||
        contentLower.includes("pe premium") ||
        contentLower.includes("pe and sport") ||
        contentLower.includes("pe & sport") ||
        (contentLower.includes("physical education") &&
          contentLower.includes("premium")) ||
        (page.url.toLowerCase().includes("sport") &&
          page.url.toLowerCase().includes("premium"))
      ) {
        hasContent = true;
        foundUrl = foundUrl || page.url;

        if (/£[\d,]+/.test(page.content || "")) {
          hasAmount = true;
          evidence.push("Funding amount found");
        }

        if (
          contentLower.includes("spending") ||
          contentLower.includes("expenditure") ||
          contentLower.includes("how we") ||
          contentLower.includes("used for")
        ) {
          hasSpending = true;
          evidence.push("Spending details found");
        }
      }
    }

    if (hasContent && hasSpending) {
      const score = 75 + (hasAmount ? 25 : 0);
      return {
        status: "compliant",
        complianceScore: score,
        qualityScore: score >= 90 ? 4 : 3,
        clarityScore: 3,
        evidenceQuotes: [...evidence, `Found on ${foundUrl}`],
        gaps: !hasAmount ? ["PE/sport premium total not stated"] : [],
        recommendations: [],
        redFlags: [],
        confidence: 0.8,
      };
    }

    if (hasContent) {
      return {
        status: "partial",
        complianceScore: 40,
        qualityScore: 2,
        clarityScore: 2,
        evidenceQuotes: [`PE/sport premium mentioned on ${foundUrl}`],
        gaps: [
          "PE and sport premium spending breakdown and impact not detailed",
        ],
        recommendations: [
          "Detail how the PE and sport premium is spent and what impact it has had",
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
      gaps: ["No PE and sport premium information found"],
      recommendations: [
        "Publish PE and sport premium spending and impact (primary schools only)",
      ],
      redFlags: ["Missing statutory PE/sport premium information"],
      confidence: 0.9,
    };
  },
};

// Results experts — KS2, KS4, KS5
export const ks2ResultsExpert = createPolicyExpert(["ks2_results"]);
export const ks4ResultsExpert = createPolicyExpert(["ks4_results"]);
export const ks5ResultsExpert = createPolicyExpert(["ks5_results"]);

// Financial disclosure experts
export const highPayExpert = createPolicyExpert(["high_pay_disclosure"]);
export const academyAccountsExpert = createPolicyExpert(["academy_accounts"]);
export const genderPayGapExpert = createPolicyExpert(["gender_pay_gap"]);
export const offPayrollExpert = createPolicyExpert(["off_payroll_disclosure"]);
export const familyRelationshipsExpert = createPolicyExpert([
  "family_relationships_register",
]);
