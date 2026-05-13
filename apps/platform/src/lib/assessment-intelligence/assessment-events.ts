import type {
  AssessmentSourceLabelInput,
  CanonicalAssessmentLevel,
  CombinedRwmInput,
  CombinedRwmResult,
  ManualSnapshotInput,
  NormalisedAssessmentLevel,
  PupilAssessmentEvent,
} from "./types";

const LEVEL_ALIASES: Array<{
  patterns: string[];
  canonicalLevel: CanonicalAssessmentLevel;
  isAtExpected: boolean;
  isGreaterDepth: boolean;
}> = [
  {
    patterns: ["gds", "gd", "greater depth", "greater_depth", "exceeding", "exs+"],
    canonicalLevel: "greater_depth",
    isAtExpected: true,
    isGreaterDepth: true,
  },
  {
    patterns: ["exs", "exp", "expected", "secure", "borderline exs", "at expected", "2"],
    canonicalLevel: "expected",
    isAtExpected: true,
    isGreaterDepth: false,
  },
  {
    patterns: ["wts", "working towards", "working_towards", "towards"],
    canonicalLevel: "working_towards",
    isAtExpected: false,
    isGreaterDepth: false,
  },
  {
    patterns: ["below", "below expected", "emerging", "pk", "pre-key", "1"],
    canonicalLevel: "below_expected",
    isAtExpected: false,
    isGreaterDepth: false,
  },
];

export function normaliseAssessmentLevel(rawLevel: string): NormalisedAssessmentLevel {
  const normalised = rawLevel.trim().toLowerCase();
  const match = LEVEL_ALIASES.find((entry) =>
    entry.patterns.some((pattern) => normalised === pattern || normalised.includes(pattern)),
  );

  return {
    rawLevel,
    canonicalLevel: match?.canonicalLevel ?? "unknown",
    isAtExpected: match?.isAtExpected ?? false,
    isGreaterDepth: match?.isGreaterDepth ?? false,
  };
}

export function buildAssessmentSourceLabel(input: AssessmentSourceLabelInput): string {
  const yearLabel = `${input.academicYearStart}/${String(input.academicYearStart + 1).slice(2)}`;

  if (input.sourceKind === "manual_snapshot") {
    const lockLabel = input.validationTier === "teacher_locked" ? "teacher locked" : input.validationTier.replaceAll("_", " ");
    return `Source: manual teacher judgement, ${input.assessmentPeriod} ${yearLabel}, ${lockLabel}`;
  }

  if (input.sourceKind === "assessment_creator") {
    const tierLabel = input.validationTier === "teacher_reviewed_ai" ? "teacher-reviewed AI" : input.validationTier.replaceAll("_", " ");
    return `Source: Assessment Creator evidence, ${input.assessmentPeriod} ${yearLabel}, ${tierLabel}`;
  }

  if (input.sourceKind === "dfe_validated") {
    return `Source: DfE validated assessment data, ${input.assessmentPeriod} ${yearLabel}`;
  }

  const kindLabel = input.sourceKind.replaceAll("_", " ");
  const tierLabel = input.validationTier.replaceAll("_", " ");
  return `Source: ${kindLabel}, ${input.assessmentPeriod} ${yearLabel}, ${tierLabel}`;
}

export function calculateCombinedRwm(events: CombinedRwmInput[]): CombinedRwmResult {
  const byPupil = new Map<string, Partial<Record<"reading" | "writing" | "maths", boolean>>>();

  for (const event of events) {
    const existing = byPupil.get(event.pupilHash) ?? {};
    existing[event.subject] = event.isAtExpected;
    byPupil.set(event.pupilHash, existing);
  }

  let denominator = 0;
  let combinedCount = 0;
  let excludedIncompletePupils = 0;

  for (const subjects of byPupil.values()) {
    if (
      subjects.reading === undefined ||
      subjects.writing === undefined ||
      subjects.maths === undefined
    ) {
      excludedIncompletePupils += 1;
      continue;
    }
    denominator += 1;
    if (subjects.reading && subjects.writing && subjects.maths) {
      combinedCount += 1;
    }
  }

  return {
    denominator,
    combinedCount,
    combinedPct: denominator > 0 ? Math.round((combinedCount / denominator) * 1000) / 10 : null,
    excludedIncompletePupils,
  };
}

export function buildManualSnapshotEvents(input: ManualSnapshotInput): PupilAssessmentEvent[] {
  const sourceLabel = buildAssessmentSourceLabel({
    sourceKind: "manual_snapshot",
    assessmentPeriod: input.assessmentPeriod,
    academicYearStart: input.academicYearStart,
    validationTier: "teacher_locked",
  });

  return input.rows.map((row) => {
    const level = normaliseAssessmentLevel(row.rawLevel);
    return {
      organizationId: input.organizationId,
      schoolUrn: input.schoolUrn,
      sourceBatchId: input.sourceBatchId,
      sourceKind: "manual_snapshot",
      sourceLabel,
      validationTier: "teacher_locked",
      pupilHash: row.pupilHash,
      classId: input.classId,
      className: input.className,
      yearGroupAtAssessment: row.yearGroupAtAssessment,
      academicYearStart: input.academicYearStart,
      assessmentPeriod: input.assessmentPeriod,
      assessmentDate: input.assessmentDate,
      subject: input.subject,
      rawLevel: row.rawLevel,
      canonicalLevel: level.canonicalLevel,
      isAtExpected: level.isAtExpected,
      isGreaterDepth: level.isGreaterDepth,
      teacherComment: row.teacherComment?.trim() || null,
      voiceTranscript: row.voiceTranscript?.trim() || null,
      uncertaintyFlag: row.uncertaintyFlag === true,
      moderationStatus: row.uncertaintyFlag ? "needs_moderation" : "not_moderated",
      evidenceConfidence: row.uncertaintyFlag ? "low" : "medium",
      lockedBy: input.lockedBy,
    };
  });
}
