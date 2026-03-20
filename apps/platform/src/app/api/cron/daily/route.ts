/**
 * Unified Daily Cron Endpoint
 *
 * GET /api/cron/daily
 *
 * Vercel cron: runs daily at 06:00 UTC
 * vercel.json: { "crons": [{ "path": "/api/cron/daily", "schedule": "0 6 * * *" }] }
 *
 * Orchestrates all daily automated processes for every active organisation:
 *   1. Risk recalculation (overdue tasks -> risk register)
 *   2. Compliance reminders (policies, training, DBS expiring within 30/14/7 days)
 *   3. Training expiry alerts (upcoming training expirations)
 *   4. Approval SLA checks (pending approvals past deadline)
 *   5. Energy anomaly detection (stub — weekend/overnight patterns)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { runDailyRiskRecalculation } from "@/lib/risk-integration";
import { processDailyReminders } from "@/lib/estates-compliance/notifications/reminder-service";
import { NotificationService } from "@/lib/notification-service";
import {
  shouldNotify,
  type NotificationCategory,
} from "@/lib/notification-preferences";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://schoolgle.co.uk";

// ---------------------------------------------------------------------------
// Organisation loader
// ---------------------------------------------------------------------------

async function getActiveOrganizations(): Promise<
  Array<{ id: string; name: string }>
> {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("is_active", true);

  if (error) {
    // Fallback: if is_active column doesn't exist, just get all orgs
    const { data: allOrgs, error: allErr } = await supabase
      .from("organizations")
      .select("id, name")
      .limit(100);

    if (allErr) {
      console.error("[Cron] Failed to fetch organizations:", allErr.message);
      return [];
    }
    return allOrgs || [];
  }

  return data || [];
}

// ---------------------------------------------------------------------------
// Task runners (per organisation)
// ---------------------------------------------------------------------------

interface OrgResult {
  organizationId: string;
  organizationName: string;
  risk: { risks_created: number; risks_updated: number; errors: string[] };
  compliance: { processed: number; sent: number; failed: number };
  training: { expiring: number; notified: number };
  approvals: { breached: number; notified: number };
  energy: { anomalies: number };
  durationMs: number;
}

/**
 * Check compliance_training_completions for certificates expiring within 30/14/7 days.
 */
async function checkTrainingExpiry(organizationId: string): Promise<{
  expiring: number;
  notified: number;
}> {
  const supabase = getServiceSupabase();
  const now = new Date();
  let expiring = 0;
  let notified = 0;

  for (const daysAhead of [30, 14, 7]) {
    const checkDate = new Date(now);
    checkDate.setDate(checkDate.getDate() + daysAhead);
    const dateStr = checkDate.toISOString().split("T")[0];

    const { data: expiringRecords, error } = await supabase
      .from("compliance_training_completions")
      .select("id, user_id, course_name, expiry_date")
      .eq("organization_id", organizationId)
      .eq("expiry_date", dateStr);

    if (error || !expiringRecords) continue;

    expiring += expiringRecords.length;

    for (const record of expiringRecords) {
      if (!shouldNotify(record.user_id, "training_expiry", "in_app")) continue;

      const result = await NotificationService.send({
        organizationId,
        userId: record.user_id,
        type: "compliance_reminder",
        title: `Training expires in ${daysAhead} days`,
        message: `Your "${record.course_name}" training certificate expires on ${record.expiry_date}. Please arrange renewal.`,
        link: "/dashboard/compliance/training",
        metadata: {
          category: "training_expiry",
          days_until_expiry: daysAhead,
          course_name: record.course_name,
        },
      });

      if (result.success) notified++;
    }
  }

  return { expiring, notified };
}

/**
 * Check for pending approvals that have breached their SLA.
 * Looks at compliance_tasks with status 'pending_approval' and an sla_deadline.
 */
async function checkApprovalSLA(organizationId: string): Promise<{
  breached: number;
  notified: number;
}> {
  const supabase = getServiceSupabase();
  const now = new Date().toISOString();
  let breached = 0;
  let notified = 0;

  // Check compliance_tasks for pending approvals past their SLA
  const { data: overdueApprovals, error } = await supabase
    .from("compliance_tasks")
    .select("id, title, assigned_to, sla_deadline")
    .eq("organization_id", organizationId)
    .eq("status", "pending_approval")
    .lt("sla_deadline", now);

  if (error || !overdueApprovals) return { breached, notified };

  breached = overdueApprovals.length;

  for (const task of overdueApprovals) {
    if (!task.assigned_to) continue;
    if (!shouldNotify(task.assigned_to, "approval_requests", "in_app"))
      continue;

    const result = await NotificationService.send({
      organizationId,
      userId: task.assigned_to,
      type: "compliance_overdue",
      title: "Approval SLA breached",
      message: `The approval for "${task.title}" has exceeded its SLA deadline. Please review urgently.`,
      link: "/dashboard/compliance/tasks",
      metadata: {
        category: "approval_requests",
        task_id: task.id,
        sla_deadline: task.sla_deadline,
      },
    });

    if (result.success) notified++;
  }

  return { breached, notified };
}

