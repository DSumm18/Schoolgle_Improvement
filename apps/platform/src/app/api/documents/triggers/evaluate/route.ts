import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { fireTrigger } from "@/lib/document-engine";

/**
 * POST /api/documents/triggers/evaluate
 * Manually fire a trigger event (for testing or manual invocation).
 *
 * Body: { event, payload }
 */
export const POST = protectedRoute(
  async (auth, request: NextRequest) => {
    const body = await request.json();
    const { event, payload } = body;

    if (!event) {
      return apiError("Missing required field: event", 400);
    }

    const supabase = createServiceRoleClient();

    const results = await fireTrigger(supabase, event, auth.organizationId, {
      ...payload,
      triggeredBy: auth.userId,
    });

    return apiSuccess({
      event,
      results,
      documentsGenerated: results.filter((r) => r.documentId).length,
      documentsSent: results.filter((r) => r.sent).length,
    });
  },
  { requiredRole: "slt" },
);
