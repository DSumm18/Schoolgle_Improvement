/**
 * Cross-Module Risk Integration Service
 *
 * Automatically creates and updates risks when tasks go overdue or incidents
 * occur in other modules.  This is the "wiring" that makes the risk register
 * dynamic — it bridges Estates, Compliance, and any other task-bearing module
 * into the centralised risk register.
 *
 * All database access uses the service-role Supabase client so this can run
 * from cron jobs and background processes without a user session.
 */

import { createClient } from "@supabase/supabase-js";
import {
  assessRiskFromTask,
  calculateResidualScore,
  generateRiskRef,
  getRiskBand,
  type Risk,
  type RiskCategory,
  type Mitigation,
} from "@/lib/risk-engine";
import { NotificationService } from "@/lib/notification-service";
import {
  getAllStatutoryChecks,
  type StatutoryCheck,
} from "@/lib/estates-compliance/statutory-checks";

// ---------------------------------------------------------------------------
// Service-role Supabase client (bypasses RLS)
// ---------------------------------------------------------------------------

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OverdueTaskRow {
  id: string;
  title: string;
  due_date: string;
  priority?: string;
  is_statutory?: boolean;
  has_safeguarding_impact?: boolean;
  organization_id: string;
  /** Which source module this comes from — "estates" | "compliance" */
  _source_module: string;
  _source_table: string;
  /** Task type ID that maps to a statutory check definition */
  task_type?: string;
}

export interface IncidentParams {
  organization_id: string;
  title: string;
  description?: string;
  severity: "minor" | "moderate" | "major" | "critical";
  source_module: string;
  source_record_id?: string;
  reported_by_id?: string;
  reported_by_name?: string;
  risk_categories?: RiskCategory[];
  has_safeguarding_impact?: boolean;
}

export interface SyncSummary {
  risks_created: number;
  risks_updated: number;
  mitigations_updated: number;
  scores_recalculated: number;
  notifications_sent: number;
  errors: string[];
}

// ---------------------------------------------------------------------------
// 1. Check and Create Risks from Overdue Tasks
// ---------------------------------------------------------------------------

