/**
 * Canvas Report Builder — Composable Report Packs with Tone Control
 *
 * Generates professional documents from Canvas data with:
 * - 6 tone presets (governor, staff, Ofsted, parent, trust board, LA return)
 * - Anti-AI humanizer (varied sentence length, contractions, hedging, local context)
 * - Composable sections (each section is a Canvas widget)
 * - School branding throughout
 */

import type { ReportTone, VizSpec, BusinessArea, HealthAlert } from "./types";
import type { MigrationReport, MigrationAction } from "./migration-report";
import type { ReconciliationResult } from "./types";

// ─── Report Section Types ──────────────────────────────────

export interface ReportSection {
  id: string;
  title: string;
  type:
    | "narrative"
    | "chart"
    | "table"
    | "metric"
    | "action_list"
    | "alert_list";
  content?: string;
  vizSpec?: VizSpec;
  data?: Record<string, unknown>[];
  actions?: MigrationAction[];
  alerts?: HealthAlert[];
  order: number;
  included: boolean;
}

export interface ReportPack {
  title: string;
  subtitle?: string;
  tone: ReportTone;
  sections: ReportSection[];
  branding: {
    primaryColor: string;
    schoolName: string;
    logoUrl?: string;
  };
  generatedAt: string;
  generatedBy: string;
}

// ─── Tone Instructions ─────────────────────────────────────

const TONE_SYSTEM_PROMPTS: Record<ReportTone, string> = {
  governor_brief: `Write for a school governing board. Use formal but accessible language. No jargon.
Lead with the headline finding, then supporting data. Governors are strategic — they want to know
"is this good or bad?" and "what should we do about it?" not the technical details.
Use phrases like "the board should note", "this represents", "we recommend".
Structure: headline → key metric → context → recommendation.`,

  staff_update: `Write for school staff. Professional but warm. Action-focused — what do they need to do?
Use "we" language. Be direct. Staff are busy — get to the point quickly.
Use phrases like "you'll notice", "we've seen", "the next step is".
Structure: what changed → what it means → what to do.`,

  ofsted_evidence: `Write as self-evaluation evidence for Ofsted. Use the EIF framework language.
Be evaluative, not descriptive — say what the data SHOWS, not just what it IS.
Reference specific framework areas where relevant.
Use phrases like "this demonstrates", "evidence shows", "this is reflected in".
Structure: judgement claim → supporting evidence → impact statement.`,

  parent_communication: `Write for parents. Simple, reassuring, positive framing.
Avoid percentages and statistics where possible — use "most", "nearly all", "a small number".
Focus on what it means for their child.
Use phrases like "we're pleased to share", "your child benefits from", "we're working to improve".
Structure: good news → context → what we're doing → what parents can do.`,

  trust_board: `Write for a Multi-Academy Trust board. Data-heavy, benchmarked against other schools in the trust.
Flag risks explicitly. Include trend direction. Use RAG ratings where appropriate.
Use phrases like "relative to trust average", "this school sits in the", "escalation recommended".
Structure: metric → trust comparison → national benchmark → risk flag → action owner.`,

  la_return: `Write for a Local Authority statutory return. Compliant, reference-number-heavy.
Use the formal language expected in DfE returns.
Include specific dates, reference numbers, and regulatory citations where relevant.
Structure: requirement → compliance status → evidence reference → date.`,

  custom: `Follow the user's custom tone instructions provided separately.`,
};

// ─── Humanizer Rules ───────────────────────────────────────

