/**
 * Auto-Escalation Service
 *
 * Runs daily (via /api/risk/daily-sync or Vercel cron) to:
 *   1. Check all compliance_instances for overdue items
 *   2. Auto-escalate risk scores on linked tickets/risk entries
 *   3. Check for repeat failures on the same asset
 *   4. Check for critical tickets with no action in 24hrs
 *   5. Generate notifications for escalated items
 *   6. Log all changes to risk_score_events
 *
 * Uses the dynamic scoring engine (scoring-engine.ts) for all calculations.
 */

import { createClient } from "@supabase/supabase-js";
import {
  applyEscalation,
  applyDeEscalation,
  getRiskLevel,
  type ScoreChangeResult,
} from "./scoring-engine";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AutoEscalationSummary {
  overdue_escalations: number;
  repeat_failure_escalations: number;
  critical_no_action_escalations: number;
  monitoring_completions: number;
  total_events_logged: number;
  errors: string[];
}

interface OverdueItem {
  id: string;
  title: string;
  due_date: string;
  organization_id: string;
  risk_score: number | null;
  linked_risk_entry_id: string | null;
  source_type: "ticket" | "compliance_check";
}

// ---------------------------------------------------------------------------
// Service-role Supabase client
// ---------------------------------------------------------------------------

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// ---------------------------------------------------------------------------
// Main Entry Point
// ---------------------------------------------------------------------------

/**
 * Run the full auto-escalation pipeline for an organization.
 * Called by the daily-sync API route.
 */
export async function runAutoEscalation(
  organizationId: string,
): Promise<AutoEscalationSummary> {
  const summary: AutoEscalationSummary = {
    overdue_escalations: 0,
    repeat_failure_escalations: 0,
    critical_no_action_escalations: 0,
    monitoring_completions: 0,
    total_events_logged: 0,
    errors: [],
  };

  // Run all escalation checks
  await escalateOverdueItems(organizationId, summary);
  await escalateRepeatFailures(organizationId, summary);
  await escalateCriticalNoAction(organizationId, summary);
  await recordMonitoringCompletions(organizationId, summary);

  return summary;
}

// ---------------------------------------------------------------------------
// 1. Overdue Compliance Checks & Tickets
// ---------------------------------------------------------------------------

async function escalateOverdueItems(
  organizationId: string,
  summary: AutoEscalationSummary,
): Promise<void> {
  const supabase = getServiceSupabase();

  // Fetch overdue helpdesk tickets with risk scores
  const { data: overdueTickets, error: ticketErr } = await supabase
    .from("estates_helpdesk_tickets")
    .select(
      "id, title, due_date, risk_score, linked_risk_entry_id, organization_id",
    )
    .eq("organization_id", organizationId)
    .not("status", "in", '("completed","cancelled","closed")')
    .not("due_date", "is", null)
    .lt("due_date", new Date().toISOString());

  if (ticketErr) {
    summary.errors.push(`Overdue tickets query: ${ticketErr.message}`);
    return;
  }

  // Fetch overdue compliance tasks
  const { data: overdueChecks, error: checkErr } = await supabase
    .from("estates_compliance_tasks")
    .select(
      "id, title, due_date, organization_id",
    )
    .eq("organization_id", organizationId)
    .neq("status", "completed")
    .not("due_date", "is", null)
    .lt("due_date", new Date().toISOString());

  if (checkErr) {
    summary.errors.push(`Overdue checks query: ${checkErr.message}`);
  }

  // Combine into a common format
  const overdueItems: OverdueItem[] = [
    ...(overdueTickets ?? []).map((t: any) => ({
      id: t.id,
      title: t.title,
      due_date: t.due_date,
      organization_id: t.organization_id,
      risk_score: t.risk_score ?? 0,
      linked_risk_entry_id: t.linked_risk_entry_id,
      source_type: "ticket" as const,
    })),
    ...(overdueChecks ?? []).map((c: any) => ({
      id: c.id,
      title: c.title,
      due_date: c.due_date,
      organization_id: c.organization_id,
      risk_score: 0,
      linked_risk_entry_id: null,
      source_type: "compliance_check" as const,
    })),
  ];

  for (const item of overdueItems) {
    const overdueDays = Math.floor(
      (Date.now() - new Date(item.due_date).getTime()) / (24 * 60 * 60 * 1000),
    );

    if (overdueDays < 1) continue;

    const currentScore = item.risk_score ?? 0;
    const result = applyEscalation(currentScore || 5, {
      type: "check_overdue",
      overdue_days: overdueDays,
    });

    if (result.change === 0) continue;

    // Log the event
    await logScoreEvent(supabase, {
      organization_id: organizationId,
      ticket_id: item.source_type === "ticket" ? item.id : undefined,
      compliance_check_id:
        item.source_type === "compliance_check" ? item.id : undefined,
      risk_id: item.linked_risk_entry_id ?? undefined,
      previous_score: currentScore,
      new_score: result.new_score,
      change_amount: result.change,
      risk_level: result.risk_level,
      change_reason: result.reason,
      triggered_by: "check_overdue",
      metadata: { overdue_days: overdueDays, item_title: item.title },
    });

    // Update the ticket's risk_score if it's a ticket
    if (item.source_type === "ticket") {
      await supabase
        .from("estates_helpdesk_tickets")
        .update({ risk_score: result.new_score })
        .eq("id", item.id);
    }

    // Update the linked risk register entry if present
    if (item.linked_risk_entry_id) {
      await updateRiskRegisterScore(
        supabase,
        item.linked_risk_entry_id,
        result,
      );
    }

    summary.overdue_escalations++;
    summary.total_events_logged++;
  }
}

