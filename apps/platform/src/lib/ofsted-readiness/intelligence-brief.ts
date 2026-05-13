import type {
  OfstedFindingSeverity,
  OfstedFindingStatus,
} from "./findings";

export type OfstedIntelligenceTone = "red" | "amber" | "green" | "blue";

export interface OfstedBriefKs2Row {
  academic_year_end: number;
  subject: string;
  breakdown_topic: string;
  breakdown: string;
  expected_standard_pct: number | null;
  higher_standard_pct: number | null;
  progress_measure_score: number | null;
}

export interface OfstedBriefCensusRow {
  academic_year_end: number;
  number_on_roll: number | null;
  fsm_pct: number | null;
  eal_pct: number | null;
  sen_pct: number | null;
}

export interface OfstedBriefSchoolRow {
  urn: number;
  name: string;
  ks2: OfstedBriefKs2Row[];
  census: OfstedBriefCensusRow[];
}

export interface OfstedBriefDataConnection {
  provider: string;
  folder_name: string | null;
}

export interface OfstedBriefFinding {
  severity: OfstedFindingSeverity;
  status: OfstedFindingStatus;
  title: string;
}

export interface OfstedBriefLatestAnalysis {
  title: string;
  executive_summary: string | null;
  confidence_score: number | null;
  data_sources_used: string[] | null;
}

export interface OfstedInspectionIntelligenceBriefInput {
  organizationName: string;
  schoolRows: OfstedBriefSchoolRow[];
  dataConnections: OfstedBriefDataConnection[];
  ofstedFindings: OfstedBriefFinding[];
  latestAnalysis: OfstedBriefLatestAnalysis | null;
}

export interface OfstedInspectionSignal {
  key: string;
  label: string;
  value: string;
  tone: OfstedIntelligenceTone;
  source: string;
  explanation: string;
}

export interface OfstedInspectionIntelligenceBrief {
  title: string;
  signals: OfstedInspectionSignal[];
  trustPatterns: string[];
  dataQualityWarnings: string[];
  inspectionQuestions: string[];
  sourcesUsed: string[];
  findingsSummary: {
    critical: number;
    high: number;
    active: number;
  };
}

