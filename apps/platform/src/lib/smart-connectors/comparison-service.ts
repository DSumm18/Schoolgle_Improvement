export interface ComparisonQueryParams {
  urn: number;
  table: string;
  valueColumn: string;
  timePeriod: string;
  laCode: string;
  phaseName: string;
  subject?: string;
  breakdownTopic?: string;
}

/**
 * Build a single SQL query that returns the school's value, national average, and LA average.
 */
export function buildComparisonQuery(params: ComparisonQueryParams): string {
  const {
    urn, table, valueColumn, timePeriod, laCode, phaseName,
    subject, breakdownTopic = 'All pupils',
  } = params;

  const subjectFilter = subject ? `AND k.subject = '${subject}'` : '';
  const breakdownFilter = table === 'ks2_results' || table === 'ks4_results'
    ? `AND k.breakdown_topic = '${breakdownTopic}'`
    : '';

  return `
    WITH school_val AS (
      SELECT ${valueColumn}::numeric AS value
      FROM ${table} k
      WHERE k.urn = ${urn}
        AND k.time_period = '${timePeriod}'
        ${subjectFilter}
        ${breakdownFilter}
      LIMIT 1
    ),
    national_avg AS (
      SELECT ROUND(AVG(k.${valueColumn}::numeric), 1) AS avg_value,
             COUNT(DISTINCT k.urn) AS school_count
      FROM ${table} k
      WHERE k.time_period = '${timePeriod}'
        ${subjectFilter}
        ${breakdownFilter}
    ),
    la_avg AS (
      SELECT ROUND(AVG(k.${valueColumn}::numeric), 1) AS avg_value,
             COUNT(DISTINCT k.urn) AS school_count
      FROM ${table} k
      JOIN schools s ON k.urn = s.urn
      WHERE k.time_period = '${timePeriod}'
        AND s.la_code = '${laCode}'
        AND s.phase_name = '${phaseName}'
        ${subjectFilter}
        ${breakdownFilter}
    )
    SELECT
      sv.value AS school_value,
      na.avg_value AS national_avg,
      na.school_count AS national_count,
      la.avg_value AS la_avg,
      la.school_count AS la_count
    FROM school_val sv, national_avg na, la_avg la
  `;
}

export interface DifferenceParams {
  schoolValue: number;
  nationalAvg: number;
  laAvg: number;
  similarAvg: number | null;
}

/**
 * Compute differences between school value and benchmarks.
 * Positive = above average, negative = below.
 */
export function computeDifferences(params: DifferenceParams) {
  const { schoolValue, nationalAvg, laAvg, similarAvg } = params;
  return {
    vsNational: Math.round((schoolValue - nationalAvg) * 10) / 10,
    vsLa: Math.round((schoolValue - laAvg) * 10) / 10,
    vsSimilar: similarAvg !== null ? Math.round((schoolValue - similarAvg) * 10) / 10 : null,
  };
}
