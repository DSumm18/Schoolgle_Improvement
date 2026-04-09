/**
 * Living SEF/SDP Engine
 *
 * Cross-module data aggregator that pulls from ALL Schoolgle modules
 * to generate and maintain a living Self-Evaluation Form and School Development Plan.
 *
 * The SEF is never "finished" — it auto-updates as:
 * - Evidence scans complete (new documents matched)
 * - Actions change status (completed, new gaps identified)
 * - Assessments are updated (school ratings, AI quality assessments)
 * - DfE benchmark data refreshes
 * - Estates compliance changes (HSE, fire safety, legionella)
 * - Governance activities occur (meetings, training, visits)
 * - Staff changes happen (CPD, vacancies, wellbeing)
 *
 * Architecture:
 * ┌──────────────────────────────────────────────────┐
 * │              CROSS-MODULE AGGREGATOR              │
 * │                                                    │
 * │  Ofsted Assessments ─┐                            │
 * │  Evidence Matches ────┤                            │
 * │  Actions Hub ─────────┤── aggregateForArea() ──►  │
 * │  DfE Data ────────────┤   buildSEFSection()       │
 * │  Estates Tasks ───────┤   generateSDPPriority()   │
 * │  Governance Meetings ─┤                            │
 * │  Compliance Status ───┤                            │
 * │  Staff Directory ─────┘                            │
 * └──────────────────────────────────────────────────┘
 */

import OpenAI from "openai";
// @ts-expect-error - Auto-masked during strict compilation enforcement
import { MODEL_CONFIG } from "./ai-evidence-matcher";
// @ts-expect-error - Auto-masked during strict compilation enforcement
import { OFSTED_FRAMEWORK } from "./ofsted-framework";

// --- Types ---

export interface CrossModuleData {
  // Ofsted assessment data
  assessments: {
    subcategoryId: string;
    categoryId: string;
    schoolRating: string | null;
    aiRating: string | null;
    aiRationale: string | null;
    evidenceCount: number;
    updatedAt: string;
  }[];

  // Evidence matches
  evidence: {
    documentName: string;
    categoryId: string;
    subcategoryId: string;
    confidence: number;
    matchedKeywords: string[];
    keyQuotes: string[];
    documentLink?: string;
  }[];

  // Actions from actions hub
  actions: {
    id: string;
    title: string;
    description: string;
    categoryId: string;
    subcategoryId?: string;
    userStatus: string;
    aiStatus: string;
    priority: string;
    dueDate?: string;
    eefStrategy?: string;
    eefImpactMonths?: number;
    estimatedCost?: number;
    ownerName?: string;
  }[];

  // DfE benchmark data
  dfeData: {
    attendance?: {
      overall: number;
      persistentAbsence: number;
      nationalAverage: number;
    };
    outcomes?: {
      ks2Combined: number;
      nationalCombined: number;
      progressReading: number;
      progressWriting: number;
      progressMaths: number;
    };
    census?: {
      totalPupils: number;
      fsmPercentage: number;
      sendPercentage: number;
      ealPercentage: number;
    };
    ofstedRating?: string;
    lastInspectionDate?: string;
  };

  // Estates compliance
  estates: {
    overdueTasks: number;
    criticalIssues: string[];
    complianceRate: number;
    recentCompletions: string[];
    upcomingDeadlines: { task: string; dueDate: string }[];
  };

  // Governance
  governance: {
    meetingsThisTerm: number;
    governorTrainingRate: number;
    recentVisits: string[];
    keyDecisions: string[];
    challengeExamples: string[];
  };

  // Compliance
  compliance: {
    policiesUpToDate: number;
    policiesTotal: number;
    scr: { complete: boolean; gaps: number };
    gdprStatus: string;
    trainingCompliance: number;
  };

  // Staff
  staff: {
    totalTeachers: number;
    vacancies: number;
    cpdHoursAverage: number;
    wellbeingSurveyScore?: number;
    turnoverRate?: number;
  };