export function buildOfstedInspectionIntelligenceBrief(
  input: OfstedInspectionIntelligenceBriefInput,
): OfstedInspectionIntelligenceBrief {
  const signals: OfstedInspectionSignal[] = [];
  const trustPatterns: string[] = [];
  const dataQualityWarnings: string[] = [];
  const inspectionQuestions: string[] = [];
  const sourcesUsed = new Set<string>();
  const latestCombinedRows = input.schoolRows
    .map((school) => ({
      school,
      row: getLatestCombinedRwmRow(school.ks2),
    }))
    .filter(
      (entry): entry is { school: OfstedBriefSchoolRow; row: OfstedBriefKs2Row } =>
        Boolean(entry.row),
    );

  if (latestCombinedRows.length > 0) {
    sourcesUsed.add("DfE KS2 validated outcomes");
    const primary = latestCombinedRows[0];
    const value = primary.row.expected_standard_pct;

    if (value !== null) {
      signals.push({
        key: "ks2-combined-rwm",
        label: "KS2 Combined RWM+",
        value: `${value}%`,
        tone: value < 50 ? "red" : value < 60 ? "amber" : "green",
        source: `DfE ${primary.row.academic_year_end}`,
        explanation:
          "Combined RWM+ means pupils meeting expected+ in Reading, Writing and Maths together, not an average of the three subjects.",
      });

      if (value < 60) {
        inspectionQuestions.push(
          `How do leaders explain the latest validated KS2 Combined RWM+ figure of ${value}% and the actions now in place?`,
        );
      }
    }
  } else {
    dataQualityWarnings.push(
      "No validated DfE school context was found for this organization scope.",
    );
  }

  const latestCensus = input.schoolRows
    .map((school) => getLatestCensusRow(school.census))
    .find((row): row is OfstedBriefCensusRow => Boolean(row));

  if (latestCensus) {
    sourcesUsed.add("DfE census context");
    const contextParts = [
      formatPct("FSM", latestCensus.fsm_pct),
      formatPct("SEND", latestCensus.sen_pct),
      formatPct("EAL", latestCensus.eal_pct),
    ].filter(Boolean);

    if (contextParts.length > 0) {
      signals.push({
        key: "dfe-context",
        label: "School Context",
        value: contextParts.join(" | "),
        tone: "blue",
        source: `DfE census ${latestCensus.academic_year_end}`,
        explanation:
          "Use this to contextualise attainment, attendance, inclusion, and pupil premium evidence.",
      });
    }
  }

  const activeConnections = input.dataConnections.filter(
    (connection) => connection.provider === "google" && connection.folder_name,
  );
  if (activeConnections.length > 0) {
    sourcesUsed.add("Schoolgle Connector folder");
  } else {
    dataQualityWarnings.push(
      "No Schoolgle Connector folder is active, so document evidence may be incomplete.",
    );
  }

  if (input.latestAnalysis) {
    sourcesUsed.add("Latest School Improvement analysis");
    for (const source of input.latestAnalysis.data_sources_used || []) {
      sourcesUsed.add(source);
    }
    if (input.latestAnalysis.executive_summary) {
      signals.push({
        key: "school-improvement-summary",
        label: input.latestAnalysis.title,
        value: confidenceLabel(input.latestAnalysis.confidence_score),
        tone: "blue",
        source: "School Intelligence",
        explanation: input.latestAnalysis.executive_summary,
      });
    }
  } else {
    dataQualityWarnings.push(
      "No recent School Improvement intelligence analysis is available for this school.",
    );
  }

  const latestValues = latestCombinedRows
    .map(({ row }) => row.expected_standard_pct)
    .filter((value): value is number => value !== null);

  if (latestValues.length > 1) {
    const belowFifty = latestValues.filter((value) => value < 50).length;
    if (belowFifty > 0) {
      trustPatterns.push(
        `${belowFifty} of ${latestValues.length} schools are below 50% KS2 Combined RWM+ in the latest validated DfE year.`,
      );
    }

    const min = Math.min(...latestValues);
    const max = Math.max(...latestValues);
    if (max - min >= 15) {
      trustPatterns.push(
        `Trust range for latest KS2 Combined RWM+ is ${min}% to ${max}%, a ${max - min}pp spread.`,
      );
    }
  }

  const findingsSummary = input.ofstedFindings.reduce(
    (summary, finding) => {
      if (!["verified", "dismissed"].includes(finding.status)) {
        summary.active += 1;
      }
      if (finding.severity === "critical") summary.critical += 1;
      if (finding.severity === "high") summary.high += 1;
      return summary;
    },
    { critical: 0, high: 0, active: 0 },
  );

  if (findingsSummary.critical > 0 || findingsSummary.high > 0) {
    inspectionQuestions.push(
      `Which critical or high Ofsted findings have been assigned, and what evidence will verify completion?`,
    );
  }

  return {
    title: `${input.organizationName} inspection intelligence`,
    signals,
    trustPatterns,
    dataQualityWarnings,
    inspectionQuestions,
    sourcesUsed: Array.from(sourcesUsed),
    findingsSummary,
  };
}

function getLatestCombinedRwmRow(
  rows: OfstedBriefKs2Row[],
): OfstedBriefKs2Row | null {
  return [...rows]
    .filter(
      (row) =>
        row.subject === "Reading, writing and maths" &&
        row.breakdown_topic === "All pupils" &&
        row.breakdown === "Total",
    )
    .sort((a, b) => b.academic_year_end - a.academic_year_end)[0] || null;
}

function getLatestCensusRow(
  rows: OfstedBriefCensusRow[],
): OfstedBriefCensusRow | null {
  return [...rows].sort((a, b) => b.academic_year_end - a.academic_year_end)[0] ||
    null;
}

function formatPct(label: string, value: number | null): string | null {
  return value === null ? null : `${label} ${value}%`;
}

function confidenceLabel(value: number | null): string {
  if (value === null) return "Confidence not recorded";
  return `${Math.round(value * 100)}% confidence`;
}
