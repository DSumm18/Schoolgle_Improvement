import type { ParseResult, ParsedAssessmentRecord } from "@/lib/ctf-xml-parser";
import {
  buildAssessmentSourceLabel,
  normaliseAssessmentLevel,
} from "./assessment-events";
import type {
  AssessmentSourceKind,
  AssessmentSubject,
  AssessmentValidationTier,
  CanonicalAssessmentLevel,
} from "./types";

export type AssessmentEvidenceLayer =
  | "dfe_rear_view"
  | "school_capture"
  | "pupil_level"
  | "ofsted_bridge";

export type AssessmentEvidenceSourceType =
  | "dfe_public_data"
  | "school_assessment_capture"
  | "ctf_pupil_layer"
  | "assessment_creator"
  | "school_improvement_signal";

export interface AssessmentEvidenceSource {
  id: string;
  layer: AssessmentEvidenceLayer;
  sourceType: AssessmentEvidenceSourceType;
  label: string;
  description: string;
  status: "connected" | "available" | "not_connected";
  evidenceCount: number;
  latestAcademicYear: number | null;
  isDemo?: boolean;
}

export interface AssessmentJourneyLayer {
  id: "dfe_rear_view" | "school_captures" | "pupil_level" | "ofsted_bridge";
  title: string;
  badge: string;
  status: "ready" | "optional" | "locked";
  description: string;
}

export interface CtfSpineMappingInput {
  organizationId: string;
  importId: string;
  fileName: string;
  parsed: ParseResult;
  isDemo?: boolean;
  demoFixtureId?: string | null;
}

export interface CtfAssessmentSourceBatchInsert {
  organization_id: string;
  school_id: string | null;
  school_urn: number | null;
  source_kind: "ctf_import";
  source_label: string;
  source_table: "school_assessment_imports";
  source_id: string;
  file_name: string;
  validation_tier: "imported_external";
  academic_year_start: number;
  assessment_period: string;
  assessment_date: string;
  locked_at: string | null;
  locked_by: string | null;
  notes: string | null;
  raw_snapshot: Record<string, unknown>;
  is_demo: boolean;
  demo_fixture_id: string | null;
  source_display_name: string;
  source_layer: "pupil_level";
}

export interface CtfPupilAssessmentEventInsert {
  organization_id: string;
  school_urn: number | null;
  source_batch_id: string;
  source_kind: AssessmentSourceKind;
  source_label: string;
  validation_tier: AssessmentValidationTier;
  pupil_hash: string;
  pupil_ref_hash_method: string;
  current_pupil_profile_id: string | null;
  class_id: string | null;
  class_name: string | null;
  year_group_at_assessment: string;
  academic_year_start: number;
  assessment_period: string;
  assessment_date: string;
  subject: AssessmentSubject;
  framework: string;
  raw_level: string | null;
  canonical_level: CanonicalAssessmentLevel;
  is_at_expected: boolean;
  is_greater_depth: boolean;
  scaled_score: number | null;
  raw_score: number | null;
  max_score: number | null;
  teacher_comment: string | null;
  voice_transcript: string | null;
  comment_summary: string | null;
  uncertainty_flag: boolean;
  moderation_status: "not_moderated";
  evidence_confidence: "low" | "medium";
  teacher_decision: string | null;
  teacher_marks: number | null;
  locked_by: string | null;
  locked_at: string | null;
  raw_snapshot: Record<string, unknown>;
}

export interface AssessmentCreatorProposalInput {
  pupilHash: string;
  proposedMarks: number;
  teacherMarks: number | null;
  maxMarks: number;
  teacherDecision: "pending" | "accepted" | "edited" | "rejected";
  confidence: number;
}

export interface AssessmentCreatorSpineMappingInput {
  organizationId: string;
  assessmentId: string;
  schoolUrn: number | null;
  classId: string;
  className: string;
  subject: AssessmentSubject;
  yearGroup: string;
  assessmentPeriod: string;
  academicYearStart: number;
  assessmentDate: string;
  lockedBy: string;
  proposals: AssessmentCreatorProposalInput[];
}

export interface AssessmentCreatorSourceBatchInsert
  extends Omit<CtfAssessmentSourceBatchInsert, "source_kind" | "source_table" | "file_name" | "validation_tier" | "notes" | "demo_fixture_id" | "source_display_name"> {
  source_kind: "assessment_creator";
  source_table: "assessment_creator_evidence_passports";
  file_name: null;
  validation_tier: "teacher_reviewed_ai";
  notes: string | null;
  demo_fixture_id: null;
  source_display_name: "Assessment Creator teacher-reviewed marks";
}