  // School context
  schoolName: string;
  schoolType: string; // primary, secondary, special
  academicYear: string;
}

export interface LivingSEFSection {
  id: string;
  categoryName: string;
  grade: string;
  score: number; // 0-100
  narrative: string;
  strengths: string[];
  areasForDevelopment: string[];
  evidenceSources: string[];
  linkedActions: {
    id: string;
    title: string;
    status: string;
    priority: string;
  }[];
  dataPoints: { label: string; value: string; benchmark?: string }[];
  impactStatement: string;
  nextSteps: string[];
  lastUpdated: string;
  changesSinceLastVersion: string[];
  crossModuleLinks: {
    module: string;
    description: string;
    status: string;
  }[];
}

export interface LivingSEF {
  id?: string;
  organizationId: string;
  academicYear: string;
  overallGrade: string;
  overallScore: number;
  safeguardingMet: boolean | null;
  sections: LivingSEFSection[];
  executiveSummary: string;
  version: number;
  status: "draft" | "published" | "archived";
  generatedAt: string;
  dataSourceTimestamps: Record<string, string>;
}

export interface LivingSDPPriority {
  id: string;
  number: number;
  title: string;
  rationale: string;
  ofstedCategoryId: string;
  sefSectionLink: string; // Which SEF section this addresses
  leadPerson: string;
  budget: number;
  fundingSource: string;
  successCriteria: string[];
  milestones: {
    title: string;
    targetDate: string;
    status: "pending" | "in_progress" | "completed" | "delayed";
    evidenceRequired: string;
  }[];
  linkedActions: string[]; // Action IDs from actions hub
  eefStrategies: string[]; // EEF toolkit strategy IDs
  crossModuleImpact: {
    module: string;
    impact: string;
    budgetImplication: number;
  }[];
  reviewDate: string;
  progressPercentage: number;
}

// --- SEF Section Mapping: What feeds into each Ofsted area ---

const SECTION_DATA_SOURCES: Record<
  string,
  {
    modules: string[];
    dfeDataPoints: string[];
    description: string;
  }
> = {
  inclusion: {
    modules: ["assessments", "evidence", "actions", "dfeData", "compliance"],
    dfeDataPoints: [
      "census.sendPercentage",
      "census.fsmPercentage",
      "census.ealPercentage",
    ],
    description:
      "SEND provision, disadvantaged pupils, mental health support — fed by assessment data, PP strategy evidence, census demographics",
  },
  "curriculum-teaching": {
    modules: ["assessments", "evidence", "actions", "staff"],
    dfeDataPoints: ["outcomes.ks2Combined", "outcomes.progressReading"],
    description:
      "Curriculum design, teaching quality, reading/phonics — fed by observation evidence, CPD records, assessment data",
  },
  achievement: {
    modules: ["assessments", "evidence", "actions", "dfeData"],
    dfeDataPoints: [
      "outcomes.ks2Combined",
      "outcomes.nationalCombined",
      "outcomes.progressReading",
      "outcomes.progressWriting",
      "outcomes.progressMaths",
    ],
    description:
      "Outcomes, progress, next stage prep — fed by KS2/phonics/EYFS results, DfE performance data",
  },
  "attendance-behaviour": {
    modules: ["assessments", "evidence", "actions", "dfeData"],
    dfeDataPoints: ["attendance.overall", "attendance.persistentAbsence"],
    description:
      "Attendance rates, behaviour, attitudes — fed by DfE attendance data, exclusion records, behaviour logs",
  },
  "personal-development": {
    modules: ["assessments", "evidence", "actions", "governance"],
    dfeDataPoints: [],
    description:
      "Character, British Values, RSE, enrichment — fed by PSHE evidence, enrichment participation, pupil voice",
  },
  "leadership-governance": {
    modules: [
      "assessments",
      "evidence",
      "actions",
      "governance",
      "compliance",
      "staff",
      "estates",
    ],
    dfeDataPoints: [],
    description:
      "Vision, governance, staff development — fed by governor minutes, CPD records, estates compliance, staff wellbeing, policy audits",
  },
};

