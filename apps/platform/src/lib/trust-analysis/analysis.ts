/**
 * Trust Analysis — Core Analysis Functions
 * Pennine Learning Trust, Bradford
 *
 * Compares self-reported mid-year attainment data against validated DfE KS2 results,
 * detects data quality issues, calculates disadvantage gaps, and builds heatmap/census
 * trend data for trust-wide review.
 */

import {
  SchoolSelfReport,
  KS2Result,
  CensusRecord,
  DivergenceFlag,
  DataQualityFlag,
  DisadvantageGap,
  RAGStatus,
  YearGroup,
  SubjectScores,
  PENNINE_SCHOOLS,
  getSchoolByAbbrev,
} from './types';

// ─── Subject Mapping ────────────────────────────────────────────────────────
// Maps self-report subject keys to KS2 result subject strings and SubjectScores keys.

interface SubjectMapping {
  selfKey: keyof SubjectScores;
  ks2Subject: string;
  label: string;
}

const SUBJECT_MAPPINGS: SubjectMapping[] = [
  { selfKey: 'reading',  ks2Subject: 'Reading',                    label: 'Reading' },
  { selfKey: 'writing',  ks2Subject: 'Writing',                    label: 'Writing' },
  { selfKey: 'maths',    ks2Subject: 'Maths',                      label: 'Maths' },
  { selfKey: 'combined', ks2Subject: 'Reading, writing and maths', label: 'Combined' },
];

// ─── RAG Helpers ─────────────────────────────────────────────────────────────

function divergenceRAG(absDivergencePp: number): RAGStatus {
  if (absDivergencePp >= 20) return 'red';
  if (absDivergencePp >= 10) return 'amber';
  return 'green';
}

function attainmentRAG(value: number | null): RAGStatus {
  if (value === null) return 'red';
  if (value >= 70) return 'green';
  if (value >= 50) return 'amber';
  return 'red';
}

// ─── 1. calculateDivergences ─────────────────────────────────────────────────

/**
 * Compares Y6 self-reported mid-year attainment percentages against validated 2025
 * SATs results from the DfE KS2 dataset.
 *
 * A positive divergence (self > validated) suggests over-reporting;
 * a negative divergence suggests under-reporting or data entry errors.
 *
 * @param selfReports  Mid-year self-reported attainment from each school
 * @param ks2Results   DfE KS2 results for all Pennine schools
 * @returns            Array of divergence flags, one per school per subject
 */
export function calculateDivergences(
  selfReports: SchoolSelfReport[],
  ks2Results: KS2Result[],
): DivergenceFlag[] {
  const flags: DivergenceFlag[] = [];

  for (const report of selfReports) {
    // Only compare against Y6 — the cohort for which SATs data exists
    const y6Data = report.yearGroups.find(yg => yg.yearGroup === 'Y6');
    if (!y6Data) continue;

    const school = getSchoolByAbbrev(report.school);
    if (!school) continue;

    // Retrieve the validated KS2 results for this school's 2025 SATs cohort,
    // restricted to the all-pupils breakdown to match self-reported totals.
    const schoolKs2 = ks2Results.filter(
      r =>
        r.urn === school.urn &&
        r.academicYearEnd === 2025 &&
        r.breakdownTopic === 'All pupils',
    );

    for (const mapping of SUBJECT_MAPPINGS) {
      const selfPct = y6Data.allPupils[mapping.selfKey];
      if (selfPct === null) continue; // Cannot compare if self-report is absent

      // Find the matching KS2 row for this subject
      const ks2Row = schoolKs2.find(r => r.subject === mapping.ks2Subject);
      const validatedPct = ks2Row?.expectedStandardPct ?? null;
      if (validatedPct === null) continue; // No validated data to compare against

      const divergencePp = selfPct - validatedPct;
      const absDiv = Math.abs(divergencePp);
      const rag = divergenceRAG(absDiv);

      // Build a narrative that matches the tone of an Ofsted dashboard briefing.
      // Large divergences warrant explicit questioning framing.
      let narrative: string;
      const direction = divergencePp > 0 ? 'above' : 'below';
      const absFormatted = absDiv.toFixed(1);

      if (rag === 'red') {
        narrative =
          `${school.name}'s self-reported ${mapping.label} (${selfPct}%) is ` +
          `${absFormatted} percentage points ${direction} the validated 2025 SATs result ` +
          `(${validatedPct}%). This is a substantial divergence. Ofsted would likely ask: ` +
          `"How accurate is your in-year assessment picture, and what does the gap between ` +
          `your predicted and actual outcomes tell you about the reliability of your ` +
          `self-evaluation?"`;
      } else if (rag === 'amber') {
        narrative =
          `${school.name}'s self-reported ${mapping.label} (${selfPct}%) is ` +
          `${absFormatted} percentage points ${direction} the validated 2025 SATs result ` +
          `(${validatedPct}%). This moderate divergence warrants review — leaders should ` +
          `be able to explain whether this reflects genuine mid-year progress, assessment ` +
          `methodology differences, or a calibration issue.`;
      } else {
        narrative =
          `${school.name}'s self-reported ${mapping.label} (${selfPct}%) closely matches ` +
          `the validated 2025 SATs result (${validatedPct}%), with a divergence of ` +
          `${absFormatted} percentage points. This indicates good assessment calibration.`;
      }

      flags.push({
        school: report.school,
        subject: mapping.label,
        selfReportedPct: selfPct,
        validatedPct,
        divergencePp,
        rag,
        narrative,
      });
    }
  }

  return flags;
}

