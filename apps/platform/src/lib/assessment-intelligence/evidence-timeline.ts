export type EvidenceSourceKind = "ctf_import" | "manual_snapshot" | "mis_import" | "dfe_validated" | "spreadsheet_import";

export interface EvidenceDemographics {
  isFsm: boolean;
  isSend: boolean;
  isEal: boolean;
  gender: string;
  source?: string;
}

export interface CtfEvidenceRecord {
  pupil_hash: string;
  year_group: number;
  subject: string;
  attainment_level: string | null;
  scaled_score: number | string | null;
  academic_year_start: number;
  assessment_period: string | null;
}

export interface TeacherEvidenceEvent {
  pupil_hash: string;
  source_kind: string;
  source_label: string;
  validation_tier: string;
  class_name: string | null;
  year_group_at_assessment: string;
  current_year_group: string | null;
  academic_year_start: number;
  assessment_period: string;
  assessment_date: string | null;
  subject: string;
  raw_level: string | null;
  canonical_level: string | null;
  is_at_expected: boolean | null;
  is_greater_depth: boolean | null;
  scaled_score: number | string | null;
  teacher_comment: string | null;
  uncertainty_flag: boolean | null;
  moderation_status: string | null;
  evidence_confidence: string | null;
}

export interface EvidencePoint {
  id: string;
  pupilId: string;
  sourceKind: EvidenceSourceKind;
  sourceLabel: string;
  sourceTable: string;
  validationTier: string;
  academicYearStart: number;
  academicYearLabel: string;
  assessmentPeriod: string;
  assessmentDate: string | null;
  dateLabel: string;
  yearGroupLabel: string;
  yearGroupSort: number;
  subject: string;
  levelLabel: string;
  canonicalLevel: "below_expected" | "working_towards" | "expected" | "greater_depth" | "unknown";
  levelScore: number;
  isAtExpected: boolean;
  isGreaterDepth: boolean;
  scaledScore: number | null;
  teacherComment: string | null;
  uncertaintyFlag: boolean;
  moderationStatus: string | null;
  evidenceConfidence: string | null;
  demographics: EvidenceDemographics;
}

export interface PupilEvidenceTimeline {
  pupilId: string;
  demographics: EvidenceDemographics;
  points: EvidencePoint[];
  trend: "improving" | "declining" | "stable" | "mixed" | "insufficient";
  latestStatus: "secure" | "watch" | "urgent";
  supportSignals: string[];
  priorityScore: number;
}

export interface AggregateEvidenceSeries {
  key: string;
  label: string;
  academicYearStart: number;
  assessmentPeriod: string;
  sourceKind: EvidenceSourceKind;
  sourceLabel: string;
  reading: number | null;
  writing: number | null;
  maths: number | null;
  pupilCount: number;
}

export interface UnifiedEvidenceTimeline {
  source: string;
  caveat: string;
  pupilsAnalysed: number;
  evidencePoints: number;
  sourceCounts: Record<string, number>;
  aggregateSeries: AggregateEvidenceSeries[];
  priorityPupilCount: number;
  priorityPupils: PupilEvidenceTimeline[];
  pupilTimelines: PupilEvidenceTimeline[];
  researchNotes: {
    label: string;
    source: string;
    note: string;
  }[];
}

