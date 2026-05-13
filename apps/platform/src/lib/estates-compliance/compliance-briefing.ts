export type BriefingComplianceStatus =
  | "compliant"
  | "due_soon"
  | "overdue"
  | "in_progress"
  | "no_record"
  | "not_applicable";

export type BriefingConfidence = "high" | "medium" | "low";
export type BriefingRiskLabel =
  | "Stable"
  | "Monitor"
  | "Attention"
  | "Escalate"
  | "Critical";

export interface BriefingCheck {
  id: string;
  name: string;
  frequency: string;
  category?: string;
  risk_level?: string;
  requiresQualification?: string;
}

export interface BriefingCompletion {
  status: string;
  completed_at?: string;
  completion_notes?: string;
  next_due?: string;
  next_due_date?: string;
  evidence_ids?: string[];
  evidence?: Array<{ id?: string }>;
}

export interface BriefingTask {
  id?: string;
  title?: string;
  task_name?: string;
  status?: string;
  priority?: string;
  due_by?: string;
  due_date?: string;
  findings?: Array<{
    severity?: string;
    description?: string;
    classification?: string;
    estimated_cost?: number;
  }>;
}

export interface BriefingAsset {
  name: string;
  condition?: string;
  lifecycle_status?: string;
  warranty_status?: string;
  recent_failure_count?: number;
}

export interface ComplianceBriefingInput {
  check: BriefingCheck;
  completions: BriefingCompletion[];
  relatedTasks?: BriefingTask[];
  linkedAssets?: BriefingAsset[];
  now?: Date;
}

export interface ComplianceBriefing {
  complianceStatus: BriefingComplianceStatus;
  riskScore: 1 | 2 | 3 | 4 | 5;
  riskLabel: BriefingRiskLabel;
  confidence: BriefingConfidence;
  summary: string;
  reportLine: string;
  keyPoints: string[];
  edPrompts: string[];
  kpis: {
    lastCompleted?: string;
    nextDue?: string;
    daysUntilDue: number | null;
    evidenceCount: number;
    openActions: number;
    highRiskFindings: number;
    linkedAssets: number;
    linkedContractors: number;
  };
}

const OPEN_TASK_STATUSES = new Set([
  "pending",
  "in_progress",
  "awaiting_contractor",
  "contractor_scheduled",
  "overdue",
]);

function toDateOnly(value?: string): Date | null {
  if (!value) return null;
  const datePart = value.split("T")[0];
  const parts = datePart.split("-").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
  return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
}

function daysBetween(from: Date, to: Date): number {
  const fromUtc = Date.UTC(
    from.getUTCFullYear(),
    from.getUTCMonth(),
    from.getUTCDate(),
  );
  const toUtc = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());
  return Math.ceil((toUtc - fromUtc) / 86_400_000);
}

function scoreFromPoints(points: number): 1 | 2 | 3 | 4 | 5 {
  if (points <= 0) return 1;
  if (points <= 2) return 2;
  if (points <= 4) return 3;
  if (points <= 6) return 4;
  return 5;
}

function labelFromScore(score: 1 | 2 | 3 | 4 | 5): BriefingRiskLabel {
  switch (score) {
    case 1:
      return "Stable";
    case 2:
      return "Monitor";
    case 3:
      return "Attention";
    case 4:
      return "Escalate";
    case 5:
      return "Critical";
  }
}

function latestCompletion(
  completions: BriefingCompletion[],
): BriefingCompletion | undefined {
  return [...completions].sort((a, b) => {
    const aTime = new Date(a.completed_at || "1900-01-01").getTime();
    const bTime = new Date(b.completed_at || "1900-01-01").getTime();
    return bTime - aTime;
  })[0];
}

function evidenceCount(completion?: BriefingCompletion): number {
  if (!completion) return 0;
  return (
    (completion.evidence_ids?.length || 0) + (completion.evidence?.length || 0)
  );
}

