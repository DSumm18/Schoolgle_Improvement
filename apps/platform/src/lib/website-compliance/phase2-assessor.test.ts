import { describe, expect, it } from "vitest";
import { __phase2AssessorTestables } from "./phase2-assessor";

describe("phase 2 evidence URL ranking", () => {
  it("prioritises the dedicated phonics page over generic reading and oEmbed URLs", () => {
    const sorted =
      __phase2AssessorTestables.sortEvidenceUrlsForRequirement(
        [
          "https://grovehouseprimary.co.uk/reading",
          "https://grovehouseprimary.co.uk/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fgrovehouseprimary.co.uk%2Flearning%2Fphonics%2F",
          "https://grovehouseprimary.co.uk/learning/phonics",
          "https://grovehouseprimary.co.uk/wp-content/uploads/2023/03/Parent-video_-What-is-Read-Write-Inc-Phonics.mp4",
        ],
        {
          key: "phonics_reading",
          urlPatterns: [
            "/learning/phonics",
            "/phonics",
            "/curriculum/phonics",
            "/curriculum/reading",
            "/reading",
          ],
          documentPatterns: ["Reading Policy", "Phonics Policy"],
        },
      );

    expect(sorted[0]).toBe("https://grovehouseprimary.co.uk/learning/phonics");
    expect(sorted.at(-1)).toContain("/wp-json/oembed/");
  });

  it("prioritises the main curriculum page over a single-subject curriculum PDF", () => {
    const sorted =
      __phase2AssessorTestables.sortEvidenceUrlsForRequirement(
        [
          "https://grovehouseprimary.co.uk/wp-content/uploads/2026/01/M_Religion-and-worldview-Condensed-Parent-Curriculum-overview-27.07.25.pdf",
          "https://grovehouseprimary.co.uk/the-grove-house-curriculum",
          "https://grovehouseprimary.co.uk/learning/phonics",
        ],
        {
          key: "curriculum_content",
          urlPatterns: [
            "/curriculum",
            "/learning",
            "/subjects",
            "/teaching-and-learning",
            "/parents/curriculum",
          ],
          documentPatterns: [
            "Curriculum Overview",
            "Long Term Plan",
            "Curriculum Map",
          ],
        },
      );

    expect(sorted[0]).toBe(
      "https://grovehouseprimary.co.uk/the-grove-house-curriculum",
    );
  });
});
