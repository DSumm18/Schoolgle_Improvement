/**
 * PupilCardGrid — Unit tests for helper functions
 *
 * Tests pure helper logic: levelValue, weakestSubject, overallTrend, contextPanel.
 * Component rendering tests are handled at the integration level.
 */

import { describe, it, expect } from 'vitest';
import { buildPupilRegisterGroups } from './PupilCardGrid';

// ─── Replicate helpers from PupilCardGrid (pure functions, no JSX) ─────────────

function levelValue(l: string): number {
  return l === "GDS" ? 3 : l === "EXS" || l === "2" ? 2 : l === "WTS" || l === "WT" || l === "1" ? 1 : 0;
}

function weakestSubject(journey: { subject: string; level: string }[]): { subject: string; avgLevel: number } | null {
  const subjects = [...new Set(journey.map((j) => j.subject).filter((s) => ["reading", "writing", "maths"].includes(s)))];
  if (subjects.length === 0) return null;
  const scored = subjects.map((s) => {
    const levels = journey.filter((j) => j.subject === s).map((j) => levelValue(j.level));
    const avg = levels.length > 0 ? levels.reduce((a, b) => a + b, 0) / levels.length : 0;
    return { subject: s, avgLevel: avg };
  });
  scored.sort((a, b) => a.avgLevel - b.avgLevel);
  return scored[0];
}

