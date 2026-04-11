import type { ReconciliationCheck, ReconciliationResult } from './types';

/**
 * Compare two values from different sources and determine reconciliation status.
 */
export function reconcileValues(
  field: string,
  valueA: number | string | null,
  valueB: number | string | null,
  sourceA: string,
  sourceB: string,
  tolerance: number = 0.5,
): ReconciliationCheck {
  if (valueA === null || valueB === null || valueA === undefined || valueB === undefined) {
    return {
      field,
      sourceA: { name: sourceA, value: valueA ?? 'N/A', source: sourceA },
      sourceB: { name: sourceB, value: valueB ?? 'N/A', source: sourceB },
      status: 'missing',
      explanation: `Data not available from ${valueA === null ? sourceA : sourceB}`,
    };
  }

  const numA = typeof valueA === 'string' ? parseFloat(valueA) : valueA;
  const numB = typeof valueB === 'string' ? parseFloat(valueB) : valueB;

  if (isNaN(numA) || isNaN(numB)) {
    const strMatch = String(valueA).toLowerCase().trim() === String(valueB).toLowerCase().trim();
    return {
      field,
      sourceA: { name: sourceA, value: valueA, source: sourceA },
      sourceB: { name: sourceB, value: valueB, source: sourceB },
      status: strMatch ? 'match' : 'discrepancy',
      explanation: strMatch ? undefined : `Values differ: "${valueA}" vs "${valueB}"`,
    };
  }

  const diff = Math.abs(numA - numB);

  return {
    field,
    sourceA: { name: sourceA, value: numA, source: sourceA },
    sourceB: { name: sourceB, value: numB, source: sourceB },
    status: diff <= tolerance ? 'match' : 'discrepancy',
    difference: Math.round(diff * 100) / 100,
    explanation: diff <= tolerance ? undefined : categoriseDiscrepancy(field, diff),
  };
}

/**
 * Provide a human-readable explanation for a data discrepancy.
 */
export function categoriseDiscrepancy(field: string, difference: number): string {
  if (difference >= 5) {
    return `Significant difference of ${difference.toFixed(1)}pp detected. This may indicate a data entry error or a different reporting period. School should verify.`;
  }

  const fieldLower = field.toLowerCase();

  if (fieldLower.includes('fsm') || fieldLower.includes('sen') || fieldLower.includes('eal')) {
    return `Difference of ${difference.toFixed(1)}pp likely due to different census snapshot dates. GIAS uses January census, bulk data may use a different point-in-time.`;
  }

  if (fieldLower.includes('roll') || fieldLower.includes('pupil')) {
    return `Difference of ${difference} pupils. Roll numbers change throughout the year as pupils join and leave.`;
  }

  if (fieldLower.includes('attendance')) {
    return `Difference of ${difference.toFixed(1)}pp. May reflect different term periods or data collection windows.`;
  }

  return `Difference of ${difference.toFixed(1)} detected between sources. Different snapshot dates or calculation methods may explain this.`;
}

/**
 * Build SQL queries to fetch reconcilable data for a school from multiple sources.
 */
export function buildReconciliationQueries(urn: number): string[] {
  return [
    `SELECT
       s.percentage_fsm AS gias_fsm_pct,
       s.number_of_pupils AS gias_roll,
       c.fsm_pct AS census_fsm_pct,
       c.number_on_roll AS census_roll
     FROM schools s
     LEFT JOIN census c ON s.urn = c.urn
       AND c.time_period = (SELECT MAX(time_period) FROM census WHERE urn = ${urn})
     WHERE s.urn = ${urn}`,
  ];
}

/**
 * Build a full reconciliation result from raw query data.
 */
export function buildReconciliationResult(
  urn: number,
  schoolName: string,
  data: {
    giasFsmPct: number | null;
    censusFsmPct: number | null;
    giasRoll: number | null;
    censusRoll: number | null;
  },
): ReconciliationResult {
  const checks: ReconciliationCheck[] = [
    reconcileValues('FSM %', data.giasFsmPct, data.censusFsmPct, 'GIAS School Record', 'DfE Census Data'),
    reconcileValues('Number on Roll', data.giasRoll, data.censusRoll, 'GIAS School Record', 'DfE Census Data', 5),
  ];

  const warningCount = checks.filter(c => c.status === 'discrepancy').length;
  const errorCount = checks.filter(c => c.status === 'missing').length;
  const verifiedCount = checks.filter(c => c.status === 'match').length;

  return {
    urn,
    schoolName,
    checks,
    overallStatus: warningCount > 0 ? 'warnings' : errorCount > 0 ? 'errors' : 'verified',
    verifiedCount,
    warningCount,
    errorCount,
    timestamp: new Date().toISOString(),
  };
}
