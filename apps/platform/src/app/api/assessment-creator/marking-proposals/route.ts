import { NextRequest } from "next/server";
import { apiError, apiSuccess, protectedRoute } from "@/lib/api-utils";
import { createMockMarkingProposals } from "@/lib/assessment-creator/mock-data";

export const POST = protectedRoute(async (_auth, req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  if (!body.assessmentId) return apiError("assessmentId required", 400);

  return apiSuccess({ proposals: createMockMarkingProposals(body.assessmentId) });
}, { orgOptional: true });
