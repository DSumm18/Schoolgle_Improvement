// Canonical metrics for UK primary assessment captures.
// Mirrors the layout of the standard trust mid-year spreadsheet so the in-app
// grid reads identically. Shared by the API (validation) and UI (rendering).

export type SectionKey = 'cohort' | 'all_pupils' | 'fsm6' | 'not_fsm6';

export type MetricKey =
  | 'number_in_cohort' | 'number_send' | 'ehcp' | 'number_fsm'
  | 'r_are' | 'r_gd' | 'w_are' | 'w_gd' | 'm_are' | 'm_gd' | 'c_are' | 'c_gd'
  | 'phonics' | 'mtc' | 'gld';

export const YEAR_GROUPS = ['EYFS', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6'] as const;
export type YearGroup = (typeof YEAR_GROUPS)[number];

export interface MetricDef {
  key: MetricKey;
  label: string;        // short column header (e.g. "R ARE")
  longLabel: string;    // full description (e.g. "Reading at expected standard")
  type: 'count' | 'pct';
  help: string;         // tooltip — why we collect it
  feeds: string;        // where it appears in the report
}

// Cohort columns (same for every year group)
export const COHORT_METRICS: MetricDef[] = [
  { key: 'number_in_cohort', label: 'Cohort', longLabel: 'Number in cohort', type: 'count',
    help: 'Total pupils in this year group as of the capture date. Used to weight every percentage below and to compute trust-wide totals.',
    feeds: 'Total pupils, cohort size warnings for small year groups' },
  { key: 'number_send', label: 'SEND', longLabel: 'Number with SEND (inc. EHCP)', type: 'count',
    help: 'Pupils on the SEN register, including SEN Support and EHCP. EEF research shows SEND pupils attain ~30pp below peers at KS2 — we use this to contextualise attainment and flag when the gap is widening.',
    feeds: 'Demographic context, EEF gap analysis, governor questions' },
  { key: 'ehcp', label: 'EHCP', longLabel: 'Pupils with EHCPs', type: 'count',
    help: 'Pupils with an Education, Health and Care Plan (highest tier of SEN support). Required separately from SEND total for funding reconciliation and LA benchmarking.',
    feeds: 'SEND Hub, funding alignment' },
  { key: 'number_fsm', label: 'FSM', longLabel: 'Free School Meals (FSM6)', type: 'count',
    help: 'Pupils eligible for Free School Meals under the FSM6 (ever-6) measure. Primary indicator of disadvantage used by DfE and EEF; drives Pupil Premium allocation.',
    feeds: 'FSM % trust-wide, disadvantage gap analysis, Pupil Premium tracking' },
];

// Attainment column set, per year group.
// EYFS uses GLD only. Y3, Y5 are core 8 (no phonics/MTC). Y1/Y2 add Phonics.
// Y4 adds MTC. Y6 is core 8 and contributes to KS2 track record.
export const YEAR_GROUP_METRICS: Record<YearGroup, MetricDef[]> = {
  EYFS: [
    { key: 'gld', label: 'GLD', longLabel: 'Good Level of Development', type: 'pct',
      help: 'EYFS statutory outcome — % of children achieving the expected standard across the 17 Early Learning Goals. Sets the baseline for KS1 trajectory.',
      feeds: 'EYFS outcome tracking, Y1 baseline context' },
  ],
  'Year 1': coreAttainmentPlus('phonics', 'Phonics', 'Phonics screening check', 'Year 1 statutory phonics check — % passing. Predictor of Y2 reading ARE and long-term reading outcomes.'),
  'Year 2': coreAttainmentPlus('phonics', 'Phonics', 'Phonics screening retake', 'Pupils who did not pass in Y1 retake in Y2. % passing at retake is monitored for early reading intervention impact.'),
  'Year 3': coreAttainment(),
  'Year 4': coreAttainmentPlus('mtc', 'MTC', 'Multiplication Tables Check', 'Y4 statutory times-tables check — % scoring 20+/25. Predictor of Y6 maths ARE and KS2 Combined.'),
  'Year 5': coreAttainment(),
  'Year 6': coreAttainment(),
};

function coreAttainment(): MetricDef[] {
  return [
    { key: 'r_are', label: 'R ARE', longLabel: 'Reading — Age-Related Expectation', type: 'pct',
      help: '% of pupils working at or above the expected standard in Reading. One of the four core attainment measures.',
      feeds: 'Traffic-light grid, heatmap, Y6 radar, KS2 prediction' },
    { key: 'r_gd', label: 'R GD', longLabel: 'Reading — Greater Depth', type: 'pct',
      help: '% working at greater depth in Reading (above ARE). GD Reading should track broadly with GD Maths — large mismatches flag moderation drift.',
      feeds: 'GD forensic review, moderation challenge' },
    { key: 'w_are', label: 'W ARE', longLabel: 'Writing — Age-Related Expectation', type: 'pct',
      help: '% at or above expected in Writing. The weakest of the four subjects for most schools nationally — watch the R-W gap.',
      feeds: 'Traffic-light grid, heatmap, subject profile' },
    { key: 'w_gd', label: 'W GD', longLabel: 'Writing — Greater Depth', type: 'pct',
      help: '% at greater depth in Writing. 0% GD Writing across multiple year groups is a systemic flag — either curriculum challenge or moderation practice.',
      feeds: 'GD forensic review, Zero-GD alert' },
    { key: 'm_are', label: 'M ARE', longLabel: 'Maths — Age-Related Expectation', type: 'pct',
      help: '% at or above expected in Maths.',
      feeds: 'Traffic-light grid, heatmap, subject profile' },
    { key: 'm_gd', label: 'M GD', longLabel: 'Maths — Greater Depth', type: 'pct',
      help: '% at greater depth in Maths.',
      feeds: 'GD forensic review' },
    { key: 'c_are', label: 'C ARE', longLabel: 'Combined (R+W+M) — Age-Related', type: 'pct',
      help: 'Combined headline measure — % achieving ARE in Reading, Writing AND Maths. This is the headline figure for Ofsted and the trust board.',
      feeds: 'KS2 track record chart, headline figures, narrative lead' },
    { key: 'c_gd', label: 'C GD', longLabel: 'Combined — Greater Depth', type: 'pct',
      help: '% achieving GD in all three subjects. Very small numbers typical — treat swings as statistical noise below 5pp.',
      feeds: 'GD forensic review' },
  ];
}

function coreAttainmentPlus(extraKey: MetricKey, extraLabel: string, extraLong: string, extraHelp: string): MetricDef[] {
  return [...coreAttainment(), {
    key: extraKey,
    label: extraLabel,
    longLabel: extraLong,
    type: 'pct',
    help: extraHelp,
    feeds: 'Statutory outcome tracking',
  }];
}

export const SECTIONS: Array<{ key: Exclude<SectionKey, 'cohort'>; label: string; help: string }> = [
  { key: 'all_pupils', label: 'All Pupils', help: 'Whole year group, no filter applied.' },
  { key: 'fsm6', label: 'FSM6', help: 'Pupils eligible for FSM under the ever-6 measure. Gap vs non-FSM is the disadvantage signal.' },
  { key: 'not_fsm6', label: 'Not FSM6', help: 'Pupils not eligible for FSM — the comparison group for disadvantage gap analysis.' },
];

// Validation: returns an error string if the value is out of range for the metric, else null.
export function validateCell(def: MetricDef, raw: string | number | null | undefined, cohortSize?: number | null): string | null {
  if (raw === null || raw === undefined || raw === '') return null;
  const n = typeof raw === 'number' ? raw : Number(String(raw).replace(/[%,\s]/g, ''));
  if (!Number.isFinite(n)) return 'Not a number';
  if (def.type === 'pct') {
    if (n < 0 || n > 100) return 'Percentage must be between 0 and 100';
  }
  if (def.type === 'count') {
    if (n < 0) return 'Count cannot be negative';
    if (!Number.isInteger(n)) return 'Count must be a whole number';
    if (cohortSize !== null && cohortSize !== undefined && n > cohortSize) return `Cannot exceed cohort size (${cohortSize})`;
  }
  return null;
}
