import { describe, expect, it } from "vitest";
import { peSportPremiumExpert } from "./experts/funding-results";
import type { StructuralMatch } from "./experts/base-expert";

function makePeSportMatch(content: string): StructuralMatch {
  return {
    requirement: {
      key: "pe_sport_premium",
      name: "PE & Sport Premium",
      description: "PE and sport premium report",
      legislation: ["PE and Sport Premium Conditions of Grant"],
      searchKeywords: ["sport premium", "sports grant"],
      urlPatterns: ["/current-year-pe-sports-premium"],
      documentPatterns: ["Sports Grant Report"],
      complianceCriteria: [],
      qualityCriteria: [],
      redFlags: [],
      category: "pe_sport_premium",
      severity: "statutory",
    },
    matchingPages: [
      {
        url: "https://grovehouseprimary.co.uk/current-year-pe-sports-premium/",
        title: "Current Year PE & Sports Premium",
        content:
          "Spending details, swimming data and impact outcomes for PE and sport participation.",
        contentType: "html",
      },
      {
        url: "https://grovehouseprimary.co.uk/wp-content/uploads/2025/11/Grove-24-25-PE-Sports-Grant-Report.pdf",
        title: "Grove 24-25 PE& Sports Grant Report",
        content,
        contentType: "pdf",
      },
    ],
    keywordsFound: ["sports grant"],
    datesFound: ["24-25"],
    documentLinksFound: [],
  };
}

describe("PE sport premium expert", () => {
  it("does not create a failure gap when the current report exists but PDF extraction is limited", async () => {
    const result = await peSportPremiumExpert.assess(
      makePeSportMatch("Grove 24-25 PE& Sports Grant Report"),
      null,
    );

    expect(result?.status).toBe("compliant");
    expect(result?.gaps).not.toContain(
      "PE/sport premium total amount not stated",
    );
    expect(result?.recommendations.join(" ")).not.toContain(
      "achieve full compliance",
    );
    expect(result?.evidenceQuotes.join(" ")).toContain(
      "Funding amount not machine-verified",
    );
  });
});