// ─── 2. detectDataQualityIssues ──────────────────────────────────────────────

/**
 * Scans self-reported data for completeness and plausibility issues.
 *
 * Flags are categorised as:
 *   - error:   Missing data that is required for statutory/inspection purposes
 *   - warning: Data that may indicate an anomaly or is worth querying
 *
 * @param selfReports  Mid-year self-reported attainment from each school
 * @returns            Array of data quality flags with school, year group, and severity
 */
export function detectDataQualityIssues(
  selfReports: SchoolSelfReport[],
): DataQualityFlag[] {
  const flags: DataQualityFlag[] = [];

  for (const report of selfReports) {
    const { school, yearGroups } = report;

    // ── EYFS: check GLD is present ────────────────────────────────────────
    const eyfsData = yearGroups.find(yg => yg.yearGroup === 'EYFS');
    if (!eyfsData) {
      flags.push({
        school,
        yearGroup: 'EYFS',
        issue: 'EYFS data is entirely absent. Good Level of Development (GLD) is a statutory headline measure.',
        severity: 'error',
      });
    } else if (eyfsData.gld === null || eyfsData.gld === undefined) {
      flags.push({
        school,
        yearGroup: 'EYFS',
        issue: 'GLD percentage is missing for EYFS. This is a statutory measure and must be reported.',
        severity: 'error',
      });
    }

    for (const ygData of yearGroups) {
      const { yearGroup, cohortSize, allPupils, gd, phonics, mtc } = ygData;

      // ── Small cohort warning ──────────────────────────────────────────
      if (cohortSize < 15 && yearGroup !== 'EYFS') {
        // Calculate what 1 pupil represents as a percentage of this cohort
        const perPupilPct = cohortSize > 0 ? (1 / cohortSize * 100).toFixed(1) : 'N/A';
        flags.push({
          school,
          yearGroup,
          issue:
            `Cohort size is ${cohortSize} pupils. Small cohort: each pupil represents ` +
            `approximately ${perPupilPct}pp. Percentage changes may be misleading.`,
          severity: 'warning',
        });
      }

      // ── Missing core R/W/M data (non-EYFS year groups) ───────────────
      if (yearGroup !== 'EYFS') {
        if (allPupils.reading === null) {
          flags.push({
            school,
            yearGroup,
            issue: 'Reading attainment percentage is missing.',
            severity: 'error',
          });
        }
        if (allPupils.writing === null) {
          flags.push({
            school,
            yearGroup,
            issue: 'Writing attainment percentage is missing.',
            severity: 'error',
          });
        }
        if (allPupils.maths === null) {
          flags.push({
            school,
            yearGroup,
            issue: 'Maths attainment percentage is missing.',
            severity: 'error',
          });
        }
      }

      // ── Zero GD in Writing ─────────────────────────────────────────
      // Zero greater depth in writing is unusual outside EYFS and warrants scrutiny.
      if (yearGroup !== 'EYFS' && gd.writing !== null && gd.writing === 0) {
        flags.push({
          school,
          yearGroup,
          issue:
            'Greater Depth in Writing is reported as 0%. This is atypical — please confirm ' +
            'this is correct and not a data entry omission.',
          severity: 'warning',
        });
      }

      // ── Missing phonics for Y1/Y2 ────────────────────────────────────
      if ((yearGroup === 'Y1' || yearGroup === 'Y2') && (phonics === null || phonics === undefined)) {
        flags.push({
          school,
          yearGroup,
          issue:
            `Phonics screening check result is missing for ${yearGroup}. ` +
            `This is a statutory assessment and must be reported.`,
          severity: 'warning',
        });
      }

      // ── Missing MTC for Y4 ───────────────────────────────────────────
      if (yearGroup === 'Y4' && (mtc === null || mtc === undefined)) {
        flags.push({
          school,
          yearGroup,
          issue:
            'Multiplication Tables Check (MTC) result is missing for Y4. ' +
            'This is a statutory assessment.',
          severity: 'warning',
        });
      }

      // ── High FSM flag for Y6 ─────────────────────────────────────────
      // Flag schools where FSM pupils form a significant proportion of the Y6 cohort,
      // as this context is important for interpreting headline attainment figures.
      if (yearGroup === 'Y6') {
        const schoolMeta = getSchoolByAbbrev(school);
        if (schoolMeta && schoolMeta.fsmPct >= 40) {
          flags.push({
            school,
            yearGroup,
            issue:
              `School-wide FSM is ${schoolMeta.fsmPct}% — high disadvantage context. ` +
              `Headline attainment and disadvantage gaps require careful contextualisation ` +
              `when presenting to Ofsted.`,
            severity: 'warning',
          });
        }
      }
    }
  }

  return flags;
}

