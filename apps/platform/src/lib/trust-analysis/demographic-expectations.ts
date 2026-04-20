/**
 * Demographic Expectation Model
 * Predicts expected attainment at each year group based on school demographics.
 * Based on DfE National Statistics 2022/23 and EEF disadvantage attainment gap data.
 */

export interface SchoolDemographics {
  fsmPct: number;
  sendPct: number;
  ealPct: number;
}

// National average attainment at expected standard (2022/23 DfE published)
export const NATIONAL_BASELINES = {
  Y1_phonics: 79,
  Y2_reading: 68,
  Y2_writing: 60,
  Y2_maths: 70,
  Y2_combined: 56,
  Y6_reading: 73,
  Y6_writing: 71,
  Y6_maths: 73,
  Y6_combined: 60,
} as const;

// Demographic gaps at expected standard (pp below national average)
// Published DfE/EEF data
export const DEMOGRAPHIC_GAPS = {
  fsm: { ks1: 18, ks2: 20 },
  send: { ks1: 25, ks2: 30 },
  // EAL gap varies dramatically by year group because of language development
  eal: {
    Y1: 20, Y2: 15, Y3: 8, Y4: 4, Y5: 0, Y6: -2, // negative = EAL pupils exceed peers
  },
} as const;

export type YearGroupShort = 'Y1' | 'Y2' | 'Y3' | 'Y4' | 'Y5' | 'Y6';
export type SubjectKey = 'reading' | 'writing' | 'maths' | 'combined';

/**
 * Calculate expected attainment at expected standard given demographics and year group.
 * Returns a prediction with low-high range accounting for uncertainty.
 */
export function demographicExpectation(
  demographics: SchoolDemographics,
  yearGroup: YearGroupShort,
  subject: SubjectKey,
): { expected: number; low: number; high: number; baseline: number; adjustments: { factor: string; pp: number }[] } {
  // Get national baseline
  let baseline: number;
  if (yearGroup === 'Y2') {
    baseline = subject === 'reading' ? NATIONAL_BASELINES.Y2_reading :
               subject === 'writing' ? NATIONAL_BASELINES.Y2_writing :
               subject === 'maths' ? NATIONAL_BASELINES.Y2_maths :
               NATIONAL_BASELINES.Y2_combined;
  } else if (yearGroup === 'Y6') {
    baseline = subject === 'reading' ? NATIONAL_BASELINES.Y6_reading :
               subject === 'writing' ? NATIONAL_BASELINES.Y6_writing :
               subject === 'maths' ? NATIONAL_BASELINES.Y6_maths :
               NATIONAL_BASELINES.Y6_combined;
  } else {
    // For Y1/Y3/Y4/Y5, interpolate between KS1 and KS2 baselines
    const ks1 = subject === 'reading' ? NATIONAL_BASELINES.Y2_reading :
                subject === 'writing' ? NATIONAL_BASELINES.Y2_writing :
                subject === 'maths' ? NATIONAL_BASELINES.Y2_maths :
                NATIONAL_BASELINES.Y2_combined;
    const ks2 = subject === 'reading' ? NATIONAL_BASELINES.Y6_reading :
                subject === 'writing' ? NATIONAL_BASELINES.Y6_writing :
                subject === 'maths' ? NATIONAL_BASELINES.Y6_maths :
                NATIONAL_BASELINES.Y6_combined;
    // Linear interpolation: Y1=0, Y2=0.2, Y3=0.4, Y4=0.6, Y5=0.8, Y6=1.0
    const progress: Record<YearGroupShort, number> = { Y1: 0, Y2: 0.2, Y3: 0.4, Y4: 0.6, Y5: 0.8, Y6: 1.0 };
    baseline = Math.round(ks1 + (ks2 - ks1) * progress[yearGroup]);
  }

  const adjustments: { factor: string; pp: number }[] = [];

  // FSM adjustment
  const stage = yearGroup === 'Y1' || yearGroup === 'Y2' ? 'ks1' : 'ks2';
  const fsmGap = DEMOGRAPHIC_GAPS.fsm[stage];
  const fsmAdjustment = -(demographics.fsmPct / 100) * fsmGap;
  adjustments.push({ factor: `FSM ${demographics.fsmPct}%`, pp: Math.round(fsmAdjustment) });

  // SEND adjustment
  const sendGap = DEMOGRAPHIC_GAPS.send[stage];
  const sendAdjustment = -(demographics.sendPct / 100) * sendGap;
  adjustments.push({ factor: `SEND ${demographics.sendPct}%`, pp: Math.round(sendAdjustment) });

  // EAL adjustment (year-group specific — this is the clever bit)
  const ealGap = DEMOGRAPHIC_GAPS.eal[yearGroup];
  const ealAdjustment = -(demographics.ealPct / 100) * ealGap;
  adjustments.push({ factor: `EAL ${demographics.ealPct}% at ${yearGroup}`, pp: Math.round(ealAdjustment) });

  const expected = Math.round(baseline + adjustments.reduce((sum, a) => sum + a.pp, 0));
  // ±5pp confidence band for school-level variation
  const low = Math.max(0, expected - 5);
  const high = Math.min(100, expected + 5);

  return { expected, low, high, baseline, adjustments };
}

