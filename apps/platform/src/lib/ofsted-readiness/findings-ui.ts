import type {
  OfstedFindingActionLevel,
  OfstedFindingSeverity,
  OfstedFindingStatus,
} from "./findings";

export interface FindingSummaryInput {
  severity: OfstedFindingSeverity;
  status: OfstedFindingStatus;
  assigned_task_id?: string | null;
}

export interface FindingSummary {
  total: number;
  active: number;
  critical: number;
  high: number;
  assigned: number;
  verified: number;
}

export function summariseFindings(
  findings: FindingSummaryInput[],
): FindingSummary {
  return findings.reduce<FindingSummary>(
    (summary, finding) => {
      summary.total += 1;
      if (!["verified", "dismissed"].includes(finding.status)) {
        summary.active += 1;
      }
      if (finding.severity === "critical") summary.critical += 1;
      if (finding.severity === "high") summary.high += 1;
      if (finding.assigned_task_id) summary.assigned += 1;
      if (finding.status === "verified") summary.verified += 1;
      return summary;
    },
    {
      total: 0,
      active: 0,
      critical: 0,
      high: 0,
      assigned: 0,
      verified: 0,
    },
  );
}

export function getFindingStatusLabel(status: OfstedFindingStatus): string {
  const labels: Record<OfstedFindingStatus, string> = {
    identified: "Identified",
    acknowledged: "Acknowledged",
    assigned: "Assigned",
    in_progress: "In progress",
    completed: "Completed",
    verification_required: "Verification required",
    verified: "Verified",
    recurring: "Recurring review",
    dismissed: "Dismissed",
  };
  return labels[status];
}

export function getFindingBadgeTone(
  value: OfstedFindingSeverity | OfstedFindingActionLevel,
): "rose" | "amber" | "blue" | "emerald" | "slate" {
  if (value === "critical" || value === "required_action") return "rose";
  if (value === "high" || value === "recommended_action") return "amber";
  if (value === "medium" || value === "suggested_improvement") return "blue";
  if (value === "low") return "emerald";
  return "slate";
}