export function normaliseAssessmentEvidenceSources(input: {
  dfe?: {
    schoolCount: number;
    latestAcademicYear: number | null;
    sourceLabel: string;
  } | null;
  schoolCaptures?: Array<{
    id: string;
    label: string;
    assessmentPeriod: string;
    academicYearStart: number;
    schoolCount: number;
    cellCount: number;
  }>;
  pupilLevel?: Array<{
    batchId: string;
    sourceKind: AssessmentSourceKind;
    sourceLabel: string;
    pupilCount: number;
    eventCount: number;
    academicYearStart?: number | null;
    isDemo?: boolean;
  }>;
}): AssessmentEvidenceSource[] {
  const sources: AssessmentEvidenceSource[] = [];

  if (input.dfe) {
    sources.push({
      id: "dfe-public-data",
      layer: "dfe_rear_view",
      sourceType: "dfe_public_data",
      label: input.dfe.sourceLabel,
      description: `${input.dfe.schoolCount} school${input.dfe.schoolCount === 1 ? "" : "s"} matched to validated DfE public data.`,
      status: "connected",
      evidenceCount: input.dfe.schoolCount,
      latestAcademicYear: input.dfe.latestAcademicYear,
    });
  }

  for (const capture of input.schoolCaptures ?? []) {
    sources.push({
      id: capture.id,
      layer: "school_capture",
      sourceType: "school_assessment_capture",
      label: capture.label,
      description: `${capture.assessmentPeriod} ${capture.academicYearStart}/${String(capture.academicYearStart + 1).slice(2)} capture across ${capture.schoolCount} school${capture.schoolCount === 1 ? "" : "s"}.`,
      status: "connected",
      evidenceCount: capture.cellCount,
      latestAcademicYear: capture.academicYearStart,
    });
  }

  for (const batch of input.pupilLevel ?? []) {
    sources.push({
      id: batch.batchId,
      layer: "pupil_level",
      sourceType:
        batch.sourceKind === "assessment_creator"
          ? "assessment_creator"
          : "ctf_pupil_layer",
      label: batch.sourceLabel,
      description: `${batch.pupilCount} pseudonymised pupil${batch.pupilCount === 1 ? "" : "s"} and ${batch.eventCount} assessment event${batch.eventCount === 1 ? "" : "s"}.`,
      status: "connected",
      evidenceCount: batch.eventCount,
      latestAcademicYear: batch.academicYearStart ?? null,
      isDemo: batch.isDemo === true,
    });
  }

  return sources;
}

export function buildAssessmentJourneyLayers(input: {
  dfeConnected: boolean;
  captureCount: number;
  pupilEventCount: number;
  ofstedFindingCount: number;
  demoMode?: boolean;
}): AssessmentJourneyLayer[] {
  return [
    {
      id: "dfe_rear_view",
      title: "1. DfE rear-view",
      badge: input.dfeConnected ? "ready" : "matching URNs",
      status: input.dfeConnected ? "ready" : "locked",
      description:
        "Validated public data shows historic outcomes, census context and the starting point for conversations.",
    },
    {
      id: "school_captures",
      title: "2. School captures",
      badge: input.captureCount > 0 ? `${input.captureCount} capture${input.captureCount === 1 ? "" : "s"}` : "optional",
      status: input.captureCount > 0 ? "ready" : "optional",
      description:
        "Autumn, spring and summer professional judgements show what leaders believe is happening now.",
    },
    {
      id: "pupil_level",
      title: "3. Pupil-level evidence",
      badge: input.pupilEventCount > 0 ? `${input.pupilEventCount} events${input.demoMode ? " · demo" : ""}` : "connect CTF / MIS",
      status: input.pupilEventCount > 0 ? "ready" : "optional",
      description:
        "CTF, MIS and Assessment Creator records unlock subgroup gaps, pupil journeys and evidence confidence.",
    },
    {
      id: "ofsted_bridge",
      title: "4. Ofsted bridge",
      badge: input.ofstedFindingCount > 0 ? `${input.ofstedFindingCount} finding${input.ofstedFindingCount === 1 ? "" : "s"}` : "ready to generate",
      status: input.ofstedFindingCount > 0 ? "ready" : "optional",
      description:
        "Relevant signals become Ofsted findings, tasks, evidence and timeline follow-up without changing the source data.",
    },
  ];
}

