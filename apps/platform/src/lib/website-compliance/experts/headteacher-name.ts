/**
 * Expert: Headteacher Name
 *
 * Checks for the headteacher/principal name on the website.
 * Uses preserve_names PII mode so staff names aren't masked.
 * Structural check — no AI needed.
 */

import type {
  ComplianceExpert,
  StructuralMatch,
  ExpertResult,
} from "./base-expert";

const HEAD_PATTERNS = [
  /(?:Headteacher|Head\s*Teacher|Principal|Head\s*of\s*School|Executive\s*Head)[:\s]+(?:is\s+)?(?:Mrs?|Ms|Miss|Dr|Prof)\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?/gi,
  /(?:Mrs?|Ms|Miss|Dr|Prof)\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?,?\s+(?:Headteacher|Head\s*Teacher|Principal|Head\s*of\s*School)/gi,
  /(?:our|the|school'?s?)\s+(?:Headteacher|Head\s*Teacher|Principal)\s+(?:is\s+)?(?:Mrs?|Ms|Miss|Dr|Prof)\.?\s+[A-Z][a-z]+/gi,
  /(?:welcome\s+(?:from|message))[^.]{0,80}(?:Mrs?|Ms|Miss|Dr|Prof)\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?[^.]{0,40}(?:Headteacher|Head\s*Teacher|Principal)/gi,
];

export const headteacherNameExpert: ComplianceExpert = {
  config: {
    requirementKeys: ["headteacher_name"],
    piiMode: "preserve_names",
    needsAI: false,
  },

  async assess(match: StructuralMatch): Promise<ExpertResult> {
    let foundName = false;
    let nameEvidence = "";
    let foundUrl = "";

    for (const page of match.matchingPages) {
      const content = page.content || "";

      for (const pattern of HEAD_PATTERNS) {
        pattern.lastIndex = 0;
        const m = pattern.exec(content);
        if (m) {
          foundName = true;
          nameEvidence = m[0].trim();
          foundUrl = page.url;
          break;
        }
      }

      // Also check homepage / about pages for head's name
      if (!foundName) {
        const urlLower = page.url.toLowerCase();
        const contentLower = content.toLowerCase();
        if (
          (urlLower.includes("/about") ||
            urlLower.endsWith("/") ||
            urlLower.includes("/staff") ||
            urlLower.includes("/welcome")) &&
          (contentLower.includes("headteacher") ||
            contentLower.includes("head teacher") ||
            contentLower.includes("principal"))
        ) {
          const nameMatch = content.match(
            /(?:Mrs?|Ms|Miss|Dr|Prof)\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?/,
          );
          if (nameMatch) {
            foundName = true;
            nameEvidence = nameMatch[0].trim();
            foundUrl = page.url;
          }
        }
      }

      if (foundName) break;
    }

    if (foundName) {
      return {
        status: "compliant",
        complianceScore: 100,
        qualityScore: 4,
        clarityScore: 4,
        evidenceQuotes: [
          `Headteacher: ${nameEvidence}`,
          `Found on ${foundUrl}`,
        ],
        gaps: [],
        recommendations: [],
        redFlags: [],
        confidence: 0.9,
      };
    }

    // Check if role is mentioned without a detectable name
    const hasRoleMention = match.matchingPages.some((p) => {
      const cl = (p.content || "").toLowerCase();
      return (
        cl.includes("headteacher") ||
        cl.includes("head teacher") ||
        cl.includes("principal")
      );
    });

    if (hasRoleMention) {
      return {
        status: "partial",
        complianceScore: 50,
        qualityScore: 2,
        clarityScore: 2,
        evidenceQuotes: [
          "Headteacher role mentioned but specific name not clearly identified",
        ],
        gaps: ["Headteacher's name should be prominently displayed"],
        recommendations: [
          "Ensure the headteacher's full name (with title) is clearly visible, e.g. on the homepage or About page",
        ],
        redFlags: [],
        confidence: 0.75,
      };
    }

    return {
      status: "not_found",
      complianceScore: 0,
      qualityScore: 0,
      clarityScore: 0,
      evidenceQuotes: [],
      gaps: ["Headteacher name not found on the school website"],
      recommendations: [
        "Publish the headteacher's name prominently (statutory under School Information Regulations 2012)",
      ],
      redFlags: ["Missing statutory headteacher name"],
      confidence: 0.9,
    };
  },
};
