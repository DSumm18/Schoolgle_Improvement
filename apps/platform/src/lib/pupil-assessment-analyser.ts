/**
 * Pupil Assessment Analyser
 *
 * Analyses PSEUDONYMISED pupil data to generate insights:
 * - Teacher assessment accuracy (over/under-assessing?)
 * - Scheme effectiveness (did the new programme help?)
 * - Class-level anomalies (one class falling behind?)
 * - Group comparisons (FSM vs non-FSM, SEN vs non-SEN)
 * - Individual pupil trajectories (who needs intervention?)
 * - EEF-backed recommendations for specific groups
 *
 * CRITICAL: This only ever sees pupil_hash, never real names.
 * All insights reference hash IDs that only the school can decode.
 */

import { ROUTER_MODELS } from "@/lib/ai-openrouter";

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import {
  eefStrategies,
  getRelevantStrategies,
  type EEFStrategy,
} from "./eef-toolkit";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// --- Types ---

interface PupilRecord {
  pupil_hash: string;
  year_group: number;
  is_fsm: boolean | null;
  is_send: boolean | null;
  send_type: string | null;
  is_eal: boolean | null;
  is_pp: boolean | null;
  gender: string | null;
  subject: string;
  assessment_period: string;
  academic_year_start: number;
  attainment_level: string | null;
  scaled_score: number | null;
  teacher_assessment: string | null;
  progress_score: number | null;
}

export interface AssessmentAnalysis {
  importId: string;
  summary: {
    totalPupils: number;
    yearGroups: number[];
    subjects: string[];
    overallProfile: string;
  };
  insights: AssessmentInsight[];
  groupComparisons: GroupComparison[];
  teacherAssessmentCheck: TeacherAccuracyReport;
  interventionRecommendations: InterventionRecommendation[];
}

export interface AssessmentInsight {
  type: string;
  title: string;
  narrative: string;
  severity: "critical" | "concern" | "monitor" | "positive" | "celebrating";
  affectedPupilHashes: string[];
  yearGroup: number;
  subject: string;
  dataEvidence: string;
  eefRecommendation: string | null;
}

export interface GroupComparison {
  group1Label: string;
  group2Label: string;
  subject: string;
  yearGroup: number;
  group1Pct: number; // % at expected+
  group2Pct: number;
  gap: number;
  gapDirection: string;
  significance: string; // 'significant', 'notable', 'minimal'
  narrative: string;
}

export interface TeacherAccuracyReport {
  overall: string; // 'accurate', 'tends_over', 'tends_under', 'insufficient_data'
  bySubject: {
    subject: string;
    accuracy: string;
    gapMagnitude: number;
    narrative: string;
    affectedPupilHashes: string[];
  }[];
}

export interface InterventionRecommendation {
  targetGroup: string; // Description of who needs help
  targetPupilHashes: string[];
  yearGroup: number;
  subject: string;
  currentLevel: string;
  targetLevel: string;
  eefStrategy: {
    id: string;
    name: string;
    monthsProgress: number;
    evidenceStrength: number;
    implementationTips: string[];
  };
  rationale: string;
  suggestedDuration: string;
  reviewPoint: string;
}

// --- Analysis Functions ---

const ATTAINMENT_ORDER: Record<string, number> = {
  WTS: 0,
  EXS: 1,
  GDS: 2,
};

function attainmentToNum(level: string | null): number {
  if (!level) return -1;
  return ATTAINMENT_ORDER[level] ?? -1;
}

function pctAtExpectedOrAbove(records: PupilRecord[]): number {
  const withLevel = records.filter(
    (r) => r.attainment_level && attainmentToNum(r.attainment_level) >= 0,
  );
  if (withLevel.length === 0) return 0;
  const atExpected = withLevel.filter(
    (r) => attainmentToNum(r.attainment_level) >= 1,
  );
  return Math.round((atExpected.length / withLevel.length) * 100);
}

function pctAtGreaterDepth(records: PupilRecord[]): number {
  const withLevel = records.filter(
    (r) => r.attainment_level && attainmentToNum(r.attainment_level) >= 0,
  );
  if (withLevel.length === 0) return 0;
  const atGD = withLevel.filter(
    (r) => attainmentToNum(r.attainment_level) >= 2,
  );
  return Math.round((atGD.length / withLevel.length) * 100);
}

/**
 * Compare two groups and calculate the gap
 */
