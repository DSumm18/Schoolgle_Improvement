/**
 * Expert: Contact Details
 *
 * Checks for school contact information: address, phone, email.
 * Structural check — no AI needed.
 */

import type {
  ComplianceExpert,
  StructuralMatch,
  ExpertResult,
} from "./base-expert";

// Broader phone pattern — also match 5-digit or 6-digit suffixes common in UK landlines
const PHONE_PATTERN =
  /(?:\+44\s?(?:\(0\))?\s?|0)(?:1\d{3,4}|2\d{2,3}|3\d{2,3})[\s.-]?\d{3,6}[\s.-]?\d{0,4}/g;
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const POSTCODE_PATTERN = /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/gi;

export const contactDetailsExpert: ComplianceExpert = {
  config: {
    requirementKeys: ["contact_details"],
    piiMode: "no_mask",
    needsAI: false,
  },

  async assess(match: StructuralMatch): Promise<ExpertResult> {
    let hasPhone = false;
    let hasEmail = false;
    let hasAddress = false;
    const evidence: string[] = [];
    let foundUrl = "";

    // Contact details are often in headers/footers of every page,
    // so also check the homepage and /contact if not already in matchingPages
    const pagesToCheck = [...match.matchingPages];

    for (const page of pagesToCheck) {
      const content = page.content || "";

      const phones = content.match(PHONE_PATTERN);
      if (phones && phones.length > 0) {
        hasPhone = true;
        evidence.push(`Phone: ${phones[0]}`);
        foundUrl = foundUrl || page.url;
      }

      const emails = content.match(EMAIL_PATTERN);
      if (emails && emails.length > 0) {
        // Filter out common non-school emails
        const schoolEmails = emails.filter(
          (e) =>
            !e.includes("noreply") &&
            !e.includes("wordpress") &&
            !e.includes("google"),
        );
        if (schoolEmails.length > 0) {
          hasEmail = true;
          evidence.push(`Email: ${schoolEmails[0]}`);
          foundUrl = foundUrl || page.url;
        }
      }

      const postcodes = content.match(POSTCODE_PATTERN);
      if (postcodes && postcodes.length > 0) {
        hasAddress = true;
        evidence.push(`Postcode found: ${postcodes[0]}`);
        foundUrl = foundUrl || page.url;
      }
    }

    const score =
      (hasPhone ? 35 : 0) + (hasEmail ? 35 : 0) + (hasAddress ? 30 : 0);

    if (score >= 70) {
      return {
        status: "compliant",
        complianceScore: score,
        qualityScore: score === 100 ? 5 : 4,
        clarityScore: 4,
        evidenceQuotes: [...evidence, `Found on ${foundUrl}`],
        gaps: [
          ...(!hasPhone ? ["School phone number not found"] : []),
          ...(!hasEmail ? ["School email address not found"] : []),
          ...(!hasAddress ? ["School postal address not found"] : []),
        ],
        recommendations: [],
        redFlags: [],
        confidence: 0.9,
      };
    }

    if (score > 0) {
      return {
        status: "partial",
        complianceScore: score,
        qualityScore: 2,
        clarityScore: 2,
        evidenceQuotes: evidence,
        gaps: [
          ...(!hasPhone ? ["School phone number not found"] : []),
          ...(!hasEmail ? ["School email address not found"] : []),
          ...(!hasAddress ? ["School postal address/postcode not found"] : []),
        ],
        recommendations: [
          "Publish full contact details including postal address, phone number, and email on a dedicated Contact page",
        ],
        redFlags: [],
        confidence: 0.85,
      };
    }

    return {
      status: "not_found",
      complianceScore: 0,
      qualityScore: 0,
      clarityScore: 0,
      evidenceQuotes: [],
      gaps: ["No school contact details (address, phone, email) found"],
      recommendations: [
        "Create a Contact page with full postal address, phone number, and email address",
      ],
      redFlags: ["Missing statutory contact information"],
      confidence: 0.9,
    };
  },
};
