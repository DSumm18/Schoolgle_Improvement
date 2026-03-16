/**
 * MIS Intelligence Analysis Engine
 *
 * Core pattern detection engine that reads data via MISDataService and produces
 * actionable intelligence for school leaders. Stateless — reads fresh each time,
 * processes in memory, returns results. No Supabase writes.
 *
 * ARCHITECTURE:
 * - All data read via getMISDataService() (local test harness, Drive, or Wonde)
 * - AttainmentLevel scoring: PKF=0, WTS=1, EXS=2, GDS=3
 * - "Expected" = EXS or GDS → % at Expected = count(level >= EXS) / total × 100
 * - Each method handles missing data gracefully (empty results + warnings)
 * - Every finding includes suggested_actions strings
 */

import { getMISDataService } from "./data-service";
import type {
  MISPupil,
  MISAttendanceRecord,
  MISTermlyAssessment,
  MISBehaviourIncident,
  MISStaffMember,
  MISTeacherClassHistory,
  MISSENRecord,
  MISHistoricalKS2,
  AttainmentLevel,
  AssessmentSubject,
} from "./types";

// ═══════════════════════════════════════════════════════════
// Return Types
// ═══════════════════════════════════════════════════════════

/** Result wrapper for all analysis methods */
export interface AnalysisResult<T> {
  findings: T[];
  warnings: string[];
  data_sources_used: string[];
  analysis_timestamp: string;
}

/** Teacher performance comparison across parallel classes */
export interface TeacherPerformancePattern {
  teacher_name: string;
  staff_id: string;
  subject: AssessmentSubject;
  direction: "underperforming" | "excelling";
  average_gap_pp: number;
  years_detected: string[];
  year_group: number;
  registration_group: string;
  pct_at_expected: number;
  parallel_teacher_comparison: {
    teacher_name: string;
    staff_id: string;
    registration_group: string;
    pct_at_expected: number;
  }[];
  suggested_actions: string[];
}

/** Alert when teacher assessments diverge from standardised scores */
export interface AssessmentInflationAlert {
  registration_group: string;
  year_group: number;
  teacher_name: string;
  staff_id: string;
  subject: AssessmentSubject;
  assessment_period: string;
  academic_year: string;
  ta_pct_expected: number;
  standardised_pct_expected: number;
  gap_pp: number;
  direction: "inflated" | "deflated";
  parallel_class_comparison: {
    registration_group: string;
    teacher_name: string;
    ta_pct_expected: number;
    standardised_pct_expected: number;
    gap_pp: number;
  }[];
  suggested_actions: string[];
}

/** Alert for a pupil on a declining trajectory */
export interface DecliningPupilAlert {
  student_id: string;
  pupil_name: string;
  year_group: number;
  registration_group: string;
  subject: AssessmentSubject;
  grades_over_time: {
    assessment_period: string;
    academic_year: string;
    level: AttainmentLevel;
    score: number;
  }[];
  current_status: AttainmentLevel;
  on_intervention: boolean;
  on_sen_register: boolean;
  pupil_premium: boolean;
  urgency: "high" | "medium" | "low";
  suggested_actions: string[];
}

/** Positive progress story for SEN/EHCP/PP pupils */
export interface PupilProgressStory {
  student_id: string;
  pupil_name: string;
  year_group: number;
  registration_group: string;
  sen_status: "N" | "K" | "E";
  pupil_premium: boolean;
  subject: AssessmentSubject;
  from_level: AttainmentLevel;
  to_level: AttainmentLevel;
  from_score: number;
  to_score: number;
  duration_terms: number;
  academic_years: string[];
  correlated_support: string[];
  suitable_for: string[];
  suggested_actions: string[];
}

/** Cohort-level anomaly detection */
export interface CohortAnomaly {
  year_group: number;
  registration_group: string;
  subject: AssessmentSubject;
  academic_year: string;
  pct_at_expected: number;
  school_avg_pct: number;
  gap_pp: number;
  probable_cause: string;
  teacher_name: string;
  teacher_absence_periods: {
    term: string;
    academic_year: string;
    role: string;
  }[];
  suggested_actions: string[];
}

/** Pupil Premium gap analysis */
export interface PPGapAnalysis {
  per_subject: {
    subject: AssessmentSubject;
    data_points: {
      assessment_period: string;
      academic_year: string;
      pp_pct_expected: number;
      non_pp_pct_expected: number;
      gap_pp: number;
    }[];
    trend_direction: "widening" | "narrowing" | "stable" | "insufficient_data";
    latest_gap_pp: number;
  }[];
  borderline_pupils: {
    student_id: string;
    pupil_name: string;
    year_group: number;
    subject: AssessmentSubject;
    current_level: AttainmentLevel;
    distance_to_expected: number;
  }[];
  projected_impact: string;
  suggested_actions: string[];
}

/** Gender gap analysis */
export interface GenderGapAnalysis {
  year_group: number;
  subject: AssessmentSubject;
  academic_year: string;
  boys_pct_expected: number;
  girls_pct_expected: number;
  gap_pp: number;
  direction: "boys_ahead" | "girls_ahead" | "equal";
  national_comparison?: {
    national_boys_pct: number;
    national_girls_pct: number;
    national_gap_pp: number;
  };
  suggested_actions: string[];
}

/** SEN pupil progress from own baseline */
export interface SENProgressSummary {
  student_id: string;
  pupil_name: string;
  year_group: number;
  registration_group: string;
  sen_status: "K" | "E";
  sen_primary_need: string;
  ehcp: boolean;
  subjects: {
    subject: AssessmentSubject;
    baseline_level: AttainmentLevel;
    baseline_score: number;
    current_level: AttainmentLevel;
    current_score: number;
    progress_points: number;
    assessment_count: number;
    trajectory: "accelerating" | "steady" | "plateauing" | "declining";
  }[];
  overall_progress: "above_expected" | "expected" | "below_expected";
  provision_description?: string;
  suggested_actions: string[];
}

/** Attendance–attainment correlation band */
export interface AttendanceAttainmentBand {
  attendance_band: string;
  attendance_min: number;
  attendance_max: number;
  pupil_count: number;
  avg_pct_expected: number;
  avg_attainment_score: number;
  subjects: {
    subject: AssessmentSubject;
    avg_pct_expected: number;
  }[];
}

/** Full attendance–attainment correlation result */
export interface AttendanceAttainmentCorrelation {
  bands: AttendanceAttainmentBand[];
  correlation_strength: "strong" | "moderate" | "weak" | "insufficient_data";
  correlation_coefficient: number;
  key_finding: string;
  suggested_actions: string[];
}

/** Bradford Factor alert for a staff member */
export interface BradfordFactorAlert {
  staff_id: string;
  staff_name: string;
  job_title: string;
  role_type: "Teaching" | "Support" | "Leadership";
  spells: number;
  total_days: number;
  bradford_factor: number;
  threshold_level: "monitor" | "concern" | "serious" | "critical";
  suggested_actions: string[];
}

/** Staff absence impact on class outcomes */
export interface StaffAbsenceImpact {
  staff_id: string;
  staff_name: string;
  year_group: number;
  registration_group: string;
  academic_year: string;
  absence_days: number;
  classes_affected: string[];
  attainment_impact: {
    subject: AssessmentSubject;
    pct_expected_with_teacher: number;
    pct_expected_during_absence: number;
    gap_pp: number;
  }[];
  behaviour_impact?: {
    incidents_per_week_with_teacher: number;
    incidents_per_week_during_absence: number;
    change_pct: number;
  };
  suggested_actions: string[];
}

/** RAG rating for Ofsted readiness */
export type RAGRating = "green" | "amber" | "red";

/** Individual Ofsted readiness check */
export interface OfstedReadinessCheck {
  area: string;
  category:
    | "quality_of_education"
    | "behaviour_attitudes"
    | "personal_development"
    | "leadership_management"
    | "safeguarding";
  rating: RAGRating;
  headline: string;
  detail: string;
  data_point?: string;
  suggested_actions: string[];
}

/** Full Ofsted readiness scan result */
export interface OfstedReadinessScan {
  overall_rating: RAGRating;
  checks: OfstedReadinessCheck[];
  strengths: string[];
  risks: string[];
  immediate_actions: string[];
  scan_date: string;
}

/** Governor report data section */
export interface GovernorReportSection {
  title: string;
  order: number;
  data: Record<string, unknown>;
  narrative: string;
  key_points: string[];
}

/** Full governor report data */
export interface GovernorReportData {
  report_date: string;
  academic_year: string;
  sections: GovernorReportSection[];
  warnings: string[];
}

// ═══════════════════════════════════════════════════════════
// Scoring Utilities
// ═══════════════════════════════════════════════════════════

/** Numeric score for each attainment level. PKF=0, WTS=1, EXS=2, GDS=3 */
const ATTAINMENT_SCORES: Record<string, number> = {
  PKF: 0,
  WTS: 1,
  EXS: 2,
  GDS: 3,
  EMG: 1, // EYFS Emerging ≈ WTS
  EXP: 2, // EYFS Expected ≈ EXS
};

function attainmentScore(level: AttainmentLevel | string): number {
  return ATTAINMENT_SCORES[level] ?? -1;
}

function isAtExpected(level: AttainmentLevel | string): boolean {
  const score = attainmentScore(level);
  return score >= 2; // EXS=2 or GDS=3
}

function pctAtExpected(levels: (AttainmentLevel | string)[]): number {
  if (levels.length === 0) return 0;
  const atExpected = levels.filter(isAtExpected).length;
  return Math.round((atExpected / levels.length) * 1000) / 10;
}

function avgAttainmentScore(levels: (AttainmentLevel | string)[]): number {
  if (levels.length === 0) return 0;
  const scores = levels.map(attainmentScore).filter((s) => s >= 0);
  if (scores.length === 0) return 0;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

/** Group an array by a key function */
function groupBy<T>(arr: T[], keyFn: (item: T) => string): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  for (const item of arr) {
    const key = keyFn(item);
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return groups;
}

/** Pearson correlation coefficient */
function pearsonCorrelation(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n < 3) return 0;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : num / den;
}

/** Order assessment periods chronologically within a year */
const PERIOD_ORDER: Record<string, number> = {
  Aut1: 1,
  Aut2: 2,
  Autumn: 2,
  Spr1: 3,
  Spr2: 4,
  Spring: 4,
  Sum1: 5,
  Sum2: 6,
  Summer: 6,
};

function periodOrdinal(academicYear: string, period: string): number {
  const yearStart = parseInt(academicYear.split("-")[0], 10) || 0;
  return yearStart * 10 + (PERIOD_ORDER[period] ?? 0);
}

// ═══════════════════════════════════════════════════════════
// Analysis Engine
// ═══════════════════════════════════════════════════════════

/**
 * MIS Intelligence Analysis Engine
 *
 * Stateless engine that reads school MIS data and produces actionable
 * intelligence for school leaders, governors, and Ofsted preparation.
 *
 * @example
 * ```ts
 * const engine = new MISAnalysisEngine();
 * const patterns = await engine.detectTeacherPerformancePatterns('org-123');
 * const ofstedScan = await engine.runOfstedReadinessScan('org-123');
 * ```
 */
export class MISAnalysisEngine {
  private svc = getMISDataService();
  private orgId: string;

  constructor(organizationId?: string) {
    this.orgId = organizationId || "";
  }

  /**
   * Build a name-based lookup map for pupils.
   * Assessment data from trackers may use different IDs than the MIS pupil roll,
   * so we also index by "LastName, FirstName" to bridge the gap.
   */
  private buildPupilMap(pupils: MISPupil[]): Map<string, MISPupil> {
    const map = new Map<string, MISPupil>();
    for (const p of pupils) {
      // Index by student_id
      map.set(p.student_id, p);
      // Index by "LastName, FirstName" (tracker format)
      const nameKey = `${p.last_name}, ${p.first_name}`;
      map.set(nameKey, p);
      // Index by lowercase variant
      map.set(nameKey.toLowerCase(), p);
    }
    return map;
  }