// ---------------------------------------------------------------------------
// 2. Repeat Failures (3+ in 12 months on same asset)
// ---------------------------------------------------------------------------

async function escalateRepeatFailures(
  organizationId: string,
  summary: AutoEscalationSummary,
): Promise<void> {
  const supabase = getServiceSupabase();

  // Find assets with 3+ completed-but-recurring tickets in the last 12 months
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

  const { data: repeatAssets, error } = await supabase.rpc(
    "get_repeat_failure_assets",
    {
      org_id: organizationId,
      since_date: twelveMonthsAgo.toISOString(),
      min_failures: 3,
    },
  );

  // If the RPC doesn't exist yet, skip gracefully
  if (error) {
    if (!error.message.includes("does not exist")) {
      summary.errors.push(`Repeat failures query: ${error.message}`);
    }
    return;
  }

  for (const asset of repeatAssets ?? []) {
    const currentScore = asset.current_risk_score ?? 5;
    const result = applyEscalation(currentScore, {
      type: "repeat_failure",
      failure_count_12_months: asset.failure_count,
    });

    if (result.change === 0) continue;

    await logScoreEvent(supabase, {
      organization_id: organizationId,
      ticket_id: asset.latest_ticket_id,
      risk_id: asset.linked_risk_entry_id,
      previous_score: currentScore,
      new_score: result.new_score,
      change_amount: result.change,
      risk_level: result.risk_level,
      change_reason: result.reason,
      triggered_by: "repeat_failure",
      metadata: {
        asset_id: asset.asset_id,
        failure_count: asset.failure_count,
      },
    });

    if (asset.latest_ticket_id) {
      await supabase
        .from("estates_helpdesk_tickets")
        .update({ risk_score: result.new_score })
        .eq("id", asset.latest_ticket_id);
    }

    summary.repeat_failure_escalations++;
    summary.total_events_logged++;
  }
}

// ---------------------------------------------------------------------------
// 3. Critical Tickets with No Action in 24hrs
// ---------------------------------------------------------------------------

