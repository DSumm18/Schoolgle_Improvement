import { describe, expect, it } from 'vitest';
import {
  analyseAcademisationImpact,
  splitRowsByConversion,
  type AcademisationMetricRow,
} from './academisation-impact-engine';

const conversionDate = '2020-09-01';

function row(
  academicYearEnd: number,
  values: Partial<AcademisationMetricRow> = {},
): AcademisationMetricRow {
  return {
    urn: academicYearEnd < 2021 ? 100001 : 200001,
    academicYearEnd,
    ks2CombinedExpectedPct: null,
    ks2ReadingExpectedPct: null,
    ks2WritingExpectedPct: null,
    ks2MathsExpectedPct: null,
    attendancePct: null,
    persistentAbsencePct: null,
    fsmPct: null,
    ealPct: null,
    senPct: null,
    numberOnRoll: null,
    ...values,
  };
}

describe('splitRowsByConversion', () => {
  it('splits rows into pre and post periods using conversion year', () => {
    const result = splitRowsByConversion(
      [row(2019), row(2020), row(2021), row(2022)],
      conversionDate,
    );

    expect(result.pre.map((entry) => entry.academicYearEnd)).toEqual([2019, 2020]);
    expect(result.post.map((entry) => entry.academicYearEnd)).toEqual([2021, 2022]);
  });
});

describe('analyseAcademisationImpact', () => {
  it('classifies improved when enough pre and post data improves materially', () => {
    const result = analyseAcademisationImpact({
      rows: [
        row(2018, { ks2CombinedExpectedPct: 58, attendancePct: 94 }),
        row(2019, { ks2CombinedExpectedPct: 60, attendancePct: 94.5 }),
        row(2021, { ks2CombinedExpectedPct: 68, attendancePct: 95.5 }),
        row(2022, { ks2CombinedExpectedPct: 70, attendancePct: 96 }),
      ],
      conversionDate,
      currentUrn: 200001,
      predecessorUrns: [100001],
    });

    expect(result.classification).toBe('improved');
    expect(result.metrics.ks2CombinedExpectedPct.preAverage).toBe(59);
    expect(result.metrics.ks2CombinedExpectedPct.postAverage).toBe(69);
    expect(result.metrics.ks2CombinedExpectedPct.delta).toBe(10);
    expect(result.confidence.cautions).toEqual([]);
  });

  it('classifies too soon and cautions when conversion has too little post data', () => {
    const result = analyseAcademisationImpact({
      rows: [
        row(2022, { ks2CombinedExpectedPct: 55 }),
        row(2023, { ks2CombinedExpectedPct: 57 }),
        row(2024, { ks2CombinedExpectedPct: 60 }),
      ],
      conversionDate: '2023-09-01',
      currentUrn: 200001,
      predecessorUrns: [100001],
      asOfAcademicYearEnd: 2024,
    });

    expect(result.classification).toBe('too_soon');
    expect(result.confidence.cautions).toContain('too_recent');
    expect(result.confidence.cautions).toContain('insufficient_post_data');
  });

  it('classifies insufficient data and cautions when predecessor data is missing', () => {
    const result = analyseAcademisationImpact({
      rows: [
        row(2021, { ks2CombinedExpectedPct: 66 }),
        row(2022, { ks2CombinedExpectedPct: 67 }),
      ],
      conversionDate,
      currentUrn: 200001,
      predecessorUrns: [100001],
    });

    expect(result.classification).toBe('insufficient_data');
    expect(result.confidence.cautions).toContain('insufficient_pre_data');
    expect(result.confidence.cautions).toContain('missing_lineage');
  });

  it('adds demographic shift caution when pupil mix changes materially', () => {
    const result = analyseAcademisationImpact({
      rows: [
        row(2018, { ks2CombinedExpectedPct: 62, fsmPct: 18, ealPct: 20, senPct: 12, numberOnRoll: 210 }),
        row(2019, { ks2CombinedExpectedPct: 63, fsmPct: 19, ealPct: 21, senPct: 12, numberOnRoll: 212 }),
        row(2021, { ks2CombinedExpectedPct: 65, fsmPct: 36, ealPct: 35, senPct: 20, numberOnRoll: 290 }),
        row(2022, { ks2CombinedExpectedPct: 66, fsmPct: 37, ealPct: 36, senPct: 21, numberOnRoll: 300 }),
      ],
      conversionDate,
      currentUrn: 200001,
      predecessorUrns: [100001],
    });

    expect(result.confidence.cautions).toContain('demographic_shift');
    expect(result.metrics.fsmPct.delta).toBeGreaterThanOrEqual(15);
  });

  it('does not interpolate null values when averaging or counting data', () => {
    const result = analyseAcademisationImpact({
      rows: [
        row(2018, { ks2CombinedExpectedPct: 50 }),
        row(2019, { ks2CombinedExpectedPct: null }),
        row(2021, { ks2CombinedExpectedPct: null }),
        row(2022, { ks2CombinedExpectedPct: 60 }),
      ],
      conversionDate,
      currentUrn: 200001,
      predecessorUrns: [100001],
    });

    expect(result.metrics.ks2CombinedExpectedPct.preAverage).toBe(50);
    expect(result.metrics.ks2CombinedExpectedPct.postAverage).toBe(60);
    expect(result.metrics.ks2CombinedExpectedPct.preCount).toBe(1);
    expect(result.metrics.ks2CombinedExpectedPct.postCount).toBe(1);
    expect(result.confidence.cautions).toContain('suppressed_or_missing_values');
  });
});
