import { describe, expect, it } from "vitest";
import { analysePolicyReview } from "./policy-review-analyser";

describe("analysePolicyReview", () => {
  it("extracts next review dates from policy content and flags due within 30 days", () => {
    const result = analysePolicyReview({
      text: "Behaviour Policy\nApproved: 01 September 2025\nNext review date: 15 May 2026",
      defaultReviewCycle: "annual",
      asOf: new Date("2026-05-01T00:00:00Z"),
    });

    expect(result.extractedDates.nextReviewDate).toBe("2026-05-15");
    expect(result.status).toBe("due_30");
    expect(result.daysUntilDue).toBe(14);
    expect(result.tags).toContain("due-30-days");
  });

  it("derives the next review date from the last reviewed date and default cycle", () => {
    const result = analysePolicyReview({
      text: "Safeguarding Policy\nLast reviewed: 10 April 2025",
      defaultReviewCycle: "annual",
      asOf: new Date("2026-05-01T00:00:00Z"),
    });

    expect(result.extractedDates.lastReviewedDate).toBe("2025-04-10");
    expect(result.derivedNextReviewDate).toBe("2026-04-10");
    expect(result.status).toBe("overdue");
  });

  it("returns no_date when content does not contain enough review evidence", () => {
    const result = analysePolicyReview({
      text: "A policy with no front-page date table.",
      defaultReviewCycle: "annual",
      asOf: new Date("2026-05-01T00:00:00Z"),
    });

    expect(result.status).toBe("no_date");
    expect(result.confidence).toBe("low");
  });
});