export function mapCtfRecordsToAssessmentSpine(input: CtfSpineMappingInput): {
  batchInsert: CtfAssessmentSourceBatchInsert;
  eventInserts: CtfPupilAssessmentEventInsert[];
} {
  const academicYearStart = mostCommonNumber(
    input.parsed.records.map((record) => record.assessment_year),
  ) ?? new Date().getFullYear();
  const assessmentPeriod =
    mostCommonString(input.parsed.records.map((record) => record.assessment_period)) ?? "summer";
  const assessmentDate = `${academicYearStart + 1}-07-01`;
  const schoolUrn = input.parsed.source_school_urn
    ? Number(input.parsed.source_school_urn)
    : null;
  const sourceLabel = buildAssessmentSourceLabel({
    sourceKind: "ctf_import",
    assessmentPeriod,
    academicYearStart,
    validationTier: "imported_external",
  });

  const batchInsert: CtfAssessmentSourceBatchInsert = {
    organization_id: input.organizationId,
    school_id: null,
    school_urn: Number.isFinite(schoolUrn) ? schoolUrn : null,
    source_kind: "ctf_import",
    source_label: sourceLabel,
    source_table: "school_assessment_imports",
    source_id: input.importId,
    file_name: input.fileName,
    validation_tier: "imported_external",
    academic_year_start: academicYearStart,
    assessment_period: assessmentPeriod,
    assessment_date: assessmentDate,
    locked_at: null,
    locked_by: null,
    notes: input.isDemo ? "Synthetic demo CTF fixture; original files remain outside Schoolgle." : null,
    raw_snapshot: {
      parserFormat: input.parsed.format,
      sourceSchoolName: input.parsed.source_school_name,
      sourceSchoolUrn: input.parsed.source_school_urn,
      pupilCount: input.parsed.pupil_count,
      recordCount: input.parsed.records.length,
      warnings: input.parsed.warnings,
      privacy: "Schoolgle stores pseudonymised events only; source XML remains in the connected cloud folder.",
    },
    is_demo: input.isDemo === true,
    demo_fixture_id: input.demoFixtureId ?? null,
    source_display_name: input.isDemo ? "Synthetic demo CTF import" : "CTF assessment import",
    source_layer: "pupil_level",
  };

  const eventInserts = input.parsed.records.flatMap((record): CtfPupilAssessmentEventInsert[] => {
    const subject = normaliseSpineSubject(record.subject);
    if (!subject) return [];
    const event = mapCtfRecordToEventInsert({
      record,
      organizationId: input.organizationId,
      schoolUrn: batchInsert.school_urn,
      sourceBatchId: "__pending__",
      sourceLabel,
      academicYearStart,
      assessmentPeriod,
      assessmentDate,
    });
    return event ? [event] : [];
  });

  return { batchInsert, eventInserts: deduplicateCtfEventInserts(eventInserts) };
}

