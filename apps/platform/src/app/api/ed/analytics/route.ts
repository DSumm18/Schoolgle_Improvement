// Ed Analytics API - Privacy-friendly usage tracking

import { NextRequest, NextResponse } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";

interface AnalyticsEvent {
  type: string;
  toolId?: string;
  duration?: number;
  timestamp: number;
  version: string;
}

/**
 * POST /api/ed/analytics
 * Record anonymous usage analytics
 *
 * Note: This is privacy-friendly - no PII is collected.
 * Anonymous POST is acceptable — no auth required.
 */
export async function POST(request: NextRequest) {
  try {
    const event: AnalyticsEvent = await request.json();

    // In production, this would write to a privacy-friendly analytics store
    if (process.env.NODE_ENV === "development") {
      console.log("[Ed Analytics]", {
        type: event.type,
        toolId: event.toolId,
        duration: event.duration,
        version: event.version,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Ed Analytics] Error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

/**
 * GET /api/ed/analytics
 * Get aggregated analytics (admin only)
 */
export const GET = protectedRoute(
  async (auth, request) => {
    // Return placeholder data
    return apiSuccess({
      summary: {
        totalQuestions: 0,
        uniqueTools: 0,
        avgResponseTime: 0,
      },
      topTools: [],
      topQuestions: [],
    });
  },
  { requiredRole: "admin" },
);