export function calculateComplianceBriefing(
  input: ComplianceBriefingInput,
): ComplianceBriefing {
  const now = input.now || new Date();
  const latest = latestCompletion(input.completions);
  const nextDue = latest?.next_due || latest?.next_due_date;
  const dueDate = toDateOnly(nextDue);
  const daysUntilDue = dueDate ? daysBetween(now, dueDate) : null;
  const evidenceTotal = evidenceCount(latest);
  const openTasks = (input.relatedTasks || []).filter((task) =>
    OPEN_TASK_STATUSES.has(task.status || "pending"),
  );
  const highRiskFindings = openTasks.flatMap((task) => task.findings || []).filter(
    (finding) => finding.severity === "critical" || finding.severity === "high",
  );

  if (latest?.status === "not_applicable") {
    return {
      complianceStatus: "not_applicable",
      riskScore: 1,
      riskLabel: "Stable",
      confidence: "medium",
      summary: `${input.check.name} is marked as not applicable for this school.`,
      reportLine: `${input.check.name}: not applicable to this site.`,
      keyPoints: ["This check is excluded from compliance reporting."],
      edPrompts: ["Only re-enable this check if the site circumstances change."],
      kpis: {
        lastCompleted: latest.completed_at,
        nextDue,
        daysUntilDue,
        evidenceCount: evidenceTotal,
        openActions: 0,
        highRiskFindings: 0,
        linkedAssets: input.linkedAssets?.length || 0,
        linkedContractors: 0,
      },
    };
  }

  let complianceStatus: BriefingComplianceStatus = "no_record";
  if (latest) {
    if (daysUntilDue !== null && daysUntilDue < 0) {
      complianceStatus = "overdue";
    } else if (["awaiting_documentation", "pending_contractor", "in_progress"].includes(latest.status)) {
      complianceStatus = "in_progress";
    } else if (latest.status === "completed" && daysUntilDue !== null && daysUntilDue <= 30) {
      complianceStatus = "due_soon";
    } else if (latest.status === "completed") {
      complianceStatus = "compliant";
    } else {
      complianceStatus = "in_progress";
    }
  }

  let points = 0;
  const keyPoints: string[] = [];
  const edPrompts: string[] = [];

  if (!latest) {
    points += 3;
    keyPoints.push("No completion record has been logged for this check yet.");
    edPrompts.push("Ask Ed to record the latest check or create a task to gather evidence.");
  }

  if (complianceStatus === "overdue") {
    points += daysUntilDue !== null && daysUntilDue < -30 ? 4 : 3;
    keyPoints.push(
      `${input.check.name} is ${Math.abs(daysUntilDue || 0)} days overdue.`,
    );
    edPrompts.push("Create an urgent compliance task and attach any latest contractor evidence.");
  }

  if (["awaiting_documentation", "pending_contractor", "in_progress"].includes(latest?.status || "")) {
    points += 2;
    keyPoints.push(`Latest status is ${latest?.status?.replace(/_/g, " ")}.`);
    edPrompts.push("Chase the contractor or upload the missing certificate/report.");
  }

  if (input.check.category === "statutory" && evidenceTotal === 0) {
    points += complianceStatus === "overdue" ? 3 : 1;
    keyPoints.push("No evidence is currently attached to the latest record.");
  }

  if (input.check.risk_level === "critical" && complianceStatus !== "compliant") {
    points += 1;
  }

  for (const task of openTasks) {
    if (task.priority === "critical") points += 2;
    else if (task.priority === "high") points += 1;
  }
  if (openTasks.length > 0) {
    keyPoints.push(
      `${openTasks.length} open action${openTasks.length === 1 ? "" : "s"} linked to this area.`,
    );
  }

  if (highRiskFindings.length > 0) {
    points += Math.min(3, highRiskFindings.length + 1);
    keyPoints.push(
      `${highRiskFindings.length} high-risk finding${highRiskFindings.length === 1 ? "" : "s"} need attention.`,
    );
  }

  for (const asset of input.linkedAssets || []) {
    const condition = (asset.condition || "").toLowerCase();
    const lifecycle = (asset.lifecycle_status || "").toLowerCase();
    if (condition === "poor" || lifecycle === "end_of_life") {
      points += 2;
      keyPoints.push(`${asset.name} is flagged as ${asset.condition || asset.lifecycle_status}.`);
    }
    if ((asset.recent_failure_count || 0) >= 2) {
      points += 1;
      keyPoints.push(`${asset.name} has ${asset.recent_failure_count} recent failures/callouts.`);
    }
    if (asset.warranty_status === "active") {
      edPrompts.push(`${asset.name} may be under warranty; check installer/supplier before paid repair.`);
    }
  }

  const confidence: BriefingConfidence =
    evidenceTotal > 0 && latest?.status === "completed"
      ? "high"
      : !latest || complianceStatus === "overdue"
        ? "low"
        : "medium";

  if (input.check.requiresQualification) {
    keyPoints.push(`Competence required: ${input.check.requiresQualification}.`);
  }

  if (keyPoints.length === 0) {
    keyPoints.push("No current concerns have been identified from linked data.");
  }

  const riskScore = scoreFromPoints(points);
  const riskLabel = labelFromScore(riskScore);
  const summary =
    complianceStatus === "compliant"
      ? `${input.check.name} is currently compliant, with a ${riskLabel.toLowerCase()} risk of becoming non-compliant.`
      : `${input.check.name} needs ${riskLabel.toLowerCase()} attention based on current records.`;

  return {
    complianceStatus,
    riskScore,
    riskLabel,
    confidence,
    summary,
    reportLine: `${input.check.name}: ${summary}`,
    keyPoints: keyPoints.slice(0, 6),
    edPrompts: edPrompts.slice(0, 4),
    kpis: {
      lastCompleted: latest?.completed_at,
      nextDue,
      daysUntilDue,
      evidenceCount: evidenceTotal,
      openActions: openTasks.length,
      highRiskFindings: highRiskFindings.length,
      linkedAssets: input.linkedAssets?.length || 0,
      linkedContractors: 0,
    },
  };
}
