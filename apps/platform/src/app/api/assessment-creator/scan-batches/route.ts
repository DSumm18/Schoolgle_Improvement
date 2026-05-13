import { NextRequest } from "next/server";
import { apiError, apiSuccess, protectedRoute } from "@/lib/api-utils";
import { MOCK_PUPIL_HASHES } from "@/lib/assessment-creator/mock-data";
import { createPaperQrPayload } from "@/lib/assessment-creator/qr";
import { buildScanPageMatch } from "@/lib/assessment-creator/scan-roundtrip";

export const POST = protectedRoute(async (_auth, req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  if (!body.assessmentId) return apiError("assessmentId required", 400);

  const scanBatchId = crypto.randomUUID();
  const matches = MOCK_PUPIL_HASHES.map((pupilHash, index) =>
    buildScanPageMatch({
      scanBatchId,
      pageId: `page-${index + 1}`,
      qrValue: createPaperQrPayload({ assessmentId: body.assessmentId, pupilHash, pageNumber: 1 }),
    }),
  );

  return apiSuccess({
    id: scanBatchId,
    status: "matched",
    uploadedFileName: body.fileName ?? "mock-scan.pdf",
    matches,
  });
}, { orgOptional: true });
