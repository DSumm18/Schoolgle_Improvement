/**
 * School Intelligence Engine
 *
 * Cross-references ALL data sources to produce research-backed analysis:
 * - DfE warehouse (attendance, census, KS2, workforce, exclusions)
 * - School contextual factors (events, disruptions, interventions)
 * - Cohort outcome tracking (internal assessment data over time)
 * - Cross-module signals (HR absence, estates disruption, compliance events)
 * - EEF Teaching & Learning Toolkit (33 strategies with evidence ratings)
 *
 * The engine doesn't just report what happened — it explains WHY,
 * correlates events with outcomes, and recommends EEF-backed interventions
 * specific to each cohort's needs.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import {
  eefStrategies,
  getRelevantStrategies,
  getHighImpactStrategies,
  searchStrategies,
  type EEFStrategy,
} from "./eef-toolkit";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// --- Types ---

export interface SchoolProfile {
  urn: number;
  name: string;
  phase: string; // primary, secondary, special
  type: string;
  la_name: string;
  pupil_count: number;
  capacity: number;
  fsm_pct: number;
  trust_name?: string;
  head_name: string;
  last_inspection_date?: string;
}

export interface DfETrendData {
  attendance: {
    year: number;
    overall_pct: number;
    persistent_absence_pct: number;
    illness_pct: number;
    excluded_pct: number;
  }[];
  census: {
    year: number;
    number_on_roll: number;
    fsm_pct: number;
    eal_pct: number;
    sen_pct: number;
    mobility_pct: number;
  }[];
  ks2: {
    year: number;
    subject: string;
    breakdown: string;
    expected_standard_pct: number | null;
    higher_standard_pct: number | null;
    progress_measure_score: number | null;
    progress_description: string;
  }[];
  workforce: {
    year: number;
    fte_teachers: number;
    fte_tas: number;
    pupil_teacher_ratio: number;
    vacancy_rate: number;
    qts_pct: number;
    average_pay: number;
  }[];
  exclusions: {
    year: number;
    total: number;
  }[];
}

export interface ContextualFactor {
  id: string;
  factor_type: string;
  title: string;
  description: string;
  rationale: string;
  start_date: string;
  end_date: string | null;
  academic_year_start: number;
  affected_year_groups: number[];
  whole_school: boolean;
  impact_area: string;
  impact_direction: string;
  impact_severity: string;
  eef_strategy_id: string | null;
  measured_outcome: string | null;
  measured_impact_score: number | null;
  source_module: string;
}

export interface CohortOutcome {
  year_group: number;
  academic_year_start: number;
  assessment_period: string;
  reading_expected_pct: number | null;
  writing_expected_pct: number | null;
  maths_expected_pct: number | null;
  combined_expected_pct: number | null;
  reading_progress: number | null;
  writing_progress: number | null;
  maths_progress: number | null;
  attendance_pct: number | null;
  persistent_absence_pct: number | null;
  national_combined_pct: number | null;
}

export interface CrossModuleSignals {
  // HR
  staffAbsenceDays: number;
  vacancies: number;
  turnoverRate: number;
  nqtCount: number;

  // Estates
  estatesOverdueTasks: number;
  criticalEstatesIssues: string[];
  buildingDisruptions: string[];

  // Compliance
  safeguardingConcerns: number;
  overduePolicies: number;
  scrGaps: number;
  trainingComplianceRate: number;

  // Governance
  governorMeetings: number;
  governorVacancies: number;
  recentGovernorDecisions: string[];
}

export interface LaBenchmarkData {
  la_name: string;
  la_code: string;
  school_count: number;
  ks2_combined: { year: number; expected_standard_pct: number }[];
  ks2_reading: { year: number; expected_standard_pct: number; progress_score: number | null }[];
  ks2_writing: { year: number; expected_standard_pct: number; progress_score: number | null }[];
  ks2_maths: { year: number; expected_standard_pct: number; progress_score: number | null }[];
  disadvantaged_gap: { year: number; all_pupils_pct: number; disadvantaged_pct: number; gap_pp: number }[];
  attendance: { year: number; overall_pct: number; persistent_absence_pct: number }[];
  persistent_absence: { year: number; pct: number }[];
  three_year_trend: {
    ks2_combined_avg: number;
    attendance_avg: number;
    direction: "improving" | "stable" | "declining";
  } | null;
}

export interface DemographicCohort {
  id: string;
  name: string;
  fsm_band: string;
  eal_band: string;
  sen_band: string;
  school_count: number;
  comparison_urns: number[];
  avg_ks2_combined: number;
  avg_attendance: number;
  avg_persistent_absence?: number | null;
  avg_disadvantaged_gap?: number | null;
  avg_reading_progress?: number | null;
  avg_maths_progress?: number | null;
}

export interface IntelligenceAnalysis {
  title: string;
  executive_summary: string;
  la_benchmarks?: LaBenchmarkData | null;
  detailed_analysis: {
    cohort_analyses: CohortAnalysis[];
    trend_insights: TrendInsight[];
    cross_module_alerts: CrossModuleAlert[];
    positive_impacts: ImpactStory[];
    negative_impacts: ImpactStory[];
  };
  eef_recommendations: EEFRecommendation[];
  suggested_actions: SuggestedAction[];
  data_sources_used: string[];
  confidence_score: number;
}

export interface CohortAnalysis {
  year_group: number;
  academic_year: number;
  narrative: string;
  attainment_vs_national: string; // "above", "in line", "below"
  progress_rating: string;
  contextual_factors: string[]; // Which events affected this cohort
  intervention_impact: string | null; // If an intervention was in place, did it work?
  risk_level: string; // "low", "medium", "high"
}

export interface TrendInsight {
  metric: string;
  direction: string; // "improving", "declining", "stable", "volatile"
  years_analysed: number;
  narrative: string;
  causal_factors: string[];
  national_comparison: string;
}

export interface CrossModuleAlert {
  source_module: string;
  alert_type: string;
  description: string;
  affected_areas: string[];
  urgency: string;
  recommended_action: string;
}

export interface ImpactStory {
  title: string;
  narrative: string;
  cohort_affected: string;
  data_evidence: string;
  eef_link: string | null;
}

export interface EEFRecommendation {
  strategy: EEFStrategy;
  rationale: string;
  target_cohorts: number[];
  expected_impact: string;
  implementation_priority: string;
  cost_benefit: string;
  evidence_strength_note: string;
}

export interface SuggestedAction {
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  ofsted_area: string;
  target_year_groups: number[];
  eef_strategy_id: string | null;
  sef_impact: string;
  legislation_reference: string | null;
  deadline_suggestion: string | null;
}

// --- Core Engine ---

export class SchoolIntelligenceEngine {
  private supabase: SupabaseClient;
  private openai: OpenAI | null = null;

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  private getOpenAI(): OpenAI {
    if (this.openai) return this.openai;

    this.openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    return this.openai;
  }

  /**
   * Get school profile from GIAS data
   */
  async getSchoolProfile(urn: number): Promise<SchoolProfile | null> {
    const { data } = await this.supabase
      .from("schools")
      .select("*")
      .eq("urn", urn)
      .single();

    if (!data) return null;

    return {
      urn: data.urn,
      name: data.name,
      phase: data.phase_name || "primary",
      type: data.type_name || "",
      la_name: data.la_name || "",
      pupil_count: data.number_of_pupils || 0,
      capacity: data.school_capacity || 0,
      fsm_pct: data.percentage_fsm || 0,
      trust_name: data.trust_name || undefined,
      head_name:
        `${data.head_title || ""} ${data.head_first_name || ""} ${data.head_last_name || ""}`.trim(),
      last_inspection_date: data.date_of_last_inspection || undefined,
    };
  }

  /**
   * Pull multi-year DfE trend data for a school
   */
  async getDfETrends(
    urn: number,
    yearsBack: number = 5,
  ): Promise<DfETrendData> {
    const minYear = new Date().getFullYear() - yearsBack - 1;

    const [attendance, census, ks2, workforce, exclusions] = await Promise.all([
      this.supabase
        .from("attendance")
        .select(
          "academic_year_start, overall_attendance_pct, persistent_absence_pct, illness_absence_pct, excluded_pct",
        )
        .eq("urn", urn)
        .gte("academic_year_start", minYear)
        .order("academic_year_start", { ascending: true }),

      this.supabase
        .from("census")
        .select(
          "academic_year_start, number_on_roll, fsm_pct, eal_pct, sen_pct, mobility_pct",
        )
        .eq("urn", urn)
        .gte("academic_year_start", minYear)
        .order("academic_year_start", { ascending: true }),

      this.supabase
        .from("ks2_results")
        .select(
          "academic_year_start, subject, breakdown, expected_standard_pct, higher_standard_pct, progress_measure_score, progress_measure_description",
        )
        .eq("urn", urn)
        .gte("academic_year_start", minYear)
        .eq("breakdown_topic", "All pupils")
        .order("academic_year_start", { ascending: true }),

      this.supabase
        .from("workforce")
        .select(
          "academic_year_start, fte_teachers, fte_teaching_assistants, pupil_teacher_ratio, teaching_vacancy_rate, teachers_with_qts_pct, average_teacher_pay",
        )
        .eq("urn", urn)
        .gte("academic_year_start", minYear)
        .order("academic_year_start", { ascending: true }),

      this.supabase
        .from("exclusions")
        .select("academic_year_start")
        .eq("urn", urn)
        .gte("academic_year_start", minYear),
    ]);

    // Aggregate exclusions by year
    const exclusionsByYear: Record<number, number> = {};
    (exclusions.data || []).forEach((e: { academic_year_start: number }) => {
      exclusionsByYear[e.academic_year_start] =
        (exclusionsByYear[e.academic_year_start] || 0) + 1;
    });

    return {
      attendance: (attendance.data || []).map((r) => ({
        year: r.academic_year_start,
        overall_pct: r.overall_attendance_pct,
        persistent_absence_pct: r.persistent_absence_pct,
        illness_pct: r.illness_absence_pct,
        excluded_pct: r.excluded_pct,
      })),
      census: (census.data || []).map((r) => ({
        year: r.academic_year_start,
        number_on_roll: r.number_on_roll,
        fsm_pct: r.fsm_pct,
        eal_pct: r.eal_pct,
        sen_pct: r.sen_pct,
        mobility_pct: r.mobility_pct,
      })),
      ks2: (ks2.data || []).map((r) => ({
        year: r.academic_year_start,
        subject: r.subject,
        breakdown: r.breakdown,
        expected_standard_pct: r.expected_standard_pct,
        higher_standard_pct: r.higher_standard_pct,
        progress_measure_score: r.progress_measure_score,
        progress_description: r.progress_measure_description,
      })),
      workforce: (workforce.data || []).map((r) => ({
        year: r.academic_year_start,
        fte_teachers: r.fte_teachers,
        fte_tas: r.fte_teaching_assistants,
        pupil_teacher_ratio: r.pupil_teacher_ratio,
        vacancy_rate: r.teaching_vacancy_rate,
        qts_pct: r.teachers_with_qts_pct,
        average_pay: r.average_teacher_pay,
      })),
      exclusions: Object.entries(exclusionsByYear).map(([year, total]) => ({
        year: parseInt(year),
        total,
      })),
    };
  }

  /**
   * Get contextual factors for an organization
   */
  async getContextualFactors(
    organizationId: string,
  ): Promise<ContextualFactor[]> {
    const { data } = await this.supabase
      .from("school_contextual_factors")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .order("start_date", { ascending: false });

    return data || [];
  }

  /**
   * Get cohort outcomes over time
   */
  async getCohortOutcomes(organizationId: string): Promise<CohortOutcome[]> {
    const { data } = await this.supabase
      .from("school_cohort_outcomes")
      .select("*")
      .eq("organization_id", organizationId)
      .order("academic_year_start", { ascending: true })
      .order("year_group", { ascending: true });

    return data || [];
  }

  /**
   * Get LA (Local Authority) benchmark data for comparison
   * Aggregates data across all schools in the same LA with FULL KPI set
   */
  async getLaBenchmarks(
    urn: number,
    yearsBack: number = 5,
  ): Promise<LaBenchmarkData | null> {
    // 1. Get this school's LA code. Some academised schools have current
    // performance rows under the new URN before our local GIAS snapshot has
    // the successor establishment row, so fall back by org postcode/name.
    let { data: school } = await this.supabase
      .from("schools")
      .select("la_name, la_code, phase_name")
      .eq("urn", urn)
      .maybeSingle();

    if (!school?.la_code) {
      const { data: organization } = await this.supabase
        .from("organizations")
        .select("name,address,local_authority")
        .eq("urn", String(urn))
        .maybeSingle();

      const postcode = organization?.address?.postcode;
      const orgTown = organization?.address?.town;
      const orgLa = organization?.local_authority || orgTown;

      if (postcode) {
        const { data: postcodeMatches } = await this.supabase
          .from("schools")
          .select("la_name, la_code, phase_name, name, postcode")
          .eq("postcode", postcode)
          .limit(10);

        school = (postcodeMatches || []).find((candidate: any) =>
          candidate.phase_name === "Primary",
        ) || postcodeMatches?.[0] || null;
      }

      if (!school?.la_code && orgLa) {
        const { data: laMatch } = await this.supabase
          .from("schools")
          .select("la_name, la_code, phase_name")
          .eq("la_name", orgLa)
          .eq("phase_name", "Primary")
          .limit(1)
          .maybeSingle();
        school = laMatch || school;
      }
    }

    if (!school?.la_code) return null;

    // 2. Get all URNs in this LA (primary schools only for fair comparison)
    const { data: laSchools } = await this.supabase
      .from("schools")
      .select("urn")
      .eq("la_code", school.la_code)
      .eq("phase_name", "Primary") as any;

    if (!laSchools || laSchools.length === 0) return null;

    const urns = laSchools.map((s: any) => s.urn);
    const minYear = new Date().getFullYear() - yearsBack - 1;

    // 3. Fetch ALL LA-wide data for comprehensive KPI set
    const [
      laKs2All,
      laKs2Reading,
      laKs2Writing,
      laKs2Maths,
      laKs2Fsm,
      laAttendance,
    ] = await Promise.all([
      // KS2 Combined (RWM)
      this.supabase
        .from("ks2_results")
        .select("academic_year_start, expected_standard_pct")
        .in("urn", urns)
        .gte("academic_year_start", minYear)
        .eq("subject", "Reading, writing and maths")
        .eq("breakdown_topic", "All pupils")
        .limit(10000),

      // KS2 Reading with progress
      this.supabase
        .from("ks2_results")
        .select("academic_year_start, expected_standard_pct, progress_measure_score")
        .in("urn", urns)
        .gte("academic_year_start", minYear)
        .eq("subject", "Reading")
        .eq("breakdown_topic", "All pupils")
        .limit(10000),

      // KS2 Writing with progress
      this.supabase
        .from("ks2_results")
        .select("academic_year_start, expected_standard_pct, progress_measure_score")
        .in("urn", urns)
        .gte("academic_year_start", minYear)
        .eq("subject", "Writing")
        .eq("breakdown_topic", "All pupils")
        .limit(10000),

      // KS2 Maths with progress
      this.supabase
        .from("ks2_results")
        .select("academic_year_start, expected_standard_pct, progress_measure_score")
        .in("urn", urns)
        .gte("academic_year_start", minYear)
        .in("subject", ["Maths", "Mathematics"])
        .eq("breakdown_topic", "All pupils")
        .limit(10000),

      // KS2 FSM for disadvantaged gap analysis
      this.supabase
        .from("ks2_results")
        .select("academic_year_start, expected_standard_pct, breakdown_topic, breakdown")
        .in("urn", urns)
        .gte("academic_year_start", minYear)
        .eq("subject", "Reading, writing and maths")
        .in("breakdown_topic", ["All pupils", "Disadvantaged status"])
        .limit(10000),

      // Attendance data
      this.supabase
        .from("attendance")
        .select("academic_year_start, overall_attendance_pct, persistent_absence_pct")
        .in("urn", urns)
        .gte("academic_year_start", minYear)
        .limit(10000),
    ]);

    // 4. Aggregate by year with proper null handling
    const aggregateByYear = <T extends { academic_year_start: number }>(
      data: T[],
      valueSelector: (d: T) => number | null | undefined,
    ): { year: number; value: number; count: number }[] => {
      const byYear: Record<number, { sum: number; count: number }> = {};
      data.forEach((d) => {
        const year = d.academic_year_start;
        const value = valueSelector(d);
        if (value !== null && value !== undefined && !isNaN(value)) {
          if (!byYear[year]) byYear[year] = { sum: 0, count: 0 };
          byYear[year].sum += value;
          byYear[year].count += 1;
        }
      });
      return Object.entries(byYear)
        .map(([year, { sum, count }]) => ({
          year: parseInt(year),
          value: Math.round((sum / count) * 10) / 10,
          count,
        }))
        .sort((a, b) => a.year - b.year);
    };

    // KS2 Combined
    const ks2Combined = aggregateByYear(
      laKs2All.data || [],
      (d: any) => d.expected_standard_pct,
    );

    // KS2 by subject with progress scores
    const ks2Reading = aggregateByYear(
      laKs2Reading.data || [],
      (d: any) => d.expected_standard_pct,
    );
    const readingProgress = aggregateByYear(
      laKs2Reading.data || [],
      (d: any) => d.progress_measure_score,
    );

    const ks2Writing = aggregateByYear(
      laKs2Writing.data || [],
      (d: any) => d.expected_standard_pct,
    );
    const writingProgress = aggregateByYear(
      laKs2Writing.data || [],
      (d: any) => d.progress_measure_score,
    );

    const ks2Maths = aggregateByYear(
      laKs2Maths.data || [],
      (d: any) => d.expected_standard_pct,
    );
    const mathsProgress = aggregateByYear(
      laKs2Maths.data || [],
      (d: any) => d.progress_measure_score,
    );

    // Attendance
    const attendanceOverall = aggregateByYear(
      laAttendance.data || [],
      (d: any) => d.overall_attendance_pct,
    );
    const persistentAbsence = aggregateByYear(
      laAttendance.data || [],
      (d: any) => d.persistent_absence_pct,
    );

    // Disadvantaged gap calculation
    const disadvantagedGap: { year: number; all_pupils_pct: number; disadvantaged_pct: number; gap_pp: number }[] = [];
    const byYearAll = new Map<number, number[]>();
    const byYearFsm = new Map<number, number[]>();

    (laKs2Fsm.data || []).forEach((d: any) => {
      const year = d.academic_year_start;
      const val = d.expected_standard_pct;
      if (val !== null && val !== undefined && !isNaN(val)) {
        if (d.breakdown_topic === "All pupils") {
          if (!byYearAll.has(year)) byYearAll.set(year, []);
          byYearAll.get(year)!.push(val);
        } else if (
          d.breakdown_topic === "Disadvantaged status" &&
          String(d.breakdown || "").toLowerCase() === "disadvantaged"
        ) {
          if (!byYearFsm.has(year)) byYearFsm.set(year, []);
          byYearFsm.get(year)!.push(val);
        }
      }
    });

    // Calculate gap per year
    byYearAll.forEach((allVals, year) => {
      const fsmVals = byYearFsm.get(year) || [];
      if (fsmVals.length > 0) {
        const allAvg = allVals.reduce((a, b) => a + b, 0) / allVals.length;
        const fsmAvg = fsmVals.reduce((a, b) => a + b, 0) / fsmVals.length;
        disadvantagedGap.push({
          year,
          all_pupils_pct: Math.round(allAvg),
          disadvantaged_pct: Math.round(fsmAvg),
          gap_pp: Math.round(allAvg - fsmAvg),
        });
      }
    });

    // 3-year trend analysis
    let threeYearTrend: LaBenchmarkData["three_year_trend"] = null;
    const recentYears = ks2Combined.slice(-3);
    if (recentYears.length >= 2) {
      const ks2Avg = recentYears.reduce((sum, d) => sum + d.value, 0) / recentYears.length;
      const attRecent = attendanceOverall.slice(-3);
      const attAvg = attRecent.length > 0
        ? attRecent.reduce((sum, d) => sum + d.value, 0) / attRecent.length
        : 0;

      // Determine trend direction
      const oldestKs2 = recentYears[0]?.value || 0;
      const newestKs2 = recentYears[recentYears.length - 1]?.value || 0;
      let direction: "improving" | "stable" | "declining" = "stable";
      if (newestKs2 - oldestKs2 > 3) direction = "improving";
      else if (oldestKs2 - newestKs2 > 3) direction = "declining";

      threeYearTrend = {
        ks2_combined_avg: Math.round(ks2Avg),
        attendance_avg: Math.round(attAvg),
        direction,
      };
    }

    // Merge attainment and progress data by year
    const mergeWithProgress = (
      attainment: typeof ks2Reading,
      progress: typeof readingProgress,
    ) => {
      const progressMap = new Map(progress.map((p) => [p.year, p.value]));
      return attainment.map((a) => ({
        year: a.year,
        expected_standard_pct: Math.round(a.value),
        progress_score: progressMap.get(a.year) ?? null,
      }));
    };

    return {
      la_name: school.la_name,
      la_code: school.la_code,
      school_count: urns.length,
      ks2_combined: ks2Combined.map((d) => ({
        year: d.year,
        expected_standard_pct: Math.round(d.value),
      })),
      ks2_reading: mergeWithProgress(ks2Reading, readingProgress),
      ks2_writing: mergeWithProgress(ks2Writing, writingProgress),
      ks2_maths: mergeWithProgress(ks2Maths, mathsProgress),
      disadvantaged_gap: disadvantagedGap,
      attendance: attendanceOverall.map((d) => ({
        year: d.year,
        overall_pct: Math.round(d.value),
        persistent_absence_pct: 0,
      })),
      persistent_absence: persistentAbsence.map((d) => ({
        year: d.year,
        pct: Math.round(d.value * 10) / 10,
      })),
      three_year_trend: threeYearTrend,
    };
  }

  /**
   * Get demographic cohort for fair comparison
   * Groups schools with similar FSM%, EAL%, SEN% profiles
   */
  async getDemographicCohort(
    urn: number,
    yearsBack: number = 3,
  ): Promise<DemographicCohort | null> {
    // 1. Get this school's demographics
    const { data: schoolCensus } = await this.supabase
      .from("census")
      .select("fsm_pct, eal_pct, sen_pct, academic_year_start")
      .eq("urn", urn)
      .gte("academic_year_start", new Date().getFullYear() - yearsBack)
      .order("academic_year_start", { ascending: false })
      .limit(1)
      .single();

    if (!schoolCensus) return null;

    const fsm = schoolCensus.fsm_pct || 0;
    const eal = schoolCensus.eal_pct || 0;
    const sen = schoolCensus.sen_pct || 0;

    // Define demographic bands (based on national distribution)
    const fsmBand = fsm < 10 ? "Low (<10%)" : fsm < 20 ? "Medium (10-20%)" : fsm < 30 ? "High (20-30%)" : "Very High (30%+)";
    const ealBand = eal < 10 ? "Low (<10%)" : eal < 25 ? "Medium (10-25%)" : "High (25%+)";
    const senBand = sen < 10 ? "Low (<10%)" : sen < 20 ? "Medium (10-20%)" : "High (20%+)";

    // 2. Find schools with similar demographics
    const fsmMin = fsm - 10, fsmMax = fsm + 10;
    const ealMin = eal - 15, ealMax = eal + 15;

    const { data: cohortSchools } = await this.supabase
      .from("census")
      .select("urn, fsm_pct, eal_pct, sen_pct")
      .gte("fsm_pct", Math.max(0, fsmMin))
      .lte("fsm_pct", Math.min(100, fsmMax))
      .gte("eal_pct", Math.max(0, ealMin))
      .lte("eal_pct", Math.min(100, ealMax))
      .gte("academic_year_start", new Date().getFullYear() - yearsBack);

    if (!cohortSchools || cohortSchools.length < 3) return null; // Need at least 3 schools

    const cohortUrns = [...new Set(cohortSchools.map((c: any) => c.urn))];
    const minYear = new Date().getFullYear() - yearsBack - 1;

    // 3. Calculate cohort averages. Keep each KPI query scoped so one missing
    // subject or suppressed metric does not wipe out the rest of the dashboard.
    const [cohortKs2, cohortReading, cohortMaths, cohortFsm, cohortAtt] = await Promise.all([
      this.supabase
        .from("ks2_results")
        .select("expected_standard_pct")
        .in("urn", cohortUrns)
        .gte("academic_year_start", minYear)
        .eq("subject", "Reading, writing and maths")
        .eq("breakdown_topic", "All pupils")
        .limit(10000),

      this.supabase
        .from("ks2_results")
        .select("progress_measure_score")
        .in("urn", cohortUrns)
        .gte("academic_year_start", minYear)
        .eq("subject", "Reading")
        .eq("breakdown_topic", "All pupils")
        .limit(10000),

      this.supabase
        .from("ks2_results")
        .select("progress_measure_score")
        .in("urn", cohortUrns)
        .gte("academic_year_start", minYear)
        .in("subject", ["Maths", "Mathematics"])
        .eq("breakdown_topic", "All pupils")
        .limit(10000),

      this.supabase
        .from("ks2_results")
        .select("academic_year_start, expected_standard_pct, breakdown_topic, breakdown")
        .in("urn", cohortUrns)
        .gte("academic_year_start", minYear)
        .eq("subject", "Reading, writing and maths")
        .in("breakdown_topic", ["All pupils", "Disadvantaged status"])
        .limit(10000),

      this.supabase
        .from("attendance")
        .select("overall_attendance_pct, persistent_absence_pct")
        .in("urn", cohortUrns)
        .gte("academic_year_start", minYear)
        .limit(10000),
    ]);

    const validKs2Values = (cohortKs2.data || [])
      .map((d: any) => d.expected_standard_pct)
      .filter((value: unknown): value is number => typeof value === "number" && value >= 0 && value <= 100);
    const validAttendanceValues = (cohortAtt.data || [])
      .map((d: any) => d.overall_attendance_pct)
      .filter((value: unknown): value is number => typeof value === "number" && value >= 50 && value <= 100);
    const validPaValues = (cohortAtt.data || [])
      .map((d: any) => d.persistent_absence_pct)
      .filter((value: unknown): value is number => typeof value === "number" && value >= 0 && value <= 100);
    const validReadingProgress = (cohortReading.data || [])
      .map((d: any) => d.progress_measure_score)
      .filter((value: unknown): value is number => typeof value === "number" && Number.isFinite(value));
    const validMathsProgress = (cohortMaths.data || [])
      .map((d: any) => d.progress_measure_score)
      .filter((value: unknown): value is number => typeof value === "number" && Number.isFinite(value));

    const avgKs2 = validKs2Values.length > 0
      ? validKs2Values.reduce((sum: number, value: number) => sum + value, 0) / validKs2Values.length
      : 0;

    const avgAtt = validAttendanceValues.length > 0
      ? validAttendanceValues.reduce((sum: number, value: number) => sum + value, 0) / validAttendanceValues.length
      : 0;
    const avgPa = validPaValues.length > 0
      ? validPaValues.reduce((sum: number, value: number) => sum + value, 0) / validPaValues.length
      : null;
    const avgReadingProgress = validReadingProgress.length > 0
      ? validReadingProgress.reduce((sum: number, value: number) => sum + value, 0) / validReadingProgress.length
      : null;
    const avgMathsProgress = validMathsProgress.length > 0
      ? validMathsProgress.reduce((sum: number, value: number) => sum + value, 0) / validMathsProgress.length
      : null;

    const byYearAll = new Map<number, number[]>();
    const byYearDisadvantaged = new Map<number, number[]>();
    for (const row of cohortFsm.data || []) {
      const value = row.expected_standard_pct;
      if (typeof value !== "number" || !Number.isFinite(value)) continue;

      const target = row.breakdown_topic === "All pupils"
        ? byYearAll
        : String(row.breakdown || "").toLowerCase() === "disadvantaged"
          ? byYearDisadvantaged
          : null;
      if (!target) continue;

      const year = row.academic_year_start;
      if (!target.has(year)) target.set(year, []);
      target.get(year)!.push(value);
    }
    const cohortGaps: number[] = [];
    byYearAll.forEach((allValues, year) => {
      const disadvantagedValues = byYearDisadvantaged.get(year);
      if (!disadvantagedValues?.length) return;
      const allAvg = allValues.reduce((sum, value) => sum + value, 0) / allValues.length;
      const disadvantagedAvg = disadvantagedValues.reduce((sum, value) => sum + value, 0) / disadvantagedValues.length;
      cohortGaps.push(allAvg - disadvantagedAvg);
    });
    const avgGap = cohortGaps.length > 0
      ? cohortGaps.reduce((sum, value) => sum + value, 0) / cohortGaps.length
      : null;

    return {
      id: `cohort-${fsmBand}-${ealBand}-${senBand}`.replace(/\s+/g, "-").toLowerCase(),
      name: `Similar Schools (${fsmBand} FSM, ${ealBand} EAL)`,
      fsm_band: fsmBand,
      eal_band: ealBand,
      sen_band: senBand,
      school_count: cohortUrns.length,
      comparison_urns: cohortUrns,
      avg_ks2_combined: Math.round(avgKs2),
      avg_attendance: Math.round(avgAtt),
      avg_persistent_absence: avgPa === null ? null : Math.round(avgPa * 10) / 10,
      avg_disadvantaged_gap: avgGap === null ? null : Math.round(avgGap * 10) / 10,
      avg_reading_progress: avgReadingProgress === null ? null : Math.round(avgReadingProgress * 10) / 10,
      avg_maths_progress: avgMathsProgress === null ? null : Math.round(avgMathsProgress * 10) / 10,
    };
  }

  /**
   * Pull cross-module signals from HR, Estates, Compliance, Governance
   */
  async getCrossModuleSignals(
    organizationId: string,
  ): Promise<CrossModuleSignals> {
    const [
      estatesTasks,
      complianceItems,
      scrEntries,
      trainingCompletions,
      concerns,
    ] = await Promise.all([
      // Estates overdue/critical tasks
      this.supabase
        .from("estates_compliance_tasks")
        .select("id, compliance_domain, task_type, status, findings")
        .eq("organization_id", organizationId)
        .in("status", ["overdue", "pending"]),

      // Compliance policies
      this.supabase
        .from("compliance_items")
        .select("id, type, status")
        .eq("organization_id", organizationId)
        .eq("type", "policy"),

      // SCR gaps
      this.supabase
        .from("compliance_scr_entries")
        .select("id, status")
        .eq("organization_id", organizationId)
        .in("status", ["pending", "expired"]),

      // Training compliance
      this.supabase
        .from("compliance_training_completions")
        .select("id, expires_at")
        .eq("organization_id", organizationId),

      // Low level concerns (safeguarding signal)
      this.supabase
        .from("compliance_low_level_concerns")
        .select("id")
        .eq("organization_id", organizationId)
        .gte(
          "reported_at",
          new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        ),
    ]);

    const overdueTasks = (estatesTasks.data || []).filter(
      (t) => t.status === "overdue",
    );
    const criticalIssues = (estatesTasks.data || [])
      .filter(
        (t) => t.findings && JSON.stringify(t.findings).includes("critical"),
      )
      .map((t) => `${t.compliance_domain}: ${t.task_type}`);

    const totalPolicies = (complianceItems.data || []).length;
    const overduePolicies = (complianceItems.data || []).filter(
      (p) => p.status === "draft" || p.status === "expired",
    ).length;

    const now = new Date();
    const expiredTraining = (trainingCompletions.data || []).filter(
      (t) => t.expires_at && new Date(t.expires_at) < now,
    );
    const totalTraining = (trainingCompletions.data || []).length;
    const trainingRate =
      totalTraining > 0
        ? ((totalTraining - expiredTraining.length) / totalTraining) * 100
        : 100;

    return {
      staffAbsenceDays: 0, // Would come from HR module when built
      vacancies: 0,
      turnoverRate: 0,
      nqtCount: 0,
      estatesOverdueTasks: overdueTasks.length,
      criticalEstatesIssues: criticalIssues,
      buildingDisruptions: [],
      safeguardingConcerns: (concerns.data || []).length,
      overduePolicies,
      scrGaps: (scrEntries.data || []).length,
      trainingComplianceRate: Math.round(trainingRate),
      governorMeetings: 0, // Would come from governance module
      governorVacancies: 0,
      recentGovernorDecisions: [],
    };
  }

  /**
   * Match EEF strategies to identified gaps
   * This is the research-backed recommendation engine
   */
  matchEEFStrategies(
    gaps: { area: string; description: string; targetYearGroups: number[] }[],
  ): EEFRecommendation[] {
    const recommendations: EEFRecommendation[] = [];

    for (const gap of gaps) {
      // Find relevant EEF strategies by keyword matching
      const matched = getRelevantStrategies(gap.description);

      // Also search by area keywords
      const areaMatches = searchStrategies(gap.area);

      // Combine and deduplicate
      const allMatches = new Map<string, EEFStrategy>();
      [...matched, ...areaMatches].forEach((s) => allMatches.set(s.id, s));

      // Sort by impact (months progress) × evidence strength
      const sorted = Array.from(allMatches.values()).sort(
        (a, b) =>
          b.monthsProgress * b.evidenceStrength -
          a.monthsProgress * a.evidenceStrength,
      );

      // Take top 3 for each gap
      for (const strategy of sorted.slice(0, 3)) {
        const costLabel = ["Very Low", "Low", "Moderate", "High", "Very High"][
          strategy.costRating - 1
        ];
        const evidenceLabel = [
          "Very Limited",
          "Limited",
          "Moderate",
          "Extensive",
          "Very Extensive",
        ][strategy.evidenceStrength - 1];

        recommendations.push({
          strategy,
          rationale:
            `Based on the identified gap in ${gap.area}: "${gap.description}". ` +
            `${strategy.name} has ${evidenceLabel.toLowerCase()} evidence showing +${strategy.monthsProgress} months additional progress. ` +
            `${strategy.implementationTips[0] || ""}`,
          target_cohorts: gap.targetYearGroups,
          expected_impact: `+${strategy.monthsProgress} months additional progress`,
          implementation_priority:
            strategy.monthsProgress >= 5
              ? "high"
              : strategy.monthsProgress >= 3
                ? "medium"
                : "low",
          cost_benefit: `${costLabel} cost for +${strategy.monthsProgress} months progress (${evidenceLabel} evidence base)`,
          evidence_strength_note:
            `Evidence strength: ${strategy.evidenceStrength}/5. ` +
            `Based on ${strategy.evidenceStrength >= 4 ? "extensive meta-analyses and RCTs" : strategy.evidenceStrength >= 3 ? "moderate evidence from multiple studies" : "limited but promising evidence"}. ` +
            `Common mistakes to avoid: ${strategy.commonMistakes[0] || "None noted"}.`,
        });
      }
    }

    // Deduplicate strategies across gaps
    const seen = new Set<string>();
    return recommendations.filter((r) => {
      const key = `${r.strategy.id}-${r.target_cohorts.join(",")}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Run full intelligence analysis for a school
   * This is the main entry point — connects everything
   */
  async runFullAnalysis(
    organizationId: string,
    urn: number,
    options: {
      focusAreas?: string[];
      focusYearGroups?: number[];
      academicYear?: number;
    } = {},
  ): Promise<IntelligenceAnalysis> {
    const currentYear =
      options.academicYear ||
      new Date().getFullYear() - (new Date().getMonth() < 8 ? 1 : 0);

    // 1. Gather all data in parallel
    const [profile, trends, factors, outcomes, signals, laBenchmarks, demographicCohort] = await Promise.all([
      this.getSchoolProfile(urn),
      this.getDfETrends(urn, 5),
      this.getContextualFactors(organizationId),
      this.getCohortOutcomes(organizationId),
      this.getCrossModuleSignals(organizationId),
      this.getLaBenchmarks(urn, 5),
      this.getDemographicCohort(urn, 3),
    ]);

    // 2. Build the comprehensive analysis prompt
    const prompt = this.buildAnalysisPrompt(
      profile,
      trends,
      factors,
      outcomes,
      signals,
      currentYear,
      options,
      laBenchmarks,
      demographicCohort,
    );

    // 3. Send to AI for deep analysis
    const completion = await this.getOpenAI().chat.completions.create({
      model: "google/gemini-2.0-flash-001",
      messages: [
        {
          role: "system",
          content: `You are a school improvement expert with deep knowledge of:
- The Ofsted Education Inspection Framework (EIF) 2025
- DfE statutory data and what it reveals about school performance
- The EEF Teaching & Learning Toolkit (all 33 strategies with evidence ratings)
- UK education legislation (Children Act 2004, Equality Act 2010, SEND Code of Practice 2015, Keeping Children Safe in Education)
- How contextual factors (staff absence, curriculum changes, demographics) affect cohort outcomes

Your analysis must:
1. CROSS-REFERENCE data — don't just report numbers, explain WHY they are what they are
2. CORRELATE events with outcomes — if Year 3 teacher was sick for 6 months, what happened to that cohort's progress?
3. RECOMMEND specific EEF strategies backed by evidence strength ratings
4. DISTINGUISH between what the school can control and external factors
5. IDENTIFY both positive impacts ("new phonics scheme → +12% Y1 phonics pass") and negative ("teacher turnover → below expected progress in Y4")
6. Be SPECIFIC about which cohorts need which interventions
7. Consider VALUE-ADDED — a school with 45% FSM achieving national average is performing strongly

Return ONLY valid JSON matching this exact structure:
{
  "cohort_analyses": [
    {
      "year_group": 3,
      "academic_year": 2024,
      "narrative": "Year 3 experienced significant disruption...",
      "attainment_vs_national": "below",
      "progress_rating": "below expected",
      "contextual_factors": ["Long-term teacher absence Sept-Feb"],
      "intervention_impact": "Catch-up tutoring programme showed +3 months progress in spring term",
      "risk_level": "high"
    }
  ],
  "trend_insights": [
    {
      "metric": "KS2 Reading",
      "direction": "improving",
      "years_analysed": 3,
      "narrative": "Reading has improved by 8pp over 3 years following introduction of reciprocal reading...",
      "causal_factors": ["New reading scheme 2022", "Reading champion role created"],
      "national_comparison": "Now 4pp above national average"
    }
  ],
  "cross_module_alerts": [
    {
      "source_module": "compliance",
      "alert_type": "safeguarding_training_gap",
      "description": "3 staff members have expired safeguarding training",
      "affected_areas": ["Safeguarding", "Leadership & Governance"],
      "urgency": "high",
      "recommended_action": "Schedule Level 3 safeguarding refresher within 2 weeks"
    }
  ],
  "positive_impacts": [
    {
      "title": "Maths Mastery Programme Impact",
      "narrative": "Since adopting Singapore Maths in 2022, Year 4 cohort has shown...",
      "cohort_affected": "Year 4 (current)",
      "data_evidence": "+15pp at expected standard vs previous cohort at same point",
      "eef_link": "Mastery Learning (+5 months, evidence strength 4/5)"
    }
  ],
  "negative_impacts": [
    {
      "title": "Year 3 Teacher Absence Impact",
      "narrative": "Long-term absence of experienced class teacher...",
      "cohort_affected": "Year 3 (current)",
      "data_evidence": "Reading progress -0.8 vs school average of +0.3",
      "eef_link": null
    }
  ],
  "identified_gaps": [
    {
      "area": "reading progress Year 3",
      "description": "Below expected progress in reading for Year 3 following teacher absence, need targeted catch-up",
      "target_year_groups": [3]
    }
  ],
  "suggested_actions": [
    {
      "title": "Implement targeted reading intervention for Year 3",
      "description": "Deploy 1:1 reading tutoring 3x weekly using EEF-recommended Reading Comprehension Strategies...",
      "priority": "high",
      "ofsted_area": "Achievement",
      "target_year_groups": [3],
      "eef_strategy_id": "reading-comprehension",
      "sef_impact": "Addresses AFD in Quality of Education: below expected reading progress in Year 3",
      "legislation_reference": "Schools must ensure all pupils make expected progress (Education Act 2002 s78)",
      "deadline_suggestion": "Start within 2 weeks, review after 6 weeks"
    }
  ]
}`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 6000,
      response_format: { type: "json_object" },
    });

    const responseText = completion.choices[0]?.message?.content || "{}";
    let aiAnalysis;
    try {
      aiAnalysis = JSON.parse(responseText);
    } catch {
      console.error(
        "[Intelligence] Failed to parse AI response:",
        responseText.substring(0, 500),
      );
      aiAnalysis = {
        cohort_analyses: [],
        trend_insights: [],
        cross_module_alerts: [],
        positive_impacts: [],
        negative_impacts: [],
        identified_gaps: [],
        suggested_actions: [],
      };
    }

    // 4. Match EEF strategies to identified gaps
    const gaps = (aiAnalysis.identified_gaps || []).map(
      (g: {
        area: string;
        description: string;
        target_year_groups: number[];
      }) => ({
        area: g.area,
        description: g.description,
        targetYearGroups: g.target_year_groups || [],
      }),
    );

    const eefRecommendations = this.matchEEFStrategies(gaps);

    // 5. Enrich AI actions with EEF data
    const enrichedActions: SuggestedAction[] = (
      aiAnalysis.suggested_actions || []
    ).map((a: SuggestedAction) => {
      // If AI suggested an EEF strategy, enrich with full data
      if (a.eef_strategy_id) {
        const strategy = eefStrategies.find((s) => s.id === a.eef_strategy_id);
        if (strategy) {
          a.description +=
            `\n\nEEF Evidence: +${strategy.monthsProgress} months progress, ` +
            `evidence strength ${strategy.evidenceStrength}/5, ` +
            `cost rating ${strategy.costRating}/5. ` +
            `Implementation tips: ${strategy.implementationTips.slice(0, 2).join("; ")}. ` +
            `Avoid: ${strategy.commonMistakes[0] || "N/A"}.`;
        }
      }
      return a;
    });

    // 6. Generate executive summary
    const positiveCount = (aiAnalysis.positive_impacts || []).length;
    const negativeCount = (aiAnalysis.negative_impacts || []).length;
    const highRiskCohorts = (aiAnalysis.cohort_analyses || [])
      .filter((c: CohortAnalysis) => c.risk_level === "high")
      .map((c: CohortAnalysis) => `Year ${c.year_group}`);
    const criticalActions = enrichedActions.filter(
      (a) => a.priority === "critical" || a.priority === "high",
    );

    const summary = [
      `Analysis of ${profile?.name || "school"} (URN: ${urn}) for ${currentYear}/${currentYear + 1}.`,
      trends.ks2.length > 0
        ? `KS2 data available for ${new Set(trends.ks2.map((k) => k.year)).size} years.`
        : "No KS2 outcome data available in DfE warehouse.",
      trends.attendance.length > 0
        ? `Attendance trend: ${trends.attendance[trends.attendance.length - 1]?.overall_pct}% (latest).`
        : "",
      factors.length > 0
        ? `${factors.length} contextual factors logged (${factors.filter((f) => f.impact_direction === "positive").length} positive, ${factors.filter((f) => f.impact_direction === "negative").length} negative).`
        : "No contextual factors logged yet — add events to enable impact analysis.",
      positiveCount > 0
        ? `${positiveCount} positive impact${positiveCount > 1 ? "s" : ""} identified.`
        : "",
      negativeCount > 0
        ? `${negativeCount} area${negativeCount > 1 ? "s" : ""} of concern identified.`
        : "",
      highRiskCohorts.length > 0
        ? `High-risk cohorts: ${highRiskCohorts.join(", ")}.`
        : "",
      criticalActions.length > 0
        ? `${criticalActions.length} high-priority action${criticalActions.length > 1 ? "s" : ""} recommended.`
        : "",
      eefRecommendations.length > 0
        ? `${eefRecommendations.length} EEF research-backed strategies recommended.`
        : "",
    ]
      .filter(Boolean)
      .join(" ");

    const dataSources = [
      "schools (GIAS)",
      ...(trends.attendance.length > 0 ? ["attendance (DfE)"] : []),
      ...(trends.census.length > 0 ? ["census (DfE)"] : []),
      ...(trends.ks2.length > 0 ? ["ks2_results (DfE)"] : []),
      ...(trends.workforce.length > 0 ? ["workforce (DfE)"] : []),
      ...(trends.exclusions.length > 0 ? ["exclusions (DfE)"] : []),
      ...(factors.length > 0 ? ["school_contextual_factors"] : []),
      ...(outcomes.length > 0 ? ["school_cohort_outcomes"] : []),
      "estates_compliance_tasks",
      "compliance_items",
      "eef_toolkit (33 strategies)",
    ];

    const result: IntelligenceAnalysis = {
      title: `School Intelligence Analysis — ${profile?.name || urn}`,
      executive_summary: summary,
      la_benchmarks: laBenchmarks,
      detailed_analysis: {
        cohort_analyses: aiAnalysis.cohort_analyses || [],
        trend_insights: aiAnalysis.trend_insights || [],
        cross_module_alerts: aiAnalysis.cross_module_alerts || [],
        positive_impacts: aiAnalysis.positive_impacts || [],
        negative_impacts: aiAnalysis.negative_impacts || [],
      },
      eef_recommendations: eefRecommendations,
      suggested_actions: enrichedActions,
      data_sources_used: dataSources,
      confidence_score: this.calculateConfidence(trends, factors, outcomes),
    };

    // 7. Store the analysis
    await this.storeAnalysis(organizationId, result, currentYear);

    return result;
  }

  /**
   * Build the comprehensive prompt with ALL data cross-referenced
   */
  private buildAnalysisPrompt(
    profile: SchoolProfile | null,
    trends: DfETrendData,
    factors: ContextualFactor[],
    outcomes: CohortOutcome[],
    signals: CrossModuleSignals,
    currentYear: number,
    options: { focusAreas?: string[]; focusYearGroups?: number[] },
    laBenchmarks: LaBenchmarkData | null,
    demographicCohort: DemographicCohort | null,
  ): string {
    const sections: string[] = [];

    // School context
    sections.push(`=== SCHOOL PROFILE ===
${
  profile
    ? `
School: ${profile.name} (URN: ${profile.urn})
Phase: ${profile.phase} | Type: ${profile.type}
LA: ${profile.la_name}${profile.trust_name ? ` | Trust: ${profile.trust_name}` : ""}
Pupils: ${profile.pupil_count} (capacity ${profile.capacity}) | FSM: ${profile.fsm_pct}%
Headteacher: ${profile.head_name}
Last Ofsted: ${profile.last_inspection_date || "Unknown"}
`
    : "School profile not available in GIAS database."
}`);

    // DfE Attendance trends
    if (trends.attendance.length > 0) {
      sections.push(`=== ATTENDANCE DATA (DfE) ===
${trends.attendance
  .map(
    (a) =>
      `${a.year}/${a.year + 1}: Overall ${a.overall_pct}% | Persistent absence ${a.persistent_absence_pct}% | Illness ${a.illness_pct}%`,
  )
  .join("\n")}
National average: ~94.5% (primary), ~91.5% (secondary)`);
    }

    // Census demographics
    if (trends.census.length > 0) {
      sections.push(`=== DEMOGRAPHICS (DfE Census) ===
${trends.census
  .map(
    (c) =>
      `${c.year}/${c.year + 1}: Roll ${c.number_on_roll} | FSM ${c.fsm_pct}% | EAL ${c.eal_pct}% | SEN ${c.sen_pct}% | Mobility ${c.mobility_pct}%`,
  )
  .join("\n")}
IMPORTANT: High FSM% means value-added analysis matters more than raw attainment.`);
    }

    // KS2 Results
    if (trends.ks2.length > 0) {
      const byYear = new Map<number, typeof trends.ks2>();
      trends.ks2.forEach((k) => {
        if (!byYear.has(k.year)) byYear.set(k.year, []);
        byYear.get(k.year)!.push(k);
      });

      const ks2Lines: string[] = [];
      byYear.forEach((results, year) => {
        ks2Lines.push(`\n${year}/${year + 1}:`);
        results.forEach((r) => {
          ks2Lines.push(
            `  ${r.subject}: Expected ${r.expected_standard_pct}% | Higher ${r.higher_standard_pct}% | Progress ${r.progress_measure_score} (${r.progress_description})`,
          );
        });
      });

      sections.push(`=== KS2 RESULTS (DfE) ===
${ks2Lines.join("\n")}
National combined expected standard: ~60%. Progress score of 0 = national average.`);
    }

    // Workforce data
    if (trends.workforce.length > 0) {
      sections.push(`=== WORKFORCE (DfE) ===
${trends.workforce
  .map(
    (w) =>
      `${w.year}/${w.year + 1}: Teachers ${w.fte_teachers} FTE | TAs ${w.fte_tas} FTE | PTR ${w.pupil_teacher_ratio} | Vacancies ${w.vacancy_rate}% | QTS ${w.qts_pct}%`,
  )
  .join("\n")}
Look for: Rising vacancy rate, declining teacher numbers, high PTR.`);
    }

    // Exclusions
    if (trends.exclusions.length > 0) {
      sections.push(`=== EXCLUSIONS (DfE) ===
${trends.exclusions.map((e) => `${e.year}/${e.year + 1}: ${e.total} exclusions`).join("\n")}`);
    }

    // Contextual factors — THE KEY DIFFERENTIATOR
    if (factors.length > 0) {
      sections.push(`=== CONTEXTUAL FACTORS (School-entered) ===
These are events the school has logged that may explain data patterns.
Cross-reference these with outcome data to assess impact.

${factors
  .map((f) => {
    const yearGroups = f.whole_school
      ? "Whole school"
      : `Year${f.affected_year_groups.length > 1 ? "s" : ""} ${f.affected_year_groups.join(", ")}`;
    const duration = f.end_date
      ? `${f.start_date} to ${f.end_date}`
      : `${f.start_date} (ongoing)`;
    const impact = f.measured_outcome
      ? `\n  MEASURED OUTCOME: ${f.measured_outcome} (impact score: ${f.measured_impact_score})`
      : "";
    const eef = f.eef_strategy_id
      ? `\n  EEF Strategy: ${f.eef_strategy_id} (expected +${(f as any).eef_expected_months_progress} months)`
      : "";
    return `• [${f.factor_type.toUpperCase()}] ${f.title}
  Affects: ${yearGroups} | Period: ${duration}
  ${f.description || ""}
  Rationale: ${f.rationale || "Not provided"}
  Expected impact: ${(f as any).expected_impact || "Not specified"} (${f.impact_direction || "unknown"} direction, ${f.impact_severity || "unknown"} severity)${impact}${eef}`;
  })
  .join("\n\n")}`);
    } else {
      sections.push(`=== CONTEXTUAL FACTORS ===
No contextual factors have been logged yet. The school should add events like:
- Staff changes (long-term absence, new appointments, NQTs)
- Curriculum changes (new teaching schemes with rationale)
- Disruptions (building work, COVID impact on specific cohorts)
- Interventions (catch-up programmes, tutoring, summer schools)
This enables impact analysis and helps explain data patterns.`);
    }

    // Internal cohort outcomes
    if (outcomes.length > 0) {
      sections.push(`=== INTERNAL COHORT OUTCOMES ===
${outcomes
  .map(
    (o) =>
      `Y${o.year_group} ${o.academic_year_start}/${o.academic_year_start + 1} (${o.assessment_period}): ` +
      `R:${o.reading_expected_pct ?? "?"}% W:${o.writing_expected_pct ?? "?"}% M:${o.maths_expected_pct ?? "?"}% ` +
      `Combined:${o.combined_expected_pct ?? "?"}% ` +
      `Attendance:${o.attendance_pct ?? "?"}%`,
  )
  .join("\n")}`);
    }

    // Cross-module signals
    sections.push(`=== CROSS-MODULE SIGNALS ===
Estates: ${signals.estatesOverdueTasks} overdue tasks${signals.criticalEstatesIssues.length > 0 ? ` | CRITICAL: ${signals.criticalEstatesIssues.join(", ")}` : ""}
Compliance: ${signals.overduePolicies} overdue policies | SCR gaps: ${signals.scrGaps} | Training compliance: ${signals.trainingComplianceRate}%
Safeguarding: ${signals.safeguardingConcerns} low-level concerns logged (12 months)
${signals.buildingDisruptions.length > 0 ? `Building disruptions: ${signals.buildingDisruptions.join(", ")}` : ""}`);

    // EEF Toolkit reference
    const highImpact = getHighImpactStrategies();
    sections.push(`=== EEF TOOLKIT REFERENCE ===
Top 5 high-impact, low-cost strategies available:
${highImpact
  .slice(0, 5)
  .map(
    (s) =>
      `• ${s.name}: +${s.monthsProgress} months, cost ${s.costRating}/5, evidence ${s.evidenceStrength}/5`,
  )
  .join("\n")}

When recommending strategies, use the exact strategy ID from: ${eefStrategies.map((s) => s.id).join(", ")}`);

    // Focus instruction
    if (options.focusAreas?.length || options.focusYearGroups?.length) {
      sections.push(`=== FOCUS ===
${options.focusAreas?.length ? `Focus areas: ${options.focusAreas.join(", ")}` : ""}
${options.focusYearGroups?.length ? `Focus year groups: ${options.focusYearGroups.map((y) => `Year ${y}`).join(", ")}` : ""}`);
    }

    sections.push(`=== ANALYSIS INSTRUCTIONS ===
1. Cross-reference contextual factors with DfE data — explain causation, not just correlation
2. For each cohort, trace their journey through year groups and identify what events impacted them
3. Where COVID affected specific cohorts (e.g. Year 6 2024 were in Year 2 during first lockdown), calculate which learning stages were disrupted
4. For curriculum changes, assess whether the rationale was sound and whether outcomes improved
5. Recommend specific EEF strategies with strategy IDs for each identified gap
6. For every negative impact, suggest a research-backed intervention to address it
7. Consider value-added: contextualise raw attainment against FSM%, SEN%, EAL%
8. Flag any cross-module alerts (expired training, overdue compliance, estates issues affecting learning)
9. Each action must include SEF impact (which SEF section it addresses) and legislation reference where applicable`);

    return sections.join("\n\n");
  }

  /**
   * Calculate confidence score based on data completeness
   */
  private calculateConfidence(
    trends: DfETrendData,
    factors: ContextualFactor[],
    outcomes: CohortOutcome[],
  ): number {
    let score = 0.3; // Base confidence

    // More DfE data = higher confidence
    if (trends.attendance.length >= 3) score += 0.1;
    if (trends.ks2.length >= 5) score += 0.15;
    if (trends.census.length >= 3) score += 0.05;
    if (trends.workforce.length >= 3) score += 0.05;

    // Contextual factors are critical for explaining data
    if (factors.length >= 3) score += 0.1;
    if (factors.length >= 8) score += 0.05;

    // Internal outcomes give us in-year tracking
    if (outcomes.length >= 5) score += 0.1;
    if (outcomes.length >= 15) score += 0.05;

    // Measured impacts mean the school is tracking what matters
    const measuredImpacts = factors.filter((f) => f.measured_outcome);
    if (measuredImpacts.length >= 2) score += 0.05;

    return Math.min(score, 0.95);
  }

  /**
   * Store analysis in database
   */
  private async storeAnalysis(
    organizationId: string,
    analysis: IntelligenceAnalysis,
    academicYear: number,
  ): Promise<void> {
    try {
      await this.supabase.from("school_intelligence_analyses").insert({
        organization_id: organizationId,
        analysis_type: "cohort_impact",
        target_academic_years: [academicYear],
        title: analysis.title,
        executive_summary: analysis.executive_summary,
        detailed_analysis: analysis.detailed_analysis,
        eef_strategies_recommended: analysis.eef_recommendations.map((r) => ({
          strategy_id: r.strategy.id,
          strategy_name: r.strategy.name,
          months_progress: r.strategy.monthsProgress,
          evidence_strength: r.strategy.evidenceStrength,
          rationale: r.rationale,
          target_cohorts: r.target_cohorts,
          cost_benefit: r.cost_benefit,
        })),
        suggested_actions: analysis.suggested_actions,
        data_sources_used: analysis.data_sources_used,
        confidence_score: analysis.confidence_score,
        urgency: analysis.suggested_actions.some(
          (a) => a.priority === "critical",
        )
          ? "critical"
          : analysis.suggested_actions.some((a) => a.priority === "high")
            ? "high"
            : "medium",
        status: "generated",
      });
    } catch (error) {
      console.error("[Intelligence] Failed to store analysis:", error);
    }
  }

  /**
   * Build inspection context for the AI inspector
   * Called by /api/ofsted/inspect to enrich inspection prompts
   */
  async buildInspectionContext(
    organizationId: string,
    urn: number,
  ): Promise<string> {
    const [profile, trends, factors, signals] = await Promise.all([
      this.getSchoolProfile(urn),
      this.getDfETrends(urn, 3),
      this.getContextualFactors(organizationId),
      this.getCrossModuleSignals(organizationId),
    ]);

    const lines: string[] = [];

    if (profile) {
      lines.push(
        `School: ${profile.name} | ${profile.phase} | ${profile.type}`,
      );
      lines.push(
        `Pupils: ${profile.pupil_count} | FSM: ${profile.fsm_pct}% | Head: ${profile.head_name}`,
      );
      if (profile.last_inspection_date)
        lines.push(`Last Ofsted: ${profile.last_inspection_date}`);
    }

    // Latest census data for context
    if (trends.census.length > 0) {
      const latest = trends.census[trends.census.length - 1];
      lines.push(
        `\nDemographics (${latest.year}/${latest.year + 1}): SEN ${latest.sen_pct}% | EAL ${latest.eal_pct}% | FSM ${latest.fsm_pct}% | Mobility ${latest.mobility_pct}%`,
      );
    }

    // Latest attendance
    if (trends.attendance.length > 0) {
      const latest = trends.attendance[trends.attendance.length - 1];
      lines.push(
        `Attendance (${latest.year}/${latest.year + 1}): ${latest.overall_pct}% | PA: ${latest.persistent_absence_pct}%`,
      );
    }

    // Latest KS2
    const latestKs2Year =
      trends.ks2.length > 0 ? Math.max(...trends.ks2.map((k) => k.year)) : null;
    if (latestKs2Year) {
      const latestResults = trends.ks2.filter((k) => k.year === latestKs2Year);
      lines.push(`\nKS2 (${latestKs2Year}/${latestKs2Year + 1}):`);
      latestResults.forEach((r) => {
        lines.push(
          `  ${r.subject}: ${r.expected_standard_pct}% exp | Progress ${r.progress_measure_score}`,
        );
      });
    }

    // Workforce
    if (trends.workforce.length > 0) {
      const latest = trends.workforce[trends.workforce.length - 1];
      lines.push(
        `\nWorkforce: ${latest.fte_teachers} teachers | PTR ${latest.pupil_teacher_ratio} | Vacancies ${latest.vacancy_rate}% | QTS ${latest.qts_pct}%`,
      );
    }

    // Active contextual factors
    const activeFactors = factors.filter(
      (f) => !f.end_date || new Date(f.end_date) > new Date(),
    );
    if (activeFactors.length > 0) {
      lines.push(`\nActive contextual factors:`);
      activeFactors.forEach((f) => {
        lines.push(
          `  • [${f.factor_type}] ${f.title} — ${f.whole_school ? "whole school" : `Y${f.affected_year_groups.join(",")}`}`,
        );
      });
    }

    // Cross-module alerts
    if (
      signals.estatesOverdueTasks > 0 ||
      signals.scrGaps > 0 ||
      signals.safeguardingConcerns > 0
    ) {
      lines.push(`\nCross-module alerts:`);
      if (signals.estatesOverdueTasks > 0)
        lines.push(`  ⚠ ${signals.estatesOverdueTasks} overdue estates tasks`);
      if (signals.scrGaps > 0) lines.push(`  ⚠ ${signals.scrGaps} SCR gaps`);
      if (signals.safeguardingConcerns > 0)
        lines.push(
          `  ⚠ ${signals.safeguardingConcerns} low-level concerns (12 months)`,
        );
      if (signals.trainingComplianceRate < 90)
        lines.push(
          `  ⚠ Training compliance: ${signals.trainingComplianceRate}%`,
        );
    }

    return lines.join("\n");
  }

  /**
   * Build a cohort journey — trace the SAME group of children across years.
   *
   * A child in Year 6 in 2024 was in Year 2 in 2020 (first COVID lockdown).
   * cohort_reception_year = academic_year - year_group
   *
   * This lets us:
   * - Track how a cohort's attainment changed year-on-year
   * - Correlate contextual factors (COVID, teacher absence) with the right cohort
   * - Predict which cohorts need intervention based on trajectory
   */
  async buildCohortJourney(
    urn: number,
    organizationId: string,
    currentYearGroup: number,
  ): Promise<{
    cohortLabel: string;
    receptionYear: number;
    journey: {
      academicYear: number;
      yearGroup: number;
      ks2Data?: {
        subject: string;
        expectedPct: number;
        progressScore: number;
      }[];
      attendancePct?: number;
      persistentAbsencePct?: number;
      contextualFactors: string[];
      internalOutcome?: { reading?: number; writing?: number; maths?: number };
    }[];
    covidImpact: string | null;
  }> {
    const currentAcademicYear =
      new Date().getFullYear() - (new Date().getMonth() < 8 ? 1 : 0);
    const receptionYear = currentAcademicYear - currentYearGroup;
    const cohortLabel = `Year ${currentYearGroup} (${currentAcademicYear}/${currentAcademicYear + 1})`;

    // Build the journey year by year
    const journey = [];

    for (let yg = 0; yg <= currentYearGroup; yg++) {
      const academicYear = receptionYear + yg;

      // KS2 data only exists for Year 6
      let ks2Data;
      if (yg === 6) {
        const { data } = await this.supabase
          .from("ks2_results")
          .select("subject, expected_standard_pct, progress_measure_score")
          .eq("urn", urn)
          .eq("academic_year_start", academicYear)
          .eq("breakdown_topic", "All pupils");

        if (data && data.length > 0) {
          ks2Data = data.map((r) => ({
            subject: r.subject,
            expectedPct: r.expected_standard_pct,
            progressScore: r.progress_measure_score,
          }));
        }
      }

      // Attendance for the school that year
      const { data: attData } = await this.supabase
        .from("attendance")
        .select("overall_attendance_pct, persistent_absence_pct")
        .eq("urn", urn)
        .eq("academic_year_start", academicYear)
        .limit(1)
        .single();

      // Contextual factors affecting this year group in this year
      const { data: factors } = await this.supabase
        .from("school_contextual_factors")
        .select("title, factor_type")
        .eq("organization_id", organizationId)
        .eq("academic_year_start", academicYear)
        .or(`whole_school.eq.true,affected_year_groups.cs.{${yg}}`);

      // Internal outcomes
      const { data: outcomes } = await this.supabase
        .from("school_cohort_outcomes")
        .select(
          "reading_expected_pct, writing_expected_pct, maths_expected_pct",
        )
        .eq("organization_id", organizationId)
        .eq("year_group", yg)
        .eq("academic_year_start", academicYear)
        .eq("assessment_period", "eoy")
        .limit(1)
        .single();

      journey.push({
        academicYear,
        yearGroup: yg,
        ks2Data,
        attendancePct: attData?.overall_attendance_pct || undefined,
        persistentAbsencePct: attData?.persistent_absence_pct || undefined,
        contextualFactors: (factors || []).map(
          (f) => `[${f.factor_type}] ${f.title}`,
        ),
        internalOutcome: outcomes
          ? {
              reading: outcomes.reading_expected_pct,
              writing: outcomes.writing_expected_pct,
              maths: outcomes.maths_expected_pct,
            }
          : undefined,
      });
    }

    // Determine COVID impact
    let covidImpact: string | null = null;
    // First lockdown: March 2020 (academic year 2019/20)
    // Second lockdown: Jan-March 2021 (academic year 2020/21)
    const yearInFirstLockdown = 2019 - receptionYear; // What year group in 2019/20
    const yearInSecondLockdown = 2020 - receptionYear;

    if (yearInFirstLockdown >= 0 && yearInFirstLockdown <= 13) {
      const stage =
        yearInFirstLockdown === 0
          ? "Reception (critical early learning disrupted)"
          : yearInFirstLockdown === 1
            ? "Year 1 (phonics screening year — many missed it)"
            : yearInFirstLockdown === 2
              ? "Year 2 (KS1 SATs year — assessments cancelled)"
              : yearInFirstLockdown <= 4
                ? `Year ${yearInFirstLockdown} (key fluency-building years disrupted)`
                : yearInFirstLockdown === 5
                  ? "Year 5 (pre-SATs preparation disrupted)"
                  : yearInFirstLockdown === 6
                    ? "Year 6 (SATs cancelled — no statutory data for this cohort)"
                    : `Year ${yearInFirstLockdown}`;

      covidImpact = `This cohort was in ${stage} during the first national lockdown (March 2020). `;
      if (yearInSecondLockdown >= 0 && yearInSecondLockdown <= 13) {
        covidImpact += `They were in Year ${yearInSecondLockdown} during the January 2021 lockdown. `;
      }
      covidImpact += `Total estimated lost learning: ${yearInFirstLockdown <= 2 ? "significant (early years foundation disrupted)" : "moderate (catch-up programmes should have mitigated)"}. `;
      covidImpact += `Any below-expected attainment should be contextualised against this disruption.`;
    }

    return {
      cohortLabel,
      receptionYear,
      journey,
      covidImpact,
    };
  }
}

// Singleton instance
let _engine: SchoolIntelligenceEngine | null = null;

export function getIntelligenceEngine(): SchoolIntelligenceEngine {
  if (!_engine) {
    _engine = new SchoolIntelligenceEngine();
  }
  return _engine;
}
