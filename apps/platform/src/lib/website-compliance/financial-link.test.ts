import { describe, expect, it } from "vitest";
import { financialLinkExpert } from "./experts/financial-link";
import type { StructuralMatch } from "./experts/base-expert";
import { runStructuralMatching, type ScrapedContent } from "./phase2-assessor";
import { WEBSITE_COMPLIANCE_REQUIREMENTS } from "./requirements";

const legacyBenchmarkingLink =
  "https://schools-financial-benchmarking.service.gov.uk/School/Detail?urn=148201";
const currentBenchmarkingLink =
  "https://financial-benchmarking-and-insights-tool.education.gov.uk";

const requirement = WEBSITE_COMPLIANCE_REQUIREMENTS.find(
  (item) => item.key === "financial_benchmarking_link",
);

function makeMatch(links: string[]): StructuralMatch {
  if (!requirement) throw new Error("Missing financial benchmarking requirement");

  return {
    requirement: {
      key: requirement.key,
      name: requirement.name,
      description: requirement.description,
      legislation: requirement.legislation,
      searchKeywords: requirement.searchKeywords,
      urlPatterns: requirement.urlPatterns,
      documentPatterns: requirement.documentPatterns,
      complianceCriteria: requirement.complianceCriteria,
      qualityCriteria: requirement.qualityCriteria,
      redFlags: requirement.redFlags,
      category: requirement.category,
      severity: requirement.severity,
    },
    matchingPages: [
      {
        url: "https://grovehouseprimary.co.uk/",
        title: "Grove House Primary School",
        content: "School Financial Benchmarking",
        links,
      },
    ],
    keywordsFound: ["financial benchmarking"],
    datesFound: [],
    documentLinksFound: links,
  };
}

describe("financial benchmarking link assessment", () => {
  it("treats legacy school-specific benchmarking links as present but needing update", async () => {
    const result = await financialLinkExpert.assess(
      makeMatch([legacyBenchmarkingLink]),
      null,
    );

    expect(result?.status).toBe("partial");
    expect(result?.complianceScore).toBeGreaterThanOrEqual(60);
    expect(result?.evidenceQuotes.join(" ")).toContain(legacyBenchmarkingLink);
    expect(result?.recommendations.join(" ")).toContain(
      currentBenchmarkingLink,
    );
  });

  it("treats current FBIT links as compliant", async () => {
    const result = await financialLinkExpert.assess(
      makeMatch([currentBenchmarkingLink]),
      null,
    );

    expect(result?.status).toBe("compliant");
    expect(result?.evidenceQuotes.join(" ")).toContain(
      currentBenchmarkingLink,
    );
  });

  it("preserves outbound benchmarking links during structural matching", () => {
    if (!requirement) throw new Error("Missing financial benchmarking requirement");

    const content: ScrapedContent[] = [
      {
        id: "page-1",
        url: "https://grovehouseprimary.co.uk/",
        title: "Grove House Primary School",
        content: "Welcome to Grove House Primary School",
        contentType: "html",
        source: "school",
        wordCount: 6,
        headings: [],
        links: [legacyBenchmarkingLink],
      },
    ];

    const [match] = runStructuralMatching(content, [requirement]);

    expect(match.matchingContent).toHaveLength(1);
    expect(match.documentLinksFound).toContain(legacyBenchmarkingLink);
  });
});
