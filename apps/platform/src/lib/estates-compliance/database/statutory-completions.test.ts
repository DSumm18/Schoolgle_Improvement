import { describe, it, expect } from "vitest";
import { calculateNextDueDate } from "./statutory-completions";
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
