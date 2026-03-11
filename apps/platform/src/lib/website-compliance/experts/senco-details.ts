/**
 * Expert: SENCO Details
 *
 * Checks for the SEN Coordinator's name and contact information.
 * Uses preserve_names PII mode so staff names aren't masked.
 * Structural check — no AI needed.
 */

import type {
  ComplianceExpert,
  StructuralMatch,
  ExpertResult,
} from "./base-expert";

const NAME_PATTERNS = [
  /(?:SENCO|SEN\s*Co|SEN\s*Coordinator|Special\s+Educational\s+Needs\s+Coordinator|SENDCo)[:\s]+(?:is\s+)?(?:Mrs?|Ms|Miss|Dr|Prof)\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?/gi,
  /(?:Mrs?|Ms|Miss|Dr|Prof)\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?,?\s+(?:who\s+is\s+)?(?:our\s+)?(?:SENCO|SENDCo|SEN\s*Coordinator)/gi,
  /(?:our|the|school'?s?)\s+(?:SENCO|SENDCo|SEN\s*Coordinator)\s+(?:is\s+)?(?:Mrs?|Ms|Miss|Dr|Prof)\.?\s+[A-Z][a-z]+/gi,
];

const CONTACT_PATTERNS = [
  /(?:SENCO|SEN|SEND|inclusion)[^.]{0,100}(?:01\d{3,4}[\s.-]?\d{5,7}|0[23]\d[\s.-]?\d{3,4}[\s.-]?\d{4})/gi,
  /(?:SENCO|SEN|SEND|inclusion)[^.]{0,100}[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
];

export const sencoDetailsExpert: ComplianceExpert = {
  config: {
    requirementKeys: ["senco_details"],
    piiMode: "preserve_names",
    needsAI: false,
  },

  async assess(match: StructuralMatch): Promise<ExpertResult> {
    let foundName = false;
    let foundContact = false;
    let nameEvidence = "";
    let contactEvidence = "";
    let foundUrl = "";

    for (const page of match.matchingPages) {
      const content = page.content || "";

      // Check for SENCO name
      for (const pattern of NAME_PATTERNS) {
        pattern.lastIndex = 0;
        const m = pattern.exec(content);
        if (m) {
          foundName = true;
          nameEvidence = m[0].trim();
          foundUrl = page.url;
          break;
        }
      }

      // Check for contact details near SENCO mention
      for (const pattern of CONTACT_PATTERNS) {
        pattern.lastIndex = 0;
        const m = pattern.exec(content);
        if (m) {
          foundContact = true;
          contactEvidence = m[0].trim();
          foundUrl = foundUrl || page.url;
          break;
        }
      }

      // Also check for SENCO keyword presence on /send or /sen pages
      if (!foundName) {
        const urlLower = page.url.toLowerCase();
        const contentLower = content.toLowerCase();
        if (
          (urlLower.includes("/send") ||
            urlLower.includes("/sen") ||
            urlLower.includes("/inclusion")) &&
          (contentLower.includes("senco") || contentLower.includes("sendco"))
        ) {
          // Page mentions SENCO — check for any staff name pattern
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
    }

    if (foundName && foundContact) {
      return {
        status: "compliant",
        complianceScore: 100,
        qualityScore: 5,
        clarityScore: 5,
        evidenceQuotes: [
          `SENCO name: ${nameEvidence}`,
          `Contact: ${contactEvidence}`,
          `Found on ${foundUrl}`,
        ],
        gaps: [],
        recommendations: [],
        redFlags: [],
        confidence: 0.95,
      };
    }

    if (foundName) {
      return {
        status: "compliant",
        complianceScore: 85,
        qualityScore: 4,
        clarityScore: 4,
        evidenceQuotes: [`SENCO name: ${nameEvidence}`, `Found on ${foundUrl}`],
        gaps: [
          "SENCO contact details (email or phone) not found near the SENCO mention",
        ],
        recommendations: [
          "Add direct contact details (email/phone) for the SENCO alongside their name",
        ],
        redFlags: [],
        confidence: 0.9,
      };
    }

    // Check if SENCO is mentioned at all without a name
    const hasMention = match.matchingPages.some((p) => {
      const cl = (p.content || "").toLowerCase();
      return (
        cl.includes("senco") ||
        cl.includes("sendco") ||
        cl.includes("sen coordinator")
      );
    });

    if (hasMention) {
      return {
        status: "partial",
        complianceScore: 40,
        qualityScore: 2,
        clarityScore: 2,
        evidenceQuotes: ["SENCO role mentioned but name not identified"],
        gaps: [
          "SENCO name must be published (Children and Families Act 2014)",
          "SENCO contact details should be easily findable",
        ],
        recommendations: [
          "Add the SENCO's name and direct contact details (e.g. 'Our SENCO is Miss Smith — email: senco@school.org')",
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
      gaps: ["No SENCO details found on the school website"],
      recommendations: [
        "Publish SENCO name and contact details on the SEND/inclusion page (statutory requirement under SEND Code of Practice 2015)",
      ],
      redFlags: ["Missing statutory SENCO details"],
      confidence: 0.9,
    };
  },
};
