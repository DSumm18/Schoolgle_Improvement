import { describe, expect, it } from "vitest";
import { getTrainingComplianceTone, summarizeTrainingCompliance } from "./training-compliance";

describe("training-compliance helpers", () => {
  it("summarizes categories into actionable totals", () => {
    const summary = summarizeTrainingCompliance([
      {
        expired_count: 2,
        expiring_soon_count: 1,
        never_completed_count: 3,
        compliant: 4,
      },
      {
        expired_count: 0,
        expiring_soon_count: 2,
        never_completed_count: 0,
        compliant: 8,
      },
    ]);

    expect(summary).toEqual({
      expired: 2,
      expiringSoon: 3,
      neverCompleted: 3,
      compliant: 12,
      actionRequired: 8,
    });
  });

  it("classifies compliance percentages for UI status", () => {
    expect(getTrainingComplianceTone(95)).toBe("strong");
    expect(getTrainingComplianceTone(75)).toBe("watch");
    expect(getTrainingComplianceTone(40)).toBe("risk");
  });
});