const HUMANIZER_INSTRUCTIONS = `
CRITICAL: This text must read as if written by a human school leader, NOT by AI.

Rules for natural writing:
1. VARY sentence length. Mix short punchy sentences (5-8 words) with longer explanatory ones (15-25 words). Never have 3+ sentences of similar length in a row.
2. USE contractions naturally: "we've" not "we have", "it's" not "it is", "don't" not "do not". Formal tone uses fewer contractions but still uses some.
3. HEDGE appropriately: "this suggests" not "this proves", "we believe" not "it is clear", "early signs indicate" not "the data conclusively shows".
4. INCLUDE specific local context when available: name staff, reference specific events, mention the school by name.
5. AVOID AI clichés completely: never use "leverage", "utilize", "it's important to note", "in today's", "landscape", "robust", "comprehensive", "holistic", "streamline", "cutting-edge", "synergy", "paradigm".
6. START paragraphs differently — don't begin every paragraph with "The" or "Our". Use varied openings: a question, a number, a name, a time reference.
7. USE active voice predominantly. "We reduced absences" not "Absences were reduced".
8. INCLUDE one human touch per section: a brief aside, a practical observation, or an honest acknowledgement of a challenge.
`;

// ─── Report Generation ─────────────────────────────────────

/**
 * Build the AI prompt for generating a report narrative section
 */
export function buildReportPrompt(
  tone: ReportTone,
  sectionTitle: string,
  data: Record<string, unknown>[] | string,
  context: {
    schoolName: string;
    academicYear?: string;
    additionalContext?: string;
    customToneInstructions?: string;
  },
): string {
  const tonePrompt =
    tone === "custom" && context.customToneInstructions
      ? context.customToneInstructions
      : TONE_SYSTEM_PROMPTS[tone];

  const dataDescription =
    typeof data === "string"
      ? data
      : `Data (JSON):\n${JSON.stringify(data.slice(0, 50), null, 2)}`;

  return `${HUMANIZER_INSTRUCTIONS}

TONE: ${tonePrompt}

SECTION: ${sectionTitle}
SCHOOL: ${context.schoolName}
${context.academicYear ? `ACADEMIC YEAR: ${context.academicYear}` : ""}
${context.additionalContext ? `CONTEXT: ${context.additionalContext}` : ""}

${dataDescription}

Write 2-4 paragraphs for this section. Follow the tone and humanizer rules exactly.
Do NOT include a heading — the section title will be added separately.
Do NOT use bullet points unless the tone specifically calls for them.
End with a forward-looking sentence about next steps or what to watch.`;
}

/**
 * Build a report prompt specifically for reconciliation findings
 */
export function buildReconciliationReportPrompt(
  tone: ReportTone,
  result: ReconciliationResult,
  context: { schoolName: string },
): string {
  const tonePrompt = TONE_SYSTEM_PROMPTS[tone];

  return `${HUMANIZER_INSTRUCTIONS}

TONE: ${tonePrompt}

SECTION: Data Reconciliation Findings
SCHOOL: ${context.schoolName}

RECONCILIATION SUMMARY:
- Systems compared: ${result.sourceASummary.system} vs ${result.sourceBSummary.system}
- Records in ${result.sourceASummary.system}: ${result.sourceASummary.records}
- Records in ${result.sourceBSummary.system}: ${result.sourceBSummary.records}
- Records matched across both: ${result.matchedRecords}
- Conflicts found: ${result.conflictCount}
- Source of truth: ${result.sourceASummary.system} (trust level ${result.sourceASummary.trustRanking}) vs ${result.sourceBSummary.system} (trust level ${result.sourceBSummary.trustRanking})

TOP CONFLICTS:
${result.conflicts
  .slice(0, 10)
  .map(
    (c) =>
      `- ${c.entityLabel}: ${c.fieldLabel} — ${c.sourceA} says "${c.sourceAValue}", ${c.sourceB} says "${c.sourceBValue}". Recommendation: ${c.recommendationReason}`,
  )
  .join("\n")}

Write a 2-3 paragraph summary suitable for the specified tone.
If governor tone: focus on GDPR compliance risk and recommend an action.
If staff tone: focus on what needs updating and by whom.
If Ofsted tone: frame as evidence of data accuracy procedures.
End with the recommended next step.`;
}

/**
 * Build a report prompt for a migration readiness report
 */
