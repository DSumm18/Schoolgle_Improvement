import type { DfETrendData } from "./school-intelligence-engine";

export interface SchoolKpiDataFromTrends {
  ks2_combined?: { year: number; expected_standard_pct: number }[];
  ks2_reading?: { year: number; expected_standard_pct: number; progress_score: number | null }[];
  ks2_writing?: { year: number; expected_standard_pct: number; progress_score: number | null }[];
  ks2_maths?: { year: number; expected_standard_pct: number; progress_score: number | null }[];
  disadvantaged_gap?: { year: number; all_pupils_pct: number; disadvantaged_pct: number; gap_pp: number }[];
  attendance?: { year: number; overall_pct: number; persistent_absence_pct: number }[];
  persistent_absence?: { year: number; pct: number }[];
}

const roundPct = (value: number) => Math.round(value * 10) / 10;
const roundProgress = (value: number) => Number(value.toFixed(1));

const byYear = <T extends { year: number }>(rows: T[]) =>
  [...rows].sort((a, b) => a.year - b.year);

function rowsForSubject(trends: DfETrendData, subjects: string | string[]) {
  const subjectSet = new Set(Array.isArray(subjects) ? subjects : [subjects]);
  return byYear(
    trends.ks2.filter(
      (row) =>
        subjectSet.has(row.subject) &&
        typeof row.expected_standard_pct === "number" &&
        Number.isFinite(row.expected_standard_pct),
    ),
  );
}

function mapKs2Subject(trends: DfETrendData, subjects: string | string[]) {
  const rows = rowsForSubject(trends, subjects);
  if (rows.length === 0) return undefined;

  return rows.map((row) => ({
    year: row.year,
    expected_standard_pct: roundPct(row.expected_standard_pct!),
    progress_score:
      row.progress_measure_score !== null && row.progress_measure_score !== undefined
        ? roundProgress(row.progress_measure_score)
        : null,
  }));
}

export function buildSchoolKpiDataFromDfETrends(
  trends: DfETrendData,
): SchoolKpiDataFromTrends {
  const combinedRows = rowsForSubject(trends, "Reading, writing and maths");
  const attendanceRows = byYear(
    trends.attendance.filter(
      (row) =>
        row.overall_pct !== null &&
        row.overall_pct !== undefined &&
        row.persistent_absence_pct !== null &&
        row.persistent_absence_pct !== undefined,
    ),
  );

  const result: SchoolKpiDataFromTrends = {};

  if (combinedRows.length > 0) {
    result.ks2_combined = combinedRows.map((row) => ({
      year: row.year,
      expected_standard_pct: roundPct(row.expected_standard_pct!),
    }));
  }

  const reading = mapKs2Subject(trends, "Reading");
  if (reading) result.ks2_reading = reading;

  const writing = mapKs2Subject(trends, "Writing");
  if (writing) result.ks2_writing = writing;

  const maths = mapKs2Subject(trends, ["Maths", "Mathematics"]);
  if (maths) result.ks2_maths = maths;

  if (attendanceRows.length > 0) {
    result.attendance = attendanceRows.map((row) => ({
      year: row.year,
      overall_pct: roundPct(row.overall_pct),
      persistent_absence_pct: roundPct(row.persistent_absence_pct),
    }));
    result.persistent_absence = attendanceRows.map((row) => ({
      year: row.year,
      pct: roundPct(row.persistent_absence_pct),
    }));
  }

  return result;
}