  /** Look up a pupil from assessment data, trying student_id first then name */
  private lookupPupil(
    pupilMap: Map<string, MISPupil>,
    assessment: MISTermlyAssessment,
  ): MISPupil | undefined {
    return (
      pupilMap.get(assessment.student_id) ||
      pupilMap.get(assessment.pupil_name) ||
      pupilMap.get(assessment.pupil_name?.toLowerCase())
    );
  }

  /** Build a name-based SEN lookup (bridges different ID systems) */
  private buildSENMap(senRecords: MISSENRecord[]): Map<string, MISSENRecord> {
    const map = new Map<string, MISSENRecord>();
    for (const s of senRecords) {
      map.set(s.student_id, s);
      const nameKey = `${s.last_name}, ${s.first_name}`;
      map.set(nameKey, s);
      map.set(nameKey.toLowerCase(), s);
    }
    return map;
  }

  /** Check if a pupil is on the SEN register by ID or name */
  private isSEN(
    senMap: Map<string, MISSENRecord>,
    assessment: MISTermlyAssessment,
  ): boolean {
    return !!(
      senMap.get(assessment.student_id) ||
      senMap.get(assessment.pupil_name) ||
      senMap.get(assessment.pupil_name?.toLowerCase())
    );
  }

  /** Look up SEN record by assessment */
  private lookupSEN(
    senMap: Map<string, MISSENRecord>,
    assessment: MISTermlyAssessment,
  ): MISSENRecord | undefined {
    return (
      senMap.get(assessment.student_id) ||
      senMap.get(assessment.pupil_name) ||
      senMap.get(assessment.pupil_name?.toLowerCase())
    );
  }

  // ─── 1. Teacher Performance Patterns ────────────────────

  /**
   * Compare Class A vs B results per year group across years.
   * If the gap follows the teacher (not the cohort), flag it.
   */
  async detectTeacherPerformancePatterns(): Promise<
    AnalysisResult<TeacherPerformancePattern>
  > {
    const warnings: string[] = [];
    const dataSources: string[] = [];

    const [assessmentsResult, historyResult] = await Promise.all([
      this.svc.read<MISTermlyAssessment>(this.orgId, "termly_assessments"),
      this.svc.read<MISTeacherClassHistory>(
        this.orgId,
        "teacher_class_history",
      ),
    ]);

    warnings.push(...assessmentsResult.warnings, ...historyResult.warnings);
    dataSources.push(
      assessmentsResult.source.fileName || "termly_assessments",
      historyResult.source.fileName || "teacher_class_history",
    );

    if (assessmentsResult.recordCount === 0) {
      warnings.push(
        "No termly assessment data available — cannot detect teacher performance patterns.",
      );
      return this.emptyResult(warnings, dataSources);
    }

    const assessments = assessmentsResult.data;
    const findings: TeacherPerformancePattern[] = [];

    // Group assessments by academic_year + year_group + subject
    const yearGroupSubjectGroups = groupBy(
      assessments,
      (a) => `${a.academic_year}|${a.year_group}|${a.subject}`,
    );

    for (const [key, group] of Object.entries(yearGroupSubjectGroups)) {
      const [academicYear, ygStr, subject] = key.split("|");
      const yearGroup = parseInt(ygStr, 10);

      // Use the latest assessment period within this year for comparison
      const latestPeriod = group.reduce((latest, a) => {
        const latestOrd = periodOrdinal(
          latest.academic_year,
          latest.assessment_period,
        );
        const currentOrd = periodOrdinal(a.academic_year, a.assessment_period);
        return currentOrd > latestOrd ? a : latest;
      }, group[0]);

      const latestAssessments = group.filter(
        (a) => a.assessment_period === latestPeriod.assessment_period,
      );

      // Group by teacher within this year-group-subject
      const byTeacher = groupBy(latestAssessments, (a) => a.staff_id);
      const teacherKeys = Object.keys(byTeacher);

      if (teacherKeys.length < 2) continue; // Need parallel classes

      // Calculate % at expected for each teacher
      const teacherStats = teacherKeys.map((staffId) => {
        const records = byTeacher[staffId];
        const levels = records.map((r) => r.teacher_assessment);
        return {
          staff_id: staffId,
          teacher_name: records[0].teacher_name,
          registration_group: records[0].registration_group,
          pct_expected: pctAtExpected(levels),
          count: records.length,
        };
      });

      // Calculate average across all teachers
      const avgPct =
        teacherStats.reduce((s, t) => s + t.pct_expected, 0) /
        teacherStats.length;

      // Flag teachers with significant gap from average (>= 10pp)
      for (const teacher of teacherStats) {
        const gap = teacher.pct_expected - avgPct;
        if (Math.abs(gap) < 10) continue;

        const direction: "underperforming" | "excelling" =
          gap < 0 ? "underperforming" : "excelling";

        // Check if this pattern persists across years for this teacher
        const teacherAllYears = assessments.filter(
          (a) => a.staff_id === teacher.staff_id && a.subject === subject,
        );
        const yearsWithData = Array.from(
          new Set(teacherAllYears.map((a) => a.academic_year)),
        );

        const parallels = teacherStats
          .filter((t) => t.staff_id !== teacher.staff_id)
          .map((t) => ({
            teacher_name: t.teacher_name,
            staff_id: t.staff_id,
            registration_group: t.registration_group,
            pct_at_expected: t.pct_expected,
          }));

        findings.push({
          teacher_name: teacher.teacher_name,
          staff_id: teacher.staff_id,
          subject: subject as AssessmentSubject,
          direction,
          average_gap_pp: Math.round(Math.abs(gap) * 10) / 10,
          years_detected: [academicYear],
          year_group: yearGroup,
          registration_group: teacher.registration_group,
          pct_at_expected: teacher.pct_expected,
          parallel_teacher_comparison: parallels,
          suggested_actions:
            direction === "underperforming"
              ? [
                  `Arrange peer observation between ${teacher.teacher_name} and parallel class teacher`,
                  `Review ${subject} planning for ${teacher.registration_group} — check differentiation and scaffolding`,
                  `Consider targeted CPD for ${teacher.teacher_name} in ${subject}`,
                  `Check if the gap follows the teacher across years or is cohort-specific`,
                ]
              : [
                  `Share ${teacher.teacher_name}'s ${subject} practice with colleagues via peer coaching`,
                  `Identify specific strategies driving success in ${teacher.registration_group}`,
                  `Consider ${teacher.teacher_name} as a subject mentor or lead practitioner`,
                ],
        });
      }
    }

    // Consolidate findings across years for the same teacher+subject
    const consolidated = this.consolidateTeacherPatterns(findings);

    return {
      findings: consolidated,
      warnings,
      data_sources_used: dataSources,
      analysis_timestamp: new Date().toISOString(),
    };
  }

  /** Merge teacher patterns detected in multiple years */
  private consolidateTeacherPatterns(
    patterns: TeacherPerformancePattern[],
  ): TeacherPerformancePattern[] {
    const byKey: Record<string, TeacherPerformancePattern[]> = {};
    for (const p of patterns) {
      const key = `${p.staff_id}|${p.subject}|${p.direction}`;
      if (!byKey[key]) byKey[key] = [];
      byKey[key].push(p);
    }

    return Object.values(byKey).map((group) => {
      if (group.length === 1) return group[0];
      const allYears = Array.from(
        new Set(group.flatMap((g) => g.years_detected)),
      );
      const avgGap =
        group.reduce((s, g) => s + g.average_gap_pp, 0) / group.length;
      const base = group[group.length - 1]; // latest year
      return {
        ...base,
        years_detected: allYears.sort(),
        average_gap_pp: Math.round(avgGap * 10) / 10,
        suggested_actions:
          allYears.length > 1
            ? [
                ...base.suggested_actions,
                `Pattern persists across ${allYears.length} years — this is a coaching priority, not a one-off`,
              ]
            : base.suggested_actions,
      };
    });
  }

  // ─── 2. Teacher Assessment Inflation ────────────────────

  /**
   * Compare teacher assessment levels vs standardised scores in termly assessments.
   * If gap > 8pp for a class, flag as inflation or deflation.
   */
  async detectTeacherAssessmentInflation(): Promise<
    AnalysisResult<AssessmentInflationAlert>
  > {
    const warnings: string[] = [];
    const dataSources: string[] = [];

    const result = await this.svc.read<MISTermlyAssessment>(
      this.orgId,
      "termly_assessments",
    );
    warnings.push(...result.warnings);
    dataSources.push(result.source.fileName || "termly_assessments");

    if (result.recordCount === 0) {
      warnings.push("No termly assessment data available.");
      return this.emptyResult(warnings, dataSources);
    }

    // Only consider assessments that have standardised scores
    const withScores = result.data.filter(
      (a) => a.standardised_score != null && a.standardised_score > 0,
    );

    if (withScores.length === 0) {
      warnings.push(
        "No assessments with standardised scores found — cannot detect inflation.",
      );
      return this.emptyResult(warnings, dataSources);
    }

    const findings: AssessmentInflationAlert[] = [];

    // Group by year_group + subject + assessment_period + academic_year
    const groups = groupBy(
      withScores,
      (a) =>
        `${a.academic_year}|${a.assessment_period}|${a.year_group}|${a.subject}`,
    );

    for (const [key, group] of Object.entries(groups)) {
      const [academicYear, period, , subject] = key.split("|");

      // Sub-group by class/teacher
      const byClass = groupBy(
        group,
        (a) => `${a.registration_group}|${a.staff_id}`,
      );
      const classKeys = Object.keys(byClass);

      const classStats = classKeys.map((ck) => {
        const records = byClass[ck];
        const taLevels = records.map((r) => r.teacher_assessment);
        const taPctExp = pctAtExpected(taLevels);

        // Standardised score >= 100 is "at expected"
        const stdAtExpected = records.filter(
          (r) => (r.standardised_score ?? 0) >= 100,
        ).length;
        const stdPctExp =
          Math.round((stdAtExpected / records.length) * 1000) / 10;

        return {
          registration_group: records[0].registration_group,
          teacher_name: records[0].teacher_name,
          staff_id: records[0].staff_id,
          year_group: records[0].year_group,
          ta_pct_expected: taPctExp,
          standardised_pct_expected: stdPctExp,
          gap_pp: Math.round((taPctExp - stdPctExp) * 10) / 10,
        };
      });

      for (const cs of classStats) {
        if (Math.abs(cs.gap_pp) < 8) continue;

        const direction: "inflated" | "deflated" =
          cs.gap_pp > 0 ? "inflated" : "deflated";

        const parallels = classStats
          .filter((c) => c.staff_id !== cs.staff_id)
          .map((c) => ({
            registration_group: c.registration_group,
            teacher_name: c.teacher_name,
            ta_pct_expected: c.ta_pct_expected,
            standardised_pct_expected: c.standardised_pct_expected,
            gap_pp: c.gap_pp,
          }));

        findings.push({
          registration_group: cs.registration_group,
          year_group: cs.year_group,
          teacher_name: cs.teacher_name,
          staff_id: cs.staff_id,
          subject: subject as AssessmentSubject,
          assessment_period: period,
          academic_year: academicYear,
          ta_pct_expected: cs.ta_pct_expected,
          standardised_pct_expected: cs.standardised_pct_expected,
          gap_pp: Math.abs(cs.gap_pp),
          direction,
          parallel_class_comparison: parallels,
          suggested_actions:
            direction === "inflated"
              ? [
                  `Moderate ${cs.teacher_name}'s ${subject} assessments using standardised test evidence`,
                  `Arrange cross-school moderation for ${subject} in Year ${cs.year_group}`,
                  `Review assessment criteria understanding — CPD on exemplification materials`,
                  `Compare work samples with standardised scores to calibrate expectations`,
                ]
              : [
                  `${cs.teacher_name} may be under-assessing — review work samples against test scores`,
                  `Check if deflation is masking pupil achievement in ${subject}`,
                  `Provide reassurance and calibration support — share good practice from parallel class`,
                ],
        });
      }
    }

    return {
      findings,
      warnings,
      data_sources_used: dataSources,
      analysis_timestamp: new Date().toISOString(),
    };
  }

