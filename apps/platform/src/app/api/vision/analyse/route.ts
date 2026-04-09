/**
 * POST /api/vision/analyse
 *
 * Lightweight visual auditing endpoint.
 * Accepts a base64-encoded image and returns structured inventory/compliance data
 * using Gemini 2.5 Flash for vision analysis.
 *
 * Rate limited to 10 requests per minute per user.
 */

import { NextRequest, NextResponse } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { analyseImage } from "@/lib/vision/analyse";

// ---------------------------------------------------------------------------
// Rate limiting (simple in-memory counter per user)
// ---------------------------------------------------------------------------

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10;

function checkVisionRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

// ---------------------------------------------------------------------------
// Accepted context values
// ---------------------------------------------------------------------------

const VALID_CONTEXTS = [
  "Chemical Store",
  "Playground",
  "Plant Room",
  "Classroom",
  "General",
];

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export const POST = protectedRoute(async (auth, request: NextRequest) => {
  // Rate limit check
  if (!checkVisionRateLimit(auth.userId)) {
    return apiError(
      "Rate limit exceeded. Maximum 10 vision analyses per minute.",
      429,
      "RATE_LIMITED",
    );
  }

  const body = await request.json();
  const { image, context } = body;

  if (!image || typeof image !== "string") {
    return apiError("image (base64 string) is required.", 400, "MISSING_IMAGE");
  }

  // Validate context if provided
  if (context && !VALID_CONTEXTS.includes(context)) {
    return apiError(
      `Invalid context. Must be one of: ${VALID_CONTEXTS.join(", ")}`,
      400,
      "INVALID_CONTEXT",
    );
  }

  // Rough size check — reject images larger than 20MB base64
  if (image.length > 20 * 1024 * 1024 * 1.37) {
    return apiError(
      "Image too large. Maximum size is 20MB.",
      413,
      "IMAGE_TOO_LARGE",
    );
  }

  const result = await analyseImage(image, context);

  return apiSuccess({
    result,
    analysedAt: new Date().toISOString(),
    context: context || "General",
  });
});