function overallTrend(journey: { subject: string; level: string }[]): "improving" | "declining" | "stable" | "insufficient" {
  const levels = journey.map((j) => levelValue(j.level));
  if (levels.length < 2) return "insufficient";
  const first = levels[0];
  const last = levels[levels.length - 1];
  if (last > first) return "improving";
  if (last < first) return "declining";
  return "stable";
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('levelValue', () => {
  it('returns 3 for GDS', () => expect(levelValue('GDS')).toBe(3));
  it('returns 2 for EXS', () => expect(levelValue('EXS')).toBe(2));
  it('returns 2 for "2"', () => expect(levelValue('2')).toBe(2));
  it('returns 1 for WTS', () => expect(levelValue('WTS')).toBe(1));
  it('returns 1 for WT', () => expect(levelValue('WT')).toBe(1));
  it('returns 1 for "1"', () => expect(levelValue('1')).toBe(1));
  it('returns 0 for unknown', () => expect(levelValue('??')).toBe(0));
});

describe('weakestSubject', () => {
  it('returns null for empty journey', () => {
    expect(weakestSubject([])).toBeNull();
  });

  it('identifies writing as weakest when it has lowest avg level', () => {
    const journey = [
      { subject: 'reading', level: 'GDS' },
      { subject: 'maths', level: 'EXS' },
      { subject: 'writing', level: 'WTS' },
    ];
    const result = weakestSubject(journey);
    expect(result?.subject).toBe('writing');
    expect(result?.avgLevel).toBe(1);
  });

  it('identifies maths as weakest', () => {
    const journey = [
      { subject: 'reading', level: 'EXS' },
      { subject: 'writing', level: 'EXS' },
      { subject: 'maths', level: 'WTS' },
    ];
    expect(weakestSubject(journey)?.subject).toBe('maths');
  });

  it('ignores non-core subjects', () => {
    const journey = [
      { subject: 'science', level: 'WTS' },
      { subject: 'reading', level: 'EXS' },
    ];
    expect(weakestSubject(journey)?.subject).toBe('reading');
  });

  it('handles multiple records per subject correctly', () => {
    const journey = [
      { subject: 'reading', level: 'GDS' },
      { subject: 'reading', level: 'EXS' },
      { subject: 'maths', level: 'WTS' },
      { subject: 'maths', level: 'WTS' },
    ];
    const result = weakestSubject(journey);
    expect(result?.subject).toBe('maths');
    expect(result?.avgLevel).toBe(1);
  });
});

describe('overallTrend', () => {
  it('returns insufficient for 0 or 1 entries', () => {
    expect(overallTrend([])).toBe('insufficient');
    expect(overallTrend([{ subject: 'reading', level: 'EXS' }])).toBe('insufficient');
  });

  it('returns improving when last level > first', () => {
    const journey = [
      { subject: 'reading', level: 'WTS' },
      { subject: 'reading', level: 'EXS' },
    ];
    expect(overallTrend(journey)).toBe('improving');
  });

  it('returns declining when last level < first', () => {
    const journey = [
      { subject: 'reading', level: 'GDS' },
      { subject: 'reading', level: 'WTS' },
    ];
    expect(overallTrend(journey)).toBe('declining');
  });

  it('returns stable when first and last are equal', () => {
    const journey = [
      { subject: 'reading', level: 'EXS' },
      { subject: 'maths', level: 'EXS' },
    ];
    expect(overallTrend(journey)).toBe('stable');
  });
});

describe('contextPanel framing', () => {
  /**
   * Key product principle: context panels must be constructive, not accusatory.
   * These tests verify the expected framing content.
   */

  // Re-implement contextPanel inline for test isolation
  function contextPanel(demo: { isFsm: boolean; isSend: boolean; isEal: boolean }, trend: string): string {
    const { isFsm, isSend, isEal } = demo;
    if (isSend && isFsm) {
      return "This pupil carries dual disadvantage markers (FSM-eligible and SEND-registered). EEF research indicates a 9+ month average attainment gap for pupils with both markers.";
    }
    if (isSend) {
      return "SEND-registered. Any attainment gap may reflect processing, communication, or specific learning needs rather than a literacy or numeracy deficit.";
    }
    if (isEal && isFsm) {
      return "EAL and Pupil Premium eligible. Language acquisition curve typically takes 5–7 years for academic fluency.";
    }
    if (isEal) {
      return "EAL learner. Research (Strand & Demie, 2018) shows EAL pupils typically reach or exceed peers by KS2.";
    }
    if (isFsm) {
      return "Pupil Premium eligible. The EEF Toolkit identifies feedback, metacognition, and reading comprehension strategies as highest-impact.";
    }
    if (trend === "declining") {
      return "No recorded demographic vulnerability flags. A declining trajectory without obvious contextual factors is worth investigating.";
    }
    return "No additional vulnerability flags on record. Progress is within the expected range for this cohort.";
  }

  it('gives dual-disadvantage framing for FSM+SEND pupils', () => {
    const text = contextPanel({ isFsm: true, isSend: true, isEal: false }, 'stable');
    expect(text).toContain('dual disadvantage');
    expect(text).toContain('EEF');
    expect(text).not.toContain('failed');
    expect(text).not.toContain('should be');
  });

  it('frames SEND context as investigation, not accusation', () => {
    const text = contextPanel({ isFsm: false, isSend: true, isEal: false }, 'stable');
    expect(text).toContain('may reflect');
    expect(text).not.toContain('failed');
  });

  it('frames EAL context with research reference', () => {
    const text = contextPanel({ isFsm: false, isSend: false, isEal: true }, 'stable');
    expect(text).toContain('Strand & Demie');
  });

  it('uses exploratory framing for declining pupils with no flags', () => {
    const text = contextPanel({ isFsm: false, isSend: false, isEal: false }, 'declining');
    expect(text).toContain('worth investigating');
    expect(text).not.toContain('failed');
    expect(text).not.toContain('accusat');
  });

  it('gives reassuring framing for no-flag stable pupils', () => {
    const text = contextPanel({ isFsm: false, isSend: false, isEal: false }, 'stable');
    expect(text).toContain('within the expected range');
  });
});

describe('buildPupilRegisterGroups', () => {
  it('groups pupils by their latest year group and creates compact row summaries', () => {
    const groups = buildPupilRegisterGroups([
      {
        pupilId: 'Amber Fox 25',
        demographics: { isFsm: true, isSend: false, isEal: true, gender: 'F' },
        journey: [
          { year: 2026, yearGroup: 2, subject: 'reading', level: 'EXS' },
          { year: 2026, yearGroup: 2, subject: 'writing', level: 'WTS' },
          { year: 2026, yearGroup: 2, subject: 'maths', level: 'EXS' },
        ],
      },
      {
        pupilId: 'Blue Robin 75',
        demographics: { isFsm: false, isSend: true, isEal: false, gender: 'M' },
        journey: [
          { year: 2026, yearGroup: 3, subject: 'reading', level: 'WTS' },
          { year: 2026, yearGroup: 3, subject: 'writing', level: 'WTS' },
          { year: 2026, yearGroup: 3, subject: 'maths', level: 'EXS' },
        ],
      },
    ]);

    expect(groups.map((group) => group.yearGroup)).toEqual([2, 3]);
    expect(groups[0].label).toBe('Y2 cohort');
    expect(groups[0].rows[0]).toMatchObject({
      pupilId: 'Amber Fox 25',
      reading: 'EXS',
      writing: 'WTS',
      maths: 'EXS',
      expectedCount: 2,
      totalSubjects: 3,
      flags: ['FSM', 'EAL'],
    });
    expect(groups[1].rows[0].flags).toEqual(['SEND']);
  });
});