  // ─── 3. Declining Pupils ────────────────────────────────

  /**
   * Track each pupil across 3+ consecutive assessment points.
   * If trajectory is downward, flag. Prioritise pupils NOT on SEN register or intervention.
   */
  async detectDecliningPupils(): Promise<AnalysisResult<DecliningPupilAlert>> {
    const warnings: string[] = [];
    const dataSources: string[] = [];

    const [assessResult, pupilsResult, senResult] = await Promise.all([
      this.svc.read<MISTermlyAssessment>(this.orgId, "termly_assessments"),
      this.svc.read<MISPupil>(this.orgId, "pupils"),
      this.svc.read<MISSENRecord>(this.orgId, "sen_register"),
    ]);

    warnings.push(
      ...assessResult.warnings,
      ...pupilsResult.warnings,
      ...senResult.warnings,
    );
    dataSources.push(
      assessResult.source.fileName || "termly_assessments",
      pupilsResult.source.fileName || "pupils",
      senResult.source.fileName || "sen_register",
    );

    if (assessResult.recordCount === 0) {
      warnings.push("No termly assessment data available.");
      return this.emptyResult(warnings, dataSources);
    }

    const senMap = this.buildSENMap(senResult.data);
    const pupilMap = this.buildPupilMap(pupilsResult.data);

    const findings: DecliningPupilAlert[] = [];

    // Group assessments by pupil_name + subject (name-based to bridge ID systems)
    const byPupilSubject = groupBy(
      assessResult.data,
      (a) => `${a.pupil_name || a.student_id}|${a.subject}`,
    );

    for (const [key, records] of Object.entries(byPupilSubject)) {
      const [studentId, subject] = key.split("|");

      // Sort chronologically
      const sorted = records.sort(
        (a, b) =>
          periodOrdinal(a.academic_year, a.assessment_period) -
          periodOrdinal(b.academic_year, b.assessment_period),
      );

      if (sorted.length < 3) continue;

      // Check last 3+ points for declining trajectory
      const lastN = sorted.slice(-3);
      const scores = lastN.map((a) => attainmentScore(a.teacher_assessment));

      // Declining = each score <= previous AND at least one strict decrease
      let isDecreasing = true;
      let hasStrictDecrease = false;
      for (let i = 1; i < scores.length; i++) {
        if (scores[i] > scores[i - 1]) {
          isDecreasing = false;
          break;
        }
        if (scores[i] < scores[i - 1]) {
          hasStrictDecrease = true;
        }
      }

      if (!isDecreasing || !hasStrictDecrease) continue;

      const pupil = this.lookupPupil(pupilMap, sorted[0]);
      const onSEN =
        this.isSEN(senMap, sorted[0]) ||
        (pupil?.sen_status !== undefined && pupil.sen_status !== "N");
      const onIntervention =
        sorted[sorted.length - 1].on_track === "Concern" || onSEN;
      const isPP = pupil?.pupil_premium ?? false;
      const currentLevel = sorted[sorted.length - 1].teacher_assessment;

      // Urgency: high if NOT on any register (i.e. flying under the radar)
      const urgency: "high" | "medium" | "low" =
        !onSEN && !onIntervention ? "high" : onIntervention ? "low" : "medium";

      findings.push({
        student_id: studentId,
        pupil_name: sorted[0].pupil_name,
        year_group: sorted[sorted.length - 1].year_group,
        registration_group: sorted[sorted.length - 1].registration_group,
        subject: subject as AssessmentSubject,
        grades_over_time: sorted.map((a) => ({
          assessment_period: a.assessment_period,
          academic_year: a.academic_year,
          level: a.teacher_assessment,
          score: attainmentScore(a.teacher_assessment),
        })),
        current_status: currentLevel,
        on_intervention: onIntervention,
        on_sen_register: onSEN,
        pupil_premium: isPP,
        urgency,
        suggested_actions: [
          urgency === "high"
            ? `PRIORITY: ${sorted[0].pupil_name} is declining in ${subject} but is NOT on any register or intervention`
            : `Monitor ${sorted[0].pupil_name}'s ${subject} trajectory — currently declining`,
          `Discuss with ${sorted[sorted.length - 1].teacher_name} at next pupil progress meeting`,
          `Review exercise books for ${subject} to check quality of work and feedback`,
          isPP
            ? "Ensure Pupil Premium provision is targeted and reviewed"
            : "Consider whether this pupil needs additional support or referral",
        ],
      });
    }

    // Sort by urgency: high first, then medium, then low
    const urgencyOrder = { high: 0, medium: 1, low: 2 };
    findings.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

    return {
      findings,
      warnings,
      data_sources_used: dataSources,
      analysis_timestamp: new Date().toISOString(),
    };
  }

  // ─── 4. Pupil Strength Change (Progress Stories) ────────

  /**
   * Identify SEN/EHCP/PP pupils making exceptional progress.
   * Returns positive stories suitable for EHCP reviews, governor reports, etc.
   */
  async detectPupilStrengthChange(): Promise<
    AnalysisResult<PupilProgressStory>
  > {
    const warnings: string[] = [];
    const dataSources: string[] = [];

    const [assessResult, pupilsResult, senResult] = await Promise.all([
      this.svc.read<MISTermlyAssessment>(this.orgId, "termly_assessments"),
      this.svc.read<MISPupil>(this.orgId, "pupils"),
      this.svc.read<MISSENRecord>(this.orgId, "sen_register"),
    ]);

    warnings.push(
      ...assessResult.warnings,
      ...pupilsResult.warnings,
      ...senResult.warnings,
    );
    dataSources.push(
      assessResult.source.fileName || "termly_assessments",
      pupilsResult.source.fileName || "pupils",
      senResult.source.fileName || "sen_register",
    );

    if (assessResult.recordCount === 0) {
      warnings.push("No termly assessment data available.");
      return this.emptyResult(warnings, dataSources);
    }

    const pupilMap = this.buildPupilMap(pupilsResult.data);
    const senMap = this.buildSENMap(senResult.data);

    const findings: PupilProgressStory[] = [];

    // Filter to only SEN/EHCP/PP pupils using name-based bridging
    const targetAssessments = assessResult.data.filter((a) => {
      const pupil = this.lookupPupil(pupilMap, a);
      if (
        pupil &&
        (pupil.sen_status !== "N" || pupil.ehcp || pupil.pupil_premium)
      )
        return true;
      if (this.isSEN(senMap, a)) return true;
      return false;
    });
    const byPupilSubject = groupBy(
      targetAssessments,
      (a) => `${a.pupil_name || a.student_id}|${a.subject}`,
    );

    for (const [key, records] of Object.entries(byPupilSubject)) {
      const [studentId, subject] = key.split("|");

      const sorted = records.sort(
        (a, b) =>
          periodOrdinal(a.academic_year, a.assessment_period) -
          periodOrdinal(b.academic_year, b.assessment_period),
      );

      if (sorted.length < 2) continue;

      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const fromScore = attainmentScore(first.teacher_assessment);
      const toScore = attainmentScore(last.teacher_assessment);
      const progress = toScore - fromScore;

      // At least 1 level of progress (e.g., WTS→EXS)
      if (progress < 1) continue;

      const pupil = this.lookupPupil(pupilMap, sorted[0]);
      const sen = this.lookupSEN(senMap, sorted[0]);
      const academicYears = Array.from(
        new Set(sorted.map((s) => s.academic_year)),
      );

      const correlatedSupport: string[] = [];
      if (sen?.provision_description)
        correlatedSupport.push(sen.provision_description);
      if (sen?.key_worker)
        correlatedSupport.push(`Key worker: ${sen.key_worker}`);
      if (sen?.external_agencies)
        correlatedSupport.push(`External: ${sen.external_agencies}`);

      const suitableFor: string[] = [];
      if (sen?.ehcp) suitableFor.push("EHCP annual review evidence");
      if (pupil?.pupil_premium)
        suitableFor.push("Pupil Premium strategy review");
      if (progress >= 2)
        suitableFor.push("Governor report — exceptional progress");
      suitableFor.push("Parent meeting — positive update");
      if (sen?.sen_status === "K" && toScore >= 2) {
        suitableFor.push("Consider whether SEN support still required");
      }

      findings.push({
        student_id: studentId,
        pupil_name: first.pupil_name,
        year_group: last.year_group,
        registration_group: last.registration_group,
        sen_status: pupil?.sen_status ?? "N",
        pupil_premium: pupil?.pupil_premium ?? false,
        subject: subject as AssessmentSubject,
        from_level: first.teacher_assessment,
        to_level: last.teacher_assessment,
        from_score: fromScore,
        to_score: toScore,
        duration_terms: sorted.length,
        academic_years: academicYears,
        correlated_support: correlatedSupport,
        suitable_for: suitableFor,
        suggested_actions: [
          `Celebrate ${first.pupil_name}'s progress in ${subject} (${first.teacher_assessment} → ${last.teacher_assessment})`,
          `Document what worked for this pupil to inform provision for similar profiles`,
          correlatedSupport.length > 0
            ? `Review whether current support package should continue, increase, or step down`
            : `Identify what drove this progress — classroom strategies, interventions, or pastoral support`,
        ],
      });
    }

    return {
      findings,
      warnings,
      data_sources_used: dataSources,
      analysis_timestamp: new Date().toISOString(),
    };
  }

  // ─── 5. Cohort Anomaly Detection ───────────────────────

