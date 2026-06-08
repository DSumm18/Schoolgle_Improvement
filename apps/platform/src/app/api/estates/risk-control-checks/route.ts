import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import {
  applyRiskControlCompletion,
  type RiskControlCompletionResult,
} from "@/lib/estates-compliance/risk-control-checks";

function addDays(date: Date, days: number): string {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString().split("T")[0];
}

function isCompletionResult(value: unknown): value is RiskControlCompletionResult {
  return value === "ok" || value === "not_ok" || value === "missed";
}

export const GET = protectedRoute(async (auth, request) => {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status") || "active";
  const due = searchParams.get("due");
  const ticketId = searchParams.get("ticketId");

  const supabase = createServiceRoleClient();

  let query = supabase
    .from("estates_risk_control_checks")
    .select("*")
    .eq("organization_id", auth.organizationId)
    .order("next_due_date", { ascending: true })
    .order("created_at", { ascending: true });

  if (status !== "all") {
    query = query.eq("status", status);
  }

  if (due === "today") {
    query = query.lte("next_due_date", new Date().toISOString().split("T")[0]);
  }

  if (ticketId) {
    query = query.eq("ticket_id", ticketId);
  }

  const { data: checks, error } = await query;
  if (error) {
    return apiError(`Failed to fetch Risk Control Checks: ${error.message}`, 500);
  }

  const ticketIds = Array.from(
    new Set((checks || []).map((check) => check.ticket_id).filter(Boolean)),
  );

  const { data: tickets } = ticketIds.length
    ? await supabase
        .from("estates_helpdesk_tickets")
        .select("id, ticket_number, title, status, priority, risk_score, location")
        .eq("organization_id", auth.organizationId)
        .in("id", ticketIds)
    : { data: [] };

  const ticketsById = new Map((tickets || []).map((ticket) => [ticket.id, ticket]));

  return apiSuccess({
    checks: (checks || []).map((check) => ({
      ...check,
      ticket: ticketsById.get(check.ticket_id) || null,
      is_overdue:
        check.status === "active" &&
        check.next_due_date < new Date().toISOString().split("T")[0],
    })),
  });
});

export const POST = protectedRoute(async (auth, request) => {
  const body = await request.json();
  const checkId = body.checkId;
  const result = body.result;

  if (!checkId) {
    return apiError("checkId is required", 400);
  }

  if (!isCompletionResult(result)) {
    return apiError("result must be ok, not_ok, or missed", 400);
  }

  const supabase = createServiceRoleClient();

  const { data: check, error: checkError } = await supabase
    .from("estates_risk_control_checks")
    .select("*")
    .eq("id", checkId)
    .eq("organization_id", auth.organizationId)
    .single();

  if (checkError || !check) {
    return apiError("Risk Control Check not found", 404);
  }

  const { data: ticket } = await supabase
    .from("estates_helpdesk_tickets")
    .select("id, title, risk_score, priority, status")
    .eq("id", check.ticket_id)
    .eq("organization_id", auth.organizationId)
    .single();

  const { data: risk } = check.risk_id
    ? await supabase
        .from("risk_register")
        .select("id, effective_residual_score")
        .eq("id", check.risk_id)
        .eq("organization_id", auth.organizationId)
        .maybeSingle()
    : { data: null };

  const currentRiskScore =
    risk?.effective_residual_score ||
    ticket?.risk_score ||
    check.risk_score_if_missed ||
    9;

  const completedAt = new Date();
  const outcome = applyRiskControlCompletion({
    currentRiskScore,
    result,
    dueDate: check.next_due_date,
    completedAt: completedAt.toISOString(),
  });

  const { error: logError } = await supabase
    .from("estates_risk_control_check_logs")
    .insert({
      organization_id: auth.organizationId,
      check_id: check.id,
      ticket_id: check.ticket_id,
      risk_id: check.risk_id,
      result,
      notes: body.notes || null,
      photo_urls: Array.isArray(body.photoUrls) ? body.photoUrls : [],
      completed_by: auth.userId,
      completed_at: completedAt.toISOString(),
      risk_score_before: currentRiskScore,
      risk_score_after: outcome.newRiskScore,
      escalation_required: outcome.escalationRequired,
      escalation_reason: outcome.reason,
    });

  if (logError) {
    return apiError(`Failed to log Risk Control Check: ${logError.message}`, 500);
  }

  const nextDueDate =
    result === "ok" && check.frequency_required === "weekly"
      ? addDays(completedAt, 7)
      : result === "ok"
        ? addDays(completedAt, 1)
        : check.next_due_date;

  const { data: updatedCheck, error: updateCheckError } = await supabase
    .from("estates_risk_control_checks")
    .update({
      last_completed_at: completedAt.toISOString(),
      next_due_date: nextDueDate,
      missed_count: result === "missed" ? (check.missed_count || 0) + 1 : check.missed_count || 0,
      failed_count: result === "not_ok" ? (check.failed_count || 0) + 1 : check.failed_count || 0,
      updated_at: completedAt.toISOString(),
    })
    .eq("id", check.id)
    .select()
    .single();

  if (updateCheckError) {
    return apiError(`Failed to update Risk Control Check: ${updateCheckError.message}`, 500);
  }

  await supabase
    .from("estates_helpdesk_tickets")
    .update({
      risk_score: outcome.newRiskScore,
      priority:
        result === "not_ok" || outcome.newRiskScore >= 17
          ? "critical"
          : ticket?.priority,
      updated_at: completedAt.toISOString(),
    })
    .eq("id", check.ticket_id)
    .eq("organization_id", auth.organizationId);

  if (check.risk_id) {
    await supabase
      .from("risk_register")
      .update({
        effective_residual_score: outcome.newRiskScore,
        direction_of_travel: outcome.riskDirection,
        updated_at: completedAt.toISOString(),
      })
      .eq("id", check.risk_id)
      .eq("organization_id", auth.organizationId);

    await supabase.from("risk_score_history").insert({
      risk_id: check.risk_id,
      organization_id: auth.organizationId,
      score_type: "system_calculated",
      system_score: outcome.newRiskScore,
      recorded_score: outcome.newRiskScore,
      previous_score: currentRiskScore,
      change_reason: outcome.reason,
      trigger_type:
        result === "ok" ? "monitoring_check_completed" : "check_missed",
      trigger_source_id: check.id,
      trigger_source_table: "estates_risk_control_checks",
    });
  }

  await supabase.from("estates_helpdesk_activity").insert({
    ticket_id: check.ticket_id,
    activity_type:
      result === "ok" ? "risk_control_completed" : "risk_control_escalated",
    actor_id: auth.userId,
    description: `Risk Control Check "${check.title}" recorded as ${result.replace("_", " ")}. ${outcome.reason}`,
    metadata: {
      check_id: check.id,
      result,
      risk_score_before: currentRiskScore,
      risk_score_after: outcome.newRiskScore,
      escalation_required: outcome.escalationRequired,
    },
  });

  if (outcome.escalationRequired) {
    await supabase.from("notifications").insert({
      organization_id: auth.organizationId,
      user_id: auth.userId,
      type: "risk_control_escalated",
      title: "Risk Control Check needs review",
      message: `${check.title}: ${outcome.reason}`,
      link: `/estates-compliance/helpdesk/${check.ticket_id}`,
      metadata: {
        checkId: check.id,
        ticketId: check.ticket_id,
        riskScore: outcome.newRiskScore,
      },
    });
  }

  return apiSuccess({
    check: updatedCheck,
    outcome,
  });
});
