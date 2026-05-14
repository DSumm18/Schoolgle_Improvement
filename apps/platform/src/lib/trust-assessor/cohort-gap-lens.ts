export type CohortGapSubject =
  | "reading"
  | "writing"
  | "maths"
  | "combinedRwm";

export type CohortGapRecord = {
  pupilHash: string;
  subject: string;
  attainmentLevel: string | null;
  academicYearStart: number;
  yearGroup?: number | null;
  assessmentPeriod?: string | null;
};

export type CohortGapDemographics = {
  isFsm: boolean;
  isSend: boolean;
  isEal: boolean;
};

export type CohortGapAttainment = Record<
  CohortGapSubject,
  {
      atExpected: number;
      total: number;
      pct: number | null;
      greaterDepth: number;
      greaterDepthPct: number | null;
  }
>;

export type CohortGapComparison = {
  key: "fsm" | "send" | "eal";
  groupLabel: string;
  comparatorLabel: string;
  groupCount: number;
  comparatorCount: number;
  groupAttainment: CohortGapAttainment;
  comparatorAttainment: CohortGapAttainment;
  combinedGapPp: number | null;
  largestSubjectGap: {
    subject: Exclude<CohortGapSubject, "combinedRwm">;
    gapPp: number | null;
  };
  confidence: "strong" | "limited" | "unavailable";
  ofstedArea: "Quality of Education" | "Leadership and Management";
  narrative: string;
};

export type CohortGapLens = {
  latestYear: number | null;
  yearGroup: number | null;
  yearGroupLabel: string;
  assessmentPeriod: string | null;
  assessedPupilCount: number;
  rwmEligiblePupilCount: number;
  source: string;
  caveat: string;
  comparisons: CohortGapComparison[];
};

const SUBJECTS = ["reading", "writing", "maths"] as const;
const EXPECTED_LEVELS = new Set([
  "EXS",
  "GDS",
  "2",
  "3",
  "ELG",
  "M",
  "E",
  "P",
  "EXPECTED",
  "GREATER_DEPTH",
  "GD",
  "SECURE",
]);
const GREATER_DEPTH_LEVELS = new Set(["GDS", "3", "GREATER_DEPTH", "GD"]);

export function buildCohortGapLens({
  records,
  getDemographics,
  minimumGroupSize = 5,
  source = "pupil_assessments_pseudo enriched from Schoolgle pupil profile flags",
}: {
  records: CohortGapRecord[];
  getDemographics: (pupilHash: string) => CohortGapDemographics;
  minimumGroupSize?: number;
  source?: string;
}): CohortGapLens {
  const selectedCohort = latestCompleteRwmCohort(records);
  const fallbackYear = latestAcademicYear(records);
  const selectedYear = selectedCohort?.academicYearStart ?? fallbackYear;
  if (selectedYear === null) {
    return {
      latestYear: selectedYear,
      yearGroup: null,
      yearGroupLabel: "No cohort",
      assessmentPeriod: null,
      assessedPupilCount: 0,
      rwmEligiblePupilCount: 0,
      source,
      caveat:
        "No pupil-level assessment rows were available, so cohort-gap analysis could not be calculated.",
      comparisons: [],
    };
  }

  const latestRecords = dedupeSubjectRecords(
    records.filter(
      (record) =>
        record.academicYearStart === selectedYear &&
        (selectedCohort?.yearGroup === undefined ||
          selectedCohort?.yearGroup === null ||
          record.yearGroup === selectedCohort.yearGroup) &&
        SUBJECTS.includes(record.subject.toLowerCase() as (typeof SUBJECTS)[number]),
    ),
  );
  const pupilHashes = Array.from(
    new Set(latestRecords.map((record) => record.pupilHash)),
  );
  const rwmEligiblePupilCount = pupilHashes.filter((hash) =>
    SUBJECTS.every((subject) =>
      latestRecords.some(
        (record) =>
          record.pupilHash === hash &&
          record.subject.toLowerCase() === subject,
      ),
    ),
  ).length;

  const definitions = [
    {
      key: "fsm" as const,
      groupLabel: "FSM / disadvantaged",
      comparatorLabel: "Non-FSM",
      predicate: (demographics: CohortGapDemographics) => demographics.isFsm,
      ofstedArea: "Quality of Education" as const,
    },
    {
      key: "send" as const,
      groupLabel: "SEND",
      comparatorLabel: "Non-SEND",
      predicate: (demographics: CohortGapDemographics) => demographics.isSend,
      ofstedArea: "Leadership and Management" as const,
    },
    {
      key: "eal" as const,
      groupLabel: "EAL",
      comparatorLabel: "Non-EAL",
      predicate: (demographics: CohortGapDemographics) => demographics.isEal,
      ofstedArea: "Quality of Education" as const,
    },
  ];

  const comparisons = definitions.map((definition) => {
    const groupHashes = pupilHashes.filter((hash) =>
      definition.predicate(getDemographics(hash)),
    );
    const comparatorHashes = pupilHashes.filter(
      (hash) => !definition.predicate(getDemographics(hash)),
    );
    const groupAttainment = computeAttainment(latestRecords, groupHashes);
    const comparatorAttainment = computeAttainment(
      latestRecords,
      comparatorHashes,
    );
    const combinedGapPp = gap(
      groupAttainment.combinedRwm.pct,
      comparatorAttainment.combinedRwm.pct,
    );
    const largestSubjectGap = findLargestSubjectGap(
      groupAttainment,
      comparatorAttainment,
    );
    const confidence = confidenceFor(
      groupHashes.length,
      comparatorHashes.length,
      minimumGroupSize,
      combinedGapPp,
    );

    return {
      key: definition.key,
      groupLabel: definition.groupLabel,
      comparatorLabel: definition.comparatorLabel,
      groupCount: groupHashes.length,
      comparatorCount: comparatorHashes.length,
      groupAttainment,
      comparatorAttainment,
      combinedGapPp,
      largestSubjectGap,
      confidence,
      ofstedArea: definition.ofstedArea,
      narrative: buildNarrative({
        groupLabel: definition.groupLabel,
        comparatorLabel: definition.comparatorLabel,
        groupCount: groupHashes.length,
        comparatorCount: comparatorHashes.length,
        combinedGapPp,
        confidence,
      }),
    } satisfies CohortGapComparison;
  });

  return {
    latestYear: selectedYear,
    yearGroup: selectedCohort?.yearGroup ?? null,
    yearGroupLabel: yearGroupLabel(selectedCohort?.yearGroup ?? null),
    assessmentPeriod: selectedCohort?.assessmentPeriod ?? null,
    assessedPupilCount: pupilHashes.length,
    rwmEligiblePupilCount,
    source,
    caveat: selectedCohort
      ? `This uses the latest complete Reading, Writing and Maths pupil-level import for ${yearGroupLabel(selectedCohort.yearGroup)}${selectedCohort.assessmentPeriod ? ` (${selectedCohort.assessmentPeriod})` : ""}. Combined RWM+ requires the same pupil to be at expected+ in all three subjects together. Small cohorts are conversation starters, not judgements.`
      : "No complete Reading, Writing and Maths pupil-level import was found, so this uses the latest available subject evidence only. Combined RWM+ is unavailable until all three subjects are present.",
    comparisons,
  };
}

