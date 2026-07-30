/**
 * Statutory Check Completions Database Functions
 *
 * Functions for tracking completion status of predefined statutory checks
 */

import { createServiceRoleClient } from "@/lib/supabase-server";
import type { ComplianceDomain } from "@/types/estates-compliance";

/**
 * Get a Supabase client for server-side DB operations.
 *
 * Uses the service role client because:
 * 1. This code is only called from API routes that have already validated
 *    the user via auth-middleware (protectedRoute) — RLS enforcement at
 *    this layer would be redundant.
 * 2. Supports both cookie-based and Bearer-token authenticated requests.
 *    The legacy cookie-based createClient() returns empty for Bearer auth.
 * 3. All queries filter by organizationId (passed explicitly), so tenant
 *    isolation is preserved.
 */
async function getClient() {
  return createServiceRoleClient();
}

/**
 * Completion record for a statutory check
 */
export interface StatutoryCompletion {
  id: string;
  organization_id: string;
  check_id: string;
  compliance_domain: ComplianceDomain;
  status:
    | "pending"
    | "completed"
    | "failed"
    | "overdue"
    | "not_applicable"
    | "in_progress"
    | "awaiting_documentation";
  completed_at?: string;
  completed_by?: string;
  completion_notes?: string;
  next_due_date: string;
  last_due_date?: string;
  evidence_ids: string[];
  documents_received: boolean;
  contractor_id?: string;
  assigned_to?: string;
  team_id?: string;
  inspection_date?: string;
  measurement_data?: unknown[];
  documentation_received_at?: string;
  documentation_received_by?: string;
  documentation_last_chased_at?: string;
  documentation_last_chased_by?: string;
  documentation_chase_count?: number;
  completion_duration_minutes?: number;
  findings: unknown[];
  rag_status: "red" | "amber" | "green";
  created_at: string;
  updated_at: string;
}

/**
 * Summary of completions for a domain
 */
export interface DomainCompletionSummary {
  domain: ComplianceDomain;
  totalChecks: number;
  completedChecks: number;
  overdueChecks: number;
  pendingChecks: number;
  status: "compliant" | "attention" | "critical";
  completions: StatutoryCompletion[];
}

/**
 * Input for creating a completion record
 */
export interface CreateCompletionInput {
  check_id: string;
  compliance_domain: ComplianceDomain;
  next_due_date: string;
  last_due_date?: string;
}

/**
 * Input for updating a completion record
 */
export interface UpdateCompletionInput {
  status?: StatutoryCompletion["status"];
  completed_at?: string;
  completed_by?: string;
  completion_notes?: string;
  next_due_date?: string;
  evidence_ids?: string[];
  documents_received?: boolean;
  contractor_id?: string;
  completion_duration_minutes?: number;
  findings?: unknown[];
  compliance_domain?: string;
  rag_status?: "red" | "amber" | "green";
  assigned_to?: string;
  team_id?: string;
  inspection_date?: string;
  documentation_received_at?: string;
  documentation_received_by?: string;
  documentation_last_chased_at?: string;
  documentation_last_chased_by?: string;
  documentation_chase_count?: number;
  measurement_data?: unknown[];
}

const UPDATABLE_COMPLETION_COLUMNS = [
  "status",
  "completed_at",
  "completed_by",
  "completion_notes",
  "next_due_date",
  "evidence_ids",
  "documents_received",
  "contractor_id",
  "completion_duration_minutes",
  "findings",
  "compliance_domain",
  "rag_status",
  "last_due_date",
  "location_id",
  "room_id",
  "reviewed_by",
  "reviewed_at",
  "assigned_to",
  "team_id",
  "inspection_date",
  "documentation_received_at",
  "documentation_received_by",
  "documentation_last_chased_at",
  "documentation_last_chased_by",
  "documentation_chase_count",
  "measurement_data",
] as const;

export function normalizeCompletionUpdates(
  updates: UpdateCompletionInput & Record<string, unknown>,
): UpdateCompletionInput & Record<string, unknown> {
  const row: Record<string, unknown> = {};

  for (const key of UPDATABLE_COMPLETION_COLUMNS) {
    if (updates[key] !== undefined) {
      row[key] = updates[key];
    }
  }

  if (row.status === "pending_contractor") {
    row.status = "in_progress";
  }

  return row;
}

async function getCheckFrequency(
  checkId: string,
  domain?: string,
): Promise<string> {
  const { getAllStatutoryChecks, getChecksForDomain } = await import(
    "@/lib/estates-compliance/statutory-checks"
  );

  const checks = domain ? getChecksForDomain(domain as ComplianceDomain) : getAllStatutoryChecks();
  return checks.find((check) => check.id === checkId)?.frequency || "annually";
}

