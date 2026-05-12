import { describe, it, expect } from "vitest";
import {
  calculateNextDueDate,
  normalizeCompletionUpdates,
} from "./statutory-completions";
import { getChecksForDomain, getAllStatutoryChecks } from "../statutory-checks";

describe("calculateNextDueDate", () => {
  it("returns tomorrow for daily frequency", () => {
    const result = calculateNextDueDate("daily");
    const expected = new Date();
    expected.setDate(expected.getDate() + 1);
    expect(result).toBe(expected.toISOString().split("T")[0]);
  });

  it("returns 7 days for weekly", () => {
    const result = calculateNextDueDate("weekly");
    const expected = new Date();
    expected.setDate(expected.getDate() + 7);
    expect(result).toBe(expected.toISOString().split("T")[0]);
  });

  it("returns 1 month for monthly", () => {
    const result = calculateNextDueDate("monthly");
    const expected = new Date();
    expected.setMonth(expected.getMonth() + 1);
    expect(result).toBe(expected.toISOString().split("T")[0]);
  });

  it("returns 3 months for quarterly", () => {
    const result = calculateNextDueDate("quarterly");
    const expected = new Date();
    expected.setMonth(expected.getMonth() + 3);
    expect(result).toBe(expected.toISOString().split("T")[0]);
  });

  it("can calculate from the inspection date", () => {
    expect(calculateNextDueDate("monthly", "2026-05-12")).toBe("2026-06-12");
    expect(calculateNextDueDate("annually", "2026-05-12")).toBe("2027-05-12");
  });
});

describe("normalizeCompletionUpdates", () => {
  it("drops non-column form fields and maps pending contractor status", () => {
    const updates = normalizeCompletionUpdates({
      status: "pending_contractor",
      completion_notes: "Contractor booked",
      inspection_date: "2026-05-12",
      next_due_date: "2026-06-12",
      evidence_ids: ["00000000-0000-0000-0000-000000000001"],
    } as any);

    expect(updates).toEqual({
      status: "in_progress",
      completion_notes: "Contractor booked",
      next_due_date: "2026-06-12",
      evidence_ids: ["00000000-0000-0000-0000-000000000001"],
    });
    expect(updates).not.toHaveProperty("inspection_date");
  });
});

describe("statutory checks integrity", () => {
  it("all checks have valid frequencies", () => {
    const validFreqs = [
      "hourly",
      "daily",
      "weekly",
      "monthly",
      "quarterly",
      "annually",
      "termly",
      "ad_hoc",
    ];
    const allChecks = getAllStatutoryChecks();
    expect(allChecks.length).toBeGreaterThan(40);
    for (const check of allChecks) {
      expect(validFreqs).toContain(check.frequency);
    }
  });

  it("all checks have required fields", () => {
    const allChecks = getAllStatutoryChecks();
    for (const check of allChecks) {
      expect(check.id).toBeTruthy();
      expect(check.domain).toBeTruthy();
      expect(check.name).toBeTruthy();
      expect(check.category).toBeTruthy();
    }
  });
});
