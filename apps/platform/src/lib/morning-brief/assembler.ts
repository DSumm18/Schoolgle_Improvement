/**
 * Morning Brief Assembler
 *
 * Gathers cross-module data for a school's daily morning briefing.
 * Sections match Task 033 spec: safeguarding, estates, staffing,
 * governance, finance, teaching, ofsted.
 *
 * Sections where the source table doesn't exist yet return stubs.
 * Phase 1 ships with Estates + Finance live; others light up as modules are built.
 */

import { createServiceRoleClient } from "@/lib/supabase-server";
import type {
  MorningBriefData,
  BriefSection,
  BriefSections,
  BriefItem,
  RAGStatus,
} from "./types";
import { emptySection } from "./types";

// Re-export types for consumers
export type { MorningBriefData, BriefSections, BriefSection };

// ─── RAG helpers ────────────────────────────────────────────────────

function computeRAG(critical: number, overdue: number): RAGStatus {
  if (critical > 0 || overdue > 2) return "red";
  if (overdue > 0) return "amber";
  return "green";
}

// ─── Section builders ───────────────────────────────────────────────

/** Safeguarding — source table not yet built. Returns stub. */
async function buildSafeguardingSection(
  _supabase: ReturnType<typeof createServiceRoleClient>,
  _orgId: string,
): Promise<BriefSection> {
  return emptySection("Safeguarding module not yet connected.");
}

/** Estates — pulls from compliance_items & estate helpdesk tickets */
async function buildEstatesSection(
  supabase: ReturnType<typeof createServiceRoleClient>,
  orgId: string,
): Promise<BriefSection> {
  const today = new Date().toISOString().slice(0, 10);

  // Overdue compliance checks
  const { data: overdue } = await supabase
    .from("compliance_items")
    .select("id, title, due_date, priority")
    .eq("organization_id", orgId)
    .eq("status", "pending")
    .lte("due_date", today)
    .order("due_date", { ascending: true })
    .limit(10);

  // Open helpdesk tickets
  const { data: tickets } = await supabase
    .from("estate_helpdesk_tickets")
    .select("id, title, priority, status")
    .eq("organization_id", orgId)
    .in("status", ["open", "in_progress"])
    .order("created_at", { ascending: false })
    .limit(10);

  const overdueItems: BriefItem[] = (overdue ?? []).slice(0, 3).map((row: any) => ({
    title: row.title,
    priority: row.priority === "critical" ? "critical" : "high",
    dueDate: row.due_date,
  }));

  const ticketItems: BriefItem[] = (tickets ?? []).slice(0, 2).map((row: any) => ({
    title: row.title,
    priority: row.priority === "urgent" ? "critical" : "medium",
  }));

  const items = [...overdueItems, ...ticketItems];
  const overdueCount = (overdue ?? []).length;
  const ticketCount = (tickets ?? []).length;
  const critical = items.filter((i) => i.priority === "critical").length;

  const parts: string[] = [];
  if (overdueCount > 0) parts.push(`${overdueCount} overdue compliance check${overdueCount !== 1 ? "s" : ""}`);
  if (ticketCount > 0) parts.push(`${ticketCount} open helpdesk ticket${ticketCount !== 1 ? "s" : ""}`);
  const summary = parts.length > 0 ? parts.join(". ") + "." : "All estates checks up to date.";

  return {
    rag: computeRAG(critical, overdueCount),
    count: overdueCount + ticketCount,
    items,
    summary,
  };
}

/** Staffing — pulls from compliance_items (training category) as proxy */
async function buildStaffingSection(
  supabase: ReturnType<typeof createServiceRoleClient>,
  orgId: string,
): Promise<BriefSection> {
  const today = new Date().toISOString().slice(0, 10);
  const sevenDays = new Date();
  sevenDays.setDate(sevenDays.getDate() + 7);
  const weekAhead = sevenDays.toISOString().slice(0, 10);

  // Training about to expire
  const { data: expiringTraining } = await supabase
    .from("compliance_items")
    .select("id, title, due_date")
    .eq("organization_id", orgId)
    .eq("category", "training")
    .eq("status", "pending")
    .gte("due_date", today)
    .lte("due_date", weekAhead)
    .order("due_date", { ascending: true })
    .limit(5);

  const items: BriefItem[] = (expiringTraining ?? []).map((row: any) => ({
    title: row.title,
    priority: "medium" as const,
    dueDate: row.due_date,
  }));

  const count = (expiringTraining ?? []).length;
  const summary = count > 0
    ? `${count} staff training certificate${count !== 1 ? "s" : ""} expiring within 7 days.`
    : "No staff absences or training issues to report.";

  return {
    rag: count > 3 ? "amber" : "green",
    count,
    items,
    summary,
  };
}

