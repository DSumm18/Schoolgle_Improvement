export type AcademisationMetricKey =
  | 'ks2CombinedExpectedPct'
  | 'ks2ReadingExpectedPct'
  | 'ks2WritingExpectedPct'
  | 'ks2MathsExpectedPct'
  | 'attendancePct'
  | 'persistentAbsencePct'
  | 'fsmPct'
  | 'ealPct'
  | 'senPct'
  | 'numberOnRoll';

export type AcademisationClassification =
  | 'improved'
  | 'declined'
  | 'stable'
  | 'too_soon'
  | 'insufficient_data';

export type AcademisationCaution =
  | 'insufficient_pre_data'
  | 'insufficient_post_data'
  | 'too_recent'
  | 'demographic_shift'
  | 'missing_lineage'
  | 'suppressed_or_missing_values';

export type AcademisationMetricRow = {
  urn: number;
  academicYearEnd: number;
  ks2CombinedExpectedPct: number | null;
  ks2ReadingExpectedPct: number | null;
  ks2WritingExpectedPct: number | null;
  ks2MathsExpectedPct: number | null;
  attendancePct: number | null;
  persistentAbsencePct: number | null;
  fsmPct: number | null;
  ealPct: number | null;
  senPct: number | null;
  numberOnRoll: number | null;
};

export type AcademisationPeriodRows = {
  pre: AcademisationMetricRow[];
  post: AcademisationMetricRow[];
};

export type AcademisationMetricSummary = {
  key: AcademisationMetricKey;
  preAverage: number | null;
  postAverage: number | null;
  delta: number | null;
  preCount: number;
  postCount: number;
};

export type AcademisationImpactOutput = {
  classification: AcademisationClassification;
  metrics: Record<AcademisationMetricKey, AcademisationMetricSummary>;
  confidence: {
    cautions: AcademisationCaution[];
    preYears: number[];
    postYears: number[];
  };
};

export type AnalyseAcademisationImpactInput = {
  rows: AcademisationMetricRow[];
  conversionDate?: string | Date | null;
  conversionAcademicYearEnd?: number | null;
  currentUrn?: number | null;
  predecessorUrns?: number[];
  asOfAcademicYearEnd?: number;
  minPeriodDataPoints?: number;
};

const METRIC_KEYS: AcademisationMetricKey[] = [
  'ks2CombinedExpectedPct',
  'ks2ReadingExpectedPct',
  'ks2WritingExpectedPct',
  'ks2MathsExpectedPct',
  'attendancePct',
  'persistentAbsencePct',
  'fsmPct',
  'ealPct',
  'senPct',
  'numberOnRoll',
];

const OUTCOME_KEYS: AcademisationMetricKey[] = [
  'ks2CombinedExpectedPct',
  'ks2ReadingExpectedPct',
  'ks2WritingExpectedPct',
  'ks2MathsExpectedPct',
  'attendancePct',
  'persistentAbsencePct',
];

const DEMOGRAPHIC_KEYS: AcademisationMetricKey[] = [
  'fsmPct',
  'ealPct',
  'senPct',
  'numberOnRoll',
];

function toAcademicYearEnd(conversionDate?: string | Date | null) {
  if (!conversionDate) return null;
  const date = conversionDate instanceof Date ? conversionDate : new Date(conversionDate);
  if (!Number.isFinite(date.getTime())) return null;
  return date.getUTCFullYear();
}

function roundMetric(value: number) {
  return Math.round(value * 10) / 10;
}

function average(values: Array<number | null | undefined>) {
  const present = values.filter((value): value is number => Number.isFinite(value));
  if (present.length === 0) {
    return { value: null, count: 0 };
  }

  return {
    value: roundMetric(present.reduce((total, value) => total + value, 0) / present.length),
    count: present.length,
  };
}

function uniqueSortedYears(rows: AcademisationMetricRow[]) {
  return [...new Set(rows.map((row) => row.academicYearEnd))].sort((a, b) => a - b);
}

function summariseMetric(
  key: AcademisationMetricKey,
  preRows: AcademisationMetricRow[],
  postRows: AcademisationMetricRow[],
): AcademisationMetricSummary {
  const pre = average(preRows.map((row) => row[key]));
  const post = average(postRows.map((row) => row[key]));
  const delta = pre.value !== null && post.value !== null
    ? roundMetric(post.value - pre.value)
    : null;

  return {
    key,
    preAverage: pre.value,
    postAverage: post.value,
    delta,
    preCount: pre.count,
    postCount: post.count,
  };
}

function hasSuppressedOrMissingValues(rows: AcademisationMetricRow[]) {
  return METRIC_KEYS.some((key) => {
    const values = rows.map((row) => row[key]);
    const presentCount = values.filter((value) => Number.isFinite(value)).length;
    return presentCount > 0 && presentCount < values.length;
  });
}

function hasDemographicShift(metrics: Record<AcademisationMetricKey, AcademisationMetricSummary>) {
  return DEMOGRAPHIC_KEYS.some((key) => {
    const metric = metrics[key];
    if (metric.delta === null || metric.preAverage === null) return false;
    if (key === 'numberOnRoll') {
      return metric.preAverage > 0 && Math.abs(metric.delta / metric.preAverage) >= 0.2;
    }
    return Math.abs(metric.delta) >= 10;
  });
}

