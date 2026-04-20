import { describe, it, expect } from 'vitest';
import {
  computeStaffingRatios,
  assessStaffing,
  NATIONAL_P_T_RATIO,
} from './staffing-ratios';

describe('computeStaffingRatios', () => {
  it('computes pupilTeacherRatio correctly', () => {
    const result = computeStaffingRatios({
      numberOfPupils: 482,
      fteTeachers: 17.0,
      fteTotal: 35.0,
      fteTeachingAssistants: 15.0,
    });
    // 482 / 17 = 28.35... → rounded to 1dp = 28.4
    expect(result.pupilTeacherRatio).toBe(28.4);
  });

  it('computes pupilAdultRatio correctly', () => {
    const result = computeStaffingRatios({
      numberOfPupils: 193,
      fteTeachers: 11.6,
      fteTotal: 22.0,
      fteTeachingAssistants: 8.0,
    });
    // 193 / 22 = 8.77... → 8.8
    expect(result.pupilAdultRatio).toBe(8.8);
  });

  it('returns null ratios when pupils is null', () => {
    const result = computeStaffingRatios({
      numberOfPupils: null,
      fteTeachers: 17.0,
      fteTotal: 35.0,
      fteTeachingAssistants: 15.0,
    });
    expect(result.pupilTeacherRatio).toBeNull();
    expect(result.pupilAdultRatio).toBeNull();
    expect(result.taPerPupil).toBeNull();
  });

  it('returns null ratios when fteTeachers is null', () => {
    const result = computeStaffingRatios({
      numberOfPupils: 400,
      fteTeachers: null,
      fteTotal: 35.0,
      fteTeachingAssistants: 15.0,
    });
    expect(result.pupilTeacherRatio).toBeNull();
  });
});

describe('assessStaffing', () => {
  const national = NATIONAL_P_T_RATIO.primary; // 20.6

  it('returns no-data when ratio is null', () => {
    const verdict = assessStaffing(null, 'primary', 70);
    expect(verdict.severity).toBe('no-data');
  });

  it('returns lean-high-performing for Hollingwood (28.4 PTR, 75%+ avg)', () => {
    // Hollingwood: PTR ~28.4 (lean), combined avg ~76 (strong)
    const verdict = assessStaffing(28.4, 'primary', 76);
    expect(verdict.severity).toBe('lean-high-performing');
    expect(verdict.label).toBe('Lean staffing, strong outcomes');
  });

  it('returns well-staffed-underperforming for Clayton Village (16.6 PTR, 51% avg)', () => {
    // Clayton Village: PTR ~16.6 (well-staffed), combined avg ~51 (below 55)
    const verdict = assessStaffing(16.6, 'primary', 51);
    expect(verdict.severity).toBe('well-staffed-underperforming');
    expect(verdict.label).toBe('Well-staffed, below-average outcomes');
  });

  it('returns typical when PTR is within 2pp of national and attainment is mid-range', () => {
    // PTR exactly at national, attainment 58% (not strong, not weak)
    const verdict = assessStaffing(national, 'primary', 60);
    expect(verdict.severity).toBe('typical');
  });

  it('returns lean-underperforming for lean PTR + weak attainment', () => {
    const verdict = assessStaffing(25.0, 'primary', 48);
    expect(verdict.severity).toBe('lean-underperforming');
  });

  it('returns well-staffed-high-performing for generous staffing + strong outcomes', () => {
    const verdict = assessStaffing(16.0, 'primary', 70);
    expect(verdict.severity).toBe('well-staffed-high-performing');
  });

  it('governor question is non-empty for all non-typical verdicts', () => {
    const verdicts = [
      assessStaffing(28.4, 'primary', 76), // lean-high-performing
      assessStaffing(25.0, 'primary', 48), // lean-underperforming
      assessStaffing(16.0, 'primary', 70), // well-staffed-high-performing
      assessStaffing(16.6, 'primary', 51), // well-staffed-underperforming
    ];
    for (const v of verdicts) {
      expect(v.governorQuestion.length).toBeGreaterThan(0);
    }
  });

  it('national PTR values are correct', () => {
    expect(NATIONAL_P_T_RATIO.primary).toBe(20.6);
    expect(NATIONAL_P_T_RATIO.secondary).toBe(17.0);
  });
});
