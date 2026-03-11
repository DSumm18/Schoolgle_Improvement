/**
 * Expert: Curriculum Content
 *
 * Checks for curriculum information including subjects by year group.
 * Also covers phonics/reading, RE withdrawal, and careers.
 */

import type {
  ComplianceExpert,
  StructuralMatch,
  ExpertResult,
} from "./base-expert";
import { createPolicyExpert } from "./policy-presence";

export const curriculumContentExpert: ComplianceExpert = {
  config: {
    requirementKeys: ["curriculum_content"],
    piiMode: "no_mask",
    needsAI: false,
  },

  async assess(match: StructuralMatch): Promise<ExpertResult> {
    let hasCurriculumPage = false;
    let hasSubjectInfo = false;
    let hasYearGroupBreakdown = false;
    let foundUrl = "";
    const evidence: string[] = [];

    const subjectKeywords = [
      "english",
      "maths",
      "mathematics",
      "science",
      "history",
      "geography",
      "art",
      "music",
      "computing",
      "pe",
      "physical education",
      "design technology",
      "d&t",
      "pshe",
      "modern foreign languages",
      "mfl",
      "french",
      "spanish",
    ];

    const yearKeywords = [
      "year 1",
      "year 2",
      "year 3",
      "year 4",
      "year 5",
      "year 6",
      "reception",
      "eyfs",
      "ks1",
      "ks2",
      "key stage",
    ];

    for (const page of match.matchingPages) {
      const contentLower = (page.content || "").toLowerCase();

      if (contentLower.includes("curriculum")) {
        hasCurriculumPage = true;
        foundUrl = foundUrl || page.url;

        const subjectsFound = subjectKeywords.filter((s) =>
          contentLower.includes(s),
        );
        if (subjectsFound.length >= 3) {
          hasSubjectInfo = true;
          evidence.push(`${subjectsFound.length} subjects mentioned`);
        }

        const yearsFound = yearKeywords.filter((y) => contentLower.includes(y));
        if (yearsFound.length >= 2) {
          hasYearGroupBreakdown = true;
          evidence.push("Year group / key stage breakdown found");
        }
      }
    }

    if (hasCurriculumPage && hasSubjectInfo) {
      const score = 70 + (hasYearGroupBreakdown ? 30 : 0);
      return {
        status: "compliant",
        complianceScore: score,
        qualityScore: score >= 90 ? 4 : 3,
        clarityScore: hasYearGroupBreakdown ? 4 : 3,
        evidenceQuotes: [...evidence, `Found on ${foundUrl}`],
        gaps: hasYearGroupBreakdown
          ? []
          : ["Curriculum content by year group not clearly broken down"],
        recommendations: hasYearGroupBreakdown
          ? []
          : [
              "Break down curriculum content by year group or key stage for parent clarity",
            ],
        redFlags: [],
        confidence: 0.8,
      };
    }

    if (hasCurriculumPage) {
      return {
        status: "partial",
        complianceScore: 40,
        qualityScore: 2,
        clarityScore: 2,
        evidenceQuotes: [`Curriculum page found at ${foundUrl}`],
        gaps: [
          "Curriculum page lacks subject details and year group breakdown",
        ],
        recommendations: [
          "List all subjects taught with content details for each year group or key stage",
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
      gaps: ["No curriculum information found on the website"],
      recommendations: [
        "Publish curriculum content for each year group/key stage (statutory under School Information Regulations)",
      ],
      redFlags: ["Missing statutory curriculum information"],
      confidence: 0.9,
    };
  },
};

export const phonicsReadingExpert = createPolicyExpert(["phonics_reading"]);
export const reWithdrawalExpert = createPolicyExpert(["re_withdrawal"]);
export const careersProgrammeExpert = createPolicyExpert(["careers_programme"]);
export const providerAccessExpert = createPolicyExpert(["provider_access"]);
