import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import {
  buildRiskControlDecisionAudit,
  suggestRiskControlChecks,
} from "@/lib/estates-compliance/risk-control-checks";

function getTicketIdFromPath(pathname: string): string {
  const parts = pathname.split("/");
  return parts[parts.indexOf("helpdesk") + 1];
}

async function loadTicketContext(
  ticketId: string,
  organizationId: string,
) {
  const supabase = createServiceRoleClient();

  const { data: ticket, error: ticketError } = await supabase
    .from("estates_helpdesk_tickets")
    .select(
      "id, organization_id, title, description, category, priority",
    )
    .eq("id", ticketId)
    .eq("organization_id", organizationId)
    .single();

  if (ticketError || !ticket) {
    return { supabase, ticket: null, riskId: null, riskScore: null };
  }

  let riskId: string | null = null;
  let riskScore: number | null = null;

  const { data: linkedRisk } = await supabase
    .from("risk_register")
    .select("id, effective_residual_score")
    .eq("organization_id", organizationId)
    .eq("source_task_id", ticketId)
    .eq("source_table", "estates_helpdesk_tickets")
    .maybeSingle();

  if (linkedRisk) {
    riskId = linkedRisk.id;
    riskScore = linkedRisk.effective_residual_score || riskScore;
  }

  return { supabase, ticket, riskId, riskScore };
}

export const GET = protectedRoute(async (auth, request) => {
  const ticketId = getTicketIdFromPath(request.nextUrl.pathname);
  const { supabase, ticket, riskId, riskScore } = await loadTicketContext(
    ticketId,
    auth.organizationId,
  );

  if (!ticket) {
    return apiError("Ticket not found", 404);
  }

  const suggestions = suggestRiskControlChecks({
    organizationId: auth.organizationId,
    ticketId,
    riskId,
    title: ticket.title,
    description: ticket.description,
    category: ticket.category,
    riskScore: riskScore || 9,
  });

  const [{ data: decisions }, { data: checks }] = await Promise.all([
    supabase
      .from("estates_risk_control_recommendations")
      .select("*")
      .eq("organization_id", auth.organizationId)
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: false }),
    supabase
      .from("estates_risk_control_checks")
      .select("*")
      .eq("organization_id", auth.organizationId)
      .eq("ticket_id", ticketId)
      .order("next_due_date", { ascending: true }),
  ]);

  return apiSuccess({
    ticket,
    riskId,
    riskScore: riskScore || suggestions.riskScore,
    suggestions,
    decisions: decisions || [],
    checks: checks || [],
  });
});

export const POST = protectedRoute(async (auth, request) => {
  const ticketId = getTicketIdFromPath(request.nextUrl.pathname);
  const body = await request.json();
  const acceptedRecommendationIds = Array.isArray(body.acceptedRecommendationIds)
    ? body.acceptedRecommendationIds
    : [];
  const declinedRecommendationIds = Array.isArray(body.declinedRecommendationIds)
    ? body.declinedRecommendationIds
    : [];

  if (
    acceptedRecommendationIds.length === 0 &&
    declinedRecommendationIds.length === 0
  ) {
    return apiError("Select at least one recommendation to accept or decline", 400);
  }

  const { supabase, ticket, riskId, riskScore } = await loadTicketContext(
    ticketId,
    auth.organizationId,
  );

  if (!ticket) {
    return apiError("Ticket not found", 404);
  }

  const suggestions = suggestRiskControlChecks({
    organizationId: auth.organizationId,
    ticketId,
    riskId,
    title: ticket.title,
    description: ticket.description,
    category: ticket.category,
    riskScore: riskScore || 9,
  });

  const audit = buildRiskControlDecisionAudit({
    organizationId: auth.organizationId,
    ticketId,
    riskId,
    actorId: auth.userId,
    acceptedRecommendationIds,
    declinedRecommendationIds,
    declinedReason: body.declinedReason,
    suggestions,
  });

  const decisionRows = [...audit.accepted, ...audit.declined];

  if (decisionRows.length > 0) {
    const { error: decisionError } = await supabase
      .from("estates_risk_control_recommendations")
      .upsert(decisionRows, {
        onConflict: "organization_id,ticket_id,recommendation_id",
      });

    if (decisionError) {
      return apiError(`Failed to save recommendation decisions: ${decisionError.message}`, 500);
    }
  }

  if (audit.checksToCreate.length > 0) {
    const { error: checkError } = await supabase
      .from("estates_risk_control_checks")
      .upsert(audit.checksToCreate, {
        onConflict: "organization_id,ticket_id,recommendation_id",
      });

    if (checkError) {
      return apiError(`Failed to create Risk Control Checks: ${checkError.message}`, 500);
    }
  }

  await supabase.from("estates_helpdesk_activity").insert({
    ticket_id: ticketId,
    activity_type: "risk_control_reviewed",
    actor_id: auth.userId,
    description: `Risk Control Checks reviewed: ${audit.accepted.length} accepted, ${audit.declined.length} declined.`,
    metadata: {
      accepted: audit.accepted.map((row) => row.recommendation_id),
      declined: audit.declined.map((row) => row.recommendation_id),
    },
  });

  return apiSuccess({
    accepted: audit.accepted,
    declined: audit.declined,
    checks: audit.checksToCreate,
  }, 201);
});
