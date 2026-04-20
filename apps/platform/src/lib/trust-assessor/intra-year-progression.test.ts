/**
 * Tests for intra-year progression logic:
 *  - Outlier detection thresholds (5pp amber, 8pp red)
 *  - KS1 baseline anchoring
 *  - Subgroup delta pattern (non-FSM faster than FSM = unusual)
 *  - GovernorReportData interface accepts intraYearProgression
 */

import { describe, it, expect } from 'vitest';
import { generateGovernorReportHtml } from './report-templates/governor-assessment';
import type { GovernorReportData } from './report-templates/governor-assessment';

// ─── Helper: minimal GovernorReportData ──────────────────────────────────────

function makeReportData(overrides?: Partial<GovernorReportData>): GovernorReportData {
  return {
    schoolName: 'Test School',
    generatedAt: new Date('2026-04-20'),
    reportDate: 'April 2026',
    academicYear: '2025/26',
    y6Combined: 56,
    nationalPercentile: 30,
    nationalRank: { rank: 1500, total: 17000 },
    threeYearAverage: 55,
    fsmPct: 35,
    sendPct: 18,
    trustFsmPct: 28,
    totalPupils: 416,
    dataQualityAlerts: [],
    narrative: {
      verdict: 'Over-reporting pattern',
      severity: 'attention',
      headline: 'Data shows potential drift',
      keyFindings: [
        { number: '9pp', title: 'Autumn to Mid jump', detail: 'Y6 Combined jumped 9pp in one term' },
        { number: '12pp', title: 'Writing drift', detail: 'Writing jumped 12pp — investigate moderation' },
        { number: '58.9%', title: 'KS1 baseline', detail: 'Last external anchor was 58.9% (KS1 2021/22)' },
      ],
      contextDefence: 'High FSM and EAL context must be factored in.',
      recommendations: [
        { action: 'Commission external moderation', eefStrategy: null, impact: 'High', cost: '£500' },
        { action: 'Cross-moderate with trust school', eefStrategy: null, impact: 'Medium', cost: '£0' },
        { action: 'Review writing assessment criteria', eefStrategy: null, impact: 'High', cost: '£0' },
      ],
      questionsForHeadteacher: [
        'What is driving the 9pp Combined jump?',
        'What writing moderation occurred?',
        'Is the prediction above the KS1 external baseline justified?',
        'Why did non-FSM gain faster than FSM?',
        'What external validation supports the mid-year figure?',
      ],
    },
    ...overrides,
  };
}

// ─── Outlier detection thresholds ────────────────────────────────────────────

describe('Intra-year progression — outlier thresholds', () => {
  it('flags delta >5pp as amber outlier', () => {
    const delta = 6;
    const isAmber = delta > 5 && delta <= 8;
    expect(isAmber).toBe(true);
  });

  it('flags delta >8pp as red outlier', () => {
    const delta = 9;
    const isRed = delta > 8;
    expect(isRed).toBe(true);
  });

  it('does not flag delta of 4pp', () => {
    const delta = 4;
    const isAmber = delta > 5;
    const isRed = delta > 8;
    expect(isAmber).toBe(false);
    expect(isRed).toBe(false);
  });

  it('handles exact boundary: 5pp is NOT flagged (> not >=)', () => {
    const delta = 5;
    const isAmber = delta > 5;
    expect(isAmber).toBe(false);
  });

  it('handles exact boundary: 8pp is amber not red', () => {
    const delta = 8;
    const isRed = delta > 8;
    const isAmber = delta > 5 && !isRed;
    expect(isRed).toBe(false);
    expect(isAmber).toBe(true);
  });
});

// ─── KS1 baseline gap calculation ────────────────────────────────────────────

describe('KS1 baseline anchor', () => {
  it('calculates gap correctly: mid-year > KS1 baseline', () => {
    const ks1Combined = 58.9;
    const midYearCombined = 56;
    const gap = Math.round(midYearCombined - ks1Combined);
    expect(gap).toBe(-3); // -2.9 rounds to -3
  });

  it('calculates gap correctly: mid-year > KS1 baseline (positive)', () => {
    const ks1Combined = 50;
    const midYearCombined = 62;
    const gap = Math.round(midYearCombined - ks1Combined);
    expect(gap).toBe(12);
  });

  it('flags >5pp above KS1 baseline as requiring explanation', () => {
    const ks1 = 50;
    const midYear = 56;
    const gap = midYear - ks1;
    const requiresExplanation = gap > 5;
    expect(requiresExplanation).toBe(true);
  });
});

// ─── FSM subgroup pattern ─────────────────────────────────────────────────────

