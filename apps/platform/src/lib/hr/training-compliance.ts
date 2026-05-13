export interface TrainingComplianceCategory {
  expired_count: number;
  expiring_soon_count: number;
  never_completed_count: number;
  compliant: number;
}

export type TrainingComplianceTone = "strong" | "watch" | "risk";

export function summarizeTrainingCompliance(
  categories: TrainingComplianceCategory[],
) {
  const summary = categories.reduce(
    (totals, category) => ({
      expired: totals.expired + category.expired_count,
      expiringSoon: totals.expiringSoon + category.expiring_soon_count,
      neverCompleted: totals.neverCompleted + category.never_completed_count,
      compliant: totals.compliant + category.compliant,
    }),
    {
      expired: 0,
      expiringSoon: 0,
      neverCompleted: 0,
      compliant: 0,
    },
  );

  return {
    ...summary,
    actionRequired:
      summary.expired + summary.expiringSoon + summary.neverCompleted,
  };
}

export function getTrainingComplianceTone(
  compliancePercentage: number,
): TrainingComplianceTone {
  if (compliancePercentage >= 90) return "strong";
  if (compliancePercentage >= 70) return "watch";
  return "risk";
}
