export interface SimilarSchoolsQueryParams {
  urn: number;
  phaseName: string;
  fsmPct: number;
  fsmTolerance: number;
  numberOfPupils: number;
  rollTolerance: number;
  laCode?: string;
  timePeriod: string;
  limit?: number;
}

/**
 * Build SQL to find schools with similar profiles.
 * Joins schools table with census for FSM data.
 */
export function buildSimilarSchoolsQuery(params: SimilarSchoolsQueryParams): string {
  const {
    urn, phaseName, fsmPct, fsmTolerance,
    numberOfPupils, rollTolerance, laCode, timePeriod, limit = 30,
  } = params;

  const rollLower = Math.round(numberOfPupils * (1 - rollTolerance / 100));
  const rollUpper = Math.round(numberOfPupils * (1 + rollTolerance / 100));

  return `
    SELECT s.urn, s.name, s.la_code, s.la_name, s.postcode,
           s.easting, s.northing, s.type_name, s.phase_name,
           s.status_name, s.school_capacity, s.number_of_pupils,
           s.percentage_fsm, s.trust_name,
           s.head_first_name, s.head_last_name,
           c.fsm_pct, c.eal_pct, c.number_on_roll,
           ABS(c.fsm_pct::numeric - ${fsmPct}) AS fsm_diff
    FROM schools s
    JOIN census c ON s.urn = c.urn AND c.time_period = '${timePeriod}'
    WHERE s.urn != ${urn}
      AND s.phase_name = '${phaseName}'
      AND s.status_name = 'Open'
      AND ABS(c.fsm_pct::numeric - ${fsmPct}) <= ${fsmTolerance}
      AND c.number_on_roll BETWEEN ${rollLower} AND ${rollUpper}
      ${laCode ? `AND s.la_code = '${laCode}'` : ''}
    ORDER BY fsm_diff ASC
    LIMIT ${limit}
  `;
}

export interface MatchScoreParams {
  targetFsm: number;
  matchFsm: number;
  targetRoll: number;
  matchRoll: number;
  sameLa: boolean;
  samePhase: boolean;
  sameType: boolean;
}

/**
 * Calculate a 0-1 similarity score between two school profiles.
 * Weights: FSM proximity 30%, roll proximity 20%, same LA 20%, same phase 15%, same type 15%
 */
export function calculateMatchScore(params: MatchScoreParams): number {
  const { targetFsm, matchFsm, targetRoll, matchRoll, sameLa, samePhase, sameType } = params;

  const fsmDiff = Math.abs(targetFsm - matchFsm);
  const fsmScore = Math.max(0, 1 - fsmDiff / 10);

  const rollDiff = Math.abs(targetRoll - matchRoll) / Math.max(targetRoll, 1);
  const rollScore = Math.max(0, 1 - rollDiff / 0.5);

  const laScore = sameLa ? 1.0 : 0.0;
  const phaseScore = samePhase ? 1.0 : 0.0;
  const typeScore = sameType ? 1.0 : 0.0;

  return Math.round((
    fsmScore * 0.30 +
    rollScore * 0.20 +
    laScore * 0.20 +
    phaseScore * 0.15 +
    typeScore * 0.15
  ) * 100) / 100;
}