/**
 * Get all completions for an organization
 */
export async function getStatutoryCompletions(
  organizationId: string,
  filters?: {
    domain?: ComplianceDomain;
    status?: StatutoryCompletion["status"];
    check_id?: string;
  },
): Promise<StatutoryCompletion[]> {
  const supabase = await getClient();

  let query = supabase
    .from("estates_statutory_completions")
    .select("*")
    .eq("organization_id", organizationId);

  if (filters?.domain) {
    query = query.eq("compliance_domain", filters.domain);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.check_id) {
    query = query.eq("check_id", filters.check_id);
  }

  // Order by next due date
  query = query.order("next_due_date", { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching statutory completions:", error);
    throw error;
  }

  return data || [];
}

/**
 * Get latest completion for a specific check
 */
export async function getLatestCompletion(
  organizationId: string,
  checkId: string,
): Promise<StatutoryCompletion | null> {
  const supabase = await getClient();

  const { data, error } = await supabase
    .from("estates_statutory_completions")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("check_id", checkId)
    .order("next_due_date", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // No completion record found
    }
    console.error("Error fetching latest completion:", error);
    throw error;
  }

  return data;
}

/**
 * Get completions summary for all domains
 * IMPORTANT: Always shows ALL statutory checks from statutory-checks.ts,
 * even if no completion record exists in the database yet
 */