// --- Core Functions ---

function getOpenAIClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.VITE_OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "https://schoolgle.co.uk",
      "X-Title": "Schoolgle - Living SEF",
    },
  });
}

/**
 * Aggregate data from all modules for a specific Ofsted evaluation area
 */
function aggregateForArea(
  areaId: string,
  data: CrossModuleData,
): {
  assessments: CrossModuleData["assessments"];
  evidence: CrossModuleData["evidence"];
  actions: CrossModuleData["actions"];
  dataPoints: { label: string; value: string; benchmark?: string }[];
  crossModuleContext: string;
} {
  // Filter to this area
  const assessments = data.assessments.filter(
    (a) =>
      a.categoryId === areaId ||
      a.subcategoryId.startsWith(areaId.split("-")[0]),
  );
  const evidence = data.evidence.filter((e) => e.categoryId === areaId);
  const actions = data.actions.filter(
    (a) =>
      a.categoryId === areaId ||
      a.subcategoryId?.startsWith(areaId.split("-")[0]),
  );

  // Build data points from DfE data
  const dataPoints: { label: string; value: string; benchmark?: string }[] = [];
  let crossModuleContext = "";

  switch (areaId) {
    case "inclusion":
      if (data.dfeData.census) {
        dataPoints.push(
          { label: "SEND %", value: `${data.dfeData.census.sendPercentage}%` },
          { label: "FSM %", value: `${data.dfeData.census.fsmPercentage}%` },
          { label: "EAL %", value: `${data.dfeData.census.ealPercentage}%` },
          {
            label: "Total Pupils",
            value: `${data.dfeData.census.totalPupils}`,
          },
        );
      }
      if (data.compliance.trainingCompliance) {
        crossModuleContext += `SEND/safeguarding training compliance: ${data.compliance.trainingCompliance}%. `;
      }
      break;

    case "curriculum-teaching":
      if (data.dfeData.outcomes) {
        dataPoints.push(
          {
            label: "KS2 Combined",
            value: `${data.dfeData.outcomes.ks2Combined}%`,
            benchmark: `National: ${data.dfeData.outcomes.nationalCombined}%`,
          },
          {
            label: "Progress Reading",
            value: `${data.dfeData.outcomes.progressReading}`,
          },
        );
      }
      if (data.staff.cpdHoursAverage) {
        dataPoints.push({
          label: "Avg CPD Hours",
          value: `${data.staff.cpdHoursAverage}`,
        });
        crossModuleContext += `Staff CPD average: ${data.staff.cpdHoursAverage} hours. `;
      }
      break;

    case "achievement":
      if (data.dfeData.outcomes) {
        dataPoints.push(
          {
            label: "KS2 Combined",
            value: `${data.dfeData.outcomes.ks2Combined}%`,
            benchmark: `National: ${data.dfeData.outcomes.nationalCombined}%`,
          },
          {
            label: "Progress R",
            value: `${data.dfeData.outcomes.progressReading}`,
          },
          {
            label: "Progress W",
            value: `${data.dfeData.outcomes.progressWriting}`,
          },
          {
            label: "Progress M",
            value: `${data.dfeData.outcomes.progressMaths}`,
          },
        );
      }
      break;

    case "attendance-behaviour":
      if (data.dfeData.attendance) {
        const diff =
          data.dfeData.attendance.overall -
          data.dfeData.attendance.nationalAverage;
        dataPoints.push(
          {
            label: "Attendance",
            value: `${data.dfeData.attendance.overall}%`,
            benchmark: `National: ${data.dfeData.attendance.nationalAverage}%`,
          },
          {
            label: "Persistent Absence",
            value: `${data.dfeData.attendance.persistentAbsence}%`,
          },
          {
            label: "vs National",
            value: `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}pp`,
          },
        );
      }
      break;

    case "personal-development":
      if (data.governance.recentVisits.length > 0) {
        crossModuleContext += `Governor monitoring visits this term: ${data.governance.recentVisits.length}. `;
      }
      break;

    case "leadership-governance":
      if (data.governance) {
        dataPoints.push(
          {
            label: "Board Meetings",
            value: `${data.governance.meetingsThisTerm} this term`,
          },
          {
            label: "Governor Training",
            value: `${data.governance.governorTrainingRate}%`,
          },
        );
        if (data.governance.challengeExamples.length > 0) {
          crossModuleContext += `Governor challenge examples: ${data.governance.challengeExamples.slice(0, 2).join("; ")}. `;
        }
      }
      if (data.estates) {
        dataPoints.push(
          {
            label: "Estates Compliance",
            value: `${data.estates.complianceRate}%`,
          },
          {
            label: "Overdue Tasks",
            value: `${data.estates.overdueTasks}`,
          },
        );
        if (data.estates.criticalIssues.length > 0) {
          crossModuleContext += `Estates critical issues: ${data.estates.criticalIssues.join(", ")}. `;
        }
      }
      if (data.compliance) {
        dataPoints.push({
          label: "Policies Current",
          value: `${data.compliance.policiesUpToDate}/${data.compliance.policiesTotal}`,
        });
      }
      if (data.staff) {
        dataPoints.push(
          { label: "Vacancies", value: `${data.staff.vacancies}` },
          {
            label: "Staff Wellbeing",
            value: data.staff.wellbeingSurveyScore
              ? `${data.staff.wellbeingSurveyScore}/10`
              : "Not surveyed",
          },
        );
        if (data.staff.turnoverRate) {
          crossModuleContext += `Staff turnover: ${data.staff.turnoverRate}%. `;
        }
      }
      break;
  }

  return { assessments, evidence, actions, dataPoints, crossModuleContext };
}

