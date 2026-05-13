import { describe, expect, it } from "vitest";
import { scoreEvidenceConfidence } from "../confidence";

describe("evidence confidence", () => {
  it("returns high confidence for fresh, broad, reviewed evidence", () => {
    const result = scoreEvidenceConfidence({
      daysOld: 10,
      objectiveCoverage: 0.88,
      depthScore: 0.8,
      questionCountPerObjective: 3,
      markingReviewCompletion: 1,
      teacherOverrideRate: 0.08,
      responseCompleteness: 0.97,
      moderated: true,
      submittedJudgementMismatch: false,
    });

    expect(result.rating).toBe("high");
    expect(result.reasons).toContain("Evidence is recent.");
  });

  it("returns mismatch when submitted judgement materially differs from evidence", () => {
    const result = scoreEvidenceConfidence({
      daysOld: 7,
      objectiveCoverage: 0.9,
      depthScore: 0.85,
      questionCountPerObjective: 4,
      markingReviewCompletion: 1,
      teacherOverrideRate: 0.02,
      responseCompleteness: 0.99,
      moderated: true,
      submittedJudgementMismatch: true,
    });

    expect(result.rating).toBe("mismatch");
  });

  it("returns low confidence when review and coverage are weak", () => {
    const result = scoreEvidenceConfidence({
      daysOld: 100,
      objectiveCoverage: 0.25,
      depthScore: 0.2,
      questionCountPerObjective: 1,
      markingReviewCompletion: 0.4,
      teacherOverrideRate: 0.4,
      responseCompleteness: 0.6,
      moderated: false,
      submittedJudgementMismatch: false,
    });

    expect(result.rating).toBe("low");
  });
});