export function buildUnifiedPupilEvidenceTimeline(input: {
  ctfRecords: CtfEvidenceRecord[];
  teacherEvents: TeacherEvidenceEvent[];
  getDemographics: (pupilHash: string) => EvidenceDemographics;
  pseudonymFromHash: (pupilHash: string) => string;
  maxPupils?: number;
}): UnifiedEvidenceTimeline {
  const points = [
    ...input.ctfRecords
      .filter((record) => isCoreSubject(record.subject))
      .map((record, index) => ctfPoint(record, index, input.getDemographics, input.pseudonymFromHash)),
    ...input.teacherEvents
      .filter((event) => isCoreSubject(event.subject))
      .map((event, index) => teacherPoint(event, index, input.getDemographics, input.pseudonymFromHash)),
  ].sort(sortEvidencePoints);

  const byPupil = new Map<string, EvidencePoint[]>();
  for (const point of points) {
    const current = byPupil.get(point.pupilId) ?? [];
    current.push(point);
    byPupil.set(point.pupilId, current);
  }

  const pupilTimelines = [...byPupil.entries()]
    .map(([pupilId, pupilPoints]) => buildPupilTimeline(pupilId, pupilPoints))
    .sort((a, b) => b.priorityScore - a.priorityScore || a.pupilId.localeCompare(b.pupilId));

  const sourceCounts = points.reduce<Record<string, number>>((acc, point) => {
    acc[point.sourceKind] = (acc[point.sourceKind] ?? 0) + 1;
    return acc;
  }, {});

  const priorityPupils = pupilTimelines.filter((pupil) => pupil.latestStatus !== "secure");
  const maxPupils = input.maxPupils ?? pupilTimelines.length;

  return {
    source: "pupil_assessments_pseudo + assessment_source_batches + pupil_assessment_events",
    caveat: "This joins imported CTF/pseudonymised assessment evidence with teacher-locked Schoolgle assessment snapshots. DfE public outcomes remain cohort-level context and are not treated as named pupil records.",
    pupilsAnalysed: pupilTimelines.length,
    evidencePoints: points.length,
    sourceCounts,
    aggregateSeries: buildAggregateSeries(points),
    priorityPupilCount: priorityPupils.length,
    priorityPupils: priorityPupils.slice(0, 12),
    pupilTimelines: pupilTimelines.slice(0, maxPupils),
    researchNotes: [
      {
        label: "SEND and adaptive teaching",
        source: "EEF Special Educational Needs in Mainstream Schools guidance report",
        note: "Use SEND status to shape provision and check progress from the pupil's own starting point; do not use SEND as an excuse for low ambition.",
      },
      {
        label: "Disadvantage and feedback",
        source: "EEF Teaching and Learning Toolkit: Feedback; Pupil Premium Guide",
        note: "Where disadvantaged pupils drop or remain below expected, prioritise precise feedback, diagnostic assessment and targeted academic support.",
      },
      {
        label: "Teacher assessment moderation",
        source: "Schoolgle Assessment Intelligence evidence model",
        note: "Large jumps, drops or teacher-flagged uncertainty should trigger moderation before leaders rely on the headline percentage.",
      },
    ],
  };
}

function ctfPoint(
  record: CtfEvidenceRecord,
  index: number,
  getDemographics: (pupilHash: string) => EvidenceDemographics,
  pseudonymFromHash: (pupilHash: string) => string,
): EvidencePoint {
    const normalised = normaliseLevel(record.attainment_level, null, false, false);
  const demographics = getDemographics(record.pupil_hash);
  const yearGroupLabel = record.year_group === 0 ? "EYFS" : `Y${record.year_group}`;
  const assessmentPeriod = record.assessment_period || "Imported assessment";
  const sourceLabel = `Source: CTF/pseudonymised pupil assessment import, ${assessmentPeriod}, academic year ${academicYearLabel(record.academic_year_start)}`;

  return {
    id: `ctf-${record.pupil_hash}-${record.subject}-${record.academic_year_start}-${record.year_group}-${index}`,
    pupilId: pseudonymFromHash(record.pupil_hash),
    sourceKind: "ctf_import",
    sourceLabel,
    sourceTable: "pupil_assessments_pseudo",
    validationTier: "imported_external",
    academicYearStart: record.academic_year_start,
    academicYearLabel: academicYearLabel(record.academic_year_start),
    assessmentPeriod,
    assessmentDate: null,
    dateLabel: `${assessmentPeriod} ${academicYearLabel(record.academic_year_start)}`,
    yearGroupLabel,
    yearGroupSort: record.year_group,
    subject: normaliseSubject(record.subject),
    levelLabel: displayLevel(record.attainment_level, normalised.canonicalLevel),
    canonicalLevel: normalised.canonicalLevel,
    levelScore: normalised.levelScore,
    isAtExpected: normalised.isAtExpected,
    isGreaterDepth: normalised.isGreaterDepth,
    scaledScore: numberOrNull(record.scaled_score),
    teacherComment: null,
    uncertaintyFlag: false,
    moderationStatus: null,
    evidenceConfidence: "imported",
    demographics,
  };
}