export function buildMigrationReportPrompt(
  tone: ReportTone,
  report: MigrationReport,
  context: { schoolName: string },
): string {
  const tonePrompt = TONE_SYSTEM_PROMPTS[tone];

  return `${HUMANIZER_INSTRUCTIONS}

TONE: ${tonePrompt}

SECTION: MIS Migration Readiness — ${report.fromSystem} to ${report.toSystem}
SCHOOL: ${context.schoolName}

READINESS: ${report.readinessScore}/100 (${report.readinessLabel})

RECORDS:
- ${report.fromSystem}: ${report.records.sourceCount} records
- ${report.toSystem}: ${report.records.targetCount} records
- Matched: ${report.records.matchedCount}
- Only in ${report.fromSystem}: ${report.records.onlyInSource.length} (${report.records.onlyInSource
    .slice(0, 5)
    .map((r) => r.label)
    .join(", ")}${report.records.onlyInSource.length > 5 ? "..." : ""})
- Only in ${report.toSystem}: ${report.records.onlyInTarget.length}

FIELDS:
- Auto-mapped: ${report.fieldMapping.autoMappedFields}/${report.fieldMapping.totalSourceFields}
- Unmapped in ${report.fromSystem}: ${report.fieldMapping.unmappedSourceFields.join(", ") || "none"}

CONFLICTS: ${report.reconciliation.conflictCount} data discrepancies between systems

CRITICAL ACTIONS:
${
  report.actions
    .filter((a) => a.priority === "critical")
    .map((a) => `- ${a.title}`)
    .join("\n") || "None"
}

Write an executive summary (3-4 paragraphs) of the migration readiness.
Start with the readiness score and what it means in plain English.
Highlight the critical actions that MUST be completed before migration.
End with a recommended timeline.`;
}

// ─── Report Pack Templates ─────────────────────────────────

/**
 * Pre-built report pack templates for common school needs
 */
