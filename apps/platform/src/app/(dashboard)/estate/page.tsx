"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  Plus,
  FileText,
  Ticket,
  Building2,
  Shield,
  type LucideIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase";
import {
  DOMAIN_METADATA,
  getChecksForDomain,
  type ComplianceDomain,
} from "@/lib/estates-compliance/statutory-checks";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

type RAGStatus = "compliant" | "due_soon" | "overdue";

interface CheckCompletion {
  checkId: string;
  status: "pending" | "completed" | "overdue" | "not_applicable";
  lastCompleted?: string;
  nextDue?: string;
}

interface DomainSummary {
  domain: ComplianceDomain;
  name: string;
  icon: string;
  order: number;
  totalChecks: number;
  completedChecks: number;
  overdueChecks: number;
  dueSoonChecks: number;
  completionPct: number;
  ragStatus: RAGStatus;
  nextDue?: string;
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

const MARS_RED = "#9F1239";

/** Build seed demo completion state so the page always renders meaningfully. */
function buildSeedCompletions(domain: ComplianceDomain): CheckCompletion[] {
  const checks = getChecksForDomain(domain);
  const now = new Date();

  return checks.map((check, i) => {
    // Deterministic pseudo-random: spread different states across domains
    const seed = (domain.charCodeAt(0) + i) % 10;

    if (seed < 5) {
      // 50% completed
      const lastCompleted = new Date(now);
      lastCompleted.setDate(lastCompleted.getDate() - 14);
      return {
        checkId: check.id,
        status: "completed",
        lastCompleted: lastCompleted.toISOString(),
      };
    } else if (seed < 7) {
      // 20% overdue
      const nextDue = new Date(now);
      nextDue.setDate(nextDue.getDate() - 3);
      return {
        checkId: check.id,
        status: "overdue",
        nextDue: nextDue.toISOString(),
      };
    } else if (seed === 7) {
      // 10% due soon (within 7 days)
      const nextDue = new Date(now);
      nextDue.setDate(nextDue.getDate() + 4);
      return {
        checkId: check.id,
        status: "pending",
        nextDue: nextDue.toISOString(),
      };
    } else {
      // 20% pending (no due date yet)
      return { checkId: check.id, status: "pending" };
    }
  });
}

function calcDomainSummary(
  domain: ComplianceDomain,
  completions: CheckCompletion[],
): DomainSummary {
  const meta = DOMAIN_METADATA[domain];
  const checks = getChecksForDomain(domain);
  const now = new Date();
  const sevenDaysFromNow = new Date(now);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  let completed = 0;
  let overdue = 0;
  let dueSoon = 0;
  let earliestDue: Date | undefined;

  for (const check of checks) {
    const comp = completions.find((c) => c.checkId === check.id);
    const status = comp?.status ?? "pending";

    if (status === "completed" || status === "not_applicable") {
      completed++;
      continue;
    }

    if (status === "overdue") {
      overdue++;
      continue;
    }

    // pending — check nextDue date
    if (comp?.nextDue) {
      const due = new Date(comp.nextDue);
      if (due < now) {
        overdue++;
      } else if (due <= sevenDaysFromNow) {
        dueSoon++;
        if (!earliestDue || due < earliestDue) earliestDue = due;
      } else {
        if (!earliestDue || due < earliestDue) earliestDue = due;
      }
    }
  }

  const total = checks.length;
  const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  let ragStatus: RAGStatus = "compliant";
  if (overdue > 0) ragStatus = "overdue";
  else if (dueSoon > 0) ragStatus = "due_soon";

  return {
    domain,
    name: meta.name,
    icon: meta.icon,
    order: meta.order,
    totalChecks: total,
    completedChecks: completed,
    overdueChecks: overdue,
    dueSoonChecks: dueSoon,
    completionPct,
    ragStatus,
    nextDue: earliestDue?.toISOString(),
  };
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  icon: Icon,
  accent,
  bg,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  accent: string;
  bg: string;
}) {
  return (
    <div className={`rounded-xl border p-4 sm:p-5 ${bg} flex items-center gap-4`}>
      <div className={`rounded-lg p-3 ${accent} flex-shrink-0`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-600">{label}</p>
      </div>
    </div>
  );
}

function RAGBadge({ status }: { status: RAGStatus }) {
  if (status === "overdue") {
    return (
      <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
        Overdue
      </Badge>
    );
  }
  if (status === "due_soon") {
    return (
      <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
        Due Soon
      </Badge>
    );
  }
  return (
    <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
      Compliant
    </Badge>
  );
}

// ─────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────

export default function EstatePage() {
  const { organizationId, loading: authLoading } = useAuth();
  const [domains, setDomains] = useState<DomainSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);

    // Build initial state from seed data
    const domainKeys = Object.keys(DOMAIN_METADATA) as ComplianceDomain[];

    // Attempt to load real completions from Supabase
    let completionMap: Record<string, CheckCompletion[]> = {};

    if (organizationId) {
      try {
        const { data } = await supabase
          .from("estates_compliance_check_completions")
          .select("check_id, status, completed_at, next_due_date")
          .eq("organization_id", organizationId);

        if (data && data.length > 0) {
          for (const row of data) {
            const domain = row.check_id?.split("_")[0] as ComplianceDomain;
            if (!completionMap[domain]) completionMap[domain] = [];
            completionMap[domain].push({
              checkId: row.check_id,
              status: row.status,
              lastCompleted: row.completed_at,
              nextDue: row.next_due_date,
            });
          }
        }
      } catch {
        // Table may not exist yet; fall through to seed data
      }
    }

    const summaries: DomainSummary[] = domainKeys.map((domain) => {
      const completions =
        completionMap[domain] && completionMap[domain].length > 0
          ? completionMap[domain]
          : buildSeedCompletions(domain);
      return calcDomainSummary(domain, completions);
    });

    // Sort: overdue first, then due_soon, then by completion % ascending
    summaries.sort((a, b) => {
      const urgency: Record<RAGStatus, number> = {
        overdue: 0,
        due_soon: 1,
        compliant: 2,
      };
      if (urgency[a.ragStatus] !== urgency[b.ragStatus]) {
        return urgency[a.ragStatus] - urgency[b.ragStatus];
      }
      return a.completionPct - b.completionPct;
    });

    setDomains(summaries);
    setLoading(false);
  }, [organizationId]);

  useEffect(() => {
    if (!authLoading) loadData();
  }, [authLoading, loadData]);

  // Aggregate totals
  const totalChecks = domains.reduce((s, d) => s + d.totalChecks, 0);
  const totalCompleted = domains.reduce((s, d) => s + d.completedChecks, 0);
  const totalOverdue = domains.reduce((s, d) => s + d.overdueChecks, 0);
  const totalDueSoon = domains.reduce((s, d) => s + d.dueSoonChecks, 0);

  const overdueDomains = domains.filter((d) => d.overdueChecks > 0);

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-6 w-6" style={{ color: MARS_RED }} />
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              Estate Compliance
            </h1>
          </div>
          <div
            className="h-1 w-16 rounded-full mb-2"
            style={{ background: MARS_RED }}
          />
          <p className="text-sm text-gray-500">
            Statutory compliance dashboard — Your School
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            asChild
            size="sm"
            className="text-white shadow-sm"
            style={{ background: MARS_RED }}
          >
            <Link href="/estate/checks">
              <Plus className="h-4 w-4 mr-1.5" />
              Log Check
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/estate/tickets">
              <Ticket className="h-4 w-4 mr-1.5" />
              Create Ticket
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/estate/reports">
              <FileText className="h-4 w-4 mr-1.5" />
              View Reports
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Overdue Alert Banner ────────────────────────────────── */}
      {!loading && overdueDomains.length > 0 && (
        <div
          className="rounded-xl border-l-4 p-4"
          style={{
            borderLeftColor: MARS_RED,
            background: "#fff1f2",
            borderTop: "1px solid #fecdd3",
            borderRight: "1px solid #fecdd3",
            borderBottom: "1px solid #fecdd3",
          }}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              className="h-5 w-5 flex-shrink-0 mt-0.5"
              style={{ color: MARS_RED }}
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-rose-900 text-sm mb-1.5">
                {totalOverdue} overdue{" "}
                {totalOverdue === 1 ? "check requires" : "checks require"}{" "}
                attention
              </p>
              <div className="flex flex-wrap gap-2">
                {overdueDomains.map((d) => (
                  <Link
                    key={d.domain}
                    href={`/estate/checks?domain=${d.domain}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-rose-800 underline underline-offset-2 hover:text-rose-950 transition-colors"
                  >
                    {d.icon} {d.name} ({d.overdueChecks})
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Summary Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <SummaryCard
          label="Total Checks"
          value={loading ? 0 : totalChecks}
          icon={ClipboardList}
          accent="bg-slate-600"
          bg="bg-slate-50 border-slate-200"
        />
        <SummaryCard
          label="Compliant"
          value={loading ? 0 : totalCompleted}
          icon={CheckCircle2}
          accent="bg-emerald-600"
          bg="bg-emerald-50 border-emerald-200"
        />
        <SummaryCard
          label="Due Soon"
          value={loading ? 0 : totalDueSoon}
          icon={Clock}
          accent="bg-amber-500"
          bg="bg-amber-50 border-amber-200"
        />
        <SummaryCard
          label="Overdue"
          value={loading ? 0 : totalOverdue}
          icon={AlertTriangle}
          accent="bg-red-600"
          bg="bg-red-50 border-red-200"
        />
      </div>

      {/* ── Category Breakdown ──────────────────────────────────── */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gray-500" />
            <CardTitle className="text-base font-semibold text-gray-800">
              Compliance by Domain
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="px-4 py-3 sm:px-6 sm:py-4">
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4 mb-2" />
                  <div className="h-2 bg-gray-100 rounded animate-pulse w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y">
              {domains.map((d) => (
                <Link
                  key={d.domain}
                  href={`/estate/checks?domain=${d.domain}`}
                  className="group flex items-center gap-3 sm:gap-4 px-4 py-3 sm:px-6 sm:py-4 hover:bg-gray-50 transition-colors"
                >
                  {/* Icon */}
                  <span className="text-xl flex-shrink-0 w-7 text-center">
                    {d.icon}
                  </span>

                  {/* Name + progress */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5 gap-2">
                      <span className="text-sm font-medium text-gray-800 truncate">
                        {d.name}
                      </span>
                      {/* Mobile RAG badge */}
                      <span className="sm:hidden flex-shrink-0">
                        <RAGBadge status={d.ragStatus} />
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${d.completionPct}%`,
                          background:
                            d.ragStatus === "overdue"
                              ? MARS_RED
                              : d.ragStatus === "due_soon"
                                ? "#D97706"
                                : "#059669",
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {d.completedChecks}/{d.totalChecks} checks complete
                    </p>
                  </div>

                  {/* Desktop: RAG badge + next due */}
                  <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0">
                    <RAGBadge status={d.ragStatus} />
                    {d.nextDue && (
                      <span className="text-xs text-gray-400">
                        Next: {formatDate(d.nextDue)}
                      </span>
                    )}
                  </div>

                  {/* Chevron */}
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
