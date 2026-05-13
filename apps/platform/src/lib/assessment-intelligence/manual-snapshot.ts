import { buildManualSnapshotEvents } from "./assessment-events";
import type { AssessmentSubject, ManualSnapshotInput, PupilAssessmentEvent } from "./types";

const VALID_SUBJECTS = new Set<AssessmentSubject>(["reading", "writing", "maths", "science", "spag"]);

export interface ManualSnapshotRequestBody {
  organizationId?: string;
  schoolUrn: number | string;
  schoolId?: string | null;
  schoolName?: string | null;
  classId: string;
  className: string;
  subject: AssessmentSubject;
  assessmentPeriod: string;
  academicYearStart: number;
  assessmentDate?: string | null;
  rows: ManualSnapshotInput["rows"];
}

export interface ManualSnapshotBuildContext {
  authOrganizationId?: string | null;
  lockedBy: string;
}

export interface AssessmentSourceBatchInsert {
  organization_id: string;
  school_id: string | null;
  school_urn: number;
  source_kind: "manual_snapshot";
  source_label: string;
  source_table: string | null;
  source_id: string | null;
  file_name: string | null;
  validation_tier: "teacher_locked";
  academic_year_start: number;
  assessment_period: string;
  assessment_date: string | null;
  locked_at: string;
  locked_by: string;
  notes: string | null;
  raw_snapshot: Record<string, unknown>;
}

export interface PupilAssessmentEventInsert {
  organization_id: string;
  school_urn: number;
  source_batch_id: string;
  source_kind: PupilAssessmentEvent["sourceKind"];
  source_label: string;
  validation_tier: PupilAssessmentEvent["validationTier"];
  pupil_hash: string;
  pupil_ref_hash_method: string;
  current_pupil_profile_id: string | null;
  class_id: string;
  class_name: string;
  year_group_at_assessment: string;
  academic_year_start: number;
  assessment_period: string;
  assessment_date: string | null;
  subject: AssessmentSubject;
  framework: string;
  raw_level: string;
  canonical_level: PupilAssessmentEvent["canonicalLevel"];
  is_at_expected: boolean;
  is_greater_depth: boolean;
  scaled_score: number | null;
  raw_score: number | null;
  max_score: number | null;
  teacher_comment: string | null;
  voice_transcript: string | null;
  comment_summary: string | null;
  uncertainty_flag: boolean;
  moderation_status: PupilAssessmentEvent["moderationStatus"];
  evidence_confidence: PupilAssessmentEvent["evidenceConfidence"];
  teacher_decision: string | null;
  teacher_marks: number | null;
  locked_by: string;
  locked_at: string;
  raw_snapshot: Record<string, unknown>;
}

