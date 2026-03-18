/**
 * POST /api/estates/helpdesk/[id]/risk — Trigger AI risk assessment + create risk_register entry
 * GET  /api/estates/helpdesk/[id]/risk — Fetch linked risk + score history for timeline
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import {
  assessTicketRisk,
  createRiskForTicket,
} from "@/lib/estates-compliance/services/helpdesk-risk-service";

export const POST = protectedRoute(async (auth, request) => {
  const ticketId = request.nextUrl.pathname.split("/").slice(-2)[0];
  const supabase = createServiceRoleClient();

  // Get the ticket
  const { data: ticket, error: ticketErr } = await supabase
    .from("estates_helpdesk_tickets")
    .select("id, title, description, category, priority, organization_id")
    .eq("id", ticketId)
    .single();

  if (ticketErr || !ticket) {
    return apiError("Ticket not found", 404);
  }

  // Check if risk already exists for this ticket
  const { data: existingRisk } = await supabase
    .from("risk_register")
    .select("id, risk_ref")
    .eq("source_task_id", ticketId)
    .eq("source_table", "estates_helpdesk_tickets")
    .maybeSingle();

  if (existingRisk) {
    return apiError(
      "Risk assessment already exists for this ticket",
      409,
      "ALREADY_EXISTS",
      {
        risk_id: existingRisk.id,
        risk_ref: existingRisk.risk_ref,
      },
    );
  }

  // Allow optional override from request body
  const body = await request.json().catch(() => ({}));

  // Assess the risk via AI
  const assessment = await assessTicketRisk({
    title: ticket.title,
    description: ticket.description,
    category: ticket.category,
    priority: ticket.priority,
  });

  // Apply user overrides if provided
  if (body.likelihood)
    assessment.likelihood = Math.max(1, Math.min(5, body.likelihood));
  if (body.impact) assessment.impact = Math.max(1, Math.min(5, body.impact));
  if (body.likelihood || body.impact) {
    assessment.score = assessment.likelihood * assessment.impact;
  }

  // Create the risk register entry
  const result = await createRiskForTicket(
    ticketId,
    ticket.organization_id,
    assessment,
    ticket.title,
  );

  if (result.error) {
    return apiError(result.error, 500);
  }

  return apiSuccess(
    {
      risk_id: result.risk_id,
      assessment,
    },
    201,
  );
});

export const GET = protectedRoute(async (auth, request) => {
  const ticketId = request.nextUrl.pathname.split("/").slice(-2)[0];
  const supabase = createServiceRoleClient();

  // Find linked risk
  const { data: risk } = await supabase
    .from("risk_register")
    .select("*")
    .eq("source_task_id", ticketId)
    .eq("source_table", "estates_helpdesk_tickets")
    .maybeSingle();

  if (!risk) {
    return apiSuccess({ risk: null, score_history: [], mitigations: [] });
  }

  // Fetch score history (chronological)
  const { data: scoreHistory } = await supabase
    .from("risk_score_history")
    .select("*")
    .eq("risk_id", risk.id)
    .order("created_at", { ascending: true });

  // Fetch mitigations
  const { data: mitigations } = await supabase
    .from("risk_mitigations")
    .select("*")
    .eq("risk_id", risk.id)
    .order("created_at", { ascending: true });

  return apiSuccess({
    risk,
    score_history: scoreHistory || [],
    mitigations: mitigations || [],
  });
});
