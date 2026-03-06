/**
 * Schoolgle Vision AI -- Core Service
 *
 * Central entry point for all vision analysis. Any module or Ed the chatbot
 * calls analyzeVision() with an image/video and gets back structured findings
 * dispatched across multiple modules.
 */

import type { VisionRequest, VisionResult, VisionMetadata } from "./types";
import { selectVisionModel, getFallbackModel, callVisionModel } from "./models";
import { dispatchFindings, summariseDispatches } from "./dispatcher";
import { computeMediaHash, buildEvidenceRecord } from "./evidence";
import { getRoomAssessmentContext } from "./contexts/room-assessment";

// ---------------------------------------------------------------------------
// Context registry -- maps context types to their prompt/parser
// ---------------------------------------------------------------------------

import type { VisionContext } from "./types";

const contexts: Record<string, () => VisionContext> = {
  "room-assessment": getRoomAssessmentContext,
  // Future:
  // 'coshh-scan': getCoshhContext,
  // 'snagging': getSnaggingContext,
  // 'lone-worker': getLoneWorkerContext,
};

function getContext(contextType: string): VisionContext {
  const factory = contexts[contextType];
  if (!factory) {
    // Default to room assessment for unknown types
    return getRoomAssessmentContext();
  }
  return factory();
}

// ---------------------------------------------------------------------------
// Main analysis function
// ---------------------------------------------------------------------------

export interface AnalysisOutput {
  result: VisionResult;
  evidence: {
    mediaHash: string;
    serverReceivedAt: string;
    captureTimestamp: string;
    deviceGps?: { lat: number; lng: number };
    deviceId?: string;
  };
}

/**
 * Analyse an image or video clip and return structured findings.
 *
 * This is the single entry point -- Ed, API routes, and UI components
 * all call this function.
 */
export async function analyzeVision(
  request: VisionRequest,
): Promise<AnalysisOutput> {
  const { contextType, media, mimeType, metadata } = request;

  // 1. Compute evidence hash for tamper-proof chain
  const mediaHash = await computeMediaHash(media);
  const evidenceRecord = buildEvidenceRecord(media, mediaHash, {
    deviceGps: metadata.deviceGps,
    deviceId: metadata.deviceId,
    capturedAt: metadata.capturedAt,
  });

  // 2. Select model and context
  const context = getContext(contextType);
  const model = selectVisionModel(contextType);

  // 3. Call vision model
  let rawResponse: string;
  try {
    rawResponse = await callVisionModel(
      model,
      context.systemPrompt,
      media,
      mimeType,
    );
  } catch (primaryError) {
    // Try fallback model
    const fallback = getFallbackModel(contextType);
    if (!fallback) throw primaryError;

    console.warn(
      `[Vision] Primary model ${model.id} failed, trying fallback ${fallback.id}:`,
      primaryError instanceof Error ? primaryError.message : primaryError,
    );
    rawResponse = await callVisionModel(
      fallback,
      context.systemPrompt,
      media,
      mimeType,
    );
  }

  // 4. Parse model response into structured VisionResult
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawResponse);
  } catch {
    // Model returned non-JSON -- wrap it
    parsed = {
      summary: rawResponse,
      items: [],
      compliance: { score: 0, issues: [], passed: true },
    };
  }

  const result = context.parseResponse(parsed, metadata);

  // 5. Dispatch findings to modules
  result.dispatches = dispatchFindings(result);
  result.summary = summariseDispatches(result.dispatches);

  return {
    result,
    evidence: {
      mediaHash: evidenceRecord.mediaHash,
      serverReceivedAt: evidenceRecord.serverReceivedAt,
      captureTimestamp: evidenceRecord.captureTimestamp,
      deviceGps: evidenceRecord.deviceGps,
      deviceId: evidenceRecord.deviceId,
    },
  };
}