function hasMissingLineage(
  preRows: AcademisationMetricRow[],
  predecessorUrns: number[] | undefined,
) {
  if (!predecessorUrns || predecessorUrns.length === 0) return false;
  const predecessorSet = new Set(predecessorUrns);
  return !preRows.some((row) => predecessorSet.has(row.urn));
}

function hasEnoughOutcomeData(
  metrics: Record<AcademisationMetricKey, AcademisationMetricSummary>,
  minPeriodDataPoints: number,
) {
  return OUTCOME_KEYS.some((key) => {
    const metric = metrics[key];
    return metric.preCount >= minPeriodDataPoints && metric.postCount >= minPeriodDataPoints;
  });
}

function classifyImpact(
  metrics: Record<AcademisationMetricKey, AcademisationMetricSummary>,
  cautions: Set<AcademisationCaution>,
  minPeriodDataPoints: number,
): AcademisationClassification {
  if (cautions.has('too_recent')) return 'too_soon';
  if (
    cautions.has('insufficient_pre_data') ||
    cautions.has('insufficient_post_data') ||
    !hasEnoughOutcomeData(metrics, minPeriodDataPoints)
  ) {
    return 'insufficient_data';
  }

  const signals = OUTCOME_KEYS.flatMap((key) => {
    const metric = metrics[key];
    if (
      metric.delta === null ||
      metric.preCount < minPeriodDataPoints ||
      metric.postCount < minPeriodDataPoints
    ) {
      return [];
    }

    return key === 'persistentAbsencePct' ? [-metric.delta] : [metric.delta];
  });

  if (signals.length === 0) return 'insufficient_data';
  const averageSignal = signals.reduce((total, value) => total + value, 0) / signals.length;
  if (averageSignal >= 2) return 'improved';
  if (averageSignal <= -2) return 'declined';
  return 'stable';
}

export function splitRowsByConversion(
  rows: AcademisationMetricRow[],
  conversionDateOrAcademicYearEnd: string | Date | number | null | undefined,
): AcademisationPeriodRows {
  const conversionAcademicYearEnd = typeof conversionDateOrAcademicYearEnd === 'number'
    ? conversionDateOrAcademicYearEnd
    : toAcademicYearEnd(conversionDateOrAcademicYearEnd);

  if (conversionAcademicYearEnd === null) {
    return { pre: [], post: [...rows].sort((a, b) => a.academicYearEnd - b.academicYearEnd) };
  }

  const sortedRows = [...rows].sort((a, b) => a.academicYearEnd - b.academicYearEnd);
  return {
    pre: sortedRows.filter((row) => row.academicYearEnd <= conversionAcademicYearEnd),
    post: sortedRows.filter((row) => row.academicYearEnd > conversionAcademicYearEnd),
  };
}

export function analyseAcademisationImpact(
  input: AnalyseAcademisationImpactInput,
): AcademisationImpactOutput {
  const minPeriodDataPoints = input.minPeriodDataPoints ?? 2;
  const conversionAcademicYearEnd =
    input.conversionAcademicYearEnd ?? toAcademicYearEnd(input.conversionDate);
  const periods = splitRowsByConversion(input.rows, conversionAcademicYearEnd);
  const metrics = Object.fromEntries(
    METRIC_KEYS.map((key) => [key, summariseMetric(key, periods.pre, periods.post)]),
  ) as Record<AcademisationMetricKey, AcademisationMetricSummary>;

  const cautions = new Set<AcademisationCaution>();
  if (hasSuppressedOrMissingValues(input.rows)) cautions.add('suppressed_or_missing_values');
  if (hasDemographicShift(metrics)) cautions.add('demographic_shift');
  if (hasMissingLineage(periods.pre, input.predecessorUrns)) cautions.add('missing_lineage');

  const outcomePreYears = new Set<number>();
  const outcomePostYears = new Set<number>();
  for (const row of periods.pre) {
    if (OUTCOME_KEYS.some((key) => Number.isFinite(row[key]))) outcomePreYears.add(row.academicYearEnd);
  }
  for (const row of periods.post) {
    if (OUTCOME_KEYS.some((key) => Number.isFinite(row[key]))) outcomePostYears.add(row.academicYearEnd);
  }

  if (outcomePreYears.size < minPeriodDataPoints) cautions.add('insufficient_pre_data');
  if (outcomePostYears.size < minPeriodDataPoints) cautions.add('insufficient_post_data');

  const asOfAcademicYearEnd =
    input.asOfAcademicYearEnd ??
    Math.max(...input.rows.map((row) => row.academicYearEnd), conversionAcademicYearEnd ?? 0);
  if (
    conversionAcademicYearEnd !== null &&
    asOfAcademicYearEnd - conversionAcademicYearEnd < minPeriodDataPoints
  ) {
    cautions.add('too_recent');
  }

  return {
    classification: classifyImpact(metrics, cautions, minPeriodDataPoints),
    metrics,
    confidence: {
      cautions: [...cautions],
      preYears: uniqueSortedYears(periods.pre),
      postYears: uniqueSortedYears(periods.post),
    },
  };
}