function teacherPoint(
  event: TeacherEvidenceEvent,
  index: number,
  getDemographics: (pupilHash: string) => EvidenceDemographics,
  pseudonymFromHash: (pupilHash: string) => string,
): EvidencePoint {
  const normalised = normaliseLevel(event.raw_level, event.canonical_level, event.is_at_expected === true, event.is_greater_depth === true);
  const demographics = getDemographics(event.pupil_hash);
  const yearGroupSort = yearGroupSortValue(event.current_year_group || event.year_group_at_assessment);
  const yearGroupLabel = event.current_year_group || event.year_group_at_assessment || "Current cohort";

  return {
    id: `teacher-${event.pupil_hash}-${event.subject}-${event.academic_year_start}-${event.assessment_period}-${index}`,
    pupilId: pseudonymFromHash(event.pupil_hash),
    sourceKind: event.source_kind === "manual_snapshot" ? "manual_snapshot" : "mis_import",
    sourceLabel: event.source_label,
    sourceTable: "assessment_source_batches + pupil_assessment_events",
    validationTier: event.validation_tier || "teacher_locked",
    academicYearStart: event.academic_year_start,
    academicYearLabel: academicYearLabel(event.academic_year_start),
    assessmentPeriod: event.assessment_period,
    assessmentDate: event.assessment_date,
    dateLabel: `${event.assessment_period} ${academicYearLabel(event.academic_year_start)}`,
    yearGroupLabel,
    yearGroupSort,
    subject: normaliseSubject(event.subject),
    levelLabel: displayLevel(event.raw_level, normalised.canonicalLevel),
    canonicalLevel: normalised.canonicalLevel,
    levelScore: normalised.levelScore,
    isAtExpected: normalised.isAtExpected,
    isGreaterDepth: normalised.isGreaterDepth,
    scaledScore: numberOrNull(event.scaled_score),
    teacherComment: event.teacher_comment,
    uncertaintyFlag: event.uncertainty_flag === true,
    moderationStatus: event.moderation_status,
    evidenceConfidence: event.evidence_confidence,
    demographics,
  };
}

function buildPupilTimeline(pupilId: string, points: EvidencePoint[]): PupilEvidenceTimeline {
  const orderedPoints = [...points].sort(sortEvidencePoints);
  const latestBySubject = latestSubjectPoints(orderedPoints);
  const drops = findDrops(orderedPoints);
  const belowLatest = latestBySubject.filter((point) => !point.isAtExpected && point.canonicalLevel !== "unknown");
  const uncertainty = orderedPoints.filter((point) => point.uncertaintyFlag);
  const demographics = inferDemographicsFromPoints(orderedPoints);

  const supportSignals = [
    ...drops.map((drop) => `${drop.subjectLabel} dropped from ${drop.from.levelLabel} (${drop.from.dateLabel}) to ${drop.to.levelLabel} (${drop.to.dateLabel}).`),
    ...belowLatest.map((point) => `${subjectLabel(point.subject)} is currently ${point.levelLabel} at ${point.dateLabel}.`),
    ...uncertainty.map((point) => `${subjectLabel(point.subject)} judgement was flagged for moderation at ${point.dateLabel}.`),
  ];

  const priorityScore =
    drops.length * 4 +
    belowLatest.length * 2 +
    uncertainty.length * 2 +
    (demographics.isSend ? 1 : 0) +
    (demographics.isFsm ? 1 : 0);

  return {
    pupilId,
    demographics,
    points: orderedPoints,
    trend: trendFromPoints(orderedPoints),
    latestStatus: priorityScore >= 5 ? "urgent" : priorityScore > 0 ? "watch" : "secure",
    supportSignals,
    priorityScore,
  };
}

