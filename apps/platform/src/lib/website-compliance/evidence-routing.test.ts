import { describe, expect, it } from "vitest";
import {
  routeWebsiteEvidenceItem,
  routeWebsiteEvidenceItems,
  summariseWebsiteEvidenceRoutes,
} from "./evidence-routing";

describe("website evidence routing", () => {
  it("uses found-on policy context to route safeguarding evidence to leadership and governance", () => {
    const route = routeWebsiteEvidenceItem({
      url: "https://drive.google.com/file/d/safeguarding-policy/view",
      title: "Safeguarding and Child Protection Policy 2025-26",
      linkText: "Safeguarding and Child Protection Policy 2025-26",
      foundOnPageUrl: "https://grovehouseprimary.co.uk/policies",
      foundOnPageTitle: "Policies and Documents",
      source: "school",
      text: "Keeping Children Safe in Education 2025 DSL Deputy DSL child protection filtering monitoring",
    });

    expect(route.ofstedCategoryId).toBe("leadership-governance");
    expect(route.subcategoryId).toBe("leadership-governance");
    expect(route.crossCuttingTags).toContain("safeguarding");
    expect(route.signals).toContain("document title matched safeguarding");
    expect(route.sourceUrl).toBe(
      "https://drive.google.com/file/d/safeguarding-policy/view",
    );
    expect(route.foundOnUrl).toBe("https://grovehouseprimary.co.uk/policies");
    expect(route.confidence).toBe("high");
  });

  it("routes SEND information report evidence to inclusion even when hosted by the trust", () => {
    const route = routeWebsiteEvidenceItem({
      url: "https://paymat.org/policies/send-information-report.pdf",
      title: "SEND Information Report 2024-25",
      linkText: "SEND Information Report",
      foundOnPageUrl: "https://grovehouseprimary.co.uk/send",
      foundOnPageTitle: "SEND",
      source: "trust",
      text: "SENCO graduated approach assess plan do review local offer special educational needs",
    });

    expect(route.ofstedCategoryId).toBe("inclusion");
    expect(route.subcategoryId).toBe("inclusion-send");
    expect(route.sourceOwner).toBe("trust");
    expect(route.requirementKey).toBe("send_information_report");
    expect(route.signals).toContain("found-on page matched send");
  });

  it("routes reading and phonics pages to curriculum and teaching", () => {
    const route = routeWebsiteEvidenceItem({
      url: "https://grovehouseprimary.co.uk/reading",
      title: "Reading and Phonics",
      headings: ["Early Reading", "Phonics", "Reading for Pleasure"],
      source: "school",
      text: "validated systematic synthetic phonics programme reading fluency curriculum",
    });

    expect(route.ofstedCategoryId).toBe("curriculum-teaching");
    expect(route.subcategoryId).toBe("curriculum-reading");
    expect(route.requirementKey).toBe("phonics_reading");
    expect(route.evidenceRole).toBe("direct");
  });

  it("routes attendance and behaviour policy documents to attendance and behaviour", () => {
    const route = routeWebsiteEvidenceItem({
      url: "https://grovehouseprimary.co.uk/wp-content/uploads/GHPS-Behaviour-Policy.pdf",
      title: "GHPS Behaviour Policy",
      foundOnPageUrl: "https://grovehouseprimary.co.uk/policies",
      source: "school",
      text: "positive behaviour attendance exclusions bullying suspension conduct",
    });

    expect(route.ofstedCategoryId).toBe("attendance-behaviour");
    expect(route.subcategoryId).toBe("behaviour-conduct");
    expect(route.requirementCategory).toBe("policies");
  });

  it("groups multiple routed sources by Ofsted category", () => {
    const routes = routeWebsiteEvidenceItems([
      {
        url: "https://grovehouseprimary.co.uk/send",
        title: "SEND",
        source: "school",
        text: "SENCO SEND special educational needs local offer",
      },
      {
        url: "https://grovehouseprimary.co.uk/key-information/pupil-premium",
        title: "Pupil Premium Strategy Statement",
        source: "school",
        text: "pupil premium disadvantaged pupils barriers strategy statement impact",
      },
      {
        url: "https://grovehouseprimary.co.uk/learning-maths",
        title: "Learning Maths",
        source: "school",
        text: "maths curriculum intent implementation progression",
      },
    ]);

    expect(routes.map((route) => route.ofstedCategoryId)).toEqual([
      "inclusion",
      "inclusion",
      "curriculum-teaching",
    ]);
  });

  it("summarises routed evidence without including low-confidence noise", () => {
    const routes = routeWebsiteEvidenceItems([
      {
        url: "https://grovehouseprimary.co.uk/policies",
        title: "Policies",
        source: "school",
      },
      {
        url: "https://grovehouseprimary.co.uk/send",
        title: "SEND",
        source: "school",
        text: "SENCO SEND special educational needs local offer",
      },
      {
        url: "https://paymat.org/governance/policies-and-statements",
        title: "PAYMAT Policies and Statements",
        source: "trust",
        text: "governance trustees policies complaints finance",
      },
    ]);

    const summary = summariseWebsiteEvidenceRoutes(routes);

    expect(summary.totalRoutes).toBe(2);
    expect(summary.byCategory).toEqual({
      inclusion: 1,
      "leadership-governance": 1,
    });
    expect(summary.bySourceOwner).toEqual({
      school: 1,
      trust: 1,
    });
    expect(summary.topRoutes).toHaveLength(2);
  });
});
