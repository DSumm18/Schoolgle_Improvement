export type VehicleType = "car" | "motorcycle" | "bicycle" | "electric_car";
export type SecrStatus = "ready" | "needs_data" | "not_applicable";
export type EnergyActionRiskLevel = "critical" | "high" | "medium" | "low";

export const UK_2025_EMISSION_FACTORS = {
  electricityKgCo2ePerKwh: 0.23314,
  electricityTransmissionKgCo2ePerKwh: 0.01879,
  gasKgCo2ePerKwh: 0.18316,
  mileageKgCo2ePerMile: {
    car: 0.27304,
    motorcycle: 0.11355,
    electric_car: 0.0614,
    bicycle: 0,
  } satisfies Record<VehicleType, number>,
} as const;

export interface CarbonSummaryInput {
  electricityKwh: number;
  gasKwh: number;
  mileageByVehicle?: Partial<Record<VehicleType, number>>;
  floorAreaSqm?: number | null;
  pupilCount?: number | null;
}

export interface CarbonSummary {
  electricityKwh: number;
  gasKwh: number;
  mileageMiles: number;
  scope1Tonnes: number;
  scope2Tonnes: number;
  scope3Tonnes: number;
  totalTonnes: number;
  intensityTonnesPerPupil: number | null;
  kgCo2ePerSqm: number | null;
  methodology: string;
}

export interface SecrReadinessInput {
  hasElectricity: boolean;
  hasGas: boolean;
  hasMileage: boolean;
  hasIntensityMetric: boolean;
  hasMethodology: boolean;
  hasPriorYearComparison: boolean;
  hasEnergyEfficiencyActions: boolean;
  isTrustLevel: boolean;
}

export interface SecrReadiness {
  status: SecrStatus;
  score: number;
  requiredEvidence: string[];
  gaps: string[];
}

export interface BuildActionPlanInput {
  summary: CarbonSummary;
  activeAnomalies: number;
  estimatedWasteCost: number;
  hasMileageData: boolean;
  hasInvoiceData: boolean;
}

export interface EnergyActionPlanItem {
  id: string;
  category: "Data" | "Heating" | "Electricity" | "Transport" | "Controls";
  title: string;
  rationale: string;
  riskLevel: EnergyActionRiskLevel;
  estimatedAnnualSavingGbp: number | null;
  estimatedCarbonSavingTonnes: number | null;
  ownerSuggestion: string;
  evidenceSource: string;
}