/**
 * Classify reported vs expected attainment.
 * Returns a verdict string and a severity.
 */
export function classifyAttainment(
  reported: number | null,
  expected: { low: number; high: number; expected: number },
): { verdict: 'accurate' | 'over-reported' | 'under-reported' | 'no-data'; severity: 'low' | 'medium' | 'high'; gap: number } {
  if (reported === null || reported === undefined) {
    return { verdict: 'no-data', severity: 'low', gap: 0 };
  }
  // Round to 1dp to absorb float-subtraction artefacts (e.g. 56.7 - 28 = 28.700000000000003).
  const gap = Math.round((reported - expected.expected) * 10) / 10;
  const absGap = Math.abs(gap);
  if (absGap <= 5) return { verdict: 'accurate', severity: 'low', gap };
  if (gap > 5 && gap <= 10) return { verdict: 'over-reported', severity: 'medium', gap };
  if (gap > 10) return { verdict: 'over-reported', severity: 'high', gap };
  if (gap < -5 && gap >= -10) return { verdict: 'under-reported', severity: 'medium', gap };
  return { verdict: 'under-reported', severity: 'high', gap };
}

/**
 * EAL Trajectory — shows expected improvement as language develops.
 */
export function getEalTrajectory(
  ealPct: number,
  fsmPct: number,
  sendPct: number,
  subject: SubjectKey = 'combined',
) {
  const yearGroups: YearGroupShort[] = ['Y1', 'Y2', 'Y3', 'Y4', 'Y5', 'Y6'];
  return yearGroups.map((yg) => {
    const pred = demographicExpectation({ fsmPct, sendPct, ealPct }, yg, subject);
    return { yearGroup: yg, expected: pred.expected, low: pred.low, high: pred.high };
  });
}

/**
 * Determine overall forensic verdict given an array of year-group classifications.
 */
export function computeForensicVerdict(
  yearAnalysis: { verdict: 'accurate' | 'over-reported' | 'under-reported' | 'no-data'; severity: 'low' | 'medium' | 'high' }[],
): {
  label: string;
  color: 'red' | 'amber' | 'green' | 'blue';
  interpretation: string;
} {
  const overReported = yearAnalysis.filter((y) => y.verdict === 'over-reported').length;
  const underReported = yearAnalysis.filter((y) => y.verdict === 'under-reported').length;
  const accurate = yearAnalysis.filter((y) => y.verdict === 'accurate').length;
  const total = yearAnalysis.filter((y) => y.verdict !== 'no-data').length;

  if (total === 0) {
    return { label: 'INSUFFICIENT DATA', color: 'blue', interpretation: 'Not enough data points to determine an assessment pattern.' };
  }

  if (overReported >= 4) {
    return {
      label: 'SYSTEMATIC OVER-ASSESSMENT',
      color: 'red',
      interpretation: `${overReported} of ${total} year groups are reporting attainment significantly above what demographics predict. This is a strong indicator of systematic over-assessment — assessments are not being moderated against national expectations.`,
    };
  }

  if (underReported >= 4) {
    return {
      label: 'CONSISTENTLY CAUTIOUS ASSESSMENT',
      color: 'blue',
      interpretation: `${underReported} of ${total} year groups report attainment below demographic prediction. Either this school faces challenges beyond the measured demographics, or teacher assessment is cautious. Investigate whether provision matches need.`,
    };
  }

  if (overReported >= 2 && overReported <= 3) {
    return {
      label: 'ASSESSMENT DRIFT',
      color: 'amber',
      interpretation: `${overReported} year groups show attainment above demographic prediction. This could indicate genuine improvement — or inconsistent moderation in those year groups. Spot-check those cohorts.`,
    };
  }

  return {
    label: 'ACCURATELY ASSESSED',
    color: 'green',
    interpretation: `${accurate} of ${total} year groups are within the expected range for this school's demographic profile. Assessment appears proportionate to intake.`,
  };
}