// ─── 3. calculateDisadvantageGaps ────────────────────────────────────────────

/**
 * Calculates the attainment gap between FSM6 and non-FSM pupils for each school's
 * Y6 cohort across all four core subjects.
 *
 * A positive gap means non-FSM pupils are outperforming FSM pupils (the typical pattern).
 * A negative gap (FSM > non-FSM) would be exceptional and worth highlighting.
 *
 * @param selfReports  Mid-year self-reported attainment from each school
 * @returns            Array of disadvantage gap objects, one per school per subject
 */
export function calculateDisadvantageGaps(
  selfReports: SchoolSelfReport[],
): DisadvantageGap[] {
  const gaps: DisadvantageGap[] = [];

  for (const report of selfReports) {
    const y6Data = report.yearGroups.find(yg => yg.yearGroup === 'Y6');
    if (!y6Data) continue;

    const { fsm6, nonFsm } = y6Data;

    for (const mapping of SUBJECT_MAPPINGS) {
      const fsmPct = fsm6[mapping.selfKey];
      const nonFsmPct = nonFsm[mapping.selfKey];

      // Only compute gap when both values are present
      const gapPp =
        nonFsmPct !== null && fsmPct !== null ? nonFsmPct - fsmPct : null;

      gaps.push({
        school: report.school,
        subject: mapping.label,
        fsmPct,
        nonFsmPct,
        gapPp,
      });
    }
  }

  return gaps;
}

// ─── 4. Heatmap ──────────────────────────────────────────────────────────────

export interface HeatmapCell {
  school: string;
  yearGroup: YearGroup;
  subject: string;
  value: number | null;
  rag: RAGStatus;
}

/**
 * Builds a flat array of heatmap cells for a given subject across all schools and
 * year groups. Each cell carries a RAG status using trust attainment thresholds:
 *   >= 70% → green, >= 50% → amber, < 50% or null → red
 *
 * @param selfReports  Mid-year self-reported attainment from each school
 * @param subject      The SubjectScores key to extract (e.g. 'reading', 'maths')
 * @returns            Flat array of HeatmapCell, ordered school → year group
 */
export function buildHeatmapData(
  selfReports: SchoolSelfReport[],
  subject: keyof SubjectScores,
): HeatmapCell[] {
  const cells: HeatmapCell[] = [];

  // Human-readable label for the subject column header
  const subjectLabel =
    SUBJECT_MAPPINGS.find(m => m.selfKey === subject)?.label ?? subject;

  for (const report of selfReports) {
    for (const ygData of report.yearGroups) {
      // EYFS does not report R/W/M/Combined — skip to avoid misleading nulls
      if (ygData.yearGroup === 'EYFS') continue;

      const value = ygData.allPupils[subject];

      cells.push({
        school: report.school,
        yearGroup: ygData.yearGroup,
        subject: subjectLabel,
        value,
        rag: attainmentRAG(value),
      });
    }
  }

  return cells;
}

// ─── 5. Census Trends ────────────────────────────────────────────────────────

export interface CensusTrend {
  urn: number;
  school: string;
  years: {
    year: number;
    nor: number;
    fsmPct: number | null;
    ealPct: number | null;
  }[];
}

/**
 * Groups DfE census records by URN and builds a time-series trend per school.
 * Records are sorted ascending by academic year end so charts render chronologically.
 *
 * Only Pennine schools (by URN) will have their abbreviated name resolved;
 * any non-Pennine URNs in the data will appear with school = 'Unknown'.
 *
 * @param census  Raw census records from the DfE dataset
 * @returns       One CensusTrend object per school, sorted by URN order in PENNINE_SCHOOLS
 */
export function buildCensusTrends(census: CensusRecord[]): CensusTrend[] {
  // Group records by URN
  const byUrn = new Map<number, CensusRecord[]>();

  for (const record of census) {
    const existing = byUrn.get(record.urn);
    if (existing) {
      existing.push(record);
    } else {
      byUrn.set(record.urn, [record]);
    }
  }

  const trends: CensusTrend[] = [];

  for (const [urn, records] of byUrn.entries()) {
    // Sort ascending so year-on-year trend reads left to right
    const sorted = [...records].sort((a, b) => a.academicYearEnd - b.academicYearEnd);

    const schoolMeta = PENNINE_SCHOOLS.find(s => s.urn === urn);
    const schoolLabel = schoolMeta?.abbrev ?? 'Unknown';

    trends.push({
      urn,
      school: schoolLabel,
      years: sorted.map(r => ({
        year: r.academicYearEnd,
        nor: r.numberOnRoll,
        fsmPct: r.fsmPct,
        ealPct: r.ealPct,
      })),
    });
  }

  // Return in the canonical Pennine school order for consistent UI rendering;
  // any unknown URNs are appended at the end.
  const pennineUrns = PENNINE_SCHOOLS.map(s => s.urn);
  trends.sort((a, b) => {
    const idxA = pennineUrns.indexOf(a.urn);
    const idxB = pennineUrns.indexOf(b.urn);
    if (idxA === -1 && idxB === -1) return 0;
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });

  return trends;
}
