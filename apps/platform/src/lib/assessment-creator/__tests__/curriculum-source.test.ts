import { describe, expect, it } from "vitest";
import { buildCurriculumUploadSummary, createOakCurriculumSource } from "../curriculum-source";

describe("curriculum source setup", () => {
  it("creates an Oak public-source upload target without naming it as a live scheme", () => {
    const source = createOakCurriculumSource();

    expect(source.name).toBe("Oak public curriculum sample");
    expect(source.provider).toBe("Public/open curriculum source");
    expect(source.source).toBe("public_framework");
    expect(source.status).toBe("needs_mapping");
    expect(source.coverageNote).toContain("Upload the downloaded Oak files");
    expect(source.coverageNote).not.toContain("White Rose");
  });

  it("summarises the accepted curriculum folder formats for teachers", () => {
    const summary = buildCurriculumUploadSummary(["curriculum.csv", "sequence.xlsx", "unit-overview.pdf"]);

    expect(summary.fileCount).toBe(3);
    expect(summary.acceptedTypes).toEqual(["CSV", "XLSX", "PDF"]);
    expect(summary.nextStep).toBe("Map uploaded content into a neutral school curriculum sequence before generating papers.");
  });
});
