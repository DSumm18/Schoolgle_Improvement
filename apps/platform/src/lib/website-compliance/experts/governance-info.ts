/**
 * Expert: Governance Information
 *
 * Checks for governance structure, governor names, attendance records,
 * and pecuniary interests.
 * Uses preserve_names PII mode.
 */

import type {
  ComplianceExpert,
  StructuralMatch,
  ExpertResult,
} from "./base-expert";

export const governanceInfoExpert: ComplianceExpert = {
  config: {
    requirementKeys: ["governance_information"],
    piiMode: "preserve_names",
    needsAI: false,
  },

  async assess(match: StructuralMatch): Promise<ExpertResult> {
    let hasGovernorNames = false;
    let hasStructure = false;
    let hasAttendance = false;
    let hasPecuniaryInterests = false;
    let foundUrl = "";
    const evidence: string[] = [];

    for (const page of match.matchingPages) {
      const content = page.content || "";
      const contentLower = content.toLowerCase();

      // Governor names (look for multiple capitalised names near governance keywords)
      if (
        contentLower.includes("governor") ||
        contentLower.includes("trustee") ||
        contentLower.includes("governing body") ||
        contentLower.includes("local advisory")
      ) {
        foundUrl = foundUrl || page.url;

        // Check for structure info
        if (
          contentLower.includes("chair") ||
          contentLower.includes("vice chair") ||
          contentLower.includes("committee")
        ) {
          hasStructure = true;
          evidence.push("Governance structure found");
        }

        // Check for names — look for title + name pattern or just multiple capitalised names near governance keywords
        const names = content.match(
          /(?:Mrs?|Ms|Miss|Dr|Prof|Rev|Cllr)\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?/g,
        );
        if (names && names.length >= 3) {
          hasGovernorNames = true;
          evidence.push(`${names.length} governor/trustee names found`);
        }

        // Also check if there's a list of people (common in governance PDFs)
        const capitalNames = content.match(/[A-Z][a-z]+\s+[A-Z][a-z]+/g);
        if (!hasGovernorNames && capitalNames && capitalNames.length >= 5) {
          hasGovernorNames = true;
          evidence.push("Multiple names found in governance content");
        }

        // Check for attendance
        if (
          contentLower.includes("attendance") ||
          contentLower.includes("meeting") ||
          contentLower.includes("present")
        ) {
          hasAttendance = true;
          evidence.push("Attendance information found");
        }

        // Check for pecuniary/business interests
        if (
          contentLower.includes("pecuniary") ||
          contentLower.includes("business interest") ||
          contentLower.includes("register of interest") ||
          contentLower.includes("declaration of interest")
        ) {
          hasPecuniaryInterests = true;
          evidence.push("Register of interests found");
        }
      }
    }

    const components = [
      hasGovernorNames,
      hasStructure,
      hasAttendance,
      hasPecuniaryInterests,
    ];
    const found = components.filter(Boolean).length;
    const score = Math.round((found / 4) * 100);

    if (found >= 3) {
      return {
        status: "compliant",
        complianceScore: score,
        qualityScore: found === 4 ? 5 : 4,
        clarityScore: 4,
        evidenceQuotes: [...evidence, `Found on ${foundUrl}`],
        gaps: [
          ...(!hasGovernorNames ? ["Governor/trustee names not listed"] : []),
          ...(!hasStructure ? ["Governance structure not detailed"] : []),
          ...(!hasAttendance ? ["Governor attendance records not found"] : []),
          ...(!hasPecuniaryInterests
            ? ["Register of pecuniary interests not found"]
            : []),
        ],
        recommendations: [],
        redFlags: [],
        confidence: 0.85,
      };
    }

    if (found >= 1) {
      return {
        status: "partial",
        complianceScore: score,
        qualityScore: 2,
        clarityScore: 2,
        evidenceQuotes: [...evidence, `Found on ${foundUrl}`],
        gaps: [
          ...(!hasGovernorNames ? ["Governor/trustee names not listed"] : []),
          ...(!hasStructure ? ["Governance structure not detailed"] : []),
          ...(!hasAttendance ? ["Governor attendance records not found"] : []),
          ...(!hasPecuniaryInterests
            ? ["Register of pecuniary interests not found"]
            : []),
        ],
        recommendations: [
          "Publish full governance details: names, roles, committee structure, attendance records, and register of pecuniary interests",
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
      gaps: ["No governance information found on the website"],
      recommendations: [
        "Publish governance structure, governor names, attendance records, and pecuniary interests (statutory under School Information Regulations)",
      ],
      redFlags: ["Missing statutory governance information"],
      confidence: 0.9,
    };
  },
};