export const REPORT_PACK_TEMPLATES: Array<{
  id: string;
  title: string;
  description: string;
  tone: ReportTone;
  targetAudience: string;
  sections: Array<{
    title: string;
    type: ReportSection["type"];
    businessArea: BusinessArea;
    dataQuery?: string;
  }>;
}> = [
  {
    id: "autumn-governor",
    title: "Autumn Term Governor Report",
    description: "Comprehensive termly update for the governing board",
    tone: "governor_brief",
    targetAudience: "Governors",
    sections: [
      {
        title: "Headteacher's Summary",
        type: "narrative",
        businessArea: "governance",
      },
      {
        title: "Attendance Overview",
        type: "chart",
        businessArea: "attendance",
        dataQuery: "attendance_summary_term",
      },
      {
        title: "Budget Position",
        type: "chart",
        businessArea: "finance",
        dataQuery: "budget_vs_actual_ytd",
      },
      {
        title: "Staffing Update",
        type: "narrative",
        businessArea: "staffing_hr",
        dataQuery: "staff_changes_term",
      },
      {
        title: "SEND Register Summary",
        type: "metric",
        businessArea: "send",
        dataQuery: "send_register_summary",
      },
      {
        title: "Safeguarding Report",
        type: "narrative",
        businessArea: "safeguarding",
        dataQuery: "safeguarding_summary_term",
      },
      {
        title: "Premises Update",
        type: "table",
        businessArea: "premises_coshh",
        dataQuery: "estates_tasks_open",
      },
      {
        title: "Data Quality Health Check",
        type: "alert_list",
        businessArea: "data_quality",
      },
    ],
  },
  {
    id: "staff-briefing",
    title: "Staff Briefing Pack",
    description: "Weekly or fortnightly staff update with key metrics",
    tone: "staff_update",
    targetAudience: "All staff",
    sections: [
      {
        title: "This Week's Headlines",
        type: "narrative",
        businessArea: "attendance",
      },
      {
        title: "Attendance This Week",
        type: "chart",
        businessArea: "attendance",
        dataQuery: "attendance_weekly",
      },
      {
        title: "Open Actions",
        type: "table",
        businessArea: "staffing_hr",
        dataQuery: "actions_open_by_owner",
      },
      {
        title: "Upcoming Deadlines",
        type: "table",
        businessArea: "governance",
        dataQuery: "tasks_due_7_days",
      },
    ],
  },
  {
    id: "ofsted-evidence-pack",
    title: "Ofsted Evidence Pack",
    description: "Self-evaluation evidence organised by EIF judgement area",
    tone: "ofsted_evidence",
    targetAudience: "Ofsted inspectors / SLT",
    sections: [
      {
        title: "Quality of Education",
        type: "narrative",
        businessArea: "curriculum_progress",
      },
      {
        title: "Pupil Outcomes",
        type: "chart",
        businessArea: "curriculum_progress",
        dataQuery: "ks2_outcomes_trend",
      },
      {
        title: "Behaviour and Attitudes",
        type: "chart",
        businessArea: "attendance",
        dataQuery: "attendance_vs_national",
      },
      {
        title: "Personal Development",
        type: "narrative",
        businessArea: "wellbeing",
      },
      {
        title: "Leadership and Management",
        type: "narrative",
        businessArea: "governance",
      },
      {
        title: "Safeguarding",
        type: "narrative",
        businessArea: "safeguarding",
      },
    ],
  },
  {
    id: "migration-readiness",
    title: "MIS Migration Readiness Report",
    description: "Comprehensive data comparison for MIS transition",
    tone: "staff_update",
    targetAudience: "Business Manager / SLT",
    sections: [
      {
        title: "Executive Summary",
        type: "narrative",
        businessArea: "data_quality",
      },
      {
        title: "Readiness Score",
        type: "metric",
        businessArea: "data_quality",
      },
      {
        title: "Record Comparison",
        type: "table",
        businessArea: "data_quality",
      },
      { title: "Field Mapping", type: "table", businessArea: "data_quality" },
      {
        title: "Data Discrepancies",
        type: "chart",
        businessArea: "data_quality",
      },
      {
        title: "Critical Actions",
        type: "action_list",
        businessArea: "data_quality",
      },
      {
        title: "Data Quality Issues",
        type: "alert_list",
        businessArea: "data_quality",
      },
    ],
  },
  {
    id: "trust-board-pack",
    title: "Trust Board Report Pack",
    description: "Multi-school data pack with benchmarking and risk flags",
    tone: "trust_board",
    targetAudience: "Trust Board / CEO",
    sections: [
      {
        title: "Trust Overview",
        type: "narrative",
        businessArea: "governance",
      },
      {
        title: "School Performance Summary",
        type: "table",
        businessArea: "curriculum_progress",
      },
      {
        title: "Attendance Comparison",
        type: "chart",
        businessArea: "attendance",
        dataQuery: "attendance_by_school",
      },
      {
        title: "Financial Position",
        type: "chart",
        businessArea: "finance",
        dataQuery: "budget_by_school",
      },
      {
        title: "Risk Register Highlights",
        type: "alert_list",
        businessArea: "governance",
      },
      {
        title: "Staffing Metrics",
        type: "metric",
        businessArea: "staffing_hr",
      },
    ],
  },
  {
    id: "parent-newsletter-data",
    title: "Parent Data Summary",
    description: "Plain English data summary for parent newsletter or website",
    tone: "parent_communication",
    targetAudience: "Parents",
    sections: [
      {
        title: "How We're Doing",
        type: "narrative",
        businessArea: "attendance",
      },
      {
        title: "Attendance",
        type: "chart",
        businessArea: "attendance",
        dataQuery: "attendance_simple",
      },
      {
        title: "What We're Working On",
        type: "narrative",
        businessArea: "curriculum_progress",
      },
      {
        title: "How You Can Help",
        type: "narrative",
        businessArea: "attendance",
      },
    ],
  },
  {
    id: "reconciliation-report",
    title: "Data Reconciliation Report",
    description:
      "GDPR Article 5(1)(d) compliance evidence — cross-system data accuracy",
    tone: "governor_brief",
    targetAudience: "DPO / Headteacher / Governors",
    sections: [
      {
        title: "Executive Summary",
        type: "narrative",
        businessArea: "data_quality",
      },
      {
        title: "Systems Compared",
        type: "metric",
        businessArea: "data_quality",
      },
      {
        title: "Discrepancies Found",
        type: "chart",
        businessArea: "data_quality",
      },
      {
        title: "Resolutions Applied",
        type: "table",
        businessArea: "data_quality",
      },
      {
        title: "GDPR Compliance Statement",
        type: "narrative",
        businessArea: "data_quality",
      },
      { title: "Standing Rules", type: "table", businessArea: "data_quality" },
    ],
  },
];