  /**
   * Find year groups performing significantly below school norm.
   * Cross-reference with teacher history to identify supply cover as root cause.
   */
  async detectCohortAnomaly(): Promise<AnalysisResult<CohortAnomaly>> {
    const warnings: string[] = [];
    const dataSources: string[] = [];

    const [assessResult, historyResult] = await Promise.all([
      this.svc.read<MISTermlyAssessment>(this.orgId, "termly_assessments"),
      this.svc.read<MISTeacherClassHistory>(
        this.orgId,
        "teacher_class_history",
      ),
    ]);

    warnings.push(...assessResult.warnings, ...historyResult.warnings);
    dataSources.push(
      assessResult.source.fileName || "termly_assessments",
      historyResult.source.fileName || "teacher_class_history",
    );

    if (assessResult.recordCount === 0) {
      warnings.push("No termly assessment data available.");
      return this.emptyResult(warnings, dataSources);
    }

    const findings: CohortAnomaly[] = [];
    const history = historyResult.data;

    // For each academic year + subject, get the latest assessment period
    const byYearSubject = groupBy(
      assessResult.data,
      (a) => `${a.academic_year}|${a.subject}`,
    );

    for (const [key, records] of Object.entries(byYearSubject)) {
      const [academicYear, subject] = key.split("|");

      // Get latest period
      const latestOrd = Math.max(
        ...records.map((r) =>
          periodOrdinal(r.academic_year, r.assessment_period),
        ),
      );
      const latestRecords = records.filter(
        (r) =>
          periodOrdinal(r.academic_year, r.assessment_period) === latestOrd,
      );

      // Group by year_group + registration_group
      const byClass = groupBy(
        latestRecords,
        (r) => `${r.year_group}|${r.registration_group}`,
      );

      // Calculate school average
      const allLevels = latestRecords.map((r) => r.teacher_assessment);
      const schoolAvg = pctAtExpected(allLevels);

      for (const [classKey, classRecords] of Object.entries(byClass)) {
        const [ygStr, regGroup] = classKey.split("|");
        const yearGroup = parseInt(ygStr, 10);
        const classLevels = classRecords.map((r) => r.teacher_assessment);
        const classPct = pctAtExpected(classLevels);
        const gap = schoolAvg - classPct;

        if (gap < 10) continue; // Only flag if >= 10pp below average

        // Look for supply cover or teacher changes for this class
        const classHistory = history.filter(
          (h) =>
            h.registration_group === regGroup &&
            h.academic_year === academicYear,
        );
        const supplyPeriods = classHistory.filter(
          (h) => h.role === "Supply" || h.role === "PPA Cover",
        );

        let probableCause = "Unknown — requires further investigation";
        if (supplyPeriods.length > 0) {
          probableCause = `Supply/cover teaching detected: ${supplyPeriods.map((s) => `${s.staff_name} (${s.term})`).join(", ")}`;
        } else if (classHistory.length > 2) {
          probableCause = `Multiple teacher changes this year (${classHistory.length} teachers)`;
        }

        const teacherName =
          classRecords[0]?.teacher_name ??
          classHistory[0]?.staff_name ??
          "Unknown";

        findings.push({
          year_group: yearGroup,
          registration_group: regGroup,
          subject: subject as AssessmentSubject,
          academic_year: academicYear,
          pct_at_expected: classPct,
          school_avg_pct: schoolAvg,
          gap_pp: Math.round(gap * 10) / 10,
          probable_cause: probableCause,
          teacher_name: teacherName,
          teacher_absence_periods: supplyPeriods.map((s) => ({
            term: s.term,
            academic_year: s.academic_year,
            role: s.role,
          })),
          suggested_actions: [
            `Investigate Year ${yearGroup} ${regGroup} ${subject} — ${Math.round(gap)}pp below school average`,
            supplyPeriods.length > 0
              ? `Address supply cover impact — ensure current teacher has a clear catch-up plan`
              : `Discuss with class teacher at next pupil progress meeting`,
            `Consider targeted booster groups or intervention for this class`,
            `Review whether cohort composition (SEN, PP) explains part of the gap`,
          ],
        });
      }
    }

    return {
      findings,
      warnings,
      data_sources_used: dataSources,
      analysis_timestamp: new Date().toISOString(),
    };
  }

  // ─── 6. PP Gap Trend ───────────────────────────────────

  /**
   * Calculate PP vs non-PP attainment at each data point.
   * Track gap over time and identify borderline pupils.
   */
  async detectPPGapTrend(): Promise<AnalysisResult<PPGapAnalysis>> {
    const warnings: string[] = [];
    const dataSources: string[] = [];

    const [assessResult, pupilsResult] = await Promise.all([
      this.svc.read<MISTermlyAssessment>(this.orgId, "termly_assessments"),
      this.svc.read<MISPupil>(this.orgId, "pupils"),
    ]);

    warnings.push(...assessResult.warnings, ...pupilsResult.warnings);
    dataSources.push(
      assessResult.source.fileName || "termly_assessments",
      pupilsResult.source.fileName || "pupils",
    );

    if (assessResult.recordCount === 0) {
      warnings.push("No termly assessment data available.");
      return this.emptyResult(warnings, dataSources);
    }

    const pupilMap = this.buildPupilMap(pupilsResult.data);

    // Tag each assessment with PP status
    const taggedAssessments = assessResult.data.map((a) => ({
      ...a,
      is_pp: this.lookupPupil(pupilMap, a)?.pupil_premium ?? false,
    }));

    // Get all subjects
    const subjects = Array.from(
      new Set(taggedAssessments.map((a) => a.subject)),
    ) as AssessmentSubject[];

    const perSubject: PPGapAnalysis["per_subject"] = [];

    for (const subject of subjects) {
      const subjectRecords = taggedAssessments.filter(
        (a) => a.subject === subject,
      );

      // Group by assessment period + academic year
      const byPeriod = groupBy(
        subjectRecords,
        (a) => `${a.academic_year}|${a.assessment_period}`,
      );

      // Sort periods chronologically
      const sortedPeriodKeys = Object.keys(byPeriod).sort((a, b) => {
        const [aYear, aPeriod] = a.split("|");
        const [bYear, bPeriod] = b.split("|");
        return periodOrdinal(aYear, aPeriod) - periodOrdinal(bYear, bPeriod);
      });

      const dataPoints: PPGapAnalysis["per_subject"][0]["data_points"] = [];

      for (const periodKey of sortedPeriodKeys) {
        const [academicYear, assessmentPeriod] = periodKey.split("|");
        const records = byPeriod[periodKey];

        const ppRecords = records.filter((r) => r.is_pp);
        const nonPPRecords = records.filter((r) => !r.is_pp);

        if (ppRecords.length === 0 || nonPPRecords.length === 0) continue;

        const ppPct = pctAtExpected(ppRecords.map((r) => r.teacher_assessment));
        const nonPPPct = pctAtExpected(
          nonPPRecords.map((r) => r.teacher_assessment),
        );

        dataPoints.push({
          assessment_period: assessmentPeriod,
          academic_year: academicYear,
          pp_pct_expected: ppPct,
          non_pp_pct_expected: nonPPPct,
          gap_pp: Math.round((nonPPPct - ppPct) * 10) / 10,
        });
      }

      // Determine trend
      let trend: "widening" | "narrowing" | "stable" | "insufficient_data" =
        "insufficient_data";
      if (dataPoints.length >= 2) {
        const gaps = dataPoints.map((d) => d.gap_pp);
        const firstHalf = gaps.slice(0, Math.floor(gaps.length / 2));
        const secondHalf = gaps.slice(Math.floor(gaps.length / 2));
        const avgFirst =
          firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const avgSecond =
          secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        const diff = avgSecond - avgFirst;
        if (Math.abs(diff) < 2) trend = "stable";
        else if (diff > 0) trend = "widening";
        else trend = "narrowing";
      }

      const latestGap =
        dataPoints.length > 0 ? dataPoints[dataPoints.length - 1].gap_pp : 0;

      perSubject.push({
        subject,
        data_points: dataPoints,
        trend_direction: trend,
        latest_gap_pp: latestGap,
      });
    }

    // Find borderline PP pupils (WTS in any subject — one step below expected)
    const borderlinePupils: PPGapAnalysis["borderline_pupils"] = [];
    const latestAssessments = this.getLatestAssessmentPerPupilSubject(
      assessResult.data,
    );

    for (const a of latestAssessments) {
      const pupil = this.lookupPupil(pupilMap, a);
      if (!pupil?.pupil_premium) continue;

      const score = attainmentScore(a.teacher_assessment);
      if (score === 1) {
        // WTS = 1 step below EXS
        borderlinePupils.push({
          student_id: a.student_id,
          pupil_name: a.pupil_name,
          year_group: a.year_group,
          subject: a.subject,
          current_level: a.teacher_assessment,
          distance_to_expected: 1,
        });
      }
    }

    // Projected impact
    const ppGaps = perSubject.filter((s) => s.latest_gap_pp > 0);
    const projectedImpact =
      ppGaps.length > 0
        ? `Current PP gap averages ${Math.round(ppGaps.reduce((s, p) => s + p.latest_gap_pp, 0) / ppGaps.length)}pp across ${ppGaps.length} subjects. ${borderlinePupils.length} PP pupils are borderline (WTS) and could move to Expected with targeted intervention.`
        : "No significant PP gap detected.";

    const analysis: PPGapAnalysis = {
      per_subject: perSubject,
      borderline_pupils: borderlinePupils,
      projected_impact: projectedImpact,
      suggested_actions: [
        borderlinePupils.length > 0
          ? `Target ${borderlinePupils.length} borderline PP pupils with structured intervention`
          : "Continue monitoring PP provision effectiveness",
        "Review PP strategy spending against outcomes",
        "Ensure class teachers know their PP pupils and the gap data",
        "Share PP data with governors at next FGB meeting",
      ],
    };

    return {
      findings: [analysis],
      warnings,
      data_sources_used: dataSources,
      analysis_timestamp: new Date().toISOString(),
    };
  }

  // ─── 7. Gender Gap ─────────────────────────────────────

  /**
   * Boys vs girls by subject by year group with national comparison.
   */
  async detectGenderGap(): Promise<AnalysisResult<GenderGapAnalysis>> {
    const warnings: string[] = [];
    const dataSources: string[] = [];

    const [assessResult, pupilsResult, ks2Result] = await Promise.all([
      this.svc.read<MISTermlyAssessment>(this.orgId, "termly_assessments"),
      this.svc.read<MISPupil>(this.orgId, "pupils"),
      this.svc.read<MISHistoricalKS2>(this.orgId, "historical_ks2"),
    ]);

    warnings.push(
      ...assessResult.warnings,
      ...pupilsResult.warnings,
      ...ks2Result.warnings,
    );
    dataSources.push(
      assessResult.source.fileName || "termly_assessments",
      pupilsResult.source.fileName || "pupils",
    );

    if (assessResult.recordCount === 0) {
      warnings.push("No termly assessment data available.");
      return this.emptyResult(warnings, dataSources);
    }

    const pupilMap = this.buildPupilMap(pupilsResult.data);
    const findings: GenderGapAnalysis[] = [];

    // Use latest assessment period per academic year
    const latestAssessments = this.getLatestAssessmentPerPupilSubject(
      assessResult.data,
    );

    // Group by year_group + subject + academic_year
    const groups = groupBy(
      latestAssessments,
      (a) => `${a.academic_year}|${a.year_group}|${a.subject}`,
    );

    for (const [key, records] of Object.entries(groups)) {
      const [academicYear, ygStr, subject] = key.split("|");
      const yearGroup = parseInt(ygStr, 10);

      const boys = records.filter(
        (r) => this.lookupPupil(pupilMap, r)?.gender === "M",
      );
      const girls = records.filter(
        (r) => this.lookupPupil(pupilMap, r)?.gender === "F",
      );

      if (boys.length < 2 || girls.length < 2) continue;

      const boysPct = pctAtExpected(boys.map((b) => b.teacher_assessment));
      const girlsPct = pctAtExpected(girls.map((g) => g.teacher_assessment));
      const gap = Math.round(Math.abs(boysPct - girlsPct) * 10) / 10;

      if (gap < 5) continue; // Only flag gaps >= 5pp

      const direction: "boys_ahead" | "girls_ahead" | "equal" =
        boysPct > girlsPct
          ? "boys_ahead"
          : girlsPct > boysPct
            ? "girls_ahead"
            : "equal";

      // National comparison from historical KS2 data if Year 6
      let nationalComparison: GenderGapAnalysis["national_comparison"];
      if (yearGroup === 6 && ks2Result.data.length > 0) {
        const ks2Year = ks2Result.data.find(
          (k) => k.academic_year === academicYear,
        );
        if (ks2Year) {
          nationalComparison = {
            national_boys_pct: ks2Year.boys_combined_pct,
            national_girls_pct: ks2Year.girls_combined_pct,
            national_gap_pp: Math.abs(
              ks2Year.boys_combined_pct - ks2Year.girls_combined_pct,
            ),
          };
        }
      }

      findings.push({
        year_group: yearGroup,
        subject: subject as AssessmentSubject,
        academic_year: academicYear,
        boys_pct_expected: boysPct,
        girls_pct_expected: girlsPct,
        gap_pp: gap,
        direction,
        national_comparison: nationalComparison,
        suggested_actions: [
          `Year ${yearGroup} ${subject}: ${gap}pp gender gap (${direction === "boys_ahead" ? "boys" : "girls"} ahead)`,
          direction === "girls_ahead" && subject === "maths"
            ? "Review maths teaching approaches — consider growth mindset interventions for boys"
            : direction === "boys_ahead" && subject === "writing"
              ? "Review writing provision — consider engaging topics and talk-for-writing approaches for girls"
              : `Investigate reasons for ${subject} gender gap in Year ${yearGroup}`,
          "Discuss with subject lead and review pupil-level data",
          "Compare with national data to contextualise the gap",
        ],
      });
    }

    return {
      findings,
      warnings,
      data_sources_used: dataSources,
      analysis_timestamp: new Date().toISOString(),
    };
  }

