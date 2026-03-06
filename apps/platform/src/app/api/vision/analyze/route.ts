/**
 * POST /api/vision/analyze
 *
 * Submit an image or video clip for Vision AI analysis.
 * Returns structured findings dispatched across multiple modules.
 */

import { NextRequest, NextResponse } from "next/server";
import { analyzeVision } from "@/lib/vision/service";
import type { VisionContextType, CheckType } from "@/lib/vision/types";

const VALID_CONTEXTS: VisionContextType[] = [
  "room-assessment",
  "coshh-scan",
  "snagging",
  "lone-worker",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const { contextType, organizationId, media, mimeType, metadata } = body;

    if (!contextType || !VALID_CONTEXTS.includes(contextType)) {
      return NextResponse.json(
        {
          error: `Invalid contextType. Must be one of: ${VALID_CONTEXTS.join(", ")}`,
        },
        { status: 400 },
      );
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId is required" },
        { status: 400 },
      );
    }

    if (!media) {
      return NextResponse.json(
        { error: "media (base64) is required" },
        { status: 400 },
      );
    }

    if (!metadata?.assetId) {
      return NextResponse.json(
        { error: "metadata.assetId is required" },
        { status: 400 },
      );
    }

    // Run analysis
    const output = await analyzeVision({
      contextType,
      organizationId,
      mediaType: body.mediaType ?? "image",
      media,
      mimeType: mimeType ?? "image/jpeg",
      metadata: {
        assetId: metadata.assetId,
        capturedAt: metadata.capturedAt ?? new Date().toISOString(),
        deviceGps: metadata.deviceGps,
        deviceId: metadata.deviceId,
        checkType: metadata.checkType as CheckType | undefined,
        userId: metadata.userId,
      },
    });

    return NextResponse.json({
      success: true,
      result: output.result,
      evidence: output.evidence,
    });
  } catch (error) {
    console.error("[Vision API] Error:", error);
    return NextResponse.json(
      {
        error: "Vision analysis failed",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
