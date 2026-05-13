import { describe, expect, it } from "vitest";
import { createPaperQrPayload, parsePaperQrPayload } from "../qr";
import { buildScanPageMatch } from "../scan-roundtrip";

describe("assessment QR payloads", () => {
  it("round-trips a pseudonymised paper payload", () => {
    const payload = createPaperQrPayload({
      assessmentId: "assessment-1",
      pupilHash: "hash-abc",
      pageNumber: 2,
    });

    expect(parsePaperQrPayload(payload)).toEqual({
      version: 1,
      assessmentId: "assessment-1",
      pupilHash: "hash-abc",
      pageNumber: 2,
    });
  });

  it("rejects unrelated QR payloads", () => {
    expect(parsePaperQrPayload("https://example.com")).toBeNull();
  });

  it("matches scan pages from valid QR payloads", () => {
    const payload = createPaperQrPayload({
      assessmentId: "assessment-1",
      pupilHash: "hash-abc",
      pageNumber: 1,
    });

    expect(buildScanPageMatch({ scanBatchId: "batch-1", pageId: "page-1", qrValue: payload })).toMatchObject({
      assessmentId: "assessment-1",
      pupilHash: "hash-abc",
      status: "matched",
    });
  });

  it("marks scan pages unmatched when no valid QR is present", () => {
    expect(buildScanPageMatch({ scanBatchId: "batch-1", pageId: "page-1", qrValue: null })).toMatchObject({
      status: "unmatched",
      matchConfidence: 0,
    });
  });
});