/** Governance — pulls from meetings table */
async function buildGovernanceSection(
  supabase: ReturnType<typeof createServiceRoleClient>,
  orgId: string,
): Promise<BriefSection> {
  const today = new Date().toISOString().slice(0, 10);
  const sevenDays = new Date();
  sevenDays.setDate(sevenDays.getDate() + 7);
  const weekAhead = sevenDays.toISOString().slice(0, 10);

  const { data: meetings } = await supabase
    .from("meetings")
    .select("id, title, scheduled_date, meeting_type")
    .eq("organization_id", orgId)
    .gte("scheduled_date", today)
    .lte("scheduled_date", weekAhead)
    .order("scheduled_date", { ascending: true })
    .limit(5);

  const items: BriefItem[] = (meetings ?? []).map((row: any) => ({
    title: `${row.title} (${row.scheduled_date})`,
    priority: "low" as const,
  }));

  const count = (meetings ?? []).length;
  const summary = count > 0
    ? `${count} governance meeting${count !== 1 ? "s" : ""} this week.`
    : "No upcoming governance meetings.";

  return {
    rag: "green",
    count,
    items,
    summary,
  };
}

/** Finance — stubs for now (DealFind tables not guaranteed) */
async function buildFinanceSection(
  supabase: ReturnType<typeof createServiceRoleClient>,
  orgId: string,
): Promise<BriefSection> {
  // Try to pull from risk_register for financial risks
  const { data: finRisks } = await supabase
    .from("risk_register")
    .select("id, title, risk_score")
    .eq("organization_id", orgId)
    .eq("status", "open")
    .eq("category", "financial")
    .gte("risk_score", 10)
    .order("risk_score", { ascending: false })
    .limit(3);

  if (finRisks && finRisks.length > 0) {
    const items: BriefItem[] = finRisks.map((row: any) => ({
      title: `${row.title} (risk score: ${row.risk_score})`,
      priority: row.risk_score >= 20 ? "critical" : "high",
    }));

    return {
      rag: items.some((i) => i.priority === "critical") ? "red" : "amber",
      count: finRisks.length,
      items,
      summary: `${finRisks.length} financial risk${finRisks.length !== 1 ? "s" : ""} flagged.`,
    };
  }

  return emptySection("No financial alerts.");
}

/** Teaching — stub until pupil assessment module matures */
async function buildTeachingSection(
  _supabase: ReturnType<typeof createServiceRoleClient>,
  _orgId: string,
): Promise<BriefSection> {
  return emptySection("Teaching data not yet connected.");
}

/** Ofsted — pulls from assessments / evidence uploads */
async function buildOfstedSection(
  supabase: ReturnType<typeof createServiceRoleClient>,
  orgId: string,
): Promise<BriefSection> {
  // Check recent evidence uploads (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: recentEvidence, count: evidenceCount } = await supabase
    .from("evidence")
    .select("id", { count: "exact" })
    .eq("organization_id", orgId)
    .gte("created_at", sevenDaysAgo.toISOString())
    .limit(1);

  const uploads = evidenceCount ?? 0;
  const summary = uploads > 0
    ? `${uploads} evidence item${uploads !== 1 ? "s" : ""} uploaded this week.`
    : "No new evidence uploaded this week.";

  return {
    rag: "green",
    count: uploads,
    items: [],
    summary,
  };
}

// ─── Headline builder ───────────────────────────────────────────────

export function buildHeadline(sections: BriefSections): string {
  const redSections = Object.entries(sections)
    .filter(([, s]) => s.rag === "red")
    .map(([key]) => key);

  const amberSections = Object.entries(sections)
    .filter(([, s]) => s.rag === "amber")
    .map(([key]) => key);

  if (redSections.length === 0 && amberSections.length === 0) {
    return "All clear this morning — no urgent items need your attention.";
  }

  const parts: string[] = [];

  if (redSections.length > 0) {
    parts.push(
      `${redSections.length} area${redSections.length > 1 ? "s" : ""} need urgent attention: ${redSections.join(", ")}`,
    );
  }

  if (amberSections.length > 0) {
    parts.push(
      `${amberSections.length} area${amberSections.length > 1 ? "s" : ""} to watch: ${amberSections.join(", ")}`,
    );
  }

  return parts.join(". ") + ".";
}

// ─── Main assembler ─────────────────────────────────────────────────

export async function assembleBrief(
  organizationId: string,
): Promise<Omit<MorningBriefData, "script">> {
  const supabase = createServiceRoleClient();

  const [safeguarding, estates, staffing, governance, finance, teaching, ofsted] =
    await Promise.all([
      buildSafeguardingSection(supabase, organizationId).catch(() => emptySection()),
      buildEstatesSection(supabase, organizationId).catch(() => emptySection()),
      buildStaffingSection(supabase, organizationId).catch(() => emptySection()),
      buildGovernanceSection(supabase, organizationId).catch(() => emptySection()),
      buildFinanceSection(supabase, organizationId).catch(() => emptySection()),
      buildTeachingSection(supabase, organizationId).catch(() => emptySection()),
      buildOfstedSection(supabase, organizationId).catch(() => emptySection()),
    ]);

  const sections: BriefSections = {
    safeguarding,
    estates,
    staffing,
    governance,
    finance,
    teaching,
    ofsted,
  };

  return {
    organizationId,
    generatedAt: new Date().toISOString(),
    headline: buildHeadline(sections),
    sections,
  };
}
