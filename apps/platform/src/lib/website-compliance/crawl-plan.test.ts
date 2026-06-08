import { describe, expect, it } from "vitest";
import type { CrawledPage } from "../website-crawler";
import {
  buildAllowedExternalDomains,
  buildPublicEvidenceSeeds,
  buildSchoolEvidenceSeedUrls,
  buildTrustSeedUrls,
  classifyEvidenceLink,
  normaliseHostname,
} from "./crawl-plan";

function page(overrides: Partial<CrawledPage>): CrawledPage {
  return {
    url: "https://grovehouseprimary.co.uk/",
    title: "Grove House Primary School",
    content: "",
    headings: [],
    links: [],
    contentType: "html",
    crawledAt: "2026-05-15T00:00:00.000Z",
    metadata: {},
    ...overrides,
  };
}

describe("crawl-plan", () => {
  it("normalises hostnames for matching", () => {
    expect(normaliseHostname("https://www.paymat.org/governance")).toBe(
      "paymat.org",
    );
    expect(normaliseHostname("WWW.GROVEHOUSEPRIMARY.CO.UK")).toBe(
      "grovehouseprimary.co.uk",
    );
  });

  it("builds targeted trust seed URLs including PAYMAT policy paths", () => {
    const seeds = buildTrustSeedUrls("https://paymat.org/");

    expect(seeds).toContain(
      "https://paymat.org/governance/policies-and-statements",
    );
    expect(seeds).toContain(
      "https://paymat.org/governance/governance-structure",
    );
    expect(seeds).not.toContain("https://paymat.org/policies");
    expect(new Set(seeds).size).toBe(seeds.length);
  });

  it("always seeds statutory school pages before sitemap ordering can exclude them", () => {
    expect(buildSchoolEvidenceSeedUrls("https://grovehouseprimary.co.uk/")).toEqual(
      expect.arrayContaining([
        "https://grovehouseprimary.co.uk/policies-and-documents",
        "https://grovehouseprimary.co.uk/key-information",
        "https://grovehouseprimary.co.uk/send",
        "https://grovehouseprimary.co.uk/safeguarding",
      ]),
    );
  });

  it("seeds curriculum subject pages because school sites often omit them from sitemaps", () => {
    expect(buildSchoolEvidenceSeedUrls("https://grovehouseprimary.co.uk/")).toEqual(
      expect.arrayContaining([
        "https://grovehouseprimary.co.uk/the-grove-house-curriculum",
        "https://grovehouseprimary.co.uk/reading",
        "https://grovehouseprimary.co.uk/learning/phonics",
        "https://grovehouseprimary.co.uk/learning-maths",
      ]),
    );
  });

  it("classifies public evidence links without treating analytics or socials as evidence", () => {
    expect(
      classifyEvidenceLink(
        "https://paymat.org/governance/policies-and-statements",
        "https://grovehouseprimary.co.uk/",
      ),
    ).toEqual({
      url: "https://paymat.org/governance/policies-and-statements",
      hostname: "paymat.org",
      kind: "trust_site",
      score: expect.any(Number),
    });

    expect(
      classifyEvidenceLink(
        "https://drive.google.com/file/d/example/view",
        "https://grovehouseprimary.co.uk/",
      )?.kind,
    ).toBe("public_document");

    expect(
      classifyEvidenceLink(
        "https://www.google-analytics.com/analytics.js",
        "https://grovehouseprimary.co.uk/",
      ),
    ).toBeNull();
    expect(
      classifyEvidenceLink(
        "https://twitter.com/grovehousePAY",
        "https://grovehouseprimary.co.uk/",
      ),
    ).toBeNull();
  });

  it("deduplicates and ranks evidence seeds found on school pages", () => {
    const seeds = buildPublicEvidenceSeeds(
      [
        page({
          links: [
            "https://www.google-analytics.com/",
            "https://paymat.org/",
            "https://paymat.org/governance/policies-and-statements",
            "https://paymat.org/governance/policies-and-statements",
            "https://drive.google.com/file/d/1pMLn7AiOXt112_Rbf78Rw4vhP-H0uZZr/view",
            "https://grovehouseprimary.co.uk/wp-content/uploads/2023/11/Grove-House-Primary-School-Ofsted-Report-October-2023.pdf",
          ],
        }),
      ],
      "https://grovehouseprimary.co.uk/",
      { limit: 10 },
    );

    expect(seeds).toEqual([
      "https://paymat.org/governance/policies-and-statements",
      "https://drive.google.com/file/d/1pMLn7AiOXt112_Rbf78Rw4vhP-H0uZZr/view",
      "https://paymat.org/",
    ]);
  });

  it("builds allowed external domains from trust domains and evidence seeds", () => {
    expect(
      buildAllowedExternalDomains(
        new Set(["www.paymat.org", "sites.google.com"]),
        [
          "https://drive.google.com/file/d/example/view",
          "https://reports.ofsted.gov.uk/provider/21/148201",
          "https://grovehouseprimary.co.uk/wp-content/uploads/report.pdf",
        ],
        "https://grovehouseprimary.co.uk/",
      ),
    ).toEqual([
      "paymat.org",
      "sites.google.com",
      "drive.google.com",
      "reports.ofsted.gov.uk",
    ]);
  });
});
