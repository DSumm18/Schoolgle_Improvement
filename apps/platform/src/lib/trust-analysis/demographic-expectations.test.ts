import { describe, it, expect } from 'vitest';
import {
  demographicExpectation,
  classifyAttainment,
  getEalTrajectory,
  computeForensicVerdict,
  NATIONAL_BASELINES,
} from './demographic-expectations';

describe('demographicExpectation', () => {
  it('returns national baseline for a zero-disadvantage school at Y6 combined', () => {
    const result = demographicExpectation({ fsmPct: 0, sendPct: 0, ealPct: 0 }, 'Y6', 'combined');
    expect(result.baseline).toBe(NATIONAL_BASELINES.Y6_combined);
    expect(result.expected).toBe(NATIONAL_BASELINES.Y6_combined);
  });

  it('reduces expected attainment for high-FSM school', () => {
    const lowFsm = demographicExpectation({ fsmPct: 5, sendPct: 10, ealPct: 5 }, 'Y6', 'combined');
    const highFsm = demographicExpectation({ fsmPct: 40, sendPct: 10, ealPct: 5 }, 'Y6', 'combined');
    expect(highFsm.expected).toBeLessThan(lowFsm.expected);
  });

  it('EAL at Y1 reduces expected attainment (language barrier)', () => {
    const noEal = demographicExpectation({ fsmPct: 20, sendPct: 10, ealPct: 0 }, 'Y1', 'combined');
    const highEal = demographicExpectation({ fsmPct: 20, sendPct: 10, ealPct: 85 }, 'Y1', 'combined');
    expect(highEal.expected).toBeLessThan(noEal.expected);
  });

  it('EAL at Y6 slightly increases expected attainment (language maturity)', () => {
    const noEal = demographicExpectation({ fsmPct: 20, sendPct: 10, ealPct: 0 }, 'Y6', 'combined');
    const highEal = demographicExpectation({ fsmPct: 20, sendPct: 10, ealPct: 85 }, 'Y6', 'combined');
    // At Y6, EAL gap is -2 (negative = EAL pupils slightly exceed), so high EAL school should score higher
    expect(highEal.expected).toBeGreaterThan(noEal.expected);
  });

  it('returns confidence band of ±5pp', () => {
    const result = demographicExpectation({ fsmPct: 27, sendPct: 15, ealPct: 40 }, 'Y6', 'combined');
    expect(result.high - result.low).toBeLessThanOrEqual(10);
    expect(result.expected - result.low).toBeLessThanOrEqual(5);
    expect(result.high - result.expected).toBeLessThanOrEqual(5);
  });

  it('returns expected within [0, 100]', () => {
    // Extreme high-disadvantage school
    const result = demographicExpectation({ fsmPct: 80, sendPct: 50, ealPct: 90 }, 'Y1', 'combined');
    expect(result.low).toBeGreaterThanOrEqual(0);
    expect(result.high).toBeLessThanOrEqual(100);
  });

  it('includes FSM, SEND, and EAL adjustment factors', () => {
    const result = demographicExpectation({ fsmPct: 30, sendPct: 15, ealPct: 50 }, 'Y4', 'combined');
    const factors = result.adjustments.map((a) => a.factor);
    expect(factors.some((f) => f.includes('FSM'))).toBe(true);
    expect(factors.some((f) => f.includes('SEND'))).toBe(true);
    expect(factors.some((f) => f.includes('EAL'))).toBe(true);
  });

  it('gives lower expectations at Y1 than Y6 for a high-EAL school (language developing)', () => {
    const demo = { fsmPct: 25, sendPct: 15, ealPct: 80 };
    const y1 = demographicExpectation(demo, 'Y1', 'combined');
    const y6 = demographicExpectation(demo, 'Y6', 'combined');
    expect(y1.expected).toBeLessThan(y6.expected);
  });
});

