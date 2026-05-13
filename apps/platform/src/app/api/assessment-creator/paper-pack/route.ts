import { NextRequest } from "next/server";
import { apiError, apiSuccess, protectedRoute } from "@/lib/api-utils";
import { createMockQuestions, MOCK_PUPIL_PASSES } from "@/lib/assessment-creator/mock-data";
import { createPaperQrPayload } from "@/lib/assessment-creator/qr";

export const POST = protectedRoute(async (_auth, req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  if (!body.assessmentId) return apiError("assessmentId required", 400);

  const questions = createMockQuestions(body.assessmentId);
  const papers = MOCK_PUPIL_PASSES.map((pass) => ({
    ...pass,
    pages: [
      {
        pageNumber: 1,
        qrPayload: createPaperQrPayload({ assessmentId: body.assessmentId, pupilHash: pass.pupilHash, pageNumber: 1 }),
      },
    ],
  }));

  return apiSuccess({ questions, papers });
}, { orgOptional: true });