  // ─── 8. SEN Progress ───────────────────────────────────

  /**
   * Track SEN pupils' progress from their own baseline.
   * Returns progress summaries per pupil.
   */
  async detectSENProgress(): Promise<AnalysisResult<SENProgressSummary>> {
    const warnings: string[] = [];
    const dataSources: string[] = [];

    const [assessResult, senResult] = await Promise.all([
      this.svc.read<MISTermlyAssessment>(this.orgId, "termly_assessments"),
      this.svc.read<MISSENRecord>(this.orgId, "sen_register"),
    ]);

    warnings.push(...assessResult.warnings, ...senResult.warnings);
    dataSources.push(
      assessResult.source.fileName || "termly_assessments",
      senResult.source.fileName || "sen_register",
    );

    if (senResult.recordCount === 0) {
      warnings.push("No SEN register data available.");
      return this.emptyResult(warnings, dataSources);
    }

    if (assessResult.recordCount === 0) {
      warnings.push("No termly assessment data available.");
      return this.emptyResult(warnings, dataSources);
    }

    const senMap = this.buildSENMap(senResult.data);
    const findings: SENProgressSummary[] = [];

    // Get assessments for SEN pupils only (using name-based bridging)
    const senAssessments = assessResult.data.filter((a) =>
      this.isSEN(senMap, a),
    );

    // Group by pupil_name (bridges ID systems)
    const byPupil = groupBy(
      senAssessments,
      (a) => a.pupil_name || a.student_id,
    );

    for (const [_pupilKey, records] of Object.entries(byPupil)) {
      const sen = this.lookupSEN(senMap, records[0]);
      if (!sen) continue;

      // Group by subject
      const bySubject = groupBy(records, (r) => r.subject);
      const subjectSummaries: SENProgressSummary["subjects"] = [];

      for (const [subject, subjectRecords] of Object.entries(bySubject)) {
        const sorted = subjectRecords.sort(
          (a, b) =>
            periodOrdinal(a.academic_year, a.assessment_period) -
            periodOrdinal(b.academic_year, b.assessment_period),
        );

        if (sorted.length < 2) continue;

        const baseline = sorted[0];
        const current = sorted[sorted.length - 1];
        const baselineScore = attainmentScore(baseline.teacher_assessment);
        const currentScore = attainmentScore(current.teacher_assessment);
        const progress = currentScore - baselineScore;

        // Determine trajectory from last 3 points
        let trajectory: "accelerating" | "steady" | "plateauing" | "declining" =
          "steady";
        if (sorted.length >= 3) {
          const last3 = sorted
            .slice(-3)
            .map((s) => attainmentScore(s.teacher_assessment));
          const diffs = [last3[1] - last3[0], last3[2] - last3[1]];
          if (diffs[1] > diffs[0] && diffs[1] > 0) trajectory = "accelerating";
          else if (diffs[1] < 0) trajectory = "declining";
          else if (diffs[0] === 0 && diffs[1] === 0) trajectory = "plateauing";
        }

        subjectSummaries.push({
          subject: subject as AssessmentSubject,
          baseline_level: baseline.teacher_assessment,
          baseline_score: baselineScore,
          current_level: current.teacher_assessment,
          current_score: currentScore,
          progress_points: progress,
          assessment_count: sorted.length,
          trajectory,
        });
      }

      if (subjectSummaries.length === 0) continue;

      // Overall progress rating
      const avgProgress =
        subjectSummaries.reduce((s, sub) => s + sub.progress_points, 0) /
        subjectSummaries.length;
      const overallProgress: "above_expected" | "expected" | "below_expected" =
        avgProgress >= 1
          ? "above_expected"
          : avgProgress >= 0
            ? "expected"
            : "below_expected";

      const decliningSubjects = subjectSummaries.filter(
        (s) => s.trajectory === "declining",
      );

      findings.push({
        student_id: sen.student_id,
        pupil_name: `${sen.last_name}, ${sen.first_name}`,
        year_group: sen.year_group,
        registration_group: sen.registration_group,
        sen_status: sen.sen_status,
        sen_primary_need: sen.sen_primary_need,
        ehcp: sen.ehcp,
        subjects: subjectSummaries,
        overall_progress: overallProgress,
        provision_description: sen.provision_description,
        suggested_actions: [
          overallProgress === "above_expected"
            ? `${sen.first_name} is making strong progress — document for EHCP review/governor report`
            : overallProgress === "below_expected"
              ? `${sen.first_name} is not making expected progress — review provision and consider referral`
              : `${sen.first_name} is making expected progress — continue current provision`,
          decliningSubjects.length > 0
            ? `Declining in ${decliningSubjects.map((s) => s.subject).join(", ")} — discuss with SENCO`
            : "Maintain current support strategies",
          sen.ehcp && sen.next_annual_review
            ? `Annual review due: ${sen.next_annual_review}`
            : "",
        ].filter(Boolean),
      });
    }

    return {
      findings,
      warnings,
      data_sources_used: dataSources,
      analysis_timestamp: new Date().toISOString(),
    };
  }

  // ─── 9. Attendance–Attainment Correlation ──────────────

  /**
   * Group pupils by attendance band and show average attainment per band.
   * Quantifies the relationship between attendance and outcomes.
   */
  async correlateAttendanceAttainment(): Promise<
    AnalysisResult<AttendanceAttainmentCorrelation>
  > {
    const warnings: string[] = [];
    const dataSources: string[] = [];

    const [attendanceResult, assessResult] = await Promise.all([
      this.svc.read<MISAttendanceRecord>(this.orgId, "attendance"),
      this.svc.read<MISTermlyAssessment>(this.orgId, "termly_assessments"),
    ]);

    warnings.push(...attendanceResult.warnings, ...assessResult.warnings);
    dataSources.push(
      attendanceResult.source.fileName || "attendance",
      assessResult.source.fileName || "termly_assessments",
    );

    if (attendanceResult.recordCount === 0 || assessResult.recordCount === 0) {
      warnings.push(
        "Attendance or assessment data missing — cannot correlate.",
      );
      return this.emptyResult(warnings, dataSources);
    }

    // Calculate overall attendance % per pupil (latest academic year)
    const latestYear = attendanceResult.data.reduce(
      (latest, r) =>
        r.academic_year_start > latest ? r.academic_year_start : latest,
      0,
    );
    const latestAttendance = attendanceResult.data.filter(
      (r) => r.academic_year_start === latestYear,
    );

    // Aggregate per student
    const pupilAttendance = new Map<
      string,
      { total: number; attended: number }
    >();
    for (const r of latestAttendance) {
      const existing = pupilAttendance.get(r.student_id) ?? {
        total: 0,
        attended: 0,
      };
      existing.total += r.possible_sessions;
      existing.attended += r.attended_sessions;
      pupilAttendance.set(r.student_id, existing);
    }

    const pupilAttPct = new Map<string, number>();
    for (const [sid, vals] of Array.from(pupilAttendance.entries())) {
      if (vals.total > 0) {
        pupilAttPct.set(
          sid,
          Math.round((vals.attended / vals.total) * 1000) / 10,
        );
      }
    }

    // Get latest assessments per pupil
    const latestAssessments = this.getLatestAssessmentPerPupilSubject(
      assessResult.data.filter((a) => a.academic_year_start === latestYear),
    );

    // Define attendance bands
    const bandDefs = [
      { label: "97-100% (Excellent)", min: 97, max: 100 },
      { label: "95-97% (Good)", min: 95, max: 96.9 },
      { label: "90-95% (Concern)", min: 90, max: 94.9 },
      { label: "85-90% (Persistent Absence)", min: 85, max: 89.9 },
      { label: "Below 85% (Severe)", min: 0, max: 84.9 },
    ];

    const subjects = Array.from(
      new Set(latestAssessments.map((a) => a.subject)),
    ) as AssessmentSubject[];

    const bands: AttendanceAttainmentBand[] = [];
    const allAttPcts: number[] = [];
    const allAttScores: number[] = [];

    for (const band of bandDefs) {
      // Find pupils in this attendance band
      const pupilsInBand = new Set<string>();
      for (const [sid, pct] of Array.from(pupilAttPct.entries())) {
        if (pct >= band.min && pct <= band.max) {
          pupilsInBand.add(sid);
        }
      }

      const bandAssessments = latestAssessments.filter((a) =>
        pupilsInBand.has(a.student_id),
      );

      if (bandAssessments.length === 0) {
        bands.push({
          attendance_band: band.label,
          attendance_min: band.min,
          attendance_max: band.max,
          pupil_count: pupilsInBand.size,
          avg_pct_expected: 0,
          avg_attainment_score: 0,
          subjects: [],
        });
        continue;
      }

      const allLevels = bandAssessments.map((a) => a.teacher_assessment);
      const avgPctExp = pctAtExpected(allLevels);
      const avgScore = avgAttainmentScore(allLevels);

      // Per-subject breakdown
      const subjectData = subjects.map((subj) => {
        const subjRecords = bandAssessments.filter((a) => a.subject === subj);
        return {
          subject: subj,
          avg_pct_expected: pctAtExpected(
            subjRecords.map((r) => r.teacher_assessment),
          ),
        };
      });

      bands.push({
        attendance_band: band.label,
        attendance_min: band.min,
        attendance_max: band.max,
        pupil_count: pupilsInBand.size,
        avg_pct_expected: avgPctExp,
        avg_attainment_score: Math.round(avgScore * 100) / 100,
        subjects: subjectData,
      });

      // For correlation calculation
      for (const sid of Array.from(pupilsInBand)) {
        const pct = pupilAttPct.get(sid)!;
        const pupilAssessments = bandAssessments.filter(
          (a) => a.student_id === sid,
        );
        if (pupilAssessments.length > 0) {
          const score = avgAttainmentScore(
            pupilAssessments.map((a) => a.teacher_assessment),
          );
          allAttPcts.push(pct);
          allAttScores.push(score);
        }
      }
    }

    const r = pearsonCorrelation(allAttPcts, allAttScores);
    const absR = Math.abs(r);
    const strength: "strong" | "moderate" | "weak" | "insufficient_data" =
      allAttPcts.length < 10
        ? "insufficient_data"
        : absR >= 0.6
          ? "strong"
          : absR >= 0.3
            ? "moderate"
            : "weak";

    const topBand = bands[0];
    const bottomBand = bands[bands.length - 1];
    const keyFinding =
      topBand &&
      bottomBand &&
      topBand.pupil_count > 0 &&
      bottomBand.pupil_count > 0
        ? `Pupils with excellent attendance (97%+) achieve ${topBand.avg_pct_expected}% at expected vs ${bottomBand.avg_pct_expected}% for those below 85% — a ${Math.round(topBand.avg_pct_expected - bottomBand.avg_pct_expected)}pp gap.`
        : "Insufficient data across attendance bands to draw comparison.";

    const correlation: AttendanceAttainmentCorrelation = {
      bands,
      correlation_strength: strength,
      correlation_coefficient: Math.round(r * 1000) / 1000,
      key_finding: keyFinding,
      suggested_actions: [
        "Share attendance-attainment data with parents at open evenings",
        "Target intervention for persistently absent pupils — they are furthest behind",
        "Work with EWO for families of pupils below 85% attendance",
        "Celebrate and reward excellent attendance — it correlates with better outcomes",
      ],
    };

    return {
      findings: [correlation],
      warnings,
      data_sources_used: dataSources,
      analysis_timestamp: new Date().toISOString(),
    };
  }

