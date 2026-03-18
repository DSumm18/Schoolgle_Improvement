/**
 * POST /api/estates/helpdesk/assess
 *
 * Lightweight AI risk pre-assessment — returns a suggested risk score
 * without creating anything in the database. Used by the ticket form
 * to show real-time AI feedback as the user types.
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { assessTicketRisk } from "@/lib/estates-compliance/services/helpdesk-risk-service";

export const POST = protectedRoute(async (auth, request) => {
  const body = await request.json();
  const { title, description, category, priority, location } = body;

  if (!title) {
    return apiError("Title is required", 400);
  }

  const assessment = await assessTicketRisk({
    title,
    description,
    category,
    priority,
    location,
  });

  return apiSuccess({ assessment });
});