function inferDemographicsFromPoints(points: EvidencePoint[]): EvidenceDemographics {
  const first = points[0];
  if (!first) return { isFsm: false, isSend: false, isEal: false, gender: "unknown", source: "none" };
  return points.reduce<EvidenceDemographics>((acc, point) => ({
    isFsm: acc.isFsm || point.demographics.isFsm,
    isSend: acc.isSend || point.demographics.isSend,
    isEal: acc.isEal || point.demographics.isEal,
    gender: acc.gender !== "unknown" ? acc.gender : point.demographics.gender,
    source: acc.source === point.demographics.source ? acc.source : "joined evidence sources",
  }), first.demographics);
}

function buildAggregateSeries(points: EvidencePoint[]): AggregateEvidenceSeries[] {
  const groups = new Map<string, EvidencePoint[]>();
  for (const point of points) {
    const key = `${point.academicYearStart}|${point.assessmentPeriod}|${point.sourceKind}`;
    const current = groups.get(key) ?? [];
    current.push(point);
    groups.set(key, current);
  }

  return [...groups.entries()]
    .map(([key, groupPoints]) => {
      const first = groupPoints[0];
      return {
        key,
        label: `${first.assessmentPeriod} ${first.academicYearLabel}`,
        academicYearStart: first.academicYearStart,
        assessmentPeriod: first.assessmentPeriod,
        sourceKind: first.sourceKind,
        sourceLabel: first.sourceLabel,
        reading: pctExpected(groupPoints.filter((point) => point.subject === "reading")),
        writing: pctExpected(groupPoints.filter((point) => point.subject === "writing")),
        maths: pctExpected(groupPoints.filter((point) => point.subject === "maths")),
        pupilCount: new Set(groupPoints.map((point) => point.pupilId)).size,
      };
    })
    .sort((a, b) => a.academicYearStart - b.academicYearStart || a.label.localeCompare(b.label));
}

function latestSubjectPoints(points: EvidencePoint[]) {
  const bySubject = new Map<string, EvidencePoint>();
  for (const point of points) bySubject.set(point.subject, point);
  return [...bySubject.values()];
}

function findDrops(points: EvidencePoint[]) {
  const drops: { subjectLabel: string; from: EvidencePoint; to: EvidencePoint }[] = [];
  for (const subject of ["reading", "writing", "maths"]) {
    const subjectPoints = points.filter((point) => point.subject === subject).sort(sortEvidencePoints);
    for (let i = 1; i < subjectPoints.length; i++) {
      if (subjectPoints[i].levelScore < subjectPoints[i - 1].levelScore) {
        drops.push({ subjectLabel: subjectLabel(subject), from: subjectPoints[i - 1], to: subjectPoints[i] });
      }
    }
  }
  return drops;
}

function trendFromPoints(points: EvidencePoint[]): PupilEvidenceTimeline["trend"] {
  const subjectTrends = ["reading", "writing", "maths"].map((subject) => {
    const subjectPoints = points.filter((point) => point.subject === subject).sort(sortEvidencePoints);
    if (subjectPoints.length < 2) return "insufficient";
    const first = subjectPoints[0].levelScore;
    const last = subjectPoints[subjectPoints.length - 1].levelScore;
    if (last > first) return "improving";
    if (last < first) return "declining";
    return "stable";
  });

  if (subjectTrends.includes("declining") && subjectTrends.includes("improving")) return "mixed";
  if (subjectTrends.includes("declining")) return "declining";
  if (subjectTrends.includes("improving")) return "improving";
  if (subjectTrends.includes("stable")) return "stable";
  return "insufficient";
}