export async function getDomainsCompletionSummary(
  organizationId: string,
  domains: ComplianceDomain[],
): Promise<DomainCompletionSummary[]> {
  const completions = await getStatutoryCompletions(organizationId);

  // Import here to avoid circular dependency
  const { getChecksForDomain } =
    await import("@/lib/estates-compliance/statutory-checks");

  // Group by domain
  const domainMap = new Map<ComplianceDomain, DomainCompletionSummary>();

  for (const domain of domains) {
    // Get ALL statutory checks for this domain (from statutory-checks.ts)
    const allStatutoryChecks = getChecksForDomain(domain);
    const totalChecks = allStatutoryChecks.length;

    // Get existing completions from database
    const domainCompletions = completions.filter(
      (c) => c.compliance_domain === domain,
    );

    // Create a map of check_id -> completion for easy lookup
    const completionMap = new Map<string, StatutoryCompletion>();
    for (const completion of domainCompletions) {
      completionMap.set(completion.check_id, completion);
    }

    // Build completions array with ALL checks, using pending status for missing ones
    const allCompletions: StatutoryCompletion[] = allStatutoryChecks.map(
      (check) => {
        const existing = completionMap.get(check.id);
        if (existing) {
          return existing;
        }
        // Return a pending completion record for checks not yet in database
        return {
          id: "", // Will be generated when first completed
          organization_id: organizationId,
          check_id: check.id,
          compliance_domain: domain,
          status: "pending",
          next_due_date: calculateNextDueDate(check.frequency),
          evidence_ids: [],
          documents_received: false,
          findings: [],
          rag_status: "amber",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      },
    );

    const completedChecks = allCompletions.filter(
      (c) => c.status === "completed",
    ).length;
    const overdueChecks = allCompletions.filter(
      (c) => c.status === "overdue",
    ).length;
    const pendingChecks = allCompletions.filter(
      (c) => c.status === "pending" || c.status === "in_progress",
    ).length;

    // Check if any critical-severity statutory checks are incomplete
    const hasCriticalIncomplete = allStatutoryChecks.some((check) => {
      if (check.risk_level !== "critical") return false;
      const completion = completionMap.get(check.id);
      return !completion || completion.status !== "completed";
    });

    // Determine domain status
    let status: "compliant" | "attention" | "critical";
    if (overdueChecks > 0 || hasCriticalIncomplete) {
      status = "critical";
    } else if (totalChecks > 0 && completedChecks / totalChecks < 0.8) {
      status = "attention";
    } else {
      status = "compliant";
    }

    domainMap.set(domain, {
      domain,
      totalChecks,
      completedChecks,
      overdueChecks,
      pendingChecks,
      status,
      completions: allCompletions,
    });
  }

  return Array.from(domainMap.values());
}

/**
 * Create a new completion record
 */
export async function createCompletion(
  organizationId: string,
  input: CreateCompletionInput,
): Promise<StatutoryCompletion> {
  const supabase = await getClient();

  const { data, error } = await supabase
    .from("estates_statutory_completions")
    .insert({
      organization_id: organizationId,
      check_id: input.check_id,
      compliance_domain: input.compliance_domain,
      next_due_date: input.next_due_date,
      last_due_date: input.last_due_date,
      status: "pending",
      rag_status: "amber",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating completion record:", error);
    throw error;
  }

  return data;
}

/**
 * Update a completion record
 */
export async function updateCompletion(
  completionId: string,
  updates: UpdateCompletionInput,
): Promise<StatutoryCompletion> {
  const supabase = await getClient();

  const { data, error } = await supabase
    .from("estates_statutory_completions")
    .update({
      ...normalizeCompletionUpdates(updates as UpdateCompletionInput & Record<string, unknown>),
      updated_at: new Date().toISOString(),
    })
    .eq("id", completionId)
    .select()
    .single();

  if (error) {
    console.error("Error updating completion record:", error);
    throw error;
  }

  return data;
}

/**
 * Complete a statutory check
 */
export async function completeStatutoryCheck(
  organizationId: string,
  checkId: string,
  updates: Omit<UpdateCompletionInput, "next_due_date"> & Record<string, unknown> & {
    next_due_date?: string;
  },
): Promise<StatutoryCompletion> {
  // First get the existing completion
  const existing = await getLatestCompletion(organizationId, checkId);
  const normalizedUpdates = normalizeCompletionUpdates(updates);
  const completionStatus =
    (normalizedUpdates.status as StatutoryCompletion["status"] | undefined) ||
    "completed";
  const ragStatus =
    (normalizedUpdates.rag_status as "red" | "amber" | "green" | undefined) ||
    (completionStatus === "completed" || completionStatus === "not_applicable"
      ? "green"
      : completionStatus === "failed"
        ? "red"
        : "amber");
  const nextDueDate =
    (normalizedUpdates.next_due_date as string | undefined) ||
    calculateNextDueDate(
      await getCheckFrequency(
        checkId,
        (normalizedUpdates.compliance_domain as string | undefined) ||
          existing?.compliance_domain,
      ),
      updates.inspection_date as string | undefined,
    );

  const canUpdateExisting =
    existing &&
    ["pending", "overdue", "in_progress", "awaiting_documentation"].includes(
      existing.status,
    );

  if (canUpdateExisting) {
    // Fill the scheduled occurrence; preserve terminal rows as audit history.
    return updateCompletion(existing.id, {
      ...normalizedUpdates,
      status: completionStatus,
      rag_status: ragStatus,
      next_due_date: nextDueDate,
      completed_at:
        (normalizedUpdates.completed_at as string | undefined) ||
        new Date().toISOString(),
    });
  } else {
    // Create new completion record
    const supabase = await getClient();
    const { data, error } = await supabase
      .from("estates_statutory_completions")
      .insert({
        organization_id: organizationId,
        check_id: checkId,
        compliance_domain: normalizedUpdates.compliance_domain,
        next_due_date: nextDueDate,
        status: completionStatus,
        rag_status: ragStatus,
        completed_at:
          (normalizedUpdates.completed_at as string | undefined) ||
          new Date().toISOString(),
        completed_by: normalizedUpdates.completed_by,
        completion_notes: normalizedUpdates.completion_notes,
        evidence_ids: normalizedUpdates.evidence_ids || [],
        documents_received: normalizedUpdates.documents_received || false,
        contractor_id: normalizedUpdates.contractor_id,
        completion_duration_minutes:
          normalizedUpdates.completion_duration_minutes,
        findings: normalizedUpdates.findings || [],
        assigned_to: normalizedUpdates.assigned_to,
        team_id: normalizedUpdates.team_id,
        inspection_date: normalizedUpdates.inspection_date,
        measurement_data: normalizedUpdates.measurement_data || [],
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating completion record:", error);
      throw error;
    }

    return data;
  }
}

export async function recordDocumentationAction(
  organizationId: string,
  completionId: string,
  userId: string,
  action: "received" | "chased",
): Promise<StatutoryCompletion> {
  const supabase = await getClient();
  const { data: current, error: fetchError } = await supabase
    .from("estates_statutory_completions")
    .select("*")
    .eq("id", completionId)
    .eq("organization_id", organizationId)
    .single();

  if (fetchError || !current) throw new Error("Completion record not found");
  if (current.status !== "awaiting_documentation") {
    throw new Error("This check is not awaiting documentation");
  }

  const now = new Date().toISOString();
  const updates = action === "received"
    ? {
        status: "completed",
        documents_received: true,
        documentation_received_at: now,
        documentation_received_by: userId,
        rag_status: "green",
      }
    : {
        documentation_last_chased_at: now,
        documentation_last_chased_by: userId,
        documentation_chase_count: (current.documentation_chase_count || 0) + 1,
      };

  const { data, error } = await supabase
    .from("estates_statutory_completions")
    .update({ ...updates, updated_at: now })
    .eq("id", completionId)
    .eq("organization_id", organizationId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Get overdue checks
 */
export async function getOverdueChecks(
  organizationId: string,
): Promise<StatutoryCompletion[]> {
  return getStatutoryCompletions(organizationId, { status: "overdue" });
}

/**
 * Get checks due within N days
 */
export async function getUpcomingChecks(
  organizationId: string,
  daysAhead: number = 30,
): Promise<StatutoryCompletion[]> {
  const supabase = await getClient();

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  const { data, error } = await supabase
    .from("estates_statutory_completions")
    .select("*")
    .eq("organization_id", organizationId)
    .gte("next_due_date", new Date().toISOString().split("T")[0])
    .lte("next_due_date", futureDate.toISOString().split("T")[0])
    .in("status", ["pending", "in_progress"])
    .order("next_due_date", { ascending: true });

  if (error) {
    console.error("Error fetching upcoming checks:", error);
    throw error;
  }

  return data || [];
}

/**
 * Calculate next due date based on frequency
 */
export function calculateNextDueDate(
  frequency: string,
  fromDate?: string,
): string {
  const date = fromDate ? new Date(`${fromDate}T00:00:00`) : new Date();

  switch (frequency) {
    case "hourly":
    case "daily":
      date.setDate(date.getDate() + 1);
      break;
    case "weekly":
      date.setDate(date.getDate() + 7);
      break;
    case "monthly":
      date.setMonth(date.getMonth() + 1);
      break;
    case "quarterly":
      date.setMonth(date.getMonth() + 3);
      break;
    case "6_monthly":
      date.setMonth(date.getMonth() + 6);
      break;
    case "annual":
    case "annually":
      date.setFullYear(date.getFullYear() + 1);
      break;
    case "2_yearly":
      date.setFullYear(date.getFullYear() + 2);
      break;
    case "3_yearly":
      date.setFullYear(date.getFullYear() + 3);
      break;
    case "5_yearly":
      date.setFullYear(date.getFullYear() + 5);
      break;
    case "10_yearly":
      date.setFullYear(date.getFullYear() + 10);
      break;
    case "as_needed":
    case "ad_hoc":
      break;
    case "termly":
      // Approximate 3 months
      date.setMonth(date.getMonth() + 3);
      break;
    default:
      date.setFullYear(date.getFullYear() + 1);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Initialize completions for all statutory checks in a domain
 */
export async function initializeDomainCompletions(
  organizationId: string,
  domain: ComplianceDomain,
  checks: Array<{ id: string; frequency: string }>,
): Promise<number> {
  // Use service role for provisioning — bypasses cookie-based RLS.
  // This is a privileged admin operation that writes to a specific org.
  const { createServiceRoleClient } = await import("@/lib/supabase-server");
  const supabase = createServiceRoleClient();

  let seeded = 0;
  for (const check of checks) {
    // Check if completion already exists
    const { data: existing } = await supabase
      .from("estates_statutory_completions")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("check_id", check.id)
      .limit(1)
      .maybeSingle();

    if (!existing) {
      const { error } = await supabase
        .from("estates_statutory_completions")
        .insert({
          organization_id: organizationId,
          check_id: check.id,
          compliance_domain: domain,
          next_due_date: calculateNextDueDate(check.frequency),
          status: "pending",
          rag_status: "amber",
        });

      if (error) {
        console.error(`[provision] Failed to seed ${check.id}:`, error.message);
        throw new Error(`Failed to seed ${check.id}: ${error.message}`);
      }
      seeded++;
    }
  }
  return seeded;
}

/**
 * Bulk initialize completions for all statutory checks.
 * Self-contained: imports its own check data from statutory-checks.ts.
 * Uses service role — safe for privileged admin provisioning.
 */
export async function initializeAllStatutoryCompletions(
  organizationId: string,
): Promise<{ totalSeeded: number; byDomain: Record<string, number> }> {
  const { DOMAIN_METADATA, getChecksForDomain } = await import(
    "@/lib/estates-compliance/statutory-checks"
  );
  const domains = Object.keys(DOMAIN_METADATA) as ComplianceDomain[];

  const byDomain: Record<string, number> = {};
  let totalSeeded = 0;

  for (const domain of domains) {
    const checks = getChecksForDomain(domain);
    const checksWithFreq = checks.map((c) => ({ id: c.id, frequency: c.frequency }));
    const count = await initializeDomainCompletions(organizationId, domain, checksWithFreq);
    byDomain[domain] = count;
    totalSeeded += count;
  }

  return { totalSeeded, byDomain };
}
