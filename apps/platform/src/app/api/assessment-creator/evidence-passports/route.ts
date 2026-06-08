import { NextRequest } from "next/server";
import { apiError, apiSuccess, protectedRoute } from "@/lib/api-utils";
import { scoreEvidenceConfidence } from "@/lib/assessment-creator/confidence";
import { createMockEvidencePassport } from "@/lib/assessment-creator/mock-data";
import type { MarkingProposal } from "@/lib/assessment-creator/types";
import { mapAssessmentCreatorProposalsToAssessmentSpine } from "@/lib/assessment-intelligence/spine-adapter";
import type { AssessmentSubject } from "@/lib/assessment-intelligence/types";
import { createServiceRoleClient } from "@/lib/supabase-server";

const ASSESSMENT_SPINE_SUBJECTS = new Set<AssessmentSubject>([
  "reading",
  "writing",
  "maths",
  "science",
  "spag",
]);

function normaliseAssessmentSpineSubject(value: unknown): AssessmentSubject {
  return typeof value === "string" && ASSESSMENT_SPINE_SUBJECTS.has(value as AssessmentSubject)
    ? (value as AssessmentSubject)
    : "maths";
}

export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const proposals = (body.proposals ?? []) as MarkingProposal[];
  if (!body.assessmentId) return apiError("assessmentId required", 400);
  if (!proposals.length) return apiError("reviewed proposals required", 400);

  const reviewComplete = proposals.every((proposal) => proposal.teacherDecision === "accepted" || proposal.teacherDecision === "edited");
  if (!reviewComplete) return apiError("all marking proposals must be teacher reviewed", 400);

  const editedCount = proposals.filter((proposal) => proposal.teacherDecision === "edited").length;
  const lowConfidenceCount = proposals.filter((proposal) => proposal.confidence < 0.75).length;
  const confidence = scoreEvidenceConfidence({
    daysOld: 0,
    objectiveCoverage: 0.82,
    depthScore: 0.74,
    questionCountPerObjective: 3,
    markingReviewCompletion: 1,
    teacherOverrideRate: editedCount / proposals.length,
    responseCompleteness: 1 - lowConfidenceCount / proposals.length / 3,
    moderated: false,
    submittedJudgementMismatch: false,
  });

  const passport = createMockEvidencePassport({
    assessmentId: body.assessmentId,
    organizationId: body.organizationId || auth.organizationId || "org-demo",
    schoolId: body.schoolId || "school-demo",
    classId: body.classId || "class-demo",
    subject: body.subject,
    yearGroup: body.yearGroup,
    evidenceConfidence: confidence.rating,
    confidenceReasons: confidence.reasons,
  });

  if (auth.organizationId) {
    const supabase = createServiceRoleClient();
    const schoolUrn =
      body.schoolUrn === null || body.schoolUrn === undefined
        ? null
        : Number(body.schoolUrn);
    const assessmentPeriod = body.assessmentPeriod || body.term || "Assessment Creator";
    const academicYearStart = Number(body.academicYearStart || new Date().getFullYear());
    const subject = normaliseAssessmentSpineSubject(body.subject || passport.subject);

    const spineMapping = mapAssessmentCreatorProposalsToAssessmentSpine({
      organizationId: auth.organizationId,
      assessmentId: body.assessmentId,
      schoolUrn: Number.isFinite(schoolUrn) ? schoolUrn : null,
      classId: body.classId || passport.classId,
      className: body.className || body.classId || passport.classId,
      subject,
      yearGroup: body.yearGroup || passport.yearGroup,
      assessmentPeriod,
      academicYearStart,
      assessmentDate: body.assessmentDate || new Date().toISOString().slice(0, 10),
      lockedBy: auth.userId,
      proposals,
    });

    const { data: batch, error: batchError } = await supabase
      .from("assessment_source_batches")
      .insert(spineMapping.batchInsert)
      .select("id")
      .single();

    if (batchError || !batch?.id) {
      console.warn(
        "[Assessment Creator] Evidence passport created but assessment spine batch failed:",
        batchError?.message,
      );
    } else if (spineMapping.eventInserts.length > 0) {
      const { error: eventError } = await supabase
        .from("pupil_assessment_events")
        .insert(
          spineMapping.eventInserts.map((event) => ({
            ...event,
            source_batch_id: batch.id,
          })),
        );

      if (eventError) {
        console.warn(
          "[Assessment Creator] Evidence passport created but assessment spine events failed:",
          eventError.message,
        );
      }
    }
  }

  return apiSuccess(passport);
}, { orgOptional: true });