  // ─── 10. Bradford Factor Alerts ────────────────────────

  /**
   * Calculate Bradford Factor for all staff.
   * Bradford Factor = S² × D where S = spells, D = total days.
   * Flag those exceeding thresholds: 50 (monitor), 100 (concern), 200 (serious), 500 (critical).
   */
  async detectBradfordFactorAlerts(): Promise<
    AnalysisResult<BradfordFactorAlert>
  > {
    const warnings: string[] = [];
    const dataSources: string[] = [];

    const staffResult = await this.svc.read<MISStaffMember>(
      this.orgId,
      "staff",
    );
    warnings.push(...staffResult.warnings);
    dataSources.push(staffResult.source.fileName || "staff");

    if (staffResult.recordCount === 0) {
      warnings.push("No staff data available.");
      return this.emptyResult(warnings, dataSources);
    }

    const findings: BradfordFactorAlert[] = [];

    for (const staff of staffResult.data) {
      const S = staff.absence_spells_this_year;
      const D = staff.absence_days_this_year;
      const bf = S * S * D;

      if (bf < 50) continue;

      const thresholdLevel: "monitor" | "concern" | "serious" | "critical" =
        bf >= 500
          ? "critical"
          : bf >= 200
            ? "serious"
            : bf >= 100
              ? "concern"
              : "monitor";

      findings.push({
        staff_id: staff.staff_id,
        staff_name: staff.display_name,
        job_title: staff.job_title,
        role_type: staff.role_type,
        spells: S,
        total_days: D,
        bradford_factor: bf,
        threshold_level: thresholdLevel,
        suggested_actions: {
          monitor: [
            `${staff.display_name}: Bradford Factor ${bf} — informal wellbeing check recommended`,
            "No formal action required, but note the pattern of short-term absences",
          ],
          concern: [
            `${staff.display_name}: Bradford Factor ${bf} — schedule informal absence review meeting`,
            "Document the conversation and agree any support measures",
            "Consider referring to occupational health if appropriate",
          ],
          serious: [
            `${staff.display_name}: Bradford Factor ${bf} — formal absence management procedure`,
            "Arrange formal meeting with HR/union representative",
            "Review occupational health referral",
            "Consider impact on class/team and arrange consistent cover",
          ],
          critical: [
            `${staff.display_name}: Bradford Factor ${bf} — CRITICAL — urgent HR intervention`,
            "Formal capability/absence management process required",
            "Assess impact on pupils and team",
            "Ensure ACAS guidelines are followed",
          ],
        }[thresholdLevel],
      });
    }

    // Sort by Bradford Factor descending
    findings.sort((a, b) => b.bradford_factor - a.bradford_factor);

    return {
      findings,
      warnings,
      data_sources_used: dataSources,
      analysis_timestamp: new Date().toISOString(),
    };
  }

  // ─── 11. Staff Absence Impact ──────────────────────────

  /**
   * Correlate staff absence with class outcome dips and behaviour spikes.
   */
  async detectStaffAbsenceImpact(): Promise<
    AnalysisResult<StaffAbsenceImpact>
  > {
    const warnings: string[] = [];
    const dataSources: string[] = [];

    const [staffResult, historyResult, assessResult, behaviourResult] =
      await Promise.all([
        this.svc.read<MISStaffMember>(this.orgId, "staff"),
        this.svc.read<MISTeacherClassHistory>(
          this.orgId,
          "teacher_class_history",
        ),
        this.svc.read<MISTermlyAssessment>(this.orgId, "termly_assessments"),
        this.svc.read<MISBehaviourIncident>(this.orgId, "behaviour"),
      ]);

    warnings.push(
      ...staffResult.warnings,
      ...historyResult.warnings,
      ...assessResult.warnings,
      ...behaviourResult.warnings,
    );
    dataSources.push(
      staffResult.source.fileName || "staff",
      historyResult.source.fileName || "teacher_class_history",
      assessResult.source.fileName || "termly_assessments",
      behaviourResult.source.fileName || "behaviour",
    );

    if (staffResult.recordCount === 0 || assessResult.recordCount === 0) {
      warnings.push("Staff or assessment data missing.");
      return this.emptyResult(warnings, dataSources);
    }

    const findings: StaffAbsenceImpact[] = [];

    // Find staff with significant absences (>= 5 days)
    const absentStaff = staffResult.data.filter(
      (s) => s.absence_days_this_year >= 5 && s.role_type === "Teaching",
    );

    for (const staff of absentStaff) {
      // Find which classes this teacher taught
      const teacherClasses = historyResult.data.filter(
        (h) => h.staff_id === staff.staff_id,
      );

      if (teacherClasses.length === 0) continue;

      const classesAffected = Array.from(
        new Set(teacherClasses.map((tc) => tc.registration_group)),
      );

      // For each class, compare assessment data when teacher was present vs supply
      const supplyPeriods = historyResult.data.filter(
        (h) =>
          classesAffected.includes(h.registration_group) &&
          (h.role === "Supply" || h.role === "PPA Cover") &&
          h.staff_id !== staff.staff_id,
      );

      if (supplyPeriods.length === 0) continue;

      // Compare attainment in periods with teacher vs periods with supply
      const subjects = Array.from(
        new Set(
          assessResult.data
            .filter((a) => classesAffected.includes(a.registration_group))
            .map((a) => a.subject),
        ),
      ) as AssessmentSubject[];

      const attainmentImpact: StaffAbsenceImpact["attainment_impact"] = [];

      for (const subject of subjects) {
        const withTeacher = assessResult.data.filter(
          (a) =>
            a.staff_id === staff.staff_id &&
            a.subject === subject &&
            classesAffected.includes(a.registration_group),
        );
        const duringAbsence = assessResult.data.filter(
          (a) =>
            a.staff_id !== staff.staff_id &&
            a.subject === subject &&
            classesAffected.includes(a.registration_group) &&
            supplyPeriods.some(
              (sp) =>
                sp.registration_group === a.registration_group &&
                sp.academic_year === a.academic_year,
            ),
        );

        if (withTeacher.length === 0 || duringAbsence.length === 0) continue;

        const pctWith = pctAtExpected(
          withTeacher.map((a) => a.teacher_assessment),
        );
        const pctDuring = pctAtExpected(
          duringAbsence.map((a) => a.teacher_assessment),
        );
        const gap = Math.round((pctWith - pctDuring) * 10) / 10;

        if (Math.abs(gap) >= 5) {
          attainmentImpact.push({
            subject,
            pct_expected_with_teacher: pctWith,
            pct_expected_during_absence: pctDuring,
            gap_pp: gap,
          });
        }
      }

      // Behaviour impact
      let behaviourImpact: StaffAbsenceImpact["behaviour_impact"];
      if (behaviourResult.recordCount > 0) {
        const classIncidents = behaviourResult.data.filter(
          (b) =>
            b.type === "Negative" &&
            classesAffected.includes(b.registration_group),
        );

        // This is a rough approximation — ideally we'd know exact absence dates
        const totalIncidents = classIncidents.length;
        // Approximate: absence_days / 190 school days in year
        const absenceProportion = staff.absence_days_this_year / 190;
        const expectedDuring = totalIncidents * absenceProportion;
        const expectedWith = totalIncidents * (1 - absenceProportion);

        if (totalIncidents > 10 && absenceProportion > 0.02) {
          const weeksWith = (190 - staff.absence_days_this_year) / 5;
          const weeksDuring = staff.absence_days_this_year / 5;

          if (weeksWith > 0 && weeksDuring > 0) {
            const perWeekWith = expectedWith / weeksWith;
            const perWeekDuring = expectedDuring / weeksDuring;

            behaviourImpact = {
              incidents_per_week_with_teacher:
                Math.round(perWeekWith * 10) / 10,
              incidents_per_week_during_absence:
                Math.round(perWeekDuring * 10) / 10,
              change_pct:
                perWeekWith > 0
                  ? Math.round(
                      ((perWeekDuring - perWeekWith) / perWeekWith) * 100,
                    )
                  : 0,
            };
          }
        }
      }

      if (attainmentImpact.length === 0 && !behaviourImpact) continue;

      const latestHistory = teacherClasses.sort(
        (a, b) => b.academic_year_start - a.academic_year_start,
      )[0];

      findings.push({
        staff_id: staff.staff_id,
        staff_name: staff.display_name,
        year_group: latestHistory?.year_group ?? 0,
        registration_group: latestHistory?.registration_group ?? "",
        academic_year: latestHistory?.academic_year ?? "",
        absence_days: staff.absence_days_this_year,
        classes_affected: classesAffected,
        attainment_impact: attainmentImpact,
        behaviour_impact: behaviourImpact,
        suggested_actions: [
          `${staff.display_name} has been absent ${staff.absence_days_this_year} days — review impact on ${classesAffected.join(", ")}`,
          attainmentImpact.length > 0
            ? `Attainment dipped during absence in: ${attainmentImpact.map((ai) => `${ai.subject} (${ai.gap_pp}pp)`).join(", ")}`
            : "",
          "Ensure high-quality cover arrangements when teacher is absent",
          "Consider a phased return plan that minimises disruption",
          "Brief cover teachers on current class progress and planning",
        ].filter(Boolean),
      });
    }

    return {
      findings,
      warnings,
      data_sources_used: dataSources,
      analysis_timestamp: new Date().toISOString(),
    };
  }

  // ─── 12. Ofsted Readiness Scan ─────────────────────────