function latestAcademicYear(records: CohortGapRecord[]): number | null {
  const years = records
    .map((record) => record.academicYearStart)
    .filter((year) => Number.isFinite(year));
  return years.length > 0 ? Math.max(...years) : null;
}

function latestCompleteRwmCohort(records: CohortGapRecord[]): {
  academicYearStart: number;
  yearGroup: number | null;
  assessmentPeriod: string | null;
} | null {
  const cohorts = new Map<
    string,
    {
      academicYearStart: number;
      yearGroup: number | null;
      assessmentPeriod: string | null;
      records: CohortGapRecord[];
    }
  >();

  for (const record of records) {
    const subject = record.subject.toLowerCase();
    if (!SUBJECTS.includes(subject as (typeof SUBJECTS)[number])) continue;
    const yearGroup = record.yearGroup ?? null;
    const assessmentPeriod = record.assessmentPeriod ?? null;
    const key = `${record.academicYearStart}|${yearGroup ?? "unknown"}|${assessmentPeriod ?? ""}`;
    const cohort = cohorts.get(key) ?? {
      academicYearStart: record.academicYearStart,
      yearGroup,
      assessmentPeriod,
      records: [],
    };
    cohort.records.push(record);
    cohorts.set(key, cohort);
  }

  return Array.from(cohorts.values())
    .filter((cohort) => {
      const pupilHashes = Array.from(
        new Set(cohort.records.map((record) => record.pupilHash)),
      );
      return pupilHashes.some((hash) =>
        SUBJECTS.every((subject) =>
          cohort.records.some(
            (record) =>
              record.pupilHash === hash &&
              record.subject.toLowerCase() === subject,
          ),
        ),
      );
    })
    .sort((a, b) => {
      if (b.academicYearStart !== a.academicYearStart) {
        return b.academicYearStart - a.academicYearStart;
      }
      return (b.yearGroup ?? -1) - (a.yearGroup ?? -1);
    })[0] ?? null;
}

function dedupeSubjectRecords(records: CohortGapRecord[]): CohortGapRecord[] {
  const byPupilSubject = new Map<string, CohortGapRecord>();
  for (const record of records) {
    const key = `${record.pupilHash}:${record.subject.toLowerCase()}`;
    if (!byPupilSubject.has(key)) {
      byPupilSubject.set(key, record);
    }
  }
  return Array.from(byPupilSubject.values());
}

