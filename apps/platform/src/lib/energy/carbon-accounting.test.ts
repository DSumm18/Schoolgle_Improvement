import { describe, expect, it } from "vitest";

import {
  assessSecrReadiness,
  buildEnergyActionPlan,
  calculateCarbonSummary,
} from "./carbon-accounting";

describe("carbon accounting", () => {
  it("calculates scope 1, 2 and 3 emissions from energy and mileage", () => {
    const summary = calculateCarbonSummary({
      electricityKwh: 100_000,
      gasKwh: 50_000,
      mileageByVehicle: { car: 1_000, motorcycle: 100, bicycle: 20 },
      floorAreaSqm: 2_500,
      pupilCount: 500,
    });

    expect(summary.scope1Tonnes).toBeCloseTo(9.16, 2);
    expect(summary.scope2Tonnes).toBeCloseTo(25.19, 2);
    expect(summary.scope3Tonnes).toBeCloseTo(0.28, 2);
    expect(summary.totalTonnes).toBeCloseTo(34.63, 2);
    expect(summary.intensityTonnesPerPupil).toBeCloseTo(0.069, 3);
    expect(summary.kgCo2ePerSqm).toBeCloseTo(13.85, 2);
  });

  it("flags SECR readiness gaps for incomplete evidence", () => {
    const readiness = assessSecrReadiness({
      hasElectricity: true,
      hasGas: false,
      hasMileage: false,
      hasIntensityMetric: true,
      hasMethodology: true,
      hasPriorYearComparison: false,
      hasEnergyEfficiencyActions: false,
      isTrustLevel: true,
    });

    expect(readiness.status).toBe("needs_data");
    expect(readiness.score).toBeLessThan(70);
    expect(readiness.gaps).toContain("Gas or heating fuel data is missing.");
    expect(readiness.gaps).toContain("Business travel/mileage evidence is missing.");
  });

  it("builds risk-led action-plan items from the carbon position", () => {
    const summary = calculateCarbonSummary({
      electricityKwh: 150_000,
      gasKwh: 180_000,
      mileageByVehicle: { car: 4_000 },
      floorAreaSqm: 2_200,
      pupilCount: 420,
    });

    const actions = buildEnergyActionPlan({
      summary,
      activeAnomalies: 2,
      estimatedWasteCost: 3_500,
      hasMileageData: true,
      hasInvoiceData: true,
    });

    expect(actions[0].riskLevel).toBe("high");
    expect(actions.some((action) => action.category === "Heating")).toBe(true);
    expect(actions.some((action) => action.category === "Controls")).toBe(true);
  });
});