export async function checkAndCreateRisksFromOverdueTasks(
  organizationId: string,
): Promise<{ created: number; updated: number; errors: string[] }> {
  const supabase = getServiceSupabase();
  const errors: string[] = [];
  let created = 0;
  let updated = 0;

  // Build a lookup map from statutory check ID → risk_level
  const statutoryChecks = getAllStatutoryChecks();
  const checkSeverityMap = new Map<string, "low" | "medium" | "high" | "critical">();
  for (const check of statutoryChecks) {
    if (check.risk_level) {
      checkSeverityMap.set(check.id, check.risk_level);
    }
  }

  // --- Fetch overdue statutory estates tasks ---
  const { data: estatesTasks, error: estatesErr } = await supabase
    .from("estates_compliance_tasks")
    .select("id, title, due_date, priority, is_statutory, organization_id, task_type")
    .eq("organization_id", organizationId)
    .neq("status", "completed")
    .eq("is_statutory", true)
    .lt("due_date", new Date().toISOString());

  if (estatesErr) {
    errors.push(`estates_compliance_tasks query failed: ${estatesErr.message}`);
  }

  // --- Fetch overdue compliance tasks ---
  const { data: complianceTasks, error: complianceErr } = await supabase
    .from("compliance_tasks")
    .select("id, title, due_date, priority, organization_id")
    .eq("organization_id", organizationId)
    .neq("status", "completed")
    .lt("due_date", new Date().toISOString());

  if (complianceErr) {
    errors.push(`compliance_tasks query failed: ${complianceErr.message}`);
  }

  // Normalise into a common shape
  const overdueTasks: OverdueTaskRow[] = [
    ...(estatesTasks ?? []).map((t: any) => ({
      ...t,
      _source_module: "estates",
      _source_table: "estates_compliance_tasks",
    })),
    ...(complianceTasks ?? []).map((t: any) => ({
      ...t,
      is_statutory: true, // compliance tasks are statutory by nature
      _source_module: "compliance",
      _source_table: "compliance_tasks",
    })),
  ];

  if (overdueTasks.length === 0) {
    return { created, updated, errors };
  }

  // Batch-fetch existing risks that already reference these tasks
  const taskIds = overdueTasks.map((t) => t.id);
  const { data: existingRisks, error: existingErr } = await supabase
    .from("risk_register")
    .select(
      "id, source_task_id, inherent_likelihood, inherent_impact, system_residual_likelihood, system_residual_impact, effective_residual_score, status",
    )
    .eq("organization_id", organizationId)
    .in("source_task_id", taskIds);

  if (existingErr) {
    errors.push(`risk_register lookup failed: ${existingErr.message}`);
    return { created, updated, errors };
  }

  const riskByTaskId = new Map<string, any>();
  for (const r of existingRisks ?? []) {
    if (r.source_task_id) riskByTaskId.set(r.source_task_id, r);
  }

  // Get school code for risk_ref generation
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", organizationId)
    .single();

  const schoolCode = org?.name
    ? org.name
        .substring(0, 3)
        .toUpperCase()
        .replace(/[^A-Z]/g, "X")
    : organizationId.substring(0, 3).toUpperCase();

  for (const task of overdueTasks) {
    const overdueDays = Math.floor(
      (Date.now() - new Date(task.due_date).getTime()) / (24 * 60 * 60 * 1000),
    );

    const assessment = assessRiskFromTask({
      domain: task._source_module,
      is_statutory: task.is_statutory,
      priority: task.priority,
      overdue_days: overdueDays,
      has_safeguarding_impact: task.has_safeguarding_impact,
      title: task.title,
      check_severity: task.task_type
        ? checkSeverityMap.get(task.task_type)
        : undefined,
    });

    const existingRisk = riskByTaskId.get(task.id);

    if (existingRisk) {
      // Risk already exists — recalculate (overdue days may have increased)
      if (
        existingRisk.status === "closed" ||
        existingRisk.status === "accepted"
      ) {
        continue; // Don't reopen manually resolved risks
      }

      const newScore =
        assessment.inherent_likelihood * assessment.inherent_impact;
      const oldScore = existingRisk.effective_residual_score ?? 0;

      // Only update if the score has changed
      if (
        assessment.inherent_likelihood !== existingRisk.inherent_likelihood ||
        assessment.inherent_impact !== existingRisk.inherent_impact
      ) {
        const { error: updateErr } = await supabase
          .from("risk_register")
          .update({
            inherent_likelihood: assessment.inherent_likelihood,
            inherent_impact: assessment.inherent_impact,
            system_residual_likelihood: assessment.inherent_likelihood,
            system_residual_impact: assessment.inherent_impact,
            effective_residual_score: newScore,
            risk_categories: assessment.risk_categories,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingRisk.id);

        if (updateErr) {
          errors.push(
            `Failed to update risk ${existingRisk.id}: ${updateErr.message}`,
          );
        } else {
          // Record score history
          await supabase.from("risk_score_history").insert({
            risk_id: existingRisk.id,
            organization_id: organizationId,
            score_type: "system_calculated",
            system_likelihood: assessment.inherent_likelihood,
            system_impact: assessment.inherent_impact,
            system_score: newScore,
            recorded_likelihood: assessment.inherent_likelihood,
            recorded_impact: assessment.inherent_impact,
            recorded_score: newScore,
            trigger_type: "daily_sync",
          });
          updated++;
        }
      }
    } else {
      // No risk exists — create one
      const primaryCategory: RiskCategory =
        assessment.risk_categories[0] || "operational";

      // Count existing risks in this category for sequence number
      const { count } = await supabase
        .from("risk_register")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .contains("risk_categories", [primaryCategory]);

      const sequence = (count ?? 0) + 1;
      const riskRef = generateRiskRef(primaryCategory, schoolCode, sequence);

      const { error: insertErr } = await supabase.from("risk_register").insert({
        organization_id: organizationId,
        risk_ref: riskRef,
        title: assessment.suggested_title,
        description: `Auto-created from overdue ${task._source_module} task "${task.title}" (${overdueDays} days overdue).`,
        tier: "school",
        status: "identified",
        risk_categories: assessment.risk_categories,
        source_module: task._source_module,
        source_task_id: task.id,
        source_table: task._source_table,
        inherent_likelihood: assessment.inherent_likelihood,
        inherent_impact: assessment.inherent_impact,
        impact_by_category: {},
        system_residual_likelihood: assessment.inherent_likelihood,
        system_residual_impact: assessment.inherent_impact,
        effective_residual_score:
          assessment.inherent_likelihood * assessment.inherent_impact,
      });

      if (insertErr) {
        errors.push(
          `Failed to create risk for task ${task.id}: ${insertErr.message}`,
        );
      } else {
        created++;
      }
    }
  }

  return { created, updated, errors };
}

// ---------------------------------------------------------------------------
// 2. Create Risk from Incident
// ---------------------------------------------------------------------------

export async function createRiskFromIncident(
  params: IncidentParams,
): Promise<{ event_id?: string; risk_id?: string; error?: string }> {
  const supabase = getServiceSupabase();

  // Map severity to numeric impact
  const severityImpact: Record<string, number> = {
    minor: 1,
    moderate: 2,
    major: 4,
    critical: 5,
  };

  // Create the risk_event record
  const { data: event, error: eventErr } = await supabase
    .from("risk_events")
    .insert({
      organization_id: params.organization_id,
      title: params.title,
      description: params.description,
      severity: params.severity,
      source_module: params.source_module,
      source_record_id: params.source_record_id,
      reported_by_id: params.reported_by_id,
      reported_by_name: params.reported_by_name,
      occurred_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (eventErr) {
    return { error: `Failed to create risk event: ${eventErr.message}` };
  }

  const eventId = event.id;

  // Only auto-create a risk for major/critical incidents
  if (params.severity !== "major" && params.severity !== "critical") {
    return { event_id: eventId };
  }

  // Determine risk categories
  const categories: RiskCategory[] =
    params.risk_categories && params.risk_categories.length > 0
      ? params.risk_categories
      : params.has_safeguarding_impact
        ? ["safeguarding"]
        : ["operational"];

  const impact = severityImpact[params.severity] ?? 3;
  const likelihood = params.severity === "critical" ? 4 : 3;

  // Get school code
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", params.organization_id)
    .single();

  const schoolCode = org?.name
    ? org.name
        .substring(0, 3)
        .toUpperCase()
        .replace(/[^A-Z]/g, "X")
    : params.organization_id.substring(0, 3).toUpperCase();

  const primaryCategory = categories[0];
  const { count } = await supabase
    .from("risk_register")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", params.organization_id)
    .contains("risk_categories", [primaryCategory]);

  const sequence = (count ?? 0) + 1;
  const riskRef = generateRiskRef(primaryCategory, schoolCode, sequence);

  const { data: risk, error: riskErr } = await supabase
    .from("risk_register")
    .insert({
      organization_id: params.organization_id,
      risk_ref: riskRef,
      title: `Risk: ${params.title}`,
      description: `Auto-created from ${params.severity} incident: ${params.description ?? params.title}`,
      tier: "school",
      status: "identified",
      risk_categories: categories,
      source_module: params.source_module,
      inherent_likelihood: likelihood,
      inherent_impact: impact,
      impact_by_category: {},
      system_residual_likelihood: likelihood,
      system_residual_impact: impact,
      effective_residual_score: likelihood * impact,
    })
    .select("id")
    .single();

  if (riskErr) {
    return {
      event_id: eventId,
      error: `Event created but risk creation failed: ${riskErr.message}`,
    };
  }

  // Link event to risk
  await supabase
    .from("risk_events")
    .update({ risk_id: risk.id })
    .eq("id", eventId);

  // Record initial score history
  await supabase.from("risk_score_history").insert({
    risk_id: risk.id,
    organization_id: params.organization_id,
    score_type: "system_calculated",
    system_likelihood: likelihood,
    system_impact: impact,
    system_score: likelihood * impact,
    recorded_likelihood: likelihood,
    recorded_impact: impact,
    recorded_score: likelihood * impact,
    trigger_type: "incident",
  });

  return { event_id: eventId, risk_id: risk.id };
}

// ---------------------------------------------------------------------------
// 3. Sync Mitigations from Tasks
// ---------------------------------------------------------------------------

export async function syncMitigationsFromTasks(
  organizationId: string,
): Promise<{ updated: number; errors: string[] }> {
  const supabase = getServiceSupabase();
  const errors: string[] = [];
  let updated = 0;

  // Fetch mitigations that have source_task_ids set
  const { data: mitigations, error: mitErr } = await supabase
    .from("risk_mitigations")
    .select(
      "id, risk_id, source_task_id, source_task_table, is_operating, effectiveness, overdue",
    )
    .eq("organization_id", organizationId)
    .not("source_task_id", "is", null);

  if (mitErr) {
    errors.push(`risk_mitigations query failed: ${mitErr.message}`);
    return { updated, errors };
  }

  if (!mitigations || mitigations.length === 0) {
    return { updated, errors };
  }

  // Group mitigations by source table for batch lookups
  const byTable = new Map<string, typeof mitigations>();
  for (const m of mitigations) {
    const table = m.source_task_table || "estates_compliance_tasks";
    if (!byTable.has(table)) byTable.set(table, []);
    byTable.get(table)!.push(m);
  }

  for (const [table, mits] of byTable) {
    const taskIds = mits.map((m: any) => m.source_task_id);

    const { data: tasks, error: taskErr } = await supabase
      .from(table)
      .select("id, status, due_date")
      .in("id", taskIds);

    if (taskErr) {
      errors.push(`Failed to query ${table}: ${taskErr.message}`);
      continue;
    }

    const taskMap = new Map<string, any>();
    for (const t of tasks ?? []) {
      taskMap.set(t.id, t);
    }

    for (const mit of mits) {
      const task = taskMap.get(mit.source_task_id);
      if (!task) continue;

      const isCompleted = task.status === "completed";
      const isOverdue =
        !isCompleted && task.due_date && new Date(task.due_date) < new Date();

      let newIsOperating = mit.is_operating;
      let newEffectiveness = mit.effectiveness;
      let newOverdue = mit.overdue;
      let lastOperatedAt: string | undefined;

      if (isCompleted) {
        newIsOperating = true;
        newEffectiveness = "effective";
        newOverdue = false;
        lastOperatedAt = new Date().toISOString();
      } else if (isOverdue) {
        newIsOperating = false;
        newEffectiveness = "ineffective";
        newOverdue = true;
      }

      // Only update if something changed
      if (
        newIsOperating !== mit.is_operating ||
        newEffectiveness !== mit.effectiveness ||
        newOverdue !== mit.overdue
      ) {
        const updateData: Record<string, any> = {
          is_operating: newIsOperating,
          effectiveness: newEffectiveness,
          overdue: newOverdue,
          updated_at: new Date().toISOString(),
        };
        if (lastOperatedAt) {
          updateData.last_operated_at = lastOperatedAt;
        }

        const { error: updateErr } = await supabase
          .from("risk_mitigations")
          .update(updateData)
          .eq("id", mit.id);

        if (updateErr) {
          errors.push(
            `Failed to update mitigation ${mit.id}: ${updateErr.message}`,
          );
        } else {
          updated++;
        }
      }
    }
  }

  return { updated, errors };
}

// ---------------------------------------------------------------------------
// 4. Run Daily Risk Recalculation
// ---------------------------------------------------------------------------

export async function runDailyRiskRecalculation(
  organizationId: string,
): Promise<SyncSummary> {
  const supabase = getServiceSupabase();
  const summary: SyncSummary = {
    risks_created: 0,
    risks_updated: 0,
    mitigations_updated: 0,
    scores_recalculated: 0,
    notifications_sent: 0,
    errors: [],
  };

  // Step 1: Create/update risks from overdue tasks
  const taskResult = await checkAndCreateRisksFromOverdueTasks(organizationId);
  summary.risks_created = taskResult.created;
  summary.risks_updated = taskResult.updated;
  summary.errors.push(...taskResult.errors);

  // Step 2: Sync mitigation statuses from tasks
  const mitResult = await syncMitigationsFromTasks(organizationId);
  summary.mitigations_updated = mitResult.updated;
  summary.errors.push(...mitResult.errors);

  // Step 3: Recalculate scores for all open risks
  const { data: openRisks, error: risksErr } = await supabase
    .from("risk_register")
    .select("*")
    .eq("organization_id", organizationId)
    .not("status", "in", '("closed","accepted")');

  if (risksErr) {
    summary.errors.push(`Failed to fetch open risks: ${risksErr.message}`);
    return summary;
  }

  // Track risks that need notifications
  const newRiskIds: string[] = [];
  const aboveAppetiteRisks: any[] = [];
  const worseningRisks: any[] = [];

  for (const riskRow of openRisks ?? []) {
    // Fetch mitigations for this risk
    const { data: mitigations } = await supabase
      .from("risk_mitigations")
      .select("*")
      .eq("risk_id", riskRow.id);

    const risk: Risk = {
      id: riskRow.id,
      risk_ref: riskRow.risk_ref,
      title: riskRow.title,
      description: riskRow.description,
      tier: riskRow.tier,
      status: riskRow.status,
      risk_categories: riskRow.risk_categories || [],
      source_module: riskRow.source_module,
      inherent_likelihood: riskRow.inherent_likelihood,
      inherent_impact: riskRow.inherent_impact,
      impact_by_category: riskRow.impact_by_category || {},
      system_residual_likelihood: riskRow.system_residual_likelihood,
      system_residual_impact: riskRow.system_residual_impact,
      override_residual_likelihood: riskRow.override_residual_likelihood,
      override_residual_impact: riskRow.override_residual_impact,
      override_expires_at: riskRow.override_expires_at,
      target_score: riskRow.target_score,
      risk_appetite_threshold: riskRow.risk_appetite_threshold,
    };

    const mits: Mitigation[] = (mitigations ?? []).map((m: any) => ({
      id: m.id,
      risk_id: m.risk_id,
      title: m.title,
      mitigation_type: m.mitigation_type,
      effectiveness: m.effectiveness,
      is_operating: m.is_operating,
      last_operated_at: m.last_operated_at,
      frequency_required: m.frequency_required,
      overdue: m.overdue,
      likelihood_reduction: m.likelihood_reduction ?? 0,
      impact_reduction: m.impact_reduction ?? 0,
    }));

    const previousScore = riskRow.effective_residual_score ?? 0;
    const result = calculateResidualScore(risk, mits, previousScore);

    // Update the risk with new calculated scores
    const { error: updateErr } = await supabase
      .from("risk_register")
      .update({
        system_residual_likelihood: result.residual_likelihood,
        system_residual_impact: result.residual_impact,
        effective_residual_score: result.effective_score,
        direction_of_travel: result.direction_of_travel,
        control_effectiveness_pct: result.control_effectiveness_pct,
        updated_at: new Date().toISOString(),
      })
      .eq("id", riskRow.id);

    if (updateErr) {
      summary.errors.push(
        `Failed to update risk score ${riskRow.id}: ${updateErr.message}`,
      );
    } else {
      summary.scores_recalculated++;

      // Record score history
      await supabase.from("risk_score_history").insert({
        risk_id: riskRow.id,
        organization_id: organizationId,
        score_type: "system_calculated",
        system_likelihood: result.residual_likelihood,
        system_impact: result.residual_impact,
        system_score: result.residual_score,
        recorded_likelihood: result.residual_likelihood,
        recorded_impact: result.residual_impact,
        recorded_score: result.effective_score,
        trigger_type: "daily_sync",
      });
    }

    // Track notification triggers
    if (riskRow.created_at && isToday(riskRow.created_at)) {
      newRiskIds.push(riskRow.id);
    }

    if (result.above_appetite) {
      aboveAppetiteRisks.push({
        risk: riskRow,
        result,
        wasAboveBefore:
          previousScore >
          (riskRow.risk_appetite_threshold ??
            getDefaultThreshold(riskRow.risk_categories)),
      });
    }

    if (result.direction_of_travel === "worsening") {
      worseningRisks.push({ risk: riskRow, result });
    }
  }

  // Step 4: Send notifications
  const notificationsSent = await sendRiskNotifications(organizationId, {
    newRiskIds,
    aboveAppetiteRisks,
    worseningRisks,
    risksCreated: summary.risks_created,
  });
  summary.notifications_sent = notificationsSent;

  return summary;
}

// ---------------------------------------------------------------------------
// Notification Helpers
// ---------------------------------------------------------------------------

async function sendRiskNotifications(
  organizationId: string,
  context: {
    newRiskIds: string[];
    aboveAppetiteRisks: any[];
    worseningRisks: any[];
    risksCreated: number;
  },
): Promise<number> {
  const supabase = getServiceSupabase();
  let sent = 0;

  // Fetch admin users for this organization (headteacher, SLT, admin roles)
  const { data: admins } = await supabase
    .from("users")
    .select("id, role")
    .eq("organization_id", organizationId)
    .in("role", ["admin", "headteacher", "slt"]);

  const adminIds = (admins ?? []).map((a: any) => a.id);
  const headteacherIds = (admins ?? [])
    .filter((a: any) => a.role === "headteacher")
    .map((a: any) => a.id);

  // Notify about newly auto-created risks
  if (context.risksCreated > 0) {
    for (const userId of adminIds) {
      try {
        await NotificationService.send({
          organizationId,
          userId,
          type: "compliance_reminder" as any,
          title: `${context.risksCreated} new risk(s) auto-created`,
          message: `${context.risksCreated} new risk(s) were automatically created from overdue statutory tasks. Review them in the Risk Register.`,
          link: "/dashboard/risk",
        });
        sent++;
      } catch {
        // Notification failures should not block the sync
      }
    }
  }

  // Notify about risks crossing above appetite (only newly crossed)
  const newlyAboveAppetite = context.aboveAppetiteRisks.filter(
    (r) => !r.wasAboveBefore,
  );
  for (const { risk } of newlyAboveAppetite) {
    // Notify headteacher and governors
    const notifyIds = [
      ...headteacherIds,
      ...(risk.risk_owner_id ? [risk.risk_owner_id] : []),
    ];
    const uniqueIds = [...new Set(notifyIds)];

    for (const userId of uniqueIds) {
      try {
        await NotificationService.send({
          organizationId,
          userId,
          type: "compliance_overdue" as any,
          title: `Risk above appetite: ${risk.risk_ref}`,
          message: `"${risk.title}" has crossed above the organisation's risk appetite threshold. Immediate attention required.`,
          link: `/dashboard/risk/${risk.id}`,
          metadata: {
            risk_id: risk.id,
            risk_ref: risk.risk_ref,
          },
        });
        sent++;
      } catch {
        // Continue on notification failure
      }
    }
  }

  // Notify risk owners about worsening risks
  for (const { risk, result } of context.worseningRisks) {
    if (!risk.risk_owner_id) continue;
    try {
      await NotificationService.send({
        organizationId,
        userId: risk.risk_owner_id,
        type: "compliance_reminder" as any,
        title: `Risk worsening: ${risk.risk_ref}`,
        message: `"${risk.title}" direction of travel is worsening (score: ${result.effective_score}). Review mitigations.`,
        link: `/dashboard/risk/${risk.id}`,
        metadata: {
          risk_id: risk.id,
          risk_ref: risk.risk_ref,
          direction: "worsening",
        },
      });
      sent++;
    } catch {
      // Continue on notification failure
    }
  }

  return sent;
}

// ---------------------------------------------------------------------------
// Utility Helpers
// ---------------------------------------------------------------------------

function isToday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function getDefaultThreshold(categories: RiskCategory[]): number {
  // Import logic from risk-engine — use lowest appetite across categories
  const thresholds: Record<string, number> = {
    safeguarding: 4,
    h_and_s: 8,
    legal: 8,
    governance: 8,
    financial: 12,
    reputational: 12,
    staffing: 12,
    cyber: 10,
    operational: 12,
    equality: 10,
    educational: 15,
    strategic: 15,
  };

  if (!categories || categories.length === 0) return 12;

  let min = Infinity;
  for (const cat of categories) {
    const t = thresholds[cat];
    if (t != null && t < min) min = t;
  }
  return min === Infinity ? 12 : min;
}