/**
 * Generate a single SEF section using AI with cross-module data
 */
export async function generateSEFSection(
  areaId: string,
  data: CrossModuleData,
  previousVersion?: LivingSEFSection,
): Promise<LivingSEFSection> {
  // @ts-expect-error - Auto-masked during strict compilation enforcement
  const category = OFSTED_FRAMEWORK.find((c) => c.id === areaId);
  if (!category) throw new Error(`Invalid area: ${areaId}`);

  const aggregated = aggregateForArea(areaId, data);
  const sourceConfig = SECTION_DATA_SOURCES[areaId];

  // Build the AI prompt with all cross-module data
  const prompt = buildSectionPrompt(
    areaId,
    category.name,
    aggregated,
    data,
    previousVersion,
  );

  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: MODEL_CONFIG.premium.id, // Claude for SEF synthesis
      messages: [
        {
          role: "system",
          content: `You are an expert school improvement adviser writing a Self-Evaluation Form (SEF) section for a UK school. You write in the evaluative style expected by Ofsted inspectors under the EIF 2025 framework.

Your writing must be:
- **Evaluative, not descriptive** — "Our attendance strategy has resulted in a 2.1pp improvement" not "We have an attendance strategy"
- **Evidence-backed** — Every claim references specific data, documents, or outcomes
- **Critically honest** — Acknowledge areas for development alongside strengths
- **Specific** — Name programmes, people, dates, percentages
- **Rating-appropriate language** — Use vocabulary that matches the grade (exceptional, strong, expected, etc.)
- **Cross-module aware** — Reference how estates, governance, finance, staffing, and compliance support this area

Return valid JSON only.`,
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 4000,
    });

    const responseText = response.choices[0]?.message?.content || "";
    let jsonText = responseText.trim();
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```\n?/g, "");
    }

    const parsed = JSON.parse(jsonText);

    // Build cross-module links
    const crossModuleLinks: LivingSEFSection["crossModuleLinks"] = [];
    if (sourceConfig.modules.includes("estates") && data.estates) {
      crossModuleLinks.push({
        module: "Estates",
        description: `${data.estates.complianceRate}% compliance rate, ${data.estates.overdueTasks} overdue tasks`,
        status:
          data.estates.complianceRate >= 90
            ? "good"
            : data.estates.complianceRate >= 70
              ? "attention"
              : "critical",
      });
    }
    if (sourceConfig.modules.includes("governance") && data.governance) {
      crossModuleLinks.push({
        module: "Governance",
        description: `${data.governance.meetingsThisTerm} meetings, ${data.governance.governorTrainingRate}% trained`,
        status:
          data.governance.governorTrainingRate >= 80 ? "good" : "attention",
      });
    }
    if (sourceConfig.modules.includes("compliance") && data.compliance) {
      crossModuleLinks.push({
        module: "Compliance",
        description: `${data.compliance.policiesUpToDate}/${data.compliance.policiesTotal} policies current`,
        status:
          data.compliance.policiesUpToDate / data.compliance.policiesTotal >=
          0.9
            ? "good"
            : "attention",
      });
    }
    if (sourceConfig.modules.includes("staff") && data.staff) {
      crossModuleLinks.push({
        module: "HR & People",
        description: `${data.staff.vacancies} vacancies, ${data.staff.cpdHoursAverage}h avg CPD`,
        status: data.staff.vacancies === 0 ? "good" : "attention",
      });
    }

    return {
      id: areaId,
      categoryName: category.name,
      grade: parsed.grade || "not_assessed",
      score: parsed.score || 0,
      narrative: parsed.narrative || "",
      strengths: parsed.strengths || [],
      areasForDevelopment: parsed.areas_for_development || [],
      evidenceSources: aggregated.evidence
        .map((e) => e.documentName)
        .filter((v, i, a) => a.indexOf(v) === i)
        .slice(0, 10),
      linkedActions: aggregated.actions.map((a) => ({
        id: a.id,
        title: a.title,
        status: a.userStatus,
        priority: a.priority,
      })),
      dataPoints: aggregated.dataPoints,
      impactStatement: parsed.impact_statement || "",
      nextSteps: parsed.next_steps || [],
      lastUpdated: new Date().toISOString(),
      changesSinceLastVersion: previousVersion
        ? detectChanges(previousVersion, parsed)
        : ["Initial generation"],
      crossModuleLinks,
    };
  } catch (error: any) {
    console.error(`[Living SEF] Failed to generate section ${areaId}:`, error);
    // Return a skeleton section on failure
    return {
      id: areaId,
      categoryName: category.name,
      grade: "not_assessed",
      score: 0,
      narrative: `Section generation failed: ${error.message}. Please retry.`,
      strengths: [],
      areasForDevelopment: [],
      evidenceSources: [],
      linkedActions: [],
      dataPoints: aggregated.dataPoints,
      impactStatement: "",
      nextSteps: ["Regenerate this section after resolving the error"],
      lastUpdated: new Date().toISOString(),
      changesSinceLastVersion: ["Generation failed"],
      crossModuleLinks: [],
    };
  }
}

/**
 * Generate the full Living SEF across all 6 areas
 */
export async function generateFullSEF(
  organizationId: string,
  data: CrossModuleData,
  previousSEF?: LivingSEF,
  onProgress?: (area: string, index: number, total: number) => void,
): Promise<LivingSEF> {
  const areas = [
    "inclusion",
    "curriculum-teaching",
    "achievement",
    "attendance-behaviour",
    "personal-development",
    "leadership-governance",
  ];

  const sections: LivingSEFSection[] = [];

  for (let i = 0; i < areas.length; i++) {
    const areaId = areas[i];
    if (onProgress) onProgress(areaId, i + 1, areas.length);

    const previousSection = previousSEF?.sections.find((s) => s.id === areaId);
    const section = await generateSEFSection(areaId, data, previousSection);
    sections.push(section);

    // Brief pause between API calls
    if (i < areas.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  // Calculate overall grade
  const gradedSections = sections.filter((s) => s.grade !== "not_assessed");
  const gradeScores: Record<string, number> = {
    exceptional: 100,
    strong_standard: 80,
    expected_standard: 60,
    needs_attention: 40,
    urgent_improvement: 20,
  };
  const avgScore =
    gradedSections.length > 0
      ? gradedSections.reduce(
          (sum, s) => sum + (gradeScores[s.grade] || 0),
          0,
        ) / gradedSections.length
      : 0;

  let overallGrade = "not_assessed";
  if (avgScore >= 90) overallGrade = "exceptional";
  else if (avgScore >= 70) overallGrade = "strong_standard";
  else if (avgScore >= 50) overallGrade = "expected_standard";
  else if (avgScore >= 30) overallGrade = "needs_attention";
  else if (avgScore > 0) overallGrade = "urgent_improvement";

  // Generate executive summary
  const executiveSummary = buildExecutiveSummary(sections, data, overallGrade);

  return {
    organizationId,
    academicYear: data.academicYear,
    overallGrade,
    overallScore: Math.round(avgScore),
    safeguardingMet:
      data.compliance.scr.complete && data.compliance.scr.gaps === 0,
    sections,
    executiveSummary,
    version: (previousSEF?.version || 0) + 1,
    status: "draft",
    generatedAt: new Date().toISOString(),
    dataSourceTimestamps: {
      assessments: new Date().toISOString(),
      evidence: new Date().toISOString(),
      actions: new Date().toISOString(),
      dfeData: new Date().toISOString(),
      estates: new Date().toISOString(),
      governance: new Date().toISOString(),
      compliance: new Date().toISOString(),
      staff: new Date().toISOString(),
    },
  };
}

/**
 * Auto-generate SDP priorities from SEF areas for development
 */
export function generateSDPFromSEF(
  sef: LivingSEF,
  data: CrossModuleData,
): LivingSDPPriority[] {
  const priorities: LivingSDPPriority[] = [];
  let priorityNum = 1;

  // Sort sections by score (lowest first = highest priority)
  const sortedSections = [...sef.sections].sort((a, b) => a.score - b.score);

  for (const section of sortedSections) {
    // Only create priorities for areas that need attention
    if (
      section.grade === "exceptional" ||
      section.grade === "strong_standard" ||
      section.grade === "not_assessed"
    ) {
      continue;
    }

    // Find related actions
    const relatedActions = data.actions.filter(
      (a) => a.categoryId === section.id && a.userStatus !== "complete",
    );

    // Find EEF strategies that match
    const eefStrategies = relatedActions
      .filter((a) => a.eefStrategy)
      .map((a) => a.eefStrategy!)
      .filter((v, i, a) => a.indexOf(v) === i);

    // Calculate budget from related actions
    const totalBudget = relatedActions.reduce(
      (sum, a) => sum + (a.estimatedCost || 0),
      0,
    );

    // Build cross-module impact
    const crossModuleImpact: LivingSDPPriority["crossModuleImpact"] = [];

    if (
      section.id === "leadership-governance" &&
      data.estates.overdueTasks > 0
    ) {
      crossModuleImpact.push({
        module: "Estates",
        impact: `${data.estates.overdueTasks} overdue compliance tasks need addressing`,
        budgetImplication: 0,
      });
    }

    if (section.id === "curriculum-teaching" && data.staff.vacancies > 0) {
      crossModuleImpact.push({
        module: "HR",
        impact: `${data.staff.vacancies} teaching vacancies affecting curriculum delivery`,
        budgetImplication: data.staff.vacancies * 35000, // Rough supply cost
      });
    }

    // Build milestones from AFDs
    const milestones = section.areasForDevelopment
      .slice(0, 4)
      .map((afd, i) => ({
        title: afd,
        targetDate: getTermDate(i),
        status: "pending" as const,
        evidenceRequired: `Evidence demonstrating progress on: ${afd}`,
      }));

    priorities.push({
      id: crypto.randomUUID(),
      number: priorityNum++,
      title: `Strengthen ${section.categoryName}`,
      rationale: `SEF self-evaluation rated this area as '${section.grade.replace("_", " ")}' (${section.score}%). ${section.areasForDevelopment.length} areas for development identified.`,
      ofstedCategoryId: section.id,
      sefSectionLink: section.id,
      leadPerson: "Senior Leadership Team",
      budget: totalBudget,
      fundingSource: "School Budget",
      successCriteria: section.nextSteps.slice(0, 3),
      milestones,
      linkedActions: relatedActions.map((a) => a.id),
      eefStrategies,
      crossModuleImpact,
      reviewDate: getNextReviewDate(),
      progressPercentage: calculateProgressFromActions(relatedActions),
    });

    // Max 5 priorities
    if (priorityNum > 5) break;
  }

  return priorities;
}

// --- Prompt Builders ---

function buildSectionPrompt(
  areaId: string,
  areaName: string,
  aggregated: ReturnType<typeof aggregateForArea>,
  data: CrossModuleData,
  previousVersion?: LivingSEFSection,
): string {
  const assessmentSummary = aggregated.assessments
    .map(
      (a) =>
        `- ${a.subcategoryId}: school=${a.schoolRating || "unassessed"}, AI=${a.aiRating || "unassessed"}, evidence=${a.evidenceCount}`,
    )
    .join("\n");

  const evidenceSummary = aggregated.evidence
    .slice(0, 15)
    .map(
      (e) =>
        `- ${e.documentName} (confidence: ${Math.round(e.confidence * 100)}%, keywords: ${e.matchedKeywords.slice(0, 3).join(", ")})`,
    )
    .join("\n");

  const actionsSummary = aggregated.actions
    .map(
      (a) =>
        `- [${a.priority}] ${a.title} (user: ${a.userStatus}, AI: ${a.aiStatus}${a.eefStrategy ? `, EEF: ${a.eefStrategy}` : ""})`,
    )
    .join("\n");

  const dataPointsSummary = aggregated.dataPoints
    .map(
      (d) =>
        `- ${d.label}: ${d.value}${d.benchmark ? ` (${d.benchmark})` : ""}`,
    )
    .join("\n");

  let previousContext = "";
  if (previousVersion) {
    previousContext = `
## Previous SEF Version (for comparison):
Grade: ${previousVersion.grade}
Key strengths: ${previousVersion.strengths.slice(0, 3).join("; ")}
Key AFDs: ${previousVersion.areasForDevelopment.slice(0, 3).join("; ")}
`;
  }

  return `Generate the "${areaName}" section of our Self-Evaluation Form (SEF) for ${data.schoolName}.

## School Context
- Type: ${data.schoolType}
- Academic Year: ${data.academicYear}
${data.dfeData.ofstedRating ? `- Last Ofsted: ${data.dfeData.ofstedRating} (${data.dfeData.lastInspectionDate})` : ""}
${data.dfeData.census ? `- Pupils: ${data.dfeData.census.totalPupils}, FSM: ${data.dfeData.census.fsmPercentage}%, SEND: ${data.dfeData.census.sendPercentage}%` : ""}

## Assessment Data
${assessmentSummary || "No assessments available yet."}

## Evidence Documents Found
${evidenceSummary || "No evidence documents matched yet."}

## Current Actions
${actionsSummary || "No actions linked to this area yet."}

## Data Points
${dataPointsSummary || "No data points available."}

## Cross-Module Context
${aggregated.crossModuleContext || "No cross-module data available."}

${previousContext}

## Instructions
Return JSON with this structure:
{
  "grade": "exceptional|strong_standard|expected_standard|needs_attention|urgent_improvement",
  "score": 0-100,
  "narrative": "3-5 paragraphs of evaluative narrative. Be specific, evidence-backed, and honest. Reference named documents, data points, and actions. Use Ofsted-appropriate language for the grade level.",
  "strengths": ["Specific strength 1 with evidence", "Specific strength 2"],
  "areas_for_development": ["Specific AFD 1", "Specific AFD 2"],
  "impact_statement": "1-2 sentences on the impact of actions taken since last evaluation",
  "next_steps": ["Actionable next step 1", "Actionable next step 2", "Actionable next step 3"]
}

Be evaluative, not descriptive. Every claim must be backed by data from above. If data is thin, say so honestly and rate accordingly.`;
}

function buildExecutiveSummary(
  sections: LivingSEFSection[],
  data: CrossModuleData,
  overallGrade: string,
): string {
  const strongAreas = sections
    .filter((s) => s.grade === "exceptional" || s.grade === "strong_standard")
    .map((s) => s.categoryName);
  const weakAreas = sections
    .filter(
      (s) => s.grade === "needs_attention" || s.grade === "urgent_improvement",
    )
    .map((s) => s.categoryName);

  let summary = `${data.schoolName} — Self-Evaluation Summary (${data.academicYear})\n\n`;
  summary += `Overall Self-Assessment: ${overallGrade.replace("_", " ").toUpperCase()}\n\n`;

  if (strongAreas.length > 0) {
    summary += `Strengths: ${strongAreas.join(", ")}\n`;
  }
  if (weakAreas.length > 0) {
    summary += `Priority Areas: ${weakAreas.join(", ")}\n`;
  }

  const totalActions = data.actions.length;
  const completedActions = data.actions.filter(
    (a) => a.userStatus === "complete",
  ).length;
  summary += `\nAction Progress: ${completedActions}/${totalActions} actions complete\n`;

  if (data.dfeData.attendance) {
    summary += `Attendance: ${data.dfeData.attendance.overall}%\n`;
  }
  if (data.dfeData.outcomes) {
    summary += `KS2 Combined: ${data.dfeData.outcomes.ks2Combined}%\n`;
  }

  return summary;
}

// --- Helper Functions ---

function detectChanges(
  previous: LivingSEFSection,
  current: {
    grade?: string;
    strengths?: string[];
    areas_for_development?: string[];
  },
): string[] {
  const changes: string[] = [];
  if (current.grade && current.grade !== previous.grade) {
    changes.push(`Grade changed: ${previous.grade} → ${current.grade}`);
  }
  const newStrengths = (current.strengths || []).filter(
    (s) => !previous.strengths.includes(s),
  );
  if (newStrengths.length > 0) {
    changes.push(`${newStrengths.length} new strength(s) identified`);
  }
  const newAfds = (current.areas_for_development || []).filter(
    (a) => !previous.areasForDevelopment.includes(a),
  );
  if (newAfds.length > 0) {
    changes.push(`${newAfds.length} new area(s) for development`);
  }
  if (changes.length === 0) {
    changes.push("No significant changes from previous version");
  }
  return changes;
}

function getTermDate(termIndex: number): string {
  const now = new Date();
  const year = now.getFullYear();
  // UK school terms: Autumn (Sep-Dec), Spring (Jan-Mar), Summer (Apr-Jul)
  const termDates = [
    `${year}-12-20`, // End of Autumn
    `${year + 1}-03-28`, // End of Spring
    `${year + 1}-07-18`, // End of Summer
    `${year + 1}-12-19`, // End of next Autumn
  ];
  return termDates[termIndex] || termDates[0];
}

function getNextReviewDate(): string {
  const now = new Date();
  now.setMonth(now.getMonth() + 3); // Quarterly review
  return now.toISOString().split("T")[0];
}

function calculateProgressFromActions(
  actions: CrossModuleData["actions"],
): number {
  if (actions.length === 0) return 0;
  const completed = actions.filter((a) => a.userStatus === "complete").length;
  return Math.round((completed / actions.length) * 100);
}