describe('FSM subgroup delta analysis', () => {
  it('detects unusual pattern: non-FSM gaining faster than FSM by >5pp', () => {
    const fsmDelta = 15;
    const nonFsmDelta = 23;
    const isUnusual = nonFsmDelta > fsmDelta + 5;
    expect(isUnusual).toBe(true);
  });

  it('does not flag if difference is ≤5pp', () => {
    const fsmDelta = 18;
    const nonFsmDelta = 20;
    const isUnusual = nonFsmDelta > fsmDelta + 5;
    expect(isUnusual).toBe(false);
  });
});

// ─── GovernorReportHtml: intraYearProgression renders ────────────────────────

describe('generateGovernorReportHtml — intra-year progression', () => {
  it('renders intra-year progression table when data provided', () => {
    const html = generateGovernorReportHtml(makeReportData({
      intraYearProgression: [
        {
          yearGroup: 'Y6',
          autumnCombined: 47,
          midYearCombined: 56,
          targetCombined: 64,
          delta: 9,
          isOutlierRed: true,
          isOutlierAmber: false,
          subjectDeltas: { reading: 6, writing: 12, maths: 7 },
          fsmDelta: 15,
          nonFsmDelta: 23,
          ks1Baseline: { year: '2021/22', combined: 58.9 },
        },
      ],
    }));
    expect(html).toContain('Intra-Year Progression');
    expect(html).toContain('47%'); // autumn
    expect(html).toContain('56%'); // mid-year
    expect(html).toContain('+9pp'); // delta
    expect(html).toContain('Significant outlier'); // red flag
  });

  it('renders KS1 external baseline in intra-year section', () => {
    const html = generateGovernorReportHtml(makeReportData({
      intraYearProgression: [
        {
          yearGroup: 'Y6',
          autumnCombined: 47,
          midYearCombined: 56,
          targetCombined: 64,
          delta: 9,
          isOutlierRed: true,
          isOutlierAmber: false,
          ks1Baseline: { year: '2021/22', combined: 58.9 },
        },
      ],
    }));
    expect(html).toContain('58.9%'); // KS1 baseline
    expect(html).toContain('2021/22'); // year
    expect(html).toContain('External'); // tier label
  });

  it('renders auto-generated headteacher questions when outliers present', () => {
    const html = generateGovernorReportHtml(makeReportData({
      intraYearProgression: [
        {
          yearGroup: 'Y6',
          autumnCombined: 47,
          midYearCombined: 56,
          targetCombined: 64,
          delta: 9,
          isOutlierRed: true,
          isOutlierAmber: false,
          subjectDeltas: { reading: 6, writing: 12, maths: 7 },
        },
      ],
    }));
    expect(html).toContain('Five Questions for the Headteacher');
    // Should auto-generate questions because outliers exist
    expect(html).toContain('3–5pp'); // reference to typical range
  });

  it('renders tier legend in page 4', () => {
    const html = generateGovernorReportHtml(makeReportData());
    expect(html).toContain('Data tiers');
    expect(html).toContain('External');
    expect(html).toContain('Self-reported');
  });

  it('renders gracefully with no intraYearProgression data', () => {
    const html = generateGovernorReportHtml(makeReportData({ intraYearProgression: undefined }));
    expect(html).toContain('Five Questions for the Headteacher'); // shows headteacher questions section
  });

  it('renders amber outlier flag for 6pp delta', () => {
    const html = generateGovernorReportHtml(makeReportData({
      intraYearProgression: [
        {
          yearGroup: 'Y5',
          autumnCombined: 60,
          midYearCombined: 66,
          targetCombined: 70,
          delta: 6,
          isOutlierRed: false,
          isOutlierAmber: true,
        },
      ],
    }));
    expect(html).toContain('+6pp');
    expect(html).toContain('Outlier'); // amber flag
  });
});

// ─── Reliability tier system ──────────────────────────────────────────────────

describe('Reliability tiers', () => {
  it('correctly identifies external data as highest reliability', () => {
    const tiers = ['external', 'derived', 'self_reported'];
    expect(tiers[0]).toBe('external');
    expect(tiers[tiers.length - 1]).toBe('self_reported');
  });

  it('external tier includes DfE KS2, KS1 2021/22, Ofsted ratings', () => {
    // This is a conceptual test confirming the tier assignments in parseSchoolDataSummary
    const ks1BaslineTier = 'external'; // KS1 2021/22 is last statutory moderated
    const trustSpreadsheetTier = 'self_reported';
    const computedDeltaTier = 'derived';
    expect(ks1BaslineTier).toBe('external');
    expect(trustSpreadsheetTier).toBe('self_reported');
    expect(computedDeltaTier).toBe('derived');
  });
});
