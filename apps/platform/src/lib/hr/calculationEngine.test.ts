import { describe, expect, it } from "vitest";
import { calculateEntitlements } from "./calculationEngine";

describe("calculateEntitlements", () => {
  it("uses 2026/27 statutory parental pay and lower earnings limit", () => {
    const results = calculateEntitlements({
      role: "teacher",
      schoolType: "maintained",
      serviceYears: 2,
      serviceMonths: 0,
      laServiceYears: 2,
      laServiceMonths: 0,
      academyPolicy: "statutory",
      annualSalary: 1000,
      isAnnualised: "yes",
      leaveType: "maternity",
      ewcOrPlacementDate: "2026-08-01",
      leaveStartDate: "2026-08-01",
      returnIntent: "yes",
      splMotherWeeksTaken: 10,
      splPartnerWeeksToTake: 12,
    });

    expect(results.eligibility.statutoryPayEligible).toBe(false);
    expect(results.eligibility.statutoryPayReason).toContain("£19.18");
    expect(results.eligibility.statutoryPayReason).toContain(
      "Lower Earnings Limit",
    );

    const standardRateResults = calculateEntitlements({
      role: "teacher",
      schoolType: "maintained",
      serviceYears: 2,
      serviceMonths: 0,
      laServiceYears: 2,
      laServiceMonths: 0,
      academyPolicy: "statutory",
      annualSalary: 40000,
      isAnnualised: "yes",
      leaveType: "paternity",
      ewcOrPlacementDate: "2026-08-01",
      leaveStartDate: "2026-08-01",
      returnIntent: "yes",
      splMotherWeeksTaken: 10,
      splPartnerWeeksToTake: 12,
    });

    expect(standardRateResults.paySchedule[0].amount).toBe(194.32);
  });
});