export function mapAssessmentCreatorProposalsToAssessmentSpine(
  input: AssessmentCreatorSpineMappingInput,
): {
  batchInsert: AssessmentCreatorSourceBatchInsert;
  eventInserts: CtfPupilAssessmentEventInsert[];
} {
  const sourceLabel = buildAssessmentSourceLabel({
    sourceKind: "assessment_creator",
    assessmentPeriod: input.assessmentPeriod,
    academicYearStart: input.academicYearStart,
    validationTier: "teacher_reviewed_ai",
  });
  const reviewedProposals = input.proposals.filter(
    (proposal) => proposal.teacherDecision === "accepted" || proposal.teacherDecision === "edited",
  );
  const grouped = new Map<
    string,
    {
      marksAwarded: number;
      marksAvailable: number;
      lowConfidenceCount: number;
      editedCount: number;
    }
  >();

  for (const proposal of reviewedProposals) {
    const current = grouped.get(proposal.pupilHash) ?? {
      marksAwarded: 0,
      marksAvailable: 0,
      lowConfidenceCount: 0,
      editedCount: 0,
    };
    current.marksAwarded += proposal.teacherMarks ?? proposal.proposedMarks;
    current.marksAvailable += proposal.maxMarks;
    if (proposal.confidence < 0.75) current.lowConfidenceCount += 1;
    if (proposal.teacherDecision === "edited") current.editedCount += 1;
    grouped.set(proposal.pupilHash, current);
  }

  const batchInsert: AssessmentCreatorSourceBatchInsert = {
    organization_id: input.organizationId,
    school_id: null,
    school_urn: input.schoolUrn,
    source_kind: "assessment_creator",
    source_label: sourceLabel,
    source_table: "assessment_creator_evidence_passports",
    source_id: input.assessmentId,
    file_name: null,
    validation_tier: "teacher_reviewed_ai",
    academic_year_start: input.academicYearStart,
    assessment_period: input.assessmentPeriod,
    assessment_date: input.assessmentDate,
    locked_at: new Date().toISOString(),
    locked_by: input.lockedBy,
    notes: "Teacher reviewed Assessment Creator marks. AI proposals are not final until accepted or edited by the teacher.",
    raw_snapshot: {
      classId: input.classId,
      className: input.className,
      subject: input.subject,
      yearGroup: input.yearGroup,
      proposalCount: input.proposals.length,
      reviewedProposalCount: reviewedProposals.length,
      privacy: "Schoolgle stores pupil hashes and teacher-approved marks only.",
    },
    is_demo: false,
    demo_fixture_id: null,
    source_display_name: "Assessment Creator teacher-reviewed marks",
    source_layer: "pupil_level",
  };

  const eventInserts = [...grouped.entries()].map(([pupilHash, aggregate]) => {
    const rawLevel = marksToRawLevel(aggregate.marksAwarded, aggregate.marksAvailable);
    const level = normaliseAssessmentLevel(rawLevel);
    return {
      organization_id: input.organizationId,
      school_urn: input.schoolUrn,
      source_batch_id: "__pending__",
      source_kind: "assessment_creator" as const,
      source_label: sourceLabel,
      validation_tier: "teacher_reviewed_ai" as const,
      pupil_hash: pupilHash,
      pupil_ref_hash_method: "schoolgle-pupil-hash",
      current_pupil_profile_id: null,
      class_id: input.classId,
      class_name: input.className,
      year_group_at_assessment: input.yearGroup,
      academic_year_start: input.academicYearStart,
      assessment_period: input.assessmentPeriod,
      assessment_date: input.assessmentDate,
      subject: input.subject,
      framework: "assessment_creator",
      raw_level: rawLevel,
      canonical_level: level.canonicalLevel,
      is_at_expected: level.isAtExpected,
      is_greater_depth: level.isGreaterDepth,
      scaled_score: null,
      raw_score: aggregate.marksAwarded,
      max_score: aggregate.marksAvailable,
      teacher_comment: null,
      voice_transcript: null,
      comment_summary: null,
      uncertainty_flag: aggregate.lowConfidenceCount > 0 || aggregate.editedCount > 0,
      moderation_status: "not_moderated" as const,
      evidence_confidence: aggregate.lowConfidenceCount > 0 ? "low" as const : "medium" as const,
      teacher_decision: "reviewed",
      teacher_marks: aggregate.marksAwarded,
      locked_by: input.lockedBy,
      locked_at: batchInsert.locked_at,
      raw_snapshot: {
        lowConfidenceCount: aggregate.lowConfidenceCount,
        editedCount: aggregate.editedCount,
        marksAwarded: aggregate.marksAwarded,
        marksAvailable: aggregate.marksAvailable,
      },
    };
  });

  return { batchInsert, eventInserts };
}

export function mapCtfRecordToEventInsert(input: {
  record: ParsedAssessmentRecord;
  organizationId: string;
  schoolUrn: number | null;
  sourceBatchId: string;
  sourceLabel: string;
  academicYearStart: number;
  assessmentPeriod: string;
  assessmentDate: string;
}): CtfPupilAssessmentEventInsert | null {
  const subject = normaliseSpineSubject(input.record.subject);
  if (!subject) return null;

  const rawLevel =
    input.record.attainment_level ??
    (input.record.scaled_score !== null ? String(input.record.scaled_score) : null);
  const level = normaliseAssessmentLevel(rawLevel ?? "unknown");

  return {
    organization_id: input.organizationId,
    school_urn: input.schoolUrn,
    source_batch_id: input.sourceBatchId,
    source_kind: "ctf_import",
    source_label: input.sourceLabel,
    validation_tier: "imported_external",
    pupil_hash: input.record.pupil_hash,
    pupil_ref_hash_method: "HMAC-SHA256(UPN, organization_id)",
    current_pupil_profile_id: null,
    class_id: null,
    class_name: null,
    year_group_at_assessment:
      input.record.year_group === null ? "Unknown" : `Year ${input.record.year_group}`,
    academic_year_start: input.record.assessment_year ?? input.academicYearStart,
    assessment_period: input.record.assessment_period ?? input.assessmentPeriod,
    assessment_date: input.assessmentDate,
    subject,
    framework: input.record.key_stage || "ctf",
    raw_level: rawLevel,
    canonical_level: level.canonicalLevel,
    is_at_expected: level.isAtExpected,
    is_greater_depth: level.isGreaterDepth,
    scaled_score: input.record.scaled_score,
    raw_score: input.record.raw_score,
    max_score: null,
    teacher_comment: null,
    voice_transcript: null,
    comment_summary: null,
    uncertainty_flag: false,
    moderation_status: "not_moderated",
    evidence_confidence: "medium",
    teacher_decision: null,
    teacher_marks: input.record.raw_score,
    locked_by: null,
    locked_at: null,
    raw_snapshot: {
      assessmentType: input.record.assessment_type,
      keyStage: input.record.key_stage,
      sourceSubjectCode: input.record.source_subject_code,
    },
  };
}