function compareGroups(
  group1: PupilRecord[],
  group2: PupilRecord[],
  group1Label: string,
  group2Label: string,
  subject: string,
  yearGroup: number,
): GroupComparison | null {
  if (group1.length < 3 || group2.length < 3) return null; // Need minimum sample

  const g1Pct = pctAtExpectedOrAbove(group1);
  const g2Pct = pctAtExpectedOrAbove(group2);
  const gap = g1Pct - g2Pct;

  const significance =
    Math.abs(gap) >= 20
      ? "significant"
      : Math.abs(gap) >= 10
        ? "notable"
        : "minimal";

  return {
    group1Label,
    group2Label,
    subject,
    yearGroup,
    group1Pct: g1Pct,
    group2Pct: g2Pct,
    gap,
    gapDirection:
      gap > 0
        ? `${group1Label} outperforming`
        : gap < 0
          ? `${group2Label} outperforming`
          : "Equal",
    significance,
    narrative:
      significance === "minimal"
        ? `No significant gap between ${group1Label} (${g1Pct}%) and ${group2Label} (${g2Pct}%) in ${subject} Y${yearGroup}.`
        : `${Math.abs(gap)}pp gap in ${subject} Y${yearGroup}: ${gap > 0 ? group1Label : group2Label} at ${Math.max(g1Pct, g2Pct)}% vs ${Math.min(g1Pct, g2Pct)}%. ${significance === "significant" ? "This requires immediate attention." : "Monitor closely."}`,
  };
}

/**
 * Check teacher assessment accuracy against test scores
 */
function checkTeacherAccuracy(records: PupilRecord[]): TeacherAccuracyReport {
  const withBoth = records.filter(
    (r) =>
      r.teacher_assessment &&
      r.attainment_level &&
      r.teacher_assessment !== r.attainment_level,
  );

  if (withBoth.length < 5) {
    return {
      overall: "insufficient_data",
      bySubject: [],
    };
  }

  const bySubject = new Map<string, PupilRecord[]>();
  for (const r of records.filter(
    (r) => r.teacher_assessment && r.attainment_level,
  )) {
    if (!bySubject.has(r.subject)) bySubject.set(r.subject, []);
    bySubject.get(r.subject)!.push(r);
  }

  const subjectReports = Array.from(bySubject.entries()).map(
    ([subject, subjectRecords]) => {
      let overCount = 0;
      let underCount = 0;
      let accurateCount = 0;
      const misassessedHashes: string[] = [];

      for (const r of subjectRecords) {
        const taNum = attainmentToNum(r.teacher_assessment);
        const actualNum = attainmentToNum(r.attainment_level);
        if (taNum < 0 || actualNum < 0) continue;

        if (taNum > actualNum) {
          overCount++;
          misassessedHashes.push(r.pupil_hash);
        } else if (taNum < actualNum) {
          underCount++;
          misassessedHashes.push(r.pupil_hash);
        } else {
          accurateCount++;
        }
      }

      const total = overCount + underCount + accurateCount;
      const accuracy =
        overCount > total * 0.3
          ? "tends_over"
          : underCount > total * 0.3
            ? "tends_under"
            : "accurate";

      const gapMagnitude = total > 0 ? (overCount + underCount) / total : 0;

      return {
        subject,
        accuracy,
        gapMagnitude: Math.round(gapMagnitude * 100) / 100,
        narrative:
          accuracy === "accurate"
            ? `Teacher assessments in ${subject} are well-calibrated (${accurateCount}/${total} accurate).`
            : accuracy === "tends_over"
              ? `Teacher assessments in ${subject} tend to OVER-assess: ${overCount}/${total} pupils assessed higher than test results suggest. Consider moderation.`
              : `Teacher assessments in ${subject} tend to UNDER-assess: ${underCount}/${total} pupils assessed lower than test results. Some pupils may be more capable than recognised.`,
        affectedPupilHashes: misassessedHashes,
      };
    },
  );

  const overallTendsOver = subjectReports.filter(
    (s) => s.accuracy === "tends_over",
  ).length;
  const overallTendsUnder = subjectReports.filter(
    (s) => s.accuracy === "tends_under",
  ).length;

  return {
    overall:
      overallTendsOver > overallTendsUnder
        ? "tends_over"
        : overallTendsUnder > overallTendsOver
          ? "tends_under"
          : "accurate",
    bySubject: subjectReports,
  };
}

/**
 * Identify pupils who need intervention and match to EEF strategies
 */