// ─── Section Narrative Generators (no AI needed) ───────────

/**
 * Generate a plain-text reconciliation GDPR compliance statement
 * (deterministic, no AI call needed)
 */
export function generateGDPRComplianceStatement(
  schoolName: string,
  reconciliationCount: number,
  approvedBy: string,
  approvedAt: string,
): string {
  const date = new Date(approvedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return `Under GDPR Article 5(1)(d), ${schoolName} is required to take reasonable steps to ensure personal data is accurate and kept up to date. On ${date}, a data reconciliation was conducted comparing ${reconciliationCount} data points across connected school systems. All reconciliation decisions were reviewed and approved by ${approvedBy}. Each decision has been logged in the Schoolgle Canvas audit trail with the approver's identity, timestamp, and reasoning. This provides evidence that ${schoolName} is meeting its obligations under the accuracy principle. The next reconciliation is recommended within 3 months, or immediately following any significant data change (e.g., payroll run, MIS migration, new academic year).`;
}

/**
 * Generate a migration timeline recommendation
 * (deterministic, no AI call needed)
 */
export function generateMigrationTimeline(
  report: MigrationReport,
): Array<{ week: string; action: string; owner: string }> {
  const timeline: Array<{ week: string; action: string; owner: string }> = [];
  const criticalActions = report.actions.filter(
    (a) => a.priority === "critical",
  );
  const importantActions = report.actions.filter(
    (a) => a.priority === "important",
  );

  // Week 1: Fix critical data quality
  if (report.sourceQualityIssues.length > 0) {
    timeline.push({
      week: "Week 1",
      action: `Fix ${report.sourceQualityIssues.length} data quality issues in ${report.fromSystem}`,
      owner: "Office Manager",
    });
  }

  // Week 2: Resolve missing records
  if (report.records.onlyInSource.length > 0) {
    timeline.push({
      week: "Week 2",
      action: `Create ${report.records.onlyInSource.length} missing records in ${report.toSystem}`,
      owner: "Office Manager",
    });
  }

  // Week 3: Resolve conflicts
  if (report.reconciliation.conflictCount > 0) {
    timeline.push({
      week: "Week 3",
      action: `Review and resolve ${report.reconciliation.conflictCount} data discrepancies`,
      owner: "Business Manager / Headteacher",
    });
  }

  // Week 4: Map unmapped fields
  if (report.fieldMapping.unmappedSourceFields.length > 0) {
    timeline.push({
      week: "Week 4",
      action: `Map ${report.fieldMapping.unmappedSourceFields.length} unmapped fields to ${report.toSystem} equivalents`,
      owner: "IT Lead / Business Manager",
    });
  }

  // Week 5: Re-run and verify
  timeline.push({
    week: `Week ${Math.max(5, timeline.length + 1)}`,
    action: "Re-run migration readiness check to verify all issues resolved",
    owner: "Business Manager",
  });

  // Week 6: Go live
  timeline.push({
    week: `Week ${Math.max(6, timeline.length + 1)}`,
    action: `Go live on ${report.toSystem} — parallel run recommended for 2 weeks`,
    owner: "Headteacher",
  });

  return timeline;
}