describe('classifyAttainment', () => {
  it('returns accurate when reported is within 5pp of expected', () => {
    const expected = { expected: 50, low: 45, high: 55 };
    expect(classifyAttainment(52, expected).verdict).toBe('accurate');
    expect(classifyAttainment(48, expected).verdict).toBe('accurate');
    expect(classifyAttainment(55, expected).verdict).toBe('accurate');
  });

  it('returns over-reported (medium) when gap is 6–10pp', () => {
    const expected = { expected: 50, low: 45, high: 55 };
    const result = classifyAttainment(58, expected);
    expect(result.verdict).toBe('over-reported');
    expect(result.severity).toBe('medium');
  });

  it('returns over-reported (high) when gap is >10pp', () => {
    const expected = { expected: 50, low: 45, high: 55 };
    const result = classifyAttainment(65, expected);
    expect(result.verdict).toBe('over-reported');
    expect(result.severity).toBe('high');
  });

  it('returns under-reported (medium) when gap is -6 to -10pp', () => {
    const expected = { expected: 50, low: 45, high: 55 };
    const result = classifyAttainment(42, expected);
    expect(result.verdict).toBe('under-reported');
    expect(result.severity).toBe('medium');
  });

  it('returns under-reported (high) when gap is < -10pp', () => {
    const expected = { expected: 50, low: 45, high: 55 };
    const result = classifyAttainment(35, expected);
    expect(result.verdict).toBe('under-reported');
    expect(result.severity).toBe('high');
  });

  it('returns no-data when reported is null', () => {
    const expected = { expected: 50, low: 45, high: 55 };
    const result = classifyAttainment(null, expected);
    expect(result.verdict).toBe('no-data');
    expect(result.gap).toBe(0);
  });
});

describe('getEalTrajectory', () => {
  it('returns 6 data points Y1–Y6', () => {
    const trajectory = getEalTrajectory(75, 25, 15);
    expect(trajectory).toHaveLength(6);
    expect(trajectory[0].yearGroup).toBe('Y1');
    expect(trajectory[5].yearGroup).toBe('Y6');
  });

  it('shows upward trajectory for high-EAL school (language develops over time)', () => {
    const trajectory = getEalTrajectory(80, 25, 15, 'combined');
    // Y6 expected should be higher than Y1 expected because EAL gap closes
    expect(trajectory[5].expected).toBeGreaterThan(trajectory[0].expected);
  });
});

describe('computeForensicVerdict', () => {
  it('returns SYSTEMATIC OVER-ASSESSMENT when 4+ year groups over-reported', () => {
    const input = Array(4).fill({ verdict: 'over-reported' as const, severity: 'high' as const });
    const result = computeForensicVerdict(input);
    expect(result.label).toBe('SYSTEMATIC OVER-ASSESSMENT');
    expect(result.color).toBe('red');
  });

  it('returns ACCURATELY ASSESSED when most year groups are accurate', () => {
    const input = Array(5).fill({ verdict: 'accurate' as const, severity: 'low' as const });
    const result = computeForensicVerdict(input);
    expect(result.label).toBe('ACCURATELY ASSESSED');
    expect(result.color).toBe('green');
  });

  it('returns ASSESSMENT DRIFT when 2–3 year groups over-reported', () => {
    const input = [
      { verdict: 'over-reported' as const, severity: 'medium' as const },
      { verdict: 'over-reported' as const, severity: 'medium' as const },
      { verdict: 'accurate' as const, severity: 'low' as const },
      { verdict: 'accurate' as const, severity: 'low' as const },
    ];
    const result = computeForensicVerdict(input);
    expect(result.label).toBe('ASSESSMENT DRIFT');
    expect(result.color).toBe('amber');
  });

  it('returns CONSISTENTLY CAUTIOUS ASSESSMENT when 4+ year groups under-reported', () => {
    const input = Array(5).fill({ verdict: 'under-reported' as const, severity: 'medium' as const });
    const result = computeForensicVerdict(input);
    expect(result.label).toBe('CONSISTENTLY CAUTIOUS ASSESSMENT');
    expect(result.color).toBe('blue');
  });

  it('returns INSUFFICIENT DATA when no data', () => {
    const input = Array(3).fill({ verdict: 'no-data' as const, severity: 'low' as const });
    const result = computeForensicVerdict(input);
    expect(result.label).toBe('INSUFFICIENT DATA');
  });
});
