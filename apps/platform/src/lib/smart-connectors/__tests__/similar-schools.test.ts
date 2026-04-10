import { describe, it, expect } from 'vitest';
import { buildSimilarSchoolsQuery, calculateMatchScore } from '../similar-schools';

describe('similar-schools', () => {
  it('builds query filtering by phase and FSM tolerance', () => {
    const sql = buildSimilarSchoolsQuery({
      urn: 148201,
      phaseName: 'Primary',
      fsmPct: 27.3,
      fsmTolerance: 5,
      numberOfPupils: 417,
      rollTolerance: 20,
      laCode: '380',
      timePeriod: '202425',
    });
    expect(sql).toContain("phase_name = 'Primary'");
    expect(sql).toContain('27.3');
    expect(sql).toContain('148201');
    expect(sql).toContain('census');
  });

  it('calculates match score — identical profile scores 1.0', () => {
    const score = calculateMatchScore({
      targetFsm: 27.3, matchFsm: 27.3,
      targetRoll: 417, matchRoll: 417,
      sameLa: true, samePhase: true, sameType: true,
    });
    expect(score).toBe(1.0);
  });

  it('calculates lower score for different FSM and roll', () => {
    const score = calculateMatchScore({
      targetFsm: 27.3, matchFsm: 32.0,
      targetRoll: 417, matchRoll: 300,
      sameLa: true, samePhase: true, sameType: false,
    });
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(1.0);
  });

  it('same LA boosts score', () => {
    const withLa = calculateMatchScore({
      targetFsm: 27.3, matchFsm: 30,
      targetRoll: 417, matchRoll: 400,
      sameLa: true, samePhase: true, sameType: true,
    });
    const withoutLa = calculateMatchScore({
      targetFsm: 27.3, matchFsm: 30,
      targetRoll: 417, matchRoll: 400,
      sameLa: false, samePhase: true, sameType: true,
    });
    expect(withLa).toBeGreaterThan(withoutLa);
  });
});
