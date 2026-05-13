import { describe, expect, it } from "vitest";
import { buildFinanceAssumptionCards } from "./finance-assumption-cards";

describe("buildFinanceAssumptionCards", () => {
  it("prioritises energy and explains seasonal utility weighting", () => {
    const cards = buildFinanceAssumptionCards([
      {
        cfr_code: "E16",
        description: "Gas and electricity",
        group: "Energy",
        budget: 48000,
        actual: 12000,
        committed: 0,
        variance: 0,
        variance_percent: 0,
        rag: "green",
        profile_name: "Energy",
        monthly_profile: [],
      },
      {
        cfr_code: "E01",
        description: "Teaching staff",
        group: "Staffing",
        budget: 900000,
        actual: 300000,
        committed: 0,
        variance: 0,
        variance_percent: 0,
        rag: "green",
        profile_name: "Staff Salary",
        monthly_profile: [],
      },
    ]);

    expect(cards[0]).toMatchObject({
      cfr_code: "E16",
      title: "Energy",
      profile_name: expect.stringMatching(/energy|gas|electric/i),
    });
    expect(cards[0].rationale).toMatch(/holiday|heating|occupancy|summer/i);
  });

  it("keeps the cards short enough for dashboard display", () => {
    const cards = buildFinanceAssumptionCards([
      {
        cfr_code: "E12",
        description: "Building maintenance",
        group: "Premises",
        budget: 30000,
        actual: 10000,
        committed: 5000,
        variance: 0,
        variance_percent: 0,
        rag: "amber",
        profile_name: "Building Maintenance",
        monthly_profile: [],
      },
    ]);

    expect(cards).toHaveLength(1);
    expect(cards[0].rationale.length).toBeLessThanOrEqual(180);
  });
});
