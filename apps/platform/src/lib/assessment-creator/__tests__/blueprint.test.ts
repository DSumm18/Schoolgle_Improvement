import { describe, expect, it } from "vitest";
import { buildAssessmentBlueprint, DEFAULT_BLEND, normaliseBlend } from "../blueprint";

describe("Assessment Creator blueprint", () => {
  it("uses the default 60/25/10/5 blend", () => {
    expect(DEFAULT_BLEND).toEqual({
      taughtCurriculum: 60,
      nationalExpectation: 25,
      retention: 10,
      statutoryReadiness: 5,
    });
  });

  it("normalises an edited blend to total 100", () => {
    expect(
      normaliseBlend({
        taughtCurriculum: 30,
        nationalExpectation: 30,
        retention: 30,
        statutoryReadiness: 30,
      }),
    ).toEqual({
      taughtCurriculum: 25,
      nationalExpectation: 25,
      retention: 25,
      statutoryReadiness: 25,
    });
  });

  it("builds a low-pressure retention check without statutory warnings", () => {
    const blueprint = buildAssessmentBlueprint({
      organizationId: "org-1",
      schoolId: "school-1",
      classId: "class-1",
      subject: "maths",
      yearGroup: "Year 5",
      term: "Spring 1",
      mode: "retention_check",
      taughtObjectives: [
        { id: "fractions", label: "Compare and order fractions", strand: "Fractions", yearGroup: "Year 5" },
      ],
    });

    expect(blueprint.status).toBe("blueprint_review");
    expect(blueprint.pressureRating).toBeLessThanOrEqual(2);
    expect(blueprint.objectives.some((objective) => objective.source === "prior_learning")).toBe(true);
    expect(blueprint.warnings).not.toContain("Statutory readiness is high-pressure; use sparingly.");
  });
});
