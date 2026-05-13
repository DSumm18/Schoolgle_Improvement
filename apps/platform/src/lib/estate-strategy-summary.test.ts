import { describe, expect, it } from "vitest";
import { buildEstateStrategySummary } from "./estate-strategy-summary";

describe("buildEstateStrategySummary", () => {
  it("creates trustee-ready totals and risk narrative", () => {
    const summary = buildEstateStrategySummary({
      planTitle: "Three-Year Estate Strategy",
      startYear: "2026/2027",
      endYear: "2028/2029",
      items: [
        {
          title: "Replace serviceable boiler",
          year: 3,
          estimated_cost: 100_000,
          risk_score: 4,
          priority_band: "should",
          consequence_if_unfunded:
            "Heating failure may force partial closure during winter.",
        },
        {
          title: "Repair unsafe play surface",
          year: 1,
          estimated_cost: 15_000,
          risk_score: 5,
          priority_band: "must",
          is_statutory: true,
          consequence_if_unfunded:
            "Area remains closed or pupils are exposed to fall-height risk.",
        },
      ],
    });

    expect(summary.totalEstimatedCost).toBe(115_000);
    expect(summary.yearSummaries[0]).toMatchObject({
      year: 1,
      totalEstimatedCost: 15_000,
      itemCount: 1,
    });
    expect(summary.highRiskCount).toBe(1);
    expect(summary.mustFundTotal).toBe(15_000);
    expect(summary.reportLines[0]).toContain("Three-Year Estate Strategy");
    expect(summary.unfundedConsequences).toHaveLength(2);
  });
});
