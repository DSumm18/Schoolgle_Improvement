/**
 * Expert: Policy Presence (Generic)
 *
 * Reusable structural expert for checking whether a policy document exists.
 * Covers: behaviour, complaints, charging & remissions, uniform, whistleblowing,
 * RSE, online safety, safeguarding, and any other "does this policy exist?" check.
 *
 * Each policy has specific keywords and document patterns defined in requirements.ts.
 * This expert checks whether the structural match found actual policy content
 * (not just a passing mention).
 */

import type {
  ComplianceExpert,
  StructuralMatch,
  ExpertResult,
} from "./base-expert";

/** Minimum content length to consider a page as containing the actual policy */
const MIN_POLICY_LENGTH = 500;

/**
 * Create a policy presence expert for one or more requirement keys.
 * This factory avoids repeating the same logic for each policy type.
 */
export function createPolicyExpert(
  requirementKeys: string[],
): ComplianceExpert {
  return {
    config: {
      requirementKeys,
      piiMode: "no_mask",
      needsAI: false,
    },

    async assess(match: StructuralMatch): Promise<ExpertResult> {
      const req = match.requirement;
      const pages = match.matchingPages;

      if (pages.length === 0) {
        return {
          status: "not_found",
          complianceScore: 0,
          qualityScore: 0,
          clarityScore: 0,
          evidenceQuotes: [],
          gaps: [`${req.name} not found on the school website`],
          recommendations: [
            `Publish ${req.name} on the school website (${req.legislation.join(", ")})`,
          ],
          redFlags:
            req.severity === "statutory"
              ? [`Missing statutory requirement: ${req.name}`]
              : [],
          confidence: 0.9,
        };
      }

      // Check for actual policy content vs just a mention
      let hasPolicyDocument = false;
      let hasPolicyLink = false;
      let bestPageUrl = pages[0].url;
      let contentLength = 0;
      const evidenceQuotes: string[] = [];

      for (const page of pages) {
        const content = page.content || "";
        const contentLower = content.toLowerCase();
        const titleLower = (page.title || "").toLowerCase();
        const urlLower = page.url.toLowerCase();

        // PDFs from Drive that matched structurally are very likely the actual policy
        const isPDF =
          urlLower.includes("drive.google.com") ||
          urlLower.endsWith(".pdf") ||
          urlLower.includes("/file/d/");

        // Check if this page IS the policy (substantial content)
        const keywordHits = req.searchKeywords.filter((kw) =>
          contentLower.includes(kw.toLowerCase()),
        );

        // Also check if the title matches document patterns (handles failed PDF extraction)
        const titleMatchesDocPattern = req.documentPatterns.some((dp) =>
          titleLower.includes(dp.toLowerCase()),
        );

        // Be more lenient with PDFs (1 keyword + 200 chars vs 2 keywords + 500 chars)
        const minKeywords = isPDF ? 1 : 2;
        const minLength = isPDF ? 200 : MIN_POLICY_LENGTH;

        if (keywordHits.length >= minKeywords && content.length > minLength) {
          hasPolicyDocument = true;
          bestPageUrl = page.url;
          contentLength = content.length;

          // Extract a snippet showing the policy is present
          const firstKeyword = keywordHits[0].toLowerCase();
          const idx = contentLower.indexOf(firstKeyword);
          if (idx >= 0) {
            const snippet = content
              .substring(Math.max(0, idx - 50), idx + 200)
              .trim();
            evidenceQuotes.push(snippet.substring(0, 200));
          }
          break;
        }

        // If PDF extraction failed but the title clearly identifies the document
        if (isPDF && titleMatchesDocPattern && !hasPolicyDocument) {
          hasPolicyLink = true;
          bestPageUrl = page.url;
          evidenceQuotes.push(
            `PDF document titled "${page.title}" matches expected policy (content extraction failed)`,
          );
        }

        // Check if there's a link to the policy (PDF or external)
        if (match.documentLinksFound.length > 0 && !hasPolicyLink) {
          hasPolicyLink = true;
          bestPageUrl = page.url;
          evidenceQuotes.push(`Document link: ${match.documentLinksFound[0]}`);
        }
      }

      if (hasPolicyDocument) {
        // Score based on how substantial the content is
        const lengthScore = Math.min(contentLength / 2000, 1); // Full marks at 2000+ chars
        const complianceScore = Math.round(70 + lengthScore * 30);

        return {
          status: "compliant",
          complianceScore,
          qualityScore: complianceScore >= 90 ? 4 : 3,
          clarityScore: 3,
          evidenceQuotes: [
            ...evidenceQuotes,
            `Found on ${bestPageUrl} (${contentLength} chars)`,
          ],
          gaps: [],
          recommendations: [],
          redFlags: [],
          confidence: 0.85,
        };
      }

      if (hasPolicyLink) {
        return {
          status: "compliant",
          complianceScore: 75,
          qualityScore: 3,
          clarityScore: 3,
          evidenceQuotes: [
            ...evidenceQuotes,
            `Policy linked from ${bestPageUrl}`,
          ],
          gaps: [],
          recommendations: [],
          redFlags: [],
          confidence: 0.8,
        };
      }

      // Pages matched but weak evidence — partial
      return {
        status: "partial",
        complianceScore: 40,
        qualityScore: 2,
        clarityScore: 2,
        evidenceQuotes: [
          `${req.name} keywords found but no clear policy document or link identified`,
        ],
        gaps: [
          `${req.name} is mentioned but the full policy content could not be confirmed`,
        ],
        recommendations: [
          `Ensure the full ${req.name} is published as a page or downloadable document`,
        ],
        redFlags: [],
        confidence: 0.6,
      };
    },
  };
}

// Pre-built policy experts for common requirement keys
export const behaviourPolicyExpert = createPolicyExpert(["behaviour_policy"]);
export const complaintsProcedureExpert = createPolicyExpert([
  "complaints_procedure",
]);
export const chargingRemissionsExpert = createPolicyExpert([
  "charging_remissions",
]);
export const uniformPolicyExpert = createPolicyExpert(["uniform_policy"]);
export const whistleblowingExpert = createPolicyExpert(["whistleblowing"]);
export const rsePolicyExpert = createPolicyExpert(["rse_policy"]);
export const onlineSafetyExpert = createPolicyExpert(["online_safety_policy"]);
export const filteringMonitoringExpert = createPolicyExpert([
  "filtering_monitoring",
]);
