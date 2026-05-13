import type { ScanPageMatch } from "./types";
import { parsePaperQrPayload } from "./qr";

export interface BuildScanMatchInput {
  scanBatchId: string;
  pageId: string;
  qrValue: string | null;
}

export function buildScanPageMatch(input: BuildScanMatchInput): ScanPageMatch {
  const payload = input.qrValue ? parsePaperQrPayload(input.qrValue) : null;

  if (!payload) {
    return {
      pageId: input.pageId,
      scanBatchId: input.scanBatchId,
      assessmentId: "",
      pupilHash: "",
      pageNumber: 0,
      matchConfidence: 0,
      status: "unmatched",
    };
  }

  return {
    pageId: input.pageId,
    scanBatchId: input.scanBatchId,
    assessmentId: payload.assessmentId,
    pupilHash: payload.pupilHash,
    pageNumber: payload.pageNumber,
    matchConfidence: 1,
    status: "matched",
  };
}