/**
 * Energy anomaly detection — stub.
 * Future: check for weekend/overnight meter readings that indicate waste.
 */
async function checkEnergyAnomalies(
  _organizationId: string,
): Promise<{ anomalies: number }> {
  // Stub: no energy data source yet
  return { anomalies: 0 };
}

/**
 * Run all daily tasks for a single organisation.
 */
async function processOrganization(org: {
  id: string;
  name: string;
}): Promise<OrgResult> {
  const start = Date.now();

  // Run all checks in parallel
  const [
    riskResult,
    complianceResult,
    trainingResult,
    approvalResult,
    energyResult,
  ] = await Promise.allSettled([
    runDailyRiskRecalculation(org.id),
    processDailyReminders(org.id, BASE_URL),
    checkTrainingExpiry(org.id),
    checkApprovalSLA(org.id),
    checkEnergyAnomalies(org.id),
  ]);

  const risk =
    riskResult.status === "fulfilled"
      ? {
          risks_created: riskResult.value.risks_created,
          risks_updated: riskResult.value.risks_updated,
          errors: riskResult.value.errors,
        }
      : {
          risks_created: 0,
          risks_updated: 0,
          errors: [riskResult.reason?.message || "Risk recalculation failed"],
        };

  const compliance =
    complianceResult.status === "fulfilled"
      ? {
          processed: complianceResult.value.processed,
          sent: complianceResult.value.sent,
          failed: complianceResult.value.failed,
        }
      : { processed: 0, sent: 0, failed: 0 };

  const training =
    trainingResult.status === "fulfilled"
      ? trainingResult.value
      : { expiring: 0, notified: 0 };

  const approvals =
    approvalResult.status === "fulfilled"
      ? approvalResult.value
      : { breached: 0, notified: 0 };

  const energy =
    energyResult.status === "fulfilled" ? energyResult.value : { anomalies: 0 };

  return {
    organizationId: org.id,
    organizationName: org.name,
    risk,
    compliance,
    training,
    approvals,
    energy,
    durationMs: Date.now() - start,
  };
}

// ---------------------------------------------------------------------------
// GET handler (Vercel cron sends GET)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  // Verify cron secret — fail CLOSED if not configured
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    const orgs = await getActiveOrganizations();

    if (orgs.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active organizations to process",
        duration_ms: Date.now() - startTime,
      });
    }

    // Process all organisations in parallel (with concurrency limit)
    const BATCH_SIZE = 5;
    const results: OrgResult[] = [];

    for (let i = 0; i < orgs.length; i += BATCH_SIZE) {
      const batch = orgs.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map((org) => processOrganization(org)),
      );
      results.push(...batchResults);
    }

    // Aggregate summary
    const summary = {
      organizations_processed: results.length,
      totals: {
        risks_created: results.reduce((s, r) => s + r.risk.risks_created, 0),
        risks_updated: results.reduce((s, r) => s + r.risk.risks_updated, 0),
        compliance_reminders_sent: results.reduce(
          (s, r) => s + r.compliance.sent,
          0,
        ),
        training_expiry_notified: results.reduce(
          (s, r) => s + r.training.notified,
          0,
        ),
        approval_sla_breached: results.reduce(
          (s, r) => s + r.approvals.breached,
          0,
        ),
        energy_anomalies: results.reduce((s, r) => s + r.energy.anomalies, 0),
      },
      errors: results.flatMap((r) =>
        r.risk.errors.map((e) => `[${r.organizationName}] ${e}`),
      ),
      duration_ms: Date.now() - startTime,
    };

    console.log("[Cron Daily]", JSON.stringify(summary, null, 2));

    return NextResponse.json({
      success: true,
      summary,
      organizations: results.map((r) => ({
        id: r.organizationId,
        name: r.organizationName,
        risk: r.risk,
        compliance: r.compliance,
        training: r.training,
        approvals: r.approvals,
        energy: r.energy,
        duration_ms: r.durationMs,
      })),
    });
  } catch (error: any) {
    console.error("[Cron Daily] Fatal error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
        duration_ms: Date.now() - startTime,
      },
      { status: 500 },
    );
  }
}