function round(value: number, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function calculateCarbonSummary({
  electricityKwh,
  gasKwh,
  mileageByVehicle = {},
  floorAreaSqm,
  pupilCount,
}: CarbonSummaryInput): CarbonSummary {
  const electricityFactor =
    UK_2025_EMISSION_FACTORS.electricityKgCo2ePerKwh +
    UK_2025_EMISSION_FACTORS.electricityTransmissionKgCo2ePerKwh;
  const scope1Tonnes =
    (Math.max(gasKwh, 0) * UK_2025_EMISSION_FACTORS.gasKgCo2ePerKwh) / 1000;
  const scope2Tonnes = (Math.max(electricityKwh, 0) * electricityFactor) / 1000;
  const mileageMiles = Object.values(mileageByVehicle).reduce(
    (sum, miles) => sum + Math.max(Number(miles) || 0, 0),
    0,
  );
  const mileageKgCo2e = Object.entries(mileageByVehicle).reduce(
    (sum, [vehicleType, miles]) =>
      sum +
      Math.max(Number(miles) || 0, 0) *
        (UK_2025_EMISSION_FACTORS.mileageKgCo2ePerMile[
          vehicleType as VehicleType
        ] ?? UK_2025_EMISSION_FACTORS.mileageKgCo2ePerMile.car),
    0,
  );
  const scope3Tonnes = mileageKgCo2e / 1000;
  const totalTonnes = scope1Tonnes + scope2Tonnes + scope3Tonnes;

  return {
    electricityKwh: Math.max(electricityKwh, 0),
    gasKwh: Math.max(gasKwh, 0),
    mileageMiles,
    scope1Tonnes: round(scope1Tonnes, 3),
    scope2Tonnes: round(scope2Tonnes, 3),
    scope3Tonnes: round(scope3Tonnes, 3),
    totalTonnes: round(totalTonnes, 3),
    intensityTonnesPerPupil:
      pupilCount && pupilCount > 0 ? round(totalTonnes / pupilCount, 4) : null,
    kgCo2ePerSqm:
      floorAreaSqm && floorAreaSqm > 0
        ? round((totalTonnes * 1000) / floorAreaSqm, 2)
        : null,
    methodology:
      "Location-based Scope 1 gas, Scope 2 electricity including transmission and distribution, and Scope 3 business mileage using UK government conversion factors.",
  };
}

export function assessSecrReadiness({
  hasElectricity,
  hasGas,
  hasMileage,
  hasIntensityMetric,
  hasMethodology,
  hasPriorYearComparison,
  hasEnergyEfficiencyActions,
  isTrustLevel,
}: SecrReadinessInput): SecrReadiness {
  const requiredEvidence = [
    "UK electricity consumption",
    "UK gas/heating fuel consumption",
    "Business travel/mileage emissions",
    "At least one intensity ratio",
    "Calculation methodology",
    "Prior-year comparison",
    "Energy efficiency actions taken in the year",
  ];
  const checks = [
    {
      ok: hasElectricity,
      gap: "Electricity consumption data is missing.",
    },
    { ok: hasGas, gap: "Gas or heating fuel data is missing." },
    {
      ok: hasMileage,
      gap: "Business travel/mileage evidence is missing.",
    },
    {
      ok: hasIntensityMetric,
      gap: "No intensity ratio can be calculated yet.",
    },
    {
      ok: hasMethodology,
      gap: "Calculation methodology needs to be stated.",
    },
    {
      ok: hasPriorYearComparison,
      gap: "Prior-year comparison is missing.",
    },
    {
      ok: hasEnergyEfficiencyActions,
      gap: "Energy efficiency actions are not recorded.",
    },
  ];
  const gaps = checks.filter((check) => !check.ok).map((check) => check.gap);
  const score = Math.round(((checks.length - gaps.length) / checks.length) * 100);

  return {
    status: !isTrustLevel ? "not_applicable" : gaps.length === 0 ? "ready" : "needs_data",
    score,
    requiredEvidence,
    gaps,
  };
}

export function buildEnergyActionPlan({
  summary,
  activeAnomalies,
  estimatedWasteCost,
  hasMileageData,
  hasInvoiceData,
}: BuildActionPlanInput): EnergyActionPlanItem[] {
  const actions: EnergyActionPlanItem[] = [];

  if (!hasInvoiceData) {
    actions.push({
      id: "connect-energy-invoices",
      category: "Data",
      title: "Connect energy invoices and validate meter coverage",
      rationale:
        "Carbon reporting and energy planning are weak until supplier invoices are captured against all known meters.",
      riskLevel: "high",
      estimatedAnnualSavingGbp: null,
      estimatedCarbonSavingTonnes: null,
      ownerSuggestion: "School business manager",
      evidenceSource: "Data connection status",
    });
  }

  if (summary.gasKwh > summary.electricityKwh * 0.8) {
    actions.push({
      id: "heating-controls-review",
      category: "Heating",
      title: "Review boiler controls, heating schedules and zoning",
      rationale:
        "Gas is the largest controllable Scope 1 source and often links directly to boiler condition, BMS settings and caretaker routines.",
      riskLevel: "high",
      estimatedAnnualSavingGbp: null,
      estimatedCarbonSavingTonnes: round(summary.scope1Tonnes * 0.08, 2),
      ownerSuggestion: "Estates lead / caretaker with heating contractor",
      evidenceSource: "Gas invoice consumption",
    });
  }

  if (activeAnomalies > 0 || estimatedWasteCost > 0) {
    actions.push({
      id: "energy-anomaly-resolution",
      category: "Controls",
      title: "Resolve active energy anomalies and confirm waste reduction",
      rationale:
        "Active anomalies indicate likely avoidable waste, such as overnight use, holiday heating or baseload drift.",
      riskLevel: activeAnomalies > 1 ? "high" : "medium",
      estimatedAnnualSavingGbp: Math.round(estimatedWasteCost),
      estimatedCarbonSavingTonnes: null,
      ownerSuggestion: "Site manager",
      evidenceSource: "Energy anomaly detection",
    });
  }

  if (!hasMileageData) {
    actions.push({
      id: "mileage-claims-import",
      category: "Transport",
      title: "Import mileage claims for Scope 3 business travel",
      rationale:
        "SECR-style reporting expects relevant transport emissions; mileage claims are the cleanest school finance evidence source.",
      riskLevel: "medium",
      estimatedAnnualSavingGbp: null,
      estimatedCarbonSavingTonnes: null,
      ownerSuggestion: "Finance officer",
      evidenceSource: "Mileage claim records",
    });
  }

  if (summary.scope2Tonnes > 20) {
    actions.push({
      id: "electricity-baseload-review",
      category: "Electricity",
      title: "Review electricity baseload, shutdown routines and holiday usage",
      rationale:
        "High electricity emissions should be checked against out-of-hours usage, server/ICT loads, catering and lighting controls.",
      riskLevel: "medium",
      estimatedAnnualSavingGbp: null,
      estimatedCarbonSavingTonnes: round(summary.scope2Tonnes * 0.06, 2),
      ownerSuggestion: "Estates lead / IT manager",
      evidenceSource: "Electricity invoice and half-hourly data",
    });
  }

  return actions.sort((left, right) => {
    const rank: Record<EnergyActionRiskLevel, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };
    return rank[left.riskLevel] - rank[right.riskLevel];
  });
}