function normaliseSpineSubject(subject: string): AssessmentSubject | null {
  if (subject === "reading" || subject === "writing" || subject === "maths" || subject === "science") {
    return subject;
  }
  if (subject === "spag" || subject === "grammar" || subject === "spelling" || subject === "punctuation") {
    return "spag";
  }
  return null;
}

function deduplicateCtfEventInserts(
  events: CtfPupilAssessmentEventInsert[],
): CtfPupilAssessmentEventInsert[] {
  const byUniqueKey = new Map<string, CtfPupilAssessmentEventInsert>();
  const duplicateCounts = new Map<string, number>();
  const duplicateRawLevels = new Map<string, Set<string>>();

  for (const event of events) {
    const key = [
      event.pupil_hash,
      event.subject,
      event.assessment_period,
      event.academic_year_start,
    ].join("|");
    const current = byUniqueKey.get(key);
    const rawLevels = duplicateRawLevels.get(key) ?? new Set<string>();
    if (event.raw_level) rawLevels.add(event.raw_level);
    duplicateRawLevels.set(key, rawLevels);

    if (!current) {
      byUniqueKey.set(key, event);
      duplicateCounts.set(key, 1);
      continue;
    }

    duplicateCounts.set(key, (duplicateCounts.get(key) ?? 1) + 1);
    byUniqueKey.set(key, chooseConservativeEvent(current, event));
  }

  return [...byUniqueKey.entries()].map(([key, event]) => {
    const duplicateCount = duplicateCounts.get(key) ?? 1;
    if (duplicateCount <= 1) return event;
    return {
      ...event,
      raw_snapshot: {
        ...event.raw_snapshot,
        duplicate_source_event_count: duplicateCount,
        duplicate_raw_levels: [...(duplicateRawLevels.get(key) ?? [])],
        dedupe_rule:
          "Conservative CTF component merge for one event per pupil/subject/period/year.",
      },
    };
  });
}

function chooseConservativeEvent(
  current: CtfPupilAssessmentEventInsert,
  candidate: CtfPupilAssessmentEventInsert,
): CtfPupilAssessmentEventInsert {
  return canonicalLevelRank(candidate.canonical_level) < canonicalLevelRank(current.canonical_level)
    ? candidate
    : current;
}

function canonicalLevelRank(level: CanonicalAssessmentLevel): number {
  switch (level) {
    case "below_expected":
      return 0;
    case "working_towards":
      return 1;
    case "unknown":
      return 1;
    case "expected":
      return 2;
    case "greater_depth":
      return 3;
  }
}

function mostCommonString(values: Array<string | null>): string | null {
  return mostCommon(values.filter((value): value is string => Boolean(value)));
}

function mostCommonNumber(values: Array<number | null>): number | null {
  return mostCommon(values.filter((value): value is number => Number.isFinite(value)));
}

function mostCommon<T extends string | number>(values: T[]): T | null {
  if (values.length === 0) return null;
  const counts = values.reduce<Map<T, number>>((acc, value) => {
    acc.set(value, (acc.get(value) ?? 0) + 1);
    return acc;
  }, new Map());
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

function marksToRawLevel(marksAwarded: number, marksAvailable: number): "GDS" | "EXS" | "WTS" | "BLW" {
  if (marksAvailable <= 0) return "BLW";
  const pct = marksAwarded / marksAvailable;
  if (pct >= 0.85) return "GDS";
  if (pct >= 0.55) return "EXS";
  if (pct > 0) return "WTS";
  return "BLW";
}
