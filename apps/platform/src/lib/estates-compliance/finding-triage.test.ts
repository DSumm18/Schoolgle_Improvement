import { describe, expect, it } from "vitest";
import { triageEstateFinding, summarizeEstateFindingTriage } from "./finding-triage";

describe("triageEstateFinding", () => {
  it("routes a serviceable end-of-life boiler to strategy instead of a panic task", () => {
    const triage = triageEstateFinding({
      assetName: "Main gas boiler",
      description:
        "Boiler is end of life but currently serviceable. Parts availability reducing. Plan replacement within 3 years.",
      estimatedCost: 100_000,
      result: "advisory",
      priority: "essential",
      conditionGrade: "C",
      complianceDomain: "gas",
    });

    expect(triage.classification).toBe("capital_pressure");
    expect(triage.recommendedRoutes).toContain("add_to_strategy");
    expect(triage.recommendedRoutes).not.toContain("create_task");
    expect(triage.strategyYear).toBe(3);
    expect(triage.riskScore).toBe(4);
  });

  it("escalates immediate health and safety defects into an urgent task and risk", () => {
    const triage = triageEstateFinding({
      assetName: "Gas boiler",
      description:
        "Repeated flame failure. CO readings elevated at 42ppm. Replacement critical — risk to H&S.",
      estimatedCost: 35_000,
      result: "fail",
      urgency: "emergency",
      priority: "urgent",
      conditionGrade: "D",
      complianceDomain: "gas",
    });

    expect(triage.classification).toBe("compliance_defect");
    expect(triage.recommendedRoutes).toEqual(["create_task", "create_risk"]);
    expect(triage.riskScore).toBe(5);
    expect(triage.urgency).toBe("emergency");
  });

  it("keeps low-cost serviceable maintenance on the watchlist", () => {
    const triage = triageEstateFinding({
      assetName: "Hot water calorifier",
      description: "Minor limescale. Descale recommended within 12 months.",
      estimatedCost: 2_500,
      result: "advisory",
      priority: "desirable",
      conditionGrade: "B",
      complianceDomain: "water",
    });

    expect(triage.classification).toBe("watchlist");
    expect(triage.recommendedRoutes).toEqual(["add_to_watchlist"]);
    expect(triage.riskScore).toBe(2);
  });

  it("routes high-cost building fabric replacement into the estate strategy", () => {
    const triage = triageEstateFinding({
      assetName: "Flat roof membrane",
      description:
        "Multiple patches visible. Ponding in 3 areas. Membrane life-expired. Full overlay or strip-and-recover needed.",
      estimatedCost: 45_000,
      result: "advisory",
      priority: "essential",
      conditionGrade: "C",
      complianceDomain: "building fabric",
    });

    expect(triage.classification).toBe("capital_pressure");
    expect(triage.recommendedRoutes).toEqual(["add_to_strategy", "create_risk"]);
    expect(triage.strategyYear).toBe(1);
  });
});

describe("summarizeEstateFindingTriage", () => {
  it("counts routes that need operational, risk, strategy, and watchlist attention", () => {
    const summary = summarizeEstateFindingTriage([
      triageEstateFinding({
        description: "Failed emergency lighting test.",
        result: "fail",
        priority: "urgent",
      }),
      triageEstateFinding({
        description: "Windows are life-expired. Full replacement required.",
        estimatedCost: 48_000,
        conditionGrade: "D",
      }),
      triageEstateFinding({
        description: "Serviceable for 2-3 more years.",
        estimatedCost: 6_000,
        conditionGrade: "B",
      }),
    ]);

    expect(summary.tasks).toBe(1);
    expect(summary.risks).toBe(2);
    expect(summary.strategyItems).toBe(1);
    expect(summary.watchlistItems).toBe(1);
    expect(summary.highestRiskScore).toBe(5);
  });
});