async function escalateCriticalNoAction(
  organizationId: string,
  summary: AutoEscalationSummary,
): Promise<void> {
  const supabase = getServiceSupabase();

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Find critical tickets created >24hrs ago that are still in 'open' status
  const { data: staleTickets, error } = await supabase
    .from("estates_helpdesk_tickets")
    .select("id, title, risk_score, linked_risk_entry_id")
    .eq("organization_id", organizationId)
    .eq("priority", "critical")
    .eq("status", "open")
    .lt("created_at", twentyFourHoursAgo.toISOString());

  if (error) {
    summary.errors.push(`Critical no-action query: ${error.message}`);
    return;
  }

  for (const ticket of staleTickets ?? []) {
    const currentScore = ticket.risk_score ?? 15;
    const result = applyEscalation(currentScore, {
      type: "critical_no_action_24hrs",
    });

    if (result.change === 0) continue;

    await logScoreEvent(supabase, {
      organization_id: organizationId,
      ticket_id: ticket.id,
      risk_id: ticket.linked_risk_entry_id,
      previous_score: currentScore,
      new_score: result.new_score,
      change_amount: result.change,
      risk_level: result.risk_level,
      change_reason: result.reason,
      triggered_by: "critical_no_action_24hrs",
      metadata: { ticket_title: ticket.title },
    });

    await supabase
      .from("estates_helpdesk_tickets")
      .update({ risk_score: result.new_score })
      .eq("id", ticket.id);

    if (ticket.linked_risk_entry_id) {
      await updateRiskRegisterScore(
        supabase,
        ticket.linked_risk_entry_id,
        result,
      );
    }

    summary.critical_no_action_escalations++;
    summary.total_events_logged++;
  }
}

// ---------------------------------------------------------------------------
// 4. Record Monitoring Completions (prevents escalation)
// ---------------------------------------------------------------------------

async function recordMonitoringCompletions(
  organizationId: string,
  summary: AutoEscalationSummary,
): Promise<void> {
  const supabase = getServiceSupabase();

  // Find tickets/checks completed today (monitoring checks)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: completedToday, error } = await supabase
    .from("estates_compliance_tasks")
    .select("id, title, organization_id")
    .eq("organization_id", organizationId)
    .eq("status", "completed")
    .gte("updated_at", todayStart.toISOString());

  if (error) {
    summary.errors.push(`Monitoring completions query: ${error.message}`);
    return;
  }

  for (const check of completedToday ?? []) {
    const result = applyDeEscalation(0, {
      type: "monitoring_check_completed",
    });

    await logScoreEvent(supabase, {
      organization_id: organizationId,
      compliance_check_id: check.id,
      previous_score: 0,
      new_score: 0,
      change_amount: 0,
      risk_level: "low",
      change_reason: result.reason,
      triggered_by: "monitoring_check_completed",
      metadata: { check_title: check.title },
    });

    summary.monitoring_completions++;
    summary.total_events_logged++;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function logScoreEvent(
  supabase: ReturnType<typeof createClient>,
  event: {
    organization_id: string;
    ticket_id?: string;
    compliance_check_id?: string;
    risk_id?: string;
    previous_score: number;
    new_score: number;
    change_amount: number;
    risk_level: string;
    change_reason: string;
    triggered_by: string;
    triggered_by_user_id?: string;
    metadata?: Record<string, any>;
  },
): Promise<void> {
  const { error } = await supabase.from("risk_score_events").insert({
    organization_id: event.organization_id,
    ticket_id: event.ticket_id ?? null,
    compliance_check_id: event.compliance_check_id ?? null,
    risk_id: event.risk_id ?? null,
    previous_score: event.previous_score,
    new_score: event.new_score,
    change_amount: event.change_amount,
    risk_level: event.risk_level,
    change_reason: event.change_reason,
    triggered_by: event.triggered_by,
    triggered_by_user_id: event.triggered_by_user_id ?? null,
    metadata: event.metadata ?? {},
  });

  if (error) {
    console.error("Failed to log risk score event:", error.message);
  }
}

async function updateRiskRegisterScore(
  supabase: ReturnType<typeof createClient>,
  riskId: string,
  result: ScoreChangeResult,
): Promise<void> {
  // Only update if auto-escalation is enabled for this risk
  const { data: risk } = await supabase
    .from("risk_register")
    .select("auto_escalation_enabled, effective_residual_score")
    .eq("id", riskId)
    .single();

  if (!risk?.auto_escalation_enabled) return;

  await supabase
    .from("risk_register")
    .update({
      effective_residual_score: result.new_score,
      direction_of_travel:
        result.change > 0
          ? "worsening"
          : result.change < 0
            ? "improving"
            : "stable",
      updated_at: new Date().toISOString(),
    })
    .eq("id", riskId);

  // Also record in risk_score_history for the existing audit trail
  await supabase.from("risk_score_history").insert({
    risk_id: riskId,
    score_type: "system_calculated",
    system_score: result.new_score,
    recorded_score: result.new_score,
    previous_score: result.previous_score,
    change_reason: result.reason,
    trigger_type: result.triggered_by,
  });
}