function normaliseLevel(
  rawLevel: string | null,
  canonicalLevel: string | null,
  isAtExpected: boolean,
  isGreaterDepth: boolean,
): { canonicalLevel: EvidencePoint["canonicalLevel"]; levelScore: number; isAtExpected: boolean; isGreaterDepth: boolean } {
  if (canonicalLevel === "greater_depth" || isGreaterDepth) return { canonicalLevel: "greater_depth", levelScore: 3, isAtExpected: true, isGreaterDepth: true };
  if (canonicalLevel === "expected" || isAtExpected) return { canonicalLevel: "expected", levelScore: 2, isAtExpected: true, isGreaterDepth: false };
  if (canonicalLevel === "working_towards") return { canonicalLevel: "working_towards", levelScore: 1, isAtExpected: false, isGreaterDepth: false };
  if (canonicalLevel === "below_expected") return { canonicalLevel: "below_expected", levelScore: 0, isAtExpected: false, isGreaterDepth: false };

  const value = String(rawLevel ?? "").trim().toUpperCase();
  if (["GDS", "GD", "GREATER_DEPTH", "3"].includes(value)) return { canonicalLevel: "greater_depth", levelScore: 3, isAtExpected: true, isGreaterDepth: true };
  if (["EXS", "EXP", "EXPECTED", "ELG", "M", "P", "2"].includes(value)) return { canonicalLevel: "expected", levelScore: 2, isAtExpected: true, isGreaterDepth: false };
  if (["WTS", "WT", "WORKING_TOWARDS", "1", "PK1", "PK2", "PK3", "PK4"].includes(value)) return { canonicalLevel: "working_towards", levelScore: 1, isAtExpected: false, isGreaterDepth: false };
  if (value) return { canonicalLevel: "below_expected", levelScore: 0, isAtExpected: false, isGreaterDepth: false };
  return { canonicalLevel: "unknown", levelScore: -1, isAtExpected: false, isGreaterDepth: false };
}

function displayLevel(rawLevel: string | null, canonicalLevel: EvidencePoint["canonicalLevel"]) {
  const raw = String(rawLevel ?? "").trim();
  if (raw) return raw.toUpperCase();
  if (canonicalLevel === "greater_depth") return "GDS";
  if (canonicalLevel === "expected") return "EXS";
  if (canonicalLevel === "working_towards") return "WTS";
  if (canonicalLevel === "below_expected") return "Below";
  return "Unknown";
}

function pctExpected(points: EvidencePoint[]) {
  if (points.length === 0) return null;
  return Math.round((points.filter((point) => point.isAtExpected).length / points.length) * 1000) / 10;
}

function sortEvidencePoints(a: EvidencePoint, b: EvidencePoint) {
  return (
    a.academicYearStart - b.academicYearStart ||
    a.yearGroupSort - b.yearGroupSort ||
    sourceOrder(a.sourceKind) - sourceOrder(b.sourceKind) ||
    a.subject.localeCompare(b.subject)
  );
}

function sourceOrder(sourceKind: EvidenceSourceKind) {
  if (sourceKind === "dfe_validated") return 0;
  if (sourceKind === "ctf_import") return 1;
  if (sourceKind === "mis_import") return 2;
  if (sourceKind === "spreadsheet_import") return 3;
  if (sourceKind === "manual_snapshot") return 4;
  return 5;
}

function isCoreSubject(subject: string | null | undefined) {
  return ["reading", "writing", "maths"].includes(normaliseSubject(subject));
}

function normaliseSubject(subject: string | null | undefined) {
  const value = String(subject ?? "").trim().toLowerCase();
  if (value === "math" || value === "mathematics") return "maths";
  return value;
}

function subjectLabel(subject: string) {
  return subject.charAt(0).toUpperCase() + subject.slice(1);
}

function academicYearLabel(year: number) {
  return `${year}/${String(year + 1).slice(-2)}`;
}

function numberOrNull(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function yearGroupSortValue(yearGroup: string | null | undefined) {
  const value = String(yearGroup ?? "").toUpperCase();
  if (value.includes("EYFS") || value.includes("RECEPTION")) return 0;
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : 99;
}