function computeAttainment(
  records: CohortGapRecord[],
  pupilHashes: string[],
): CohortGapAttainment {
  const subjectAttainment = Object.fromEntries(
    SUBJECTS.map((subject) => {
      const subjectRecords = records.filter(
        (record) =>
          pupilHashes.includes(record.pupilHash) &&
          record.subject.toLowerCase() === subject,
      );
      const atExpected = subjectRecords.filter((record) =>
        isAtExpected(record.attainmentLevel),
      ).length;
      const greaterDepth = subjectRecords.filter((record) =>
        isGreaterDepth(record.attainmentLevel),
      ).length;
      return [
        subject,
        {
          atExpected,
          total: subjectRecords.length,
          pct: percentage(atExpected, subjectRecords.length),
          greaterDepth,
          greaterDepthPct: percentage(greaterDepth, subjectRecords.length),
        },
      ];
    }),
  ) as Record<Exclude<CohortGapSubject, "combinedRwm">, CohortGapAttainment["reading"]>;

  const combinedEligible = pupilHashes.filter((hash) =>
    SUBJECTS.every((subject) =>
      records.some(
        (record) =>
          record.pupilHash === hash && record.subject.toLowerCase() === subject,
      ),
    ),
  );
  const combinedAtExpected = combinedEligible.filter((hash) =>
    SUBJECTS.every((subject) =>
      records.some(
        (record) =>
          record.pupilHash === hash &&
          record.subject.toLowerCase() === subject &&
          isAtExpected(record.attainmentLevel),
      ),
    ),
  ).length;
  const combinedGreaterDepth = combinedEligible.filter((hash) =>
    SUBJECTS.every((subject) =>
      records.some(
        (record) =>
          record.pupilHash === hash &&
          record.subject.toLowerCase() === subject &&
          isGreaterDepth(record.attainmentLevel),
      ),
    ),
  ).length;

  return {
    ...subjectAttainment,
    combinedRwm: {
      atExpected: combinedAtExpected,
      total: combinedEligible.length,
      pct: percentage(combinedAtExpected, combinedEligible.length),
      greaterDepth: combinedGreaterDepth,
      greaterDepthPct: percentage(combinedGreaterDepth, combinedEligible.length),
    },
  };
}

function isAtExpected(value: string | null): boolean {
  return EXPECTED_LEVELS.has(String(value ?? "").trim().toUpperCase());
}

function isGreaterDepth(value: string | null): boolean {
  return GREATER_DEPTH_LEVELS.has(String(value ?? "").trim().toUpperCase());
}

function yearGroupLabel(yearGroup: number | null): string {
  if (yearGroup === null) return "selected cohort";
  if (yearGroup === 0) return "Reception";
  return `Year ${yearGroup}`;
}

function percentage(numerator: number, denominator: number): number | null {
  if (denominator === 0) return null;
  return Math.round((numerator / denominator) * 1000) / 10;
}

function gap(groupPct: number | null, comparatorPct: number | null): number | null {
  if (groupPct === null || comparatorPct === null) return null;
  return Math.round((comparatorPct - groupPct) * 10) / 10;
}

function findLargestSubjectGap(
  groupAttainment: CohortGapAttainment,
  comparatorAttainment: CohortGapAttainment,
): CohortGapComparison["largestSubjectGap"] {
  return SUBJECTS.map((subject) => ({
    subject,
    gapPp: gap(groupAttainment[subject].pct, comparatorAttainment[subject].pct),
  })).sort((a, b) => Math.abs(b.gapPp ?? 0) - Math.abs(a.gapPp ?? 0))[0];
}

function confidenceFor(
  groupCount: number,
  comparatorCount: number,
  minimumGroupSize: number,
  combinedGapPp: number | null,
): CohortGapComparison["confidence"] {
  if (combinedGapPp === null || groupCount === 0 || comparatorCount === 0) {
    return "unavailable";
  }
  if (groupCount < minimumGroupSize || comparatorCount < minimumGroupSize) {
    return "limited";
  }
  return "strong";
}

function buildNarrative({
  groupLabel,
  comparatorLabel,
  groupCount,
  comparatorCount,
  combinedGapPp,
  confidence,
}: {
  groupLabel: string;
  comparatorLabel: string;
  groupCount: number;
  comparatorCount: number;
  combinedGapPp: number | null;
  confidence: CohortGapComparison["confidence"];
}): string {
  if (confidence === "unavailable" || combinedGapPp === null) {
    return `${groupLabel} and ${comparatorLabel} cannot be compared yet because one side has no complete Reading, Writing and Maths record in the latest pupil-level import.`;
  }

  const caveat =
    confidence === "limited"
      ? ` Cohort size is small (${groupCount} vs ${comparatorCount}), so use this as a prompt for evidence review.`
      : "";

  if (Math.abs(combinedGapPp) < 5) {
    return `${groupLabel} and ${comparatorLabel} are broadly aligned for Combined RWM+ in the latest pupil-level import.${caveat}`;
  }

  if (combinedGapPp > 0) {
    return `${comparatorLabel} pupils are ${combinedGapPp}pp ahead of ${groupLabel} pupils for Combined RWM+. This should trigger a provision and progress-evidence conversation, not a judgement about the pupils.${caveat}`;
  }

  return `${groupLabel} pupils are ${Math.abs(combinedGapPp)}pp ahead of ${comparatorLabel} pupils for Combined RWM+. Treat this as a strength to evidence in Ofsted readiness.${caveat}`;
}
