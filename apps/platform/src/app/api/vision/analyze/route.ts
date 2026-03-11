/**
 * POST /api/vision/analyze
 *
 * Submit an image or video clip for Vision AI analysis.
 * Returns structured findings dispatched across multiple modules.
 */

import { NextRequest, NextResponse } from "next/server";
import { analyzeVision } from "@/lib/vision/service";
import { handleVisionActions } from "@/lib/vision/action-handler";
import { protectedRoute, apiSuccess } from "@/lib/api-utils";
import type { VisionContextType, CheckType } from "@/lib/vision/types";

const VALID_CONTEXTS: VisionContextType[] = [
  "room-assessment",
  "coshh-scan",
  "snagging",
  "lone-worker",
];

export const POST = protectedRoute(
  async (auth, request) => {
    const body = await request.json();
    const { contextType, media, mimeType, metadata } = body;

    if (!contextType || !VALID_CONTEXTS.includes(contextType)) {
      return NextResponse.json(
        {
          error: `Invalid contextType. Must be one of: ${VALID_CONTEXTS.join(", ")}`,
        },
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

    const output = await analyzeVision({
      contextType,
      organizationId: auth.organizationId,
      mediaType: body.mediaType ?? "image",
      media,
      mimeType: mimeType ?? "image/jpeg",
      metadata: {
        assetId: metadata.assetId,
        capturedAt: metadata.capturedAt ?? new Date().toISOString(),
        deviceGps: metadata.deviceGps,
        deviceId: metadata.deviceId,
        checkType: metadata.checkType as CheckType | undefined,
        userId: auth.userId,
      },
    });

    // Create real helpdesk tickets and notifications from findings
    const actionResult = await handleVisionActions(
      output.result,
      output.result.dispatches || [],
      {
        organizationId: auth.organizationId,
        userId: auth.userId,
        roomName: metadata.roomName,
        assetId: metadata.assetId,
      },
    );

    return apiSuccess({
      result: output.result,
      evidence: output.evidence,
      actions: actionResult,
    });
  },
  { requiredRole: "caretaker" },
);
