import { describe, expect, it } from "vitest";
import { harvestCurriculumSources } from "../curriculum-harvester";

describe("curriculum harvester", () => {
  it("recognises Grove House Year 6 maths long-term planning as a high-confidence curriculum source", () => {
    const result = harvestCurriculumSources({
      pages: [],
      documents: [
        {
          id: "doc-year-6-maths",
          url: "https://grovehouseprimary.co.uk/wp-content/uploads/2023/07/Year-6-maths.pdf",
          filename: "Year-6-maths.pdf",
          title: "Grove House Long Term Plan - 2023-2024",
          link_text: "Year 6 maths",
          found_on_page_url: "https://grovehouseprimary.co.uk/learning-maths/",
          file_type: "pdf",
          crawled_at: "2026-05-07T09:00:00.000Z",
          extracted_text:
            "Year 6 Mathematics Long Term Plan 2023-2024 Autumn 1 Place Value Addition, Subtraction, Multiplication & Division Autumn 2 Fractions A & Fractions B Ratio Algebra Spring 1 Measure Converting Units Decimals Fractions, Decimals & Percentages Spring 2 Area, Perimeter & Volume Statistics Summer 1 Shape Position & Direction SATs Week",
        },
      ],
    });

    expect(result.sourceCount).toBe(1);
    expect(result.highConfidenceCount).toBe(1);
    expect(result.subjects).toContain("Maths");
    expect(result.yearGroups).toContain("Year 6");
    expect(result.sources[0]).toMatchObject({
      reviewStatus: "ready_for_review",
      sourceLabel: "School website PDF",
    });
    expect(result.sources[0].confidence).toBeGreaterThanOrEqual(75);
    expect(result.sources[0].topicSignals).toEqual(
      expect.arrayContaining(["Place value", "Fractions", "Ratio", "Algebra", "Statistics"]),
    );
  });

  it("recognises Grove House Autumn 2 MTP as a source with subject, term, topic and prior-learning signals", () => {
    const result = harvestCurriculumSources({
      pages: [],
      documents: [
        {
          id: "doc-mtp-autumn-2",
          url: "https://grovehouseprimary.co.uk/wp-content/uploads/2025/10/Year-6-MTP-Autumn-2-2025-2026.pdf",
          filename: "Year-6-MTP-Autumn-2-2025-2026.pdf",
          title: "Year 6 MTP",
          link_text: "Year 6 MTP Autumn 2 2025-2026",
          found_on_page_url: "https://grovehouseprimary.co.uk/year-six/",
          file_type: "pdf",
          crawled_at: "2026-05-07T09:00:00.000Z",
          extracted_text:
            "Year 6 MTP Autumn 2 Maths use common factors to simplify fractions, compare and order fractions, add and subtract fractions, multiply proper fractions. Science The pathway of light. Links to prior learning Year 3 light. Geography latitude longitude Arctic Antarctic climate zones.",
        },
      ],
    });

    expect(result.sourceCount).toBe(1);
    expect(result.terms).toContain("Autumn 2");
    expect(result.sources[0].subjects).toEqual(expect.arrayContaining(["Maths", "Science", "Geography"]));
    expect(result.sources[0].curriculumSignals).toContain("medium term plan");
    expect(result.sources[0].curriculumSignals).toContain("prior learning");
    expect(result.recommendedNextAction).toContain("Review and approve");
  });

  it("keeps Grove House curriculum intent pages as likely sources but not as approved maps", () => {
    const result = harvestCurriculumSources({
      pages: [
        {
          id: "maths-page",
          url: "https://grovehouseprimary.co.uk/learning-maths/",
          title: "Maths - Grovehouse Primary School",
          crawled_at: "2026-05-07T09:00:00.000Z",
          extracted_text:
            "The curriculum we offer is bespoke to suit the needs of our pupils and our community but is built upon the principles of Teaching for Mastery and adapted from the White Rose Maths Scheme of Learning. Every lesson will incorporate opportunities for pupils to recap prior learning.",
        },
      ],
      documents: [],
    });

    expect(result.sourceCount).toBe(1);
    expect(result.sources[0].subjects).toContain("Maths");
    expect(result.sources[0].reviewStatus).toBe("ready_for_review");
    expect(result.sources[0].confidence).toBeLessThan(75);
    expect(result.sources[0].sourceNote).toContain("Needs a curriculum lead check");
  });

  it("filters out pages with no curriculum evidence", () => {
    const result = harvestCurriculumSources({
      pages: [
        {
          id: "contact-page",
          url: "https://grovehouseprimary.co.uk/contact-us/",
          title: "Contact Us",
          crawled_at: "2026-05-07T09:00:00.000Z",
          extracted_text: "Myers Lane, Bradford, West Yorkshire, office phone number and email address.",
        },
      ],
      documents: [],
    });

    expect(result.sourceCount).toBe(0);
    expect(result.recommendedNextAction).toContain("No curriculum sources found");
  });
});
