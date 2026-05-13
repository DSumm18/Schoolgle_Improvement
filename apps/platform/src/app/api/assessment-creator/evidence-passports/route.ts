import { NextRequest } from "next/server";
import { apiError, apiSuccess, protectedRoute } from "@/lib/api-utils";
import { scoreEvidenceConfidence } from "@/lib/assessment-creator/confidence";
import { createMockEvidencePassport } from "@/lib/assessment-creator/mock-data";
import type { MarkingProposal } from "@/lib/assessment-creator/types";

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

  return apiSuccess(passport);
}, { orgOptional: true });