  /**
   * Comprehensive scan running all analysis checks plus behaviour trends
   * and exclusion rates. Returns RAG-rated report.
   */
  async runOfstedReadinessScan(): Promise<AnalysisResult<OfstedReadinessScan>> {
    const warnings: string[] = [];
    const dataSources = new Set<string>();

    const checks: OfstedReadinessCheck[] = [];

    // Run all analyses in parallel
    const [
      teacherPatterns,
      inflation,
      declining,
      cohortAnomalies,
      ppGap,
      genderGap,
      senProgress,
      attendanceCorrelation,
      bradfordAlerts,
      behaviourResult,
      ks2Result,
    ] = await Promise.all([
      this.detectTeacherPerformancePatterns(),
      this.detectTeacherAssessmentInflation(),
      this.detectDecliningPupils(),
      this.detectCohortAnomaly(),
      this.detectPPGapTrend(),
      this.detectGenderGap(),
      this.detectSENProgress(),
      this.correlateAttendanceAttainment(),
      this.detectBradfordFactorAlerts(),
      this.svc.read<MISBehaviourIncident>(this.orgId, "behaviour"),
      this.svc.read<MISHistoricalKS2>(this.orgId, "historical_ks2"),
    ]);

    // Collect warnings and data sources from all analyses
    for (const result of [
      teacherPatterns,
      inflation,
      declining,
      cohortAnomalies,
      ppGap,
      genderGap,
      senProgress,
      attendanceCorrelation,
      bradfordAlerts,
    ]) {
      warnings.push(...result.warnings);
      result.data_sources_used.forEach((ds) => dataSources.add(ds));
    }
    warnings.push(...behaviourResult.warnings, ...ks2Result.warnings);

    // ── Quality of Education checks ──

    // Teacher performance consistency
    const underperforming = teacherPatterns.findings.filter(
      (f) => f.direction === "underperforming",
    );
    checks.push({
      area: "Teaching consistency across parallel classes",
      category: "quality_of_education",
      rating:
        underperforming.length === 0
          ? "green"
          : underperforming.length <= 2
            ? "amber"
            : "red",
      headline:
        underperforming.length === 0
          ? "No significant gaps between parallel classes"
          : `${underperforming.length} teacher(s) with parallel class gaps ≥ 10pp`,
      detail:
        underperforming
          .map(
            (u) =>
              `${u.teacher_name}: ${u.subject} — ${u.average_gap_pp}pp below parallel class`,
          )
          .join("; ") || "All classes performing consistently",
      suggested_actions:
        underperforming.length > 0
          ? ["Arrange peer observations", "Review planning consistency"]
          : ["Continue monitoring"],
    });

    // Assessment accuracy
    checks.push({
      area: "Teacher assessment accuracy",
      category: "quality_of_education",
      rating:
        inflation.findings.length === 0
          ? "green"
          : inflation.findings.length <= 2
            ? "amber"
            : "red",
      headline:
        inflation.findings.length === 0
          ? "Teacher assessments aligned with standardised scores"
          : `${inflation.findings.length} class(es) with TA-standardised gap > 8pp`,
      detail:
        inflation.findings
          .map(
            (f) =>
              `${f.teacher_name} ${f.subject}: ${f.direction} by ${f.gap_pp}pp`,
          )
          .join("; ") || "Good assessment accuracy across school",
      suggested_actions:
        inflation.findings.length > 0
          ? ["Schedule moderation sessions", "Review assessment CPD needs"]
          : ["Maintain current moderation practices"],
    });

    // Declining pupils
    const highUrgency = declining.findings.filter((d) => d.urgency === "high");
    checks.push({
      area: "Pupils on declining trajectory",
      category: "quality_of_education",
      rating:
        highUrgency.length === 0
          ? declining.findings.length <= 3
            ? "green"
            : "amber"
          : "red",
      headline:
        highUrgency.length > 0
          ? `${highUrgency.length} pupil(s) declining and NOT on any register`
          : `${declining.findings.length} pupil(s) on declining trajectory (all monitored)`,
      detail:
        highUrgency.length > 0
          ? `Priority: ${highUrgency.map((d) => `${d.pupil_name} (${d.subject})`).join(", ")}`
          : "All declining pupils are on intervention or SEN register",
      suggested_actions:
        highUrgency.length > 0
          ? [
              "Arrange urgent pupil progress review for unflagged declining pupils",
            ]
          : ["Continue termly pupil progress meetings"],
    });

    // Cohort anomalies
    checks.push({
      area: "Year group performance consistency",
      category: "quality_of_education",
      rating:
        cohortAnomalies.findings.length === 0
          ? "green"
          : cohortAnomalies.findings.length <= 2
            ? "amber"
            : "red",
      headline:
        cohortAnomalies.findings.length === 0
          ? "All year groups performing within school norms"
          : `${cohortAnomalies.findings.length} class(es) significantly below school average`,
      detail:
        cohortAnomalies.findings
          .map(
            (c) =>
              `Y${c.year_group} ${c.registration_group} ${c.subject}: ${c.gap_pp}pp below avg (${c.probable_cause})`,
          )
          .join("; ") || "Consistent performance",
      suggested_actions:
        cohortAnomalies.findings.length > 0
          ? ["Investigate root causes", "Deploy targeted support"]
          : ["Maintain quality assurance"],
    });

    // PP gap
    if (ppGap.findings.length > 0) {
      const ppData = ppGap.findings[0];
      const wideningSubjects = ppData.per_subject.filter(
        (s) => s.trend_direction === "widening",
      );
      checks.push({
        area: "Pupil Premium attainment gap",
        category: "quality_of_education",
        rating:
          wideningSubjects.length > 0
            ? "red"
            : ppData.borderline_pupils.length > 3
              ? "amber"
              : "green",
        headline:
          wideningSubjects.length > 0
            ? `PP gap WIDENING in ${wideningSubjects.map((s) => s.subject).join(", ")}`
            : `PP gap stable/narrowing — ${ppData.borderline_pupils.length} borderline pupil(s)`,
        detail: ppData.projected_impact,
        suggested_actions: [
          "Review PP strategy effectiveness",
          "Target borderline pupils with intervention",
        ],
      });
    }

    // SEN progress
    const senBelowExpected = senProgress.findings.filter(
      (s) => s.overall_progress === "below_expected",
    );
    checks.push({
      area: "SEN pupil progress from baseline",
      category: "quality_of_education",
      rating:
        senBelowExpected.length === 0
          ? "green"
          : senBelowExpected.length <= 3
            ? "amber"
            : "red",
      headline:
        senBelowExpected.length === 0
          ? "All SEN pupils making expected or above expected progress"
          : `${senBelowExpected.length} SEN pupil(s) below expected progress`,
      detail:
        senBelowExpected
          .map((s) => `${s.pupil_name} (${s.sen_primary_need})`)
          .join(", ") || "Good SEN provision outcomes",
      suggested_actions:
        senBelowExpected.length > 0
          ? [
              "Review provision maps",
              "Discuss with SENCO",
              "Consider external referrals",
            ]
          : ["Continue current provision"],
    });

    // ── Behaviour & Attitudes checks ──

    // Behaviour trends
    if (behaviourResult.recordCount > 0) {
      const incidents = behaviourResult.data;
      const negativeIncidents = incidents.filter((i) => i.type === "Negative");
      const exclusions = incidents.filter((i) => i.is_exclusion);
      const fteCount = exclusions.filter(
        (e) => e.exclusion_type === "FTE",
      ).length;
      const pexCount = exclusions.filter(
        (e) => e.exclusion_type === "PEX",
      ).length;
      const totalExclDays = exclusions.reduce(
        (s, e) => s + (e.exclusion_days ?? 0),
        0,
      );

      checks.push({
        area: "Behaviour incidents",
        category: "behaviour_attitudes",
        rating:
          negativeIncidents.length > incidents.length * 0.3
            ? "red"
            : negativeIncidents.length > incidents.length * 0.15
              ? "amber"
              : "green",
        headline: `${negativeIncidents.length} negative incidents (${Math.round((negativeIncidents.length / Math.max(incidents.length, 1)) * 100)}% of total)`,
        detail: `Positive: ${incidents.length - negativeIncidents.length}, Negative: ${negativeIncidents.length}`,
        data_point: `Ratio: ${Math.round(((incidents.length - negativeIncidents.length) / Math.max(negativeIncidents.length, 1)) * 10) / 10}:1 positive to negative`,
        suggested_actions: [
          "Review behaviour policy if negative ratio is high",
          "Ensure consistent application of rewards system",
        ],
      });

      checks.push({
        area: "Exclusions",
        category: "behaviour_attitudes",
        rating: pexCount > 0 ? "red" : fteCount > 5 ? "amber" : "green",
        headline:
          pexCount > 0
            ? `${pexCount} permanent exclusion(s) — Ofsted will scrutinise this`
            : `${fteCount} fixed-term exclusion(s), ${totalExclDays} total days`,
        detail: `FTE: ${fteCount}, PEX: ${pexCount}, Total days lost: ${totalExclDays}`,
        suggested_actions:
          pexCount > 0
            ? [
                "Prepare exclusion rationale and evidence",
                "Review alternatives to exclusion",
              ]
            : fteCount > 5
              ? ["Review exclusion trends", "Consider in-school alternatives"]
              : ["Continue current approach"],
      });
    }

    // Attendance
    if (attendanceCorrelation.findings.length > 0) {
      const correlation = attendanceCorrelation.findings[0];
      const paBand = correlation.bands.find((b) => b.attendance_min === 85);
      const severeBand = correlation.bands.find(
        (b) => b.attendance_max === 84.9,
      );
      const paCount =
        (paBand?.pupil_count ?? 0) + (severeBand?.pupil_count ?? 0);

      checks.push({
        area: "Attendance and persistent absence",
        category: "behaviour_attitudes",
        rating: paCount > 20 ? "red" : paCount > 10 ? "amber" : "green",
        headline: `${paCount} pupil(s) persistently absent (below 90%)`,
        detail: correlation.key_finding,
        data_point: `Correlation: ${correlation.correlation_coefficient} (${correlation.correlation_strength})`,
        suggested_actions: [
          "Target PA families with attendance improvement plans",
          "Work with EWO for severe cases",
        ],
      });
    }

    // ── Leadership & Management checks ──

    // Staff absence (Bradford Factor)
    const criticalStaff = bradfordAlerts.findings.filter(
      (f) =>
        f.threshold_level === "critical" || f.threshold_level === "serious",
    );
    checks.push({
      area: "Staff absence management",
      category: "leadership_management",
      rating:
        criticalStaff.length > 2
          ? "red"
          : criticalStaff.length > 0
            ? "amber"
            : "green",
      headline:
        criticalStaff.length === 0
          ? "No staff at serious/critical absence levels"
          : `${criticalStaff.length} staff member(s) at serious/critical Bradford Factor`,
      detail:
        criticalStaff
          .map((s) => `${s.staff_name}: BF ${s.bradford_factor}`)
          .join(", ") || "Healthy staff attendance",
      suggested_actions:
        criticalStaff.length > 0
          ? [
              "Implement absence management procedures",
              "Review wellbeing support",
            ]
          : ["Continue monitoring"],
    });

    // Gender gap (as equity concern under L&M)
    const significantGenderGaps = genderGap.findings.filter(
      (g) => g.gap_pp >= 15,
    );
    checks.push({
      area: "Gender equity in outcomes",
      category: "leadership_management",
      rating:
        significantGenderGaps.length > 2
          ? "red"
          : significantGenderGaps.length > 0
            ? "amber"
            : "green",
      headline:
        significantGenderGaps.length === 0
          ? "No significant gender gaps (all <15pp)"
          : `${significantGenderGaps.length} subject-year group(s) with gender gap ≥ 15pp`,
      detail:
        significantGenderGaps
          .map(
            (g) =>
              `Y${g.year_group} ${g.subject}: ${g.gap_pp}pp (${g.direction})`,
          )
          .join("; ") || "Good equity across genders",
      suggested_actions:
        significantGenderGaps.length > 0
          ? [
              "Review curriculum engagement strategies",
              "Analyse by subject and year group",
            ]
          : ["Continue monitoring"],
    });

    // Historical KS2 trend
    if (ks2Result.data.length >= 2) {
      const sorted = [...ks2Result.data].sort((a, b) =>
        a.academic_year.localeCompare(b.academic_year),
      );
      const latest = sorted[sorted.length - 1];
      const previous = sorted[sorted.length - 2];

      const trend = latest.combined_rwm_pct - previous.combined_rwm_pct;
      checks.push({
        area: "KS2 outcomes trend",
        category: "quality_of_education",
        rating:
          latest.combined_rwm_pct < latest.national_combined_rwm - 10
            ? "red"
            : latest.combined_rwm_pct < latest.national_combined_rwm
              ? "amber"
              : "green",
        headline: `KS2 combined RWM: ${latest.combined_rwm_pct}% (national: ${latest.national_combined_rwm}%), trend: ${trend >= 0 ? "+" : ""}${trend}pp`,
        detail: `${latest.academic_year}: ${latest.combined_rwm_pct}%, ${previous.academic_year}: ${previous.combined_rwm_pct}%`,
        data_point: `Progress scores — R: ${latest.reading_progress}, W: ${latest.writing_progress}, M: ${latest.maths_progress}`,
        suggested_actions:
          latest.combined_rwm_pct < latest.national_combined_rwm
            ? [
                "Develop improvement plan for KS2 outcomes",
                "Review Year 5/6 teaching quality",
              ]
            : ["Maintain and build on strong KS2 results"],
      });
    }

    // ── Determine overall rating ──
    const redCount = checks.filter((c) => c.rating === "red").length;
    const amberCount = checks.filter((c) => c.rating === "amber").length;
    const overallRating: RAGRating =
      redCount >= 3
        ? "red"
        : redCount >= 1 || amberCount >= 4
          ? "amber"
          : "green";

    const strengths = checks
      .filter((c) => c.rating === "green")
      .map((c) => c.headline);
    const risks = checks
      .filter((c) => c.rating === "red")
      .map((c) => `${c.area}: ${c.headline}`);
    const immediateActions = checks
      .filter((c) => c.rating === "red")
      .flatMap((c) => c.suggested_actions);

    const scan: OfstedReadinessScan = {
      overall_rating: overallRating,
      checks,
      strengths,
      risks,
      immediate_actions: immediateActions,
      scan_date: new Date().toISOString(),
    };

    return {
      findings: [scan],
      warnings: Array.from(new Set(warnings)),
      data_sources_used: [...dataSources],
      analysis_timestamp: new Date().toISOString(),
    };
  }