function generateInterventionRecommendations(
  records: PupilRecord[],
): InterventionRecommendation[] {
  const recommendations: InterventionRecommendation[] = [];

  // Group by year_group + subject
  const groups = new Map<string, PupilRecord[]>();
  for (const r of records) {
    const key = `${r.year_group}-${r.subject}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }

  for (const [key, groupRecords] of groups) {
    const [yearGroupStr, subject] = key.split("-");
    const yearGroup = parseInt(yearGroupStr);

    // Find pupils working below expected
    const belowExpected = groupRecords.filter(
      (r) => r.attainment_level && attainmentToNum(r.attainment_level) < 1,
    );

    if (belowExpected.length === 0) continue;

    const totalWithLevel = groupRecords.filter(
      (r) => r.attainment_level && attainmentToNum(r.attainment_level) >= 0,
    ).length;
    const belowPct = Math.round((belowExpected.length / totalWithLevel) * 100);

    // Find relevant EEF strategies
    const searchTerms = `${subject} below expected progress catch-up intervention`;
    const strategies = getRelevantStrategies(searchTerms);

    if (strategies.length === 0) continue;

    const bestStrategy = strategies[0];

    // Identify specific subgroups
    const fsmBelow = belowExpected.filter((r) => r.is_fsm);
    const sendBelow = belowExpected.filter((r) => r.is_send);
    const boysBelow = belowExpected.filter((r) => r.gender === "M");
    const girlsBelow = belowExpected.filter((r) => r.gender === "F");

    // Main recommendation for all below-expected pupils
    recommendations.push({
      targetGroup: `${belowExpected.length} pupils below expected in ${subject} (${belowPct}% of Y${yearGroup})`,
      targetPupilHashes: belowExpected.map((r) => r.pupil_hash),
      yearGroup,
      subject,
      currentLevel: "WTS",
      targetLevel: "EXS",
      eefStrategy: {
        id: bestStrategy.id,
        name: bestStrategy.name,
        monthsProgress: bestStrategy.monthsProgress,
        evidenceStrength: bestStrategy.evidenceStrength,
        implementationTips: bestStrategy.implementationTips.slice(0, 3),
      },
      rationale:
        `${belowPct}% of Year ${yearGroup} are below expected standard in ${subject}. ` +
        `${bestStrategy.name} has evidence strength ${bestStrategy.evidenceStrength}/5 showing ` +
        `+${bestStrategy.monthsProgress} months additional progress. ` +
        (fsmBelow.length > belowExpected.length * 0.5
          ? `Disproportionately affects disadvantaged pupils (${fsmBelow.length}/${belowExpected.length} are FSM). `
          : "") +
        (sendBelow.length > belowExpected.length * 0.3
          ? `${sendBelow.length}/${belowExpected.length} have SEND — consider adaptive approaches. `
          : ""),
      suggestedDuration:
        bestStrategy.monthsProgress >= 5
          ? "6-8 weeks minimum"
          : "One full term",
      reviewPoint:
        "After 6 weeks — if no improvement, consider alternative strategy or remove scheme as a concern",
    });
  }

  return recommendations;
}

// --- Main Analysis Entry Point ---

/**
 * Run full analysis on pseudonymised pupil data.
 *
 * This is called AFTER the client-side pseudonymiser has processed
 * the CSV and sent hash-only data to the server.
 */
export async function analysePupilAssessments(
  organizationId: string,
  importId: string,
): Promise<AssessmentAnalysis> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Fetch all pseudonymised records for this import
  const { data: records, error } = await supabase
    .from("pupil_assessments_pseudo")
    .select("*")
    .eq("import_id", importId)
    .eq("organization_id", organizationId);

  if (error || !records || records.length === 0) {
    throw new Error(`No pupil data found for import ${importId}`);
  }

  const typedRecords: PupilRecord[] = records;

  // Basic stats
  const uniquePupils = new Set(typedRecords.map((r) => r.pupil_hash));
  const yearGroups = [...new Set(typedRecords.map((r) => r.year_group))].sort();
  const subjects = [...new Set(typedRecords.map((r) => r.subject))];

  // 1. Group comparisons
  const groupComparisons: GroupComparison[] = [];

  for (const yg of yearGroups) {
    for (const subject of subjects) {
      const ygSubject = typedRecords.filter(
        (r) => r.year_group === yg && r.subject === subject,
      );

      // FSM vs non-FSM
      const fsm = ygSubject.filter((r) => r.is_fsm === true);
      const nonFsm = ygSubject.filter((r) => r.is_fsm === false);
      const fsmComp = compareGroups(fsm, nonFsm, "FSM", "Non-FSM", subject, yg);
      if (fsmComp) groupComparisons.push(fsmComp);

      // SEN vs non-SEN
      const sen = ygSubject.filter((r) => r.is_send === true);
      const nonSen = ygSubject.filter((r) => r.is_send === false);
      const senComp = compareGroups(
        sen,
        nonSen,
        "SEND",
        "Non-SEND",
        subject,
        yg,
      );
      if (senComp) groupComparisons.push(senComp);

      // Boys vs Girls
      const boys = ygSubject.filter((r) => r.gender === "M");
      const girls = ygSubject.filter((r) => r.gender === "F");
      const genderComp = compareGroups(
        boys,
        girls,
        "Boys",
        "Girls",
        subject,
        yg,
      );
      if (genderComp) groupComparisons.push(genderComp);

      // PP vs non-PP
      const pp = ygSubject.filter((r) => r.is_pp === true);
      const nonPp = ygSubject.filter((r) => r.is_pp === false);
      const ppComp = compareGroups(
        pp,
        nonPp,
        "Pupil Premium",
        "Non-PP",
        subject,
        yg,
      );
      if (ppComp) groupComparisons.push(ppComp);
    }
  }

  // 2. Teacher assessment accuracy
  const teacherAssessmentCheck = checkTeacherAccuracy(typedRecords);

  // 3. Intervention recommendations
  const interventionRecommendations =
    generateInterventionRecommendations(typedRecords);

  // 4. Generate AI insights using cross-referenced data
  const insights = await generateAIInsights(
    organizationId,
    typedRecords,
    groupComparisons,
    teacherAssessmentCheck,
    interventionRecommendations,
  );

  // 5. Store insights in database
  await storeInsights(
    supabase as any,
    organizationId,
    importId,
    insights,
    groupComparisons,
    teacherAssessmentCheck,
  );

  // 6. Update import status
  await supabase
    .from("school_assessment_imports")
    .update({
      status: "complete",
      total_pupils: uniquePupils.size,
      total_records: typedRecords.length,
      subjects_included: subjects,
      updated_at: new Date().toISOString(),
    })
    .eq("id", importId);

  return {
    importId,
    summary: {
      totalPupils: uniquePupils.size,
      yearGroups,
      subjects,
      overallProfile:
        `${uniquePupils.size} pupils across Year${yearGroups.length > 1 ? "s" : ""} ${yearGroups.join(", ")} in ${subjects.join(", ")}. ` +
        `${pctAtExpectedOrAbove(typedRecords)}% at expected standard or above. ` +
        `${pctAtGreaterDepth(typedRecords)}% at greater depth.`,
    },
    insights,
    groupComparisons: groupComparisons.filter(
      (gc) => gc.significance !== "minimal",
    ),
    teacherAssessmentCheck,
    interventionRecommendations,
  };
}

/**
 * Use AI to generate deeper insights from the data patterns
 */
async function generateAIInsights(
  organizationId: string,
  records: PupilRecord[],
  comparisons: GroupComparison[],
  taCheck: TeacherAccuracyReport,
  interventions: InterventionRecommendation[],
): Promise<AssessmentInsight[]> {
  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  // Build aggregated data summary (no individual pupil data in prompt)
  const yearGroups = [...new Set(records.map((r) => r.year_group))].sort();
  const subjects = [...new Set(records.map((r) => r.subject))];

  const dataLines: string[] = [];
  for (const yg of yearGroups) {
    for (const subject of subjects) {
      const ygSubj = records.filter(
        (r) => r.year_group === yg && r.subject === subject,
      );
      if (ygSubj.length === 0) continue;

      const expPct = pctAtExpectedOrAbove(ygSubj);
      const gdPct = pctAtGreaterDepth(ygSubj);
      const fsmPct = pctAtExpectedOrAbove(ygSubj.filter((r) => r.is_fsm));
      const senPct = pctAtExpectedOrAbove(ygSubj.filter((r) => r.is_send));

      dataLines.push(
        `Y${yg} ${subject}: ${ygSubj.length} pupils | ${expPct}% expected+ | ${gdPct}% GD | FSM: ${fsmPct}% | SEND: ${senPct}%`,
      );
    }
  }

  const significantGaps = comparisons
    .filter((c) => c.significance === "significant")
    .map((c) => c.narrative);

  const prompt = `Analyse this pseudonymised school assessment data and identify key patterns:

ASSESSMENT DATA:
${dataLines.join("\n")}

SIGNIFICANT GAPS:
${significantGaps.length > 0 ? significantGaps.join("\n") : "No significant gaps identified."}

TEACHER ASSESSMENT: ${taCheck.overall}
${taCheck.bySubject.map((s) => s.narrative).join("\n")}

INTERVENTIONS NEEDED:
${interventions.map((i) => `${i.targetGroup} — recommend ${i.eefStrategy.name}`).join("\n")}

Return JSON array of insights. Each insight should identify a specific pattern, concern, or celebration.
Focus on: patterns across subjects, groups needing urgent support, assessment calibration issues,
and whether current attainment matches expected trajectories.

[{"type":"concern|celebrating|pattern","title":"...","narrative":"...","severity":"critical|concern|monitor|positive|celebrating","yearGroup":3,"subject":"reading","dataEvidence":"...","eefRecommendation":"...or null"}]`;

  try {
    const completion = await openai.chat.completions.create({
      model: ROUTER_MODELS.DEFAULT,
      messages: [
        {
          role: "system",
          content:
            "You are a UK primary school data analyst expert. Analyse pseudonymised assessment data to identify patterns, concerns, and celebrations. Never attempt to identify individual children. Reference EEF strategies where relevant. Be specific with percentages and year groups.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 3000,
      response_format: { type: "json_object" },
    });

    const text = completion.choices[0]?.message?.content || "[]";
    const parsed = JSON.parse(text);
    const insightsArray = Array.isArray(parsed)
      ? parsed
      : parsed.insights || [];
    return insightsArray.map((i: AssessmentInsight) => ({
      ...i,
      affectedPupilHashes: [], // AI doesn't see individual hashes
    }));
  } catch (err) {
    console.error("[Assessment Analyser] AI insights failed:", err);
    return [];
  }
}

/**
 * Store generated insights in the database
 */
async function storeInsights(
  supabase: any,
  organizationId: string,
  importId: string,
  insights: AssessmentInsight[],
  comparisons: GroupComparison[],
  taCheck: TeacherAccuracyReport,
): Promise<void> {
  const rows = [];

  // Store AI insights
  for (const insight of insights) {
    rows.push({
      organization_id: organizationId,
      import_id: importId,
      insight_type:
        insight.severity === "celebrating"
          ? "pupil_progress"
          : insight.type === "pattern"
            ? "cohort_trajectory"
            : "pupil_progress",
      target_year_group: insight.yearGroup,
      target_subject: insight.subject,
      title: insight.title,
      narrative: insight.narrative,
      severity: insight.severity,
      data_points: { evidence: insight.dataEvidence },
      eef_strategy_id: insight.eefRecommendation || null,
      recommended_action: insight.eefRecommendation,
    });
  }

  // Store significant group comparisons
  for (const comp of comparisons.filter(
    (c) => c.significance === "significant",
  )) {
    rows.push({
      organization_id: organizationId,
      import_id: importId,
      insight_type: "group_comparison",
      target_year_group: comp.yearGroup,
      target_subject: comp.subject,
      title: `${comp.group1Label} vs ${comp.group2Label} gap in ${comp.subject} Y${comp.yearGroup}`,
      narrative: comp.narrative,
      severity: Math.abs(comp.gap) >= 20 ? "concern" : "monitor",
      data_points: {
        group1: comp.group1Label,
        group1Pct: comp.group1Pct,
        group2: comp.group2Label,
        group2Pct: comp.group2Pct,
        gap: comp.gap,
      },
    });
  }

  // Store teacher accuracy findings
  for (const subj of taCheck.bySubject.filter(
    (s) => s.accuracy !== "accurate",
  )) {
    rows.push({
      organization_id: organizationId,
      import_id: importId,
      insight_type: "teacher_assessment_accuracy",
      target_subject: subj.subject,
      title: `Teacher assessment ${subj.accuracy === "tends_over" ? "over-assessing" : "under-assessing"} in ${subj.subject}`,
      narrative: subj.narrative,
      severity: subj.gapMagnitude > 0.4 ? "concern" : "monitor",
      data_points: {
        accuracy: subj.accuracy,
        gapMagnitude: subj.gapMagnitude,
      },
      assessment_gap_direction:
        subj.accuracy === "tends_over" ? "over_assessing" : "under_assessing",
      assessment_gap_magnitude: subj.gapMagnitude,
      target_pupil_hashes: subj.affectedPupilHashes.slice(0, 50), // Limit stored hashes
    });
  }

  if (rows.length > 0) {
    await supabase.from("pupil_analysis_insights").insert(rows);
  }
}