export function buildManualSnapshotInsertPayload(
  body: ManualSnapshotRequestBody,
  context: ManualSnapshotBuildContext,
) {
  const organizationId = body.organizationId || context.authOrganizationId;
  if (!organizationId) throw new Error("organizationId required");

  const schoolUrn = Number(body.schoolUrn);
  if (!Number.isInteger(schoolUrn) || schoolUrn <= 0) throw new Error("schoolUrn required");
  if (!body.classId?.trim()) throw new Error("classId required");
  if (!body.className?.trim()) throw new Error("className required");
  if (!VALID_SUBJECTS.has(body.subject)) throw new Error("valid subject required");
  if (!body.assessmentPeriod?.trim()) throw new Error("assessmentPeriod required");
  const assessmentDate = body.assessmentDate || new Date().toISOString().slice(0, 10);
  if (!Number.isInteger(body.academicYearStart) || body.academicYearStart < 2000) {
    throw new Error("academicYearStart required");
  }
  if (!Array.isArray(body.rows) || body.rows.length === 0) throw new Error("at least one pupil row required");
  if (body.rows.some((row) => Boolean(row.pupilDisplayLabel?.trim()))) {
    throw new Error("pupilDisplayLabel must not be sent to the server");
  }

  const sourceLabel = buildManualSnapshotEvents({
    organizationId,
    schoolUrn,
    sourceBatchId: "__pending__",
    classId: body.classId.trim(),
    className: body.className.trim(),
    subject: body.subject,
    assessmentPeriod: body.assessmentPeriod.trim(),
    academicYearStart: body.academicYearStart,
    assessmentDate,
    lockedBy: context.lockedBy,
    rows: body.rows.slice(0, 1),
  })[0]?.sourceLabel ?? "Source: manual teacher judgement";

  const lockedAt = new Date().toISOString();
  const batchInsert: AssessmentSourceBatchInsert = {
    organization_id: organizationId,
    school_id: body.schoolId || null,
    school_urn: schoolUrn,
    source_kind: "manual_snapshot",
    source_label: sourceLabel,
    source_table: null,
    source_id: null,
    file_name: null,
    validation_tier: "teacher_locked",
    academic_year_start: body.academicYearStart,
    assessment_period: body.assessmentPeriod.trim(),
    assessment_date: assessmentDate,
    locked_at: lockedAt,
    locked_by: context.lockedBy,
    notes: null,
    raw_snapshot: {
      schoolName: body.schoolName?.trim() || null,
      classId: body.classId.trim(),
      className: body.className.trim(),
      subject: body.subject,
      rowCount: body.rows.length,
      privacy: "server stores pupil hashes only; display labels remain browser-side",
    },
  };

  const eventDrafts = buildManualSnapshotEvents({
    organizationId,
    schoolUrn,
    sourceBatchId: "__pending__",
    classId: body.classId.trim(),
    className: body.className.trim(),
    subject: body.subject,
    assessmentPeriod: body.assessmentPeriod.trim(),
    academicYearStart: body.academicYearStart,
    assessmentDate,
    lockedBy: context.lockedBy,
    rows: body.rows,
  });

  return {
    batchInsert,
    eventDrafts,
  };
}

export function mapPupilAssessmentEventToInsert(
  event: PupilAssessmentEvent,
  sourceBatchId: string,
): PupilAssessmentEventInsert {
  return {
    organization_id: event.organizationId,
    school_urn: event.schoolUrn,
    source_batch_id: sourceBatchId,
    source_kind: event.sourceKind,
    source_label: event.sourceLabel,
    validation_tier: event.validationTier,
    pupil_hash: event.pupilHash,
    pupil_ref_hash_method: event.hashMethod || "sha256-schoolgle-client",
    current_pupil_profile_id: event.currentPupilProfileId || null,
    class_id: event.classId,
    class_name: event.className,
    year_group_at_assessment: event.yearGroupAtAssessment,
    academic_year_start: event.academicYearStart,
    assessment_period: event.assessmentPeriod,
    assessment_date: event.assessmentDate || null,
    subject: event.subject,
    framework: event.assessmentFramework || "teacher_judgement",
    raw_level: event.rawLevel,
    canonical_level: event.canonicalLevel,
    is_at_expected: event.isAtExpected,
    is_greater_depth: event.isGreaterDepth,
    scaled_score: event.scaledScore || null,
    raw_score: event.marksAwarded || null,
    max_score: event.marksAvailable || null,
    teacher_comment: event.teacherComment || null,
    voice_transcript: event.voiceTranscript || null,
    comment_summary: event.commentSummary || null,
    uncertainty_flag: event.uncertaintyFlag,
    moderation_status: event.moderationStatus,
    evidence_confidence: event.evidenceConfidence,
    teacher_decision: event.teacherDecision || null,
    teacher_marks: event.marksAwarded || null,
    locked_by: event.lockedBy,
    locked_at: new Date().toISOString(),
    raw_snapshot: {
      sourceKind: event.sourceKind,
      sourceLabel: event.sourceLabel,
      rawLevel: event.rawLevel,
      canonicalLevel: event.canonicalLevel,
    },
  };
}