  // ─── 13. Governor Report Data ──────────────────────────

  /**
   * Pull data from all sources for governor report sections.
   * Returns structured data suitable for automated report generation.
   */
  async generateGovernorReportData(): Promise<
    AnalysisResult<GovernorReportData>
  > {
    const warnings: string[] = [];
    const dataSources = new Set<string>();

    // Run all analyses in parallel
    const [
      teacherPatterns,
      ppGap,
      genderGap,
      senProgress,
      attendanceCorrelation,
      bradfordAlerts,
      behaviourResult,
      pupilsResult,
      ks2Result,
      progressStories,
    ] = await Promise.all([
      this.detectTeacherPerformancePatterns(),
      this.detectPPGapTrend(),
      this.detectGenderGap(),
      this.detectSENProgress(),
      this.correlateAttendanceAttainment(),
      this.detectBradfordFactorAlerts(),
      this.svc.read<MISBehaviourIncident>(this.orgId, "behaviour"),
      this.svc.read<MISPupil>(this.orgId, "pupils"),
      this.svc.read<MISHistoricalKS2>(this.orgId, "historical_ks2"),
      this.detectPupilStrengthChange(),
    ]);

    // Collect warnings
    for (const result of [
      teacherPatterns,
      ppGap,
      genderGap,
      senProgress,
      attendanceCorrelation,
      bradfordAlerts,
      progressStories,
    ]) {
      warnings.push(...result.warnings);
      result.data_sources_used.forEach((ds) => dataSources.add(ds));
    }

    const sections: GovernorReportSection[] = [];

    // Section 1: School Overview
    const pupils = pupilsResult.data;
    const currentPupils = pupils.filter(
      (p) => p.enrolment_status === "Current",
    );
    sections.push({
      title: "School Overview",
      order: 1,
      data: {
        total_on_roll: currentPupils.length,
        fsm_pct:
          currentPupils.length > 0
            ? Math.round(
                (currentPupils.filter((p) => p.fsm_eligible).length /
                  currentPupils.length) *
                  100,
              )
            : 0,
        pp_pct:
          currentPupils.length > 0
            ? Math.round(
                (currentPupils.filter((p) => p.pupil_premium).length /
                  currentPupils.length) *
                  100,
              )
            : 0,
        sen_pct:
          currentPupils.length > 0
            ? Math.round(
                (currentPupils.filter((p) => p.sen_status !== "N").length /
                  currentPupils.length) *
                  100,
              )
            : 0,
        ehcp_count: currentPupils.filter((p) => p.ehcp).length,
        eal_pct:
          currentPupils.length > 0
            ? Math.round(
                (currentPupils.filter((p) => p.eal).length /
                  currentPupils.length) *
                  100,
              )
            : 0,
      },
      narrative: `The school has ${currentPupils.length} pupils on roll.`,
      key_points: [
        `${currentPupils.filter((p) => p.pupil_premium).length} pupils are eligible for Pupil Premium`,
        `${currentPupils.filter((p) => p.sen_status !== "N").length} pupils on SEN register (${currentPupils.filter((p) => p.ehcp).length} with EHCP)`,
      ],
    });

    // Section 2: Attainment & Progress
    const latestKS2 =
      ks2Result.data.length > 0
        ? [...ks2Result.data].sort((a, b) =>
            b.academic_year.localeCompare(a.academic_year),
          )[0]
        : null;

    sections.push({
      title: "Attainment & Progress",
      order: 2,
      data: {
        ks2: latestKS2 ?? {},
        teaching_consistency: {
          underperforming_count: teacherPatterns.findings.filter(
            (f) => f.direction === "underperforming",
          ).length,
          excelling_count: teacherPatterns.findings.filter(
            (f) => f.direction === "excelling",
          ).length,
        },
      },
      narrative: latestKS2
        ? `KS2 combined RWM: ${latestKS2.combined_rwm_pct}% (national: ${latestKS2.national_combined_rwm}%).`
        : "KS2 data not available.",
      key_points: latestKS2
        ? [
            `Reading: ${latestKS2.reading_expected_pct}% at expected (national: ${latestKS2.national_reading_expected}%)`,
            `Maths: ${latestKS2.maths_expected_pct}% at expected (national: ${latestKS2.national_maths_expected}%)`,
            `Writing: ${latestKS2.writing_expected_pct}% at expected`,
            `Progress: R ${latestKS2.reading_progress}, W ${latestKS2.writing_progress}, M ${latestKS2.maths_progress}`,
          ]
        : ["Awaiting KS2 data"],
    });

    // Section 3: Pupil Premium
    if (ppGap.findings.length > 0) {
      const ppData = ppGap.findings[0];
      sections.push({
        title: "Pupil Premium",
        order: 3,
        data: {
          per_subject_gaps: ppData.per_subject.map((s) => ({
            subject: s.subject,
            latest_gap: s.latest_gap_pp,
            trend: s.trend_direction,
          })),
          borderline_count: ppData.borderline_pupils.length,
        },
        narrative: ppData.projected_impact,
        key_points: [
          ...ppData.per_subject.map(
            (s) =>
              `${s.subject}: PP gap ${s.latest_gap_pp}pp (${s.trend_direction})`,
          ),
          `${ppData.borderline_pupils.length} PP pupil(s) borderline (WTS) — could reach Expected with intervention`,
        ],
      });
    }

    // Section 4: SEND
    sections.push({
      title: "SEND",
      order: 4,
      data: {
        total_sen: senProgress.findings.length,
        above_expected: senProgress.findings.filter(
          (s) => s.overall_progress === "above_expected",
        ).length,
        at_expected: senProgress.findings.filter(
          (s) => s.overall_progress === "expected",
        ).length,
        below_expected: senProgress.findings.filter(
          (s) => s.overall_progress === "below_expected",
        ).length,
      },
      narrative: `${senProgress.findings.length} SEN pupils tracked. ${senProgress.findings.filter((s) => s.overall_progress === "above_expected").length} making above expected progress.`,
      key_points: senProgress.findings
        .filter((s) => s.overall_progress === "above_expected")
        .slice(0, 3)
        .map(
          (s) =>
            `${s.pupil_name}: exceptional progress (suitable for governor report)`,
        )
        .concat(
          senProgress.findings
            .filter((s) => s.overall_progress === "below_expected")
            .map(
              (s) => `${s.pupil_name}: below expected — provision under review`,
            ),
        ),
    });

    // Section 5: Behaviour & Attendance
    const negativeIncidents = behaviourResult.data.filter(
      (i) => i.type === "Negative",
    );
    const exclusions = behaviourResult.data.filter((i) => i.is_exclusion);
    sections.push({
      title: "Behaviour & Attendance",
      order: 5,
      data: {
        total_incidents: behaviourResult.recordCount,
        negative_incidents: negativeIncidents.length,
        exclusions_fte: exclusions.filter((e) => e.exclusion_type === "FTE")
          .length,
        exclusions_pex: exclusions.filter((e) => e.exclusion_type === "PEX")
          .length,
        attendance:
          attendanceCorrelation.findings.length > 0
            ? attendanceCorrelation.findings[0].bands.map((b) => ({
                band: b.attendance_band,
                count: b.pupil_count,
              }))
            : [],
      },
      narrative:
        attendanceCorrelation.findings.length > 0
          ? attendanceCorrelation.findings[0].key_finding
          : "Attendance data not available.",
      key_points: [
        `${negativeIncidents.length} negative behaviour incidents recorded`,
        `${exclusions.length} exclusion(s) this year`,
      ],
    });

    // Section 6: Staffing
    sections.push({
      title: "Staffing",
      order: 6,
      data: {
        bradford_alerts: bradfordAlerts.findings.length,
        critical_staff: bradfordAlerts.findings
          .filter(
            (f) =>
              f.threshold_level === "critical" ||
              f.threshold_level === "serious",
          )
          .map((f) => ({
            name: f.staff_name,
            bradford_factor: f.bradford_factor,
            level: f.threshold_level,
          })),
      },
      narrative: `${bradfordAlerts.findings.length} staff member(s) above Bradford Factor monitoring threshold.`,
      key_points: bradfordAlerts.findings
        .filter(
          (f) =>
            f.threshold_level === "serious" || f.threshold_level === "critical",
        )
        .map(
          (f) =>
            `${f.staff_name}: Bradford Factor ${f.bradford_factor} (${f.threshold_level})`,
        ),
    });

    // Section 7: Positive Stories
    const govStories = progressStories.findings.filter((s) =>
      s.suitable_for.some((sf) => sf.toLowerCase().includes("governor")),
    );
    sections.push({
      title: "Positive Stories & Progress",
      order: 7,
      data: {
        stories_count: govStories.length,
        stories: govStories.map((s) => ({
          pupil_name: s.pupil_name,
          subject: s.subject,
          from: s.from_level,
          to: s.to_level,
          support: s.correlated_support,
        })),
      },
      narrative: `${govStories.length} pupil(s) making exceptional progress — suitable for governor report.`,
      key_points: govStories
        .slice(0, 5)
        .map(
          (s) =>
            `${s.pupil_name}: ${s.subject} ${s.from_level} → ${s.to_level} over ${s.duration_terms} terms`,
        ),
    });

    const reportData: GovernorReportData = {
      report_date: new Date().toISOString(),
      academic_year:
        ks2Result.data.length > 0
          ? [...ks2Result.data].sort((a, b) =>
              b.academic_year.localeCompare(a.academic_year),
            )[0].academic_year
          : new Date().getFullYear() +
            "-" +
            (new Date().getFullYear() + 1).toString().slice(-2),
      sections,
      warnings: Array.from(new Set(warnings)),
    };

    return {
      findings: [reportData],
      warnings: Array.from(new Set(warnings)),
      data_sources_used: [...dataSources],
      analysis_timestamp: new Date().toISOString(),
    };
  }

  // ═══════════════════════════════════════════════════════════
  // Helper Methods
  // ═══════════════════════════════════════════════════════════

  /** Return empty result with warnings */
  private emptyResult<T>(
    warnings: string[],
    dataSources: string[],
  ): AnalysisResult<T> {
    return {
      findings: [],
      warnings,
      data_sources_used: dataSources,
      analysis_timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get the latest assessment per pupil per subject.
   * Deduplicates by taking the most recent assessment_period per student_id + subject.
   */
  private getLatestAssessmentPerPupilSubject(
    assessments: MISTermlyAssessment[],
  ): MISTermlyAssessment[] {
    const latest = new Map<string, MISTermlyAssessment>();
    for (const a of assessments) {
      const key = `${a.student_id}|${a.subject}`;
      const existing = latest.get(key);
      if (
        !existing ||
        periodOrdinal(a.academic_year, a.assessment_period) >
          periodOrdinal(existing.academic_year, existing.assessment_period)
      ) {
        latest.set(key, a);
      }
    }
    return Array.from(latest.values());
  }
}

// ─── Singleton Factory ────────────────────────────────────

let _engineInstance: MISAnalysisEngine | null = null;

/**
 * Get the singleton MIS Analysis Engine instance.
 *
 * @example
 * ```ts
 * const engine = getMISAnalysisEngine();
 * const scan = await engine.runOfstedReadinessScan('org-123');
 * ```
 */
export function getMISAnalysisEngine(): MISAnalysisEngine {
  if (!_engineInstance) {
    _engineInstance = new MISAnalysisEngine();
  }
  return _engineInstance;
}
