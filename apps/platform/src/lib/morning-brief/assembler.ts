/**
 * Morning Brief Assembler
 *
 * Gathers cross-module data for a school's daily morning briefing.
 * Pulls from: compliance tasks, unified tasks, risk register, staff/HR, calendar/meetings.
 */

import { createServiceRoleClient } from "@/lib/supabase-server";
import type {
  MorningBriefData,
  BriefSection,
  BriefSections,
  BriefItem,
  RAGStatus,
} from "./types";

// Re-export types for consumers
export type { MorningBriefData, BriefSections, BriefSection };

// ─── RAG helpers ────────────────────────────────────────────────────

function computeRAG(critical: number, overdue: number): RAGStatus {
  if (critical > 0 || overdue > 2) return "red";
  if (overdue > 0) return "amber";
  return "green";
}

// ─── Section builders ───────────────────────────────────────────────

async function buildComplianceSection(
  supabase: ReturnType<typeof createServiceRoleClient>,
  orgId: string,
): Promise<BriefSection> {
  const today = new Date().toISOString().slice(0, 10);

  const { data: overdue } = await supabase
    .from("compliance_items")
    .select("id, title, due_date, priority")
    .eq("organization_id", orgId)
    .eq("status", "pending")
    .lte("due_date", today)
    .order("due_date", { ascending: true });

  const items: BriefItem[] = (overdue ?? []).slice(0, 5).map((row: any) => ({
    title: row.title,
    priority: row.priority === "critical" ? "critical" : "high",
    dueDate: row.due_date,
  }));

  const critical = items.filter((i) => i.priority === "critical").length;
  return {
    rag: computeRAG(critical, items.length),
    count: (overdue ?? []).length,
    items,
  };
}

async function buildTasksSection(
  supabase: ReturnType<typeof createServiceRoleClient>,
  orgId: string,
): Promise<BriefSection> {
  const today = new Date().toISOString().slice(0, 10);

  const { data: dueTasks } = await supabase
    .from("unified_tasks")
    .select("id, title, due_date, priority")
    .eq("organization_id", orgId)
    .eq("status", "pending")
    .lte("due_date", today)
    .order("priority", { ascending: true });

  const items: BriefItem[] = (dueTasks ?? []).slice(0, 5).map((row: any) => ({
    title: row.title,
    priority: row.priority ?? "medium",
    dueDate: row.due_date,
  }));

  const critical = items.filter((i) => i.priority === "critical").length;
  return {
    rag: computeRAG(critical, (dueTasks ?? []).length),
    count: (dueTasks ?? []).length,
    items,
  };
}

async function buildRisksSection(
  supabase: ReturnType<typeof createServiceRoleClient>,
  orgId: string,
): Promise<BriefSection> {
  const { data: highRisks } = await supabase
    .from("risk_register")
    .select("id, title, risk_score, likelihood, impact")
    .eq("organization_id", orgId)
    .eq("status", "open")
    .gte("risk_score", 15)
    .order("risk_score", { ascending: false });

  const items: BriefItem[] = (highRisks ?? []).slice(0, 5).map((row: any) => ({
    title: `${row.title} (score: ${row.risk_score})`,
    priority: row.risk_score >= 20 ? "critical" : "high",
  }));

  const critical = items.filter((i) => i.priority === "critical").length;
  return {
    rag: computeRAG(critical, items.length),
    count: (highRisks ?? []).length,
    items,
  };
}

async function buildStaffingSection(
  supabase: ReturnType<typeof createServiceRoleClient>,
  orgId: string,
): Promise<BriefSection> {
  const today = new Date().toISOString().slice(0, 10);

  // Training about to expire (within 7 days)
  const sevenDays = new Date();
  sevenDays.setDate(sevenDays.getDate() + 7);
  const weekAhead = sevenDays.toISOString().slice(0, 10);

  const { data: expiringTraining } = await supabase
    .from("compliance_items")
    .select("id, title, due_date")
    .eq("organization_id", orgId)
    .eq("category", "training")
    .eq("status", "pending")
    .gte("due_date", today)
    .lte("due_date", weekAhead)
    .order("due_date", { ascending: true });

  const items: BriefItem[] = (expiringTraining ?? [])
    .slice(0, 5)
    .map((row: any) => ({
      title: row.title,
      priority: "medium" as const,
      dueDate: row.due_date,
    }));

  return {
    rag: items.length > 3 ? "amber" : "green",
    count: (expiringTraining ?? []).length,
    items,
  };
}

async function buildCalendarSection(
  supabase: ReturnType<typeof createServiceRoleClient>,
  orgId: string,
): Promise<BriefSection> {
  const today = new Date().toISOString().slice(0, 10);

  const { data: meetings } = await supabase
    .from("meetings")
    .select("id, title, scheduled_date, meeting_type")
    .eq("organization_id", orgId)
    .eq("scheduled_date", today)
    .order("scheduled_date", { ascending: true });

  const items: BriefItem[] = (meetings ?? []).slice(0, 5).map((row: any) => ({
    title: row.title,
    priority: "low" as const,
  }));

  return {
    rag: "green",
    count: (meetings ?? []).length,
    items,
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
): Promise<MorningBriefData> {
  const supabase = createServiceRoleClient();

  const [compliance, tasks, risks, staffing, calendar] =
    await Promise.all([
      buildComplianceSection(supabase, organizationId),
      buildTasksSection(supabase, organizationId),
      buildRisksSection(supabase, organizationId),
      buildStaffingSection(supabase, organizationId),
      buildCalendarSection(supabase, organizationId),
    ]);

  const sections: BriefSections = {
    compliance,
    tasks,
    risks,
    staffing,
    calendar,
  };

  return {
    organizationId,
    generatedAt: new Date().toISOString(),
    headline: buildHeadline(sections),
    sections,
  };
}
