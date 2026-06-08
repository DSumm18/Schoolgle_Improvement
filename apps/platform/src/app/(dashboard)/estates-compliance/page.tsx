"use client";

/**
 * Estates Compliance Dashboard
 *
 * Clean, focused layout:
 * 1. Header with top nav bar (My Diary, Asset Register, Contractors, Tasks, Helpdesk)
 * 2. Stats strip (Overdue, Due This Week, Completed, Compliance Rate)
 * 3. Tab bar (Compliance Checks | Daily Routines) + domain filter pills
 * 4. Sorted check list (urgency order) or Daily Routines card
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
  ClipboardCheck,
  LayoutList,
  Settings,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/SupabaseAuthContext";
import { supabase as supabaseClient } from "@/lib/supabase";
import {
  DOMAIN_METADATA,
  getAllStatutoryChecks,
  type ComplianceDomain,
  type StatutoryCheck,
} from "@/lib/estates-compliance/statutory-checks";
import { DailyChecksCard } from "@/components/estates-compliance/DailyChecksCard";
import { SettingsDialog } from "@/components/estates-compliance/SettingsDialog";
import { FeatureChecklist } from "@/components/ui/feature-discovery";
import { ESTATES_FEATURES } from "@/lib/feature-definitions";
import { EdBrowserControlWrapper } from "@/components/estates-compliance/EdBrowserControlWrapper";

// ============================================================================
// TYPES
// ============================================================================

type CheckUrgency =
  | "overdue"
  | "due-today"
  | "due-this-week"
  | "due-this-month"
  | "not-due"
  | "not-applicable";

interface CheckWithStatus {
  check: StatutoryCheck;
  urgency: CheckUrgency;
  daysUntilDue: number | null;
  nextDue: Date | null;
  lastCompleted: string | null;
  completionCount: number;
  awaitingDocs: boolean;
  completionStatus: string | null;
}

interface CompletionRecord {
  check_id: string;
  status: string;
  completed_at: string | null;
  next_due_date: string | null;
  documents_received: boolean;
  contractor_id: string | null;
}

type StatusFilter = "needs-doing" | "awaiting-docs" | "completed" | "all";

type ActiveTab = "checks" | "routines";

// ============================================================================
// HELPERS
// ============================================================================

function computeUrgency(
  nextDue: Date | null,
  lastCompleted: string | null,
  now: Date,
): CheckUrgency {
  if (!nextDue && !lastCompleted) return "overdue";
  if (!nextDue) return "not-due";

  const diffMs = nextDue.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 0) return "overdue";
  if (diffDays < 1) return "due-today";
  if (diffDays <= 7) return "due-this-week";
  if (diffDays <= 31) return "due-this-month";
  return "not-due";
}

function urgencyOrder(u: CheckUrgency): number {
  switch (u) {
    case "overdue": return 0;
    case "due-today": return 1;
    case "due-this-week": return 2;
    case "due-this-month": return 3;
    case "not-due": return 4;
    case "not-applicable": return 5;
  }
}

function formatDueBadge(check: CheckWithStatus): {
  label: string;
  className: string;
} {
  const { urgency, daysUntilDue, nextDue } = check;

  if (urgency === "overdue") {
    const days = daysUntilDue !== null ? Math.abs(daysUntilDue) : "?";
    return {
      label: `Overdue ${days}d`,
      className: "bg-red-100 text-red-700 border-red-200",
    };
  }
  if (urgency === "due-today") {
    return {
      label: "Due today",
      className: "bg-amber-100 text-amber-700 border-amber-200",
    };
  }
  if (urgency === "due-this-week" && nextDue) {
    const dd = String(nextDue.getDate()).padStart(2, "0");
    const mm = String(nextDue.getMonth() + 1).padStart(2, "0");
    return {
      label: `Due ${dd}/${mm}`,
      className: "bg-amber-50 text-amber-600 border-amber-100",
    };
  }
  if (urgency === "due-this-month" && nextDue) {
    const dd = String(nextDue.getDate()).padStart(2, "0");
    const mm = String(nextDue.getMonth() + 1).padStart(2, "0");
    return {
      label: `Due ${dd}/${mm}`,
      className: "bg-gray-100 text-gray-600 border-gray-200",
    };
  }
  if (urgency === "not-applicable") {
    return {
      label: "N/A",
      className: "bg-slate-100 text-slate-400 border-slate-200",
    };
  }
  if (urgency === "not-due") {
    if (nextDue) {
      const dd = String(nextDue.getDate()).padStart(2, "0");
      const mm = String(nextDue.getMonth() + 1).padStart(2, "0");
      return {
        label: `Due ${dd}/${mm}`,
        className: "bg-gray-100 text-gray-500 border-gray-200",
      };
    }
    return {
      label: "Not due",
      className: "bg-gray-100 text-gray-400 border-gray-200",
    };
  }
  return { label: "Not due", className: "bg-gray-100 text-gray-400 border-gray-200" };
}

function leftBorderClass(urgency: CheckUrgency): string {
  switch (urgency) {
    case "overdue": return "border-l-4 border-l-red-500";
    case "due-today": return "border-l-4 border-l-amber-500";
    case "due-this-week": return "border-l-4 border-l-amber-300";
    case "not-applicable": return "border-l-4 border-l-slate-200";
    default: return "";
  }
}

function domainPillColor(
  overdue: number,
  dueSoon: number,
  total: number,
  completed: number,
): string {
  if (overdue > 0) return "bg-red-100 text-red-700 border-red-200";
  if (dueSoon > 0) return "bg-amber-100 text-amber-700 border-amber-200";
  if (total > 0 && completed === total)
    return "bg-green-100 text-green-700 border-green-200";
  return "bg-gray-100 text-gray-600 border-gray-200";
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function EstatesComplianceDashboard() {
  const { organizationId, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [checksWithStatus, setChecksWithStatus] = useState<CheckWithStatus[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>("checks");
  const [selectedDomain, setSelectedDomain] = useState<
    ComplianceDomain | "all"
  >("all");
  const [notDueExpanded, setNotDueExpanded] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("needs-doing");
  const [settingsOpen, setSettingsOpen] = useState(false);

  // -------------------------------------------------------------------------
  // DATA FETCHING
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!organizationId) {
      const timeoutId = window.setTimeout(() => setLoading(false), 0);
      return () => window.clearTimeout(timeoutId);
    }

    let cancelled = false;

    async function load() {
      try {
        const {
          data: { session },
        } = await supabaseClient.auth.getSession();
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }

        // Fetch all completion records (not summary — we need next_due per check)
        const res = await fetch(
          `/api/estates/statutory-completions?organizationId=${organizationId}`,
          { headers },
        );

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        let completions: CompletionRecord[] = [];

        if (res.ok) {
          const data = await res.json();
          // API may return { completions: [...] } or { domains: [...] }
          if (Array.isArray(data.completions)) {
            completions = data.completions;
          } else if (Array.isArray(data.domains)) {
            // Flatten domain summaries into flat completions
            for (const d of data.domains) {
              if (Array.isArray(d.completions)) {
                completions.push(...d.completions);
              }
            }
          }
        }

        // Build a lookup by check_id
        const completionMap = new Map<string, CompletionRecord>();
        for (const c of completions) {
          completionMap.set(c.check_id, c);
        }

        // Build CheckWithStatus for every statutory check
        const allChecks = getAllStatutoryChecks();
        const result: CheckWithStatus[] = allChecks.map((check) => {
          const rec = completionMap.get(check.id);

          // If marked as not applicable, skip urgency calculation
          if (rec?.status === "not_applicable") {
            return {
              check,
              urgency: "not-applicable" as CheckUrgency,
              daysUntilDue: null,
              nextDue: null,
              lastCompleted: rec?.completed_at ?? null,
              completionCount: 0,
              awaitingDocs: false,
              completionStatus: "not_applicable",
            };
          }

          const nextDue = rec?.next_due_date ? new Date(rec.next_due_date) : null;
          const lastCompleted = rec?.completed_at ?? null;
          const awaitingDocs =
            rec?.status === "awaiting_documentation" ||
            (rec?.status === "completed" && rec?.documents_received === false);

          const urgency = computeUrgency(nextDue, lastCompleted, now);
          const daysUntilDue = nextDue
            ? Math.round(
                (nextDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
              )
            : null;

          return {
            check,
            urgency,
            daysUntilDue,
            nextDue,
            lastCompleted,
            completionCount: rec ? 1 : 0,
            awaitingDocs,
            completionStatus: rec?.status ?? null,
          };
        });

        // Sort by urgency then by daysUntilDue within same urgency
        result.sort((a, b) => {
          const oA = urgencyOrder(a.urgency);
          const oB = urgencyOrder(b.urgency);
          if (oA !== oB) return oA - oB;
          // Within overdue: most overdue first (most negative days first)
          if (a.daysUntilDue !== null && b.daysUntilDue !== null) {
            return a.daysUntilDue - b.daysUntilDue;
          }
          return 0;
        });

        if (!cancelled) {
          setChecksWithStatus(result);
          setLoading(false);
        }
      } catch (err) {
        console.error("[EstatesCompliance] Error loading checks:", err);
        if (!cancelled) {
          // Fall back to all checks with no status
          const allChecks = getAllStatutoryChecks();
          setChecksWithStatus(
            allChecks.map((check) => ({
              check,
              urgency: "not-due" as CheckUrgency,
              daysUntilDue: null,
              nextDue: null,
              lastCompleted: null,
              completionCount: 0,
              awaitingDocs: false,
              completionStatus: null,
            })),
          );
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [organizationId, authLoading]);

  // -------------------------------------------------------------------------
  // DERIVED STATS
  // -------------------------------------------------------------------------

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Exclude N/A checks from stats — they shouldn't count against compliance
  const applicableChecks = checksWithStatus.filter(
    (c) => c.urgency !== "not-applicable",
  );
  const naChecks = checksWithStatus.filter(
    (c) => c.urgency === "not-applicable",
  );
  const overdue = applicableChecks.filter((c) => c.urgency === "overdue");
  const dueThisWeek = applicableChecks.filter(
    (c) => c.urgency === "due-today" || c.urgency === "due-this-week",
  );
  const completed = applicableChecks.filter(
    (c) => c.lastCompleted !== null,
  );
  const awaitingDocsChecks = applicableChecks.filter((c) => c.awaitingDocs);
  const total = applicableChecks.length;
  const compliancePct =
    total > 0 ? Math.round((completed.length / total) * 100) : 0;

  // Domain stats for pills
  const domainStats = Object.keys(DOMAIN_METADATA).map((d) => {
    const domain = d as ComplianceDomain;
    const domainChecks = checksWithStatus.filter(
      (c) => c.check.domain === domain && c.urgency !== "not-applicable",
    );
    const overdueCount = domainChecks.filter((c) => c.urgency === "overdue").length;
    const dueSoonCount = domainChecks.filter(
      (c) => c.urgency === "due-today" || c.urgency === "due-this-week",
    ).length;
    const completedCount = domainChecks.filter(
      (c) => c.lastCompleted !== null,
    ).length;
    const naCount = checksWithStatus.filter(
      (c) => c.check.domain === domain && c.urgency === "not-applicable",
    ).length;
    return {
      domain,
      metadata: DOMAIN_METADATA[domain],
      total: domainChecks.length,
      overdue: overdueCount,
      dueSoon: dueSoonCount,
      completed: completedCount,
      naCount,
    };
  });

  // -------------------------------------------------------------------------
  // FILTERED + GROUPED CHECKS
  // -------------------------------------------------------------------------

  // Apply domain filter
  const domainFiltered =
    selectedDomain === "all"
      ? checksWithStatus
      : checksWithStatus.filter((c) => c.check.domain === selectedDomain);

  // Apply status filter
  const visibleChecks = domainFiltered.filter((c) => {
    switch (statusFilter) {
      case "needs-doing":
        return (
          c.urgency !== "not-applicable" &&
          !c.awaitingDocs &&
          c.completionStatus !== "completed"
        ) || c.urgency === "overdue" || c.urgency === "due-today" || c.urgency === "due-this-week" || c.urgency === "due-this-month" || c.urgency === "not-due";
      case "awaiting-docs":
        return c.awaitingDocs;
      case "completed":
        return c.lastCompleted !== null && !c.awaitingDocs && c.urgency !== "not-applicable";
      case "all":
        return true;
      default:
        return true;
    }
  });

  const dueChecks = visibleChecks.filter(
    (c) => c.urgency !== "not-due" && c.urgency !== "not-applicable",
  );
  const notDueChecks = visibleChecks.filter(
    (c) => c.urgency === "not-due" || c.urgency === "not-applicable",
  );

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------

  return (
    <EdBrowserControlWrapper>
      <div className="space-y-0">
        {/* ================================================================
            TOP NAV BAR — Quick Links
        ================================================================ */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-3 p-6 pb-4">
          {[
            {
              href: "/estates-compliance/diary",
              icon: "📅",
              label: "My Diary",
              sub: "Daily tasks",
              bg: "bg-blue-50 text-blue-600",
            },
            {
              href: "/estates-compliance/risk-control-checks",
              icon: "🛡️",
              label: "Risk Controls",
              sub: "Due checks",
              bg: "bg-orange-50 text-orange-600",
            },
            {
              href: "/estates-compliance/assets",
              icon: "🏢",
              label: "Asset Register",
              sub: "Manage assets",
              bg: "bg-emerald-50 text-emerald-600",
            },
            {
              href: "/estates-compliance/pathfinder",
              icon: "🗺️",
              label: "Pathfinder",
              sub: "Site plan & pins",
              bg: "bg-teal-50 text-teal-600",
            },
            {
              href: "/estates-compliance/contractors",
              icon: "👷",
              label: "Contractors",
              sub: "Approved list",
              bg: "bg-amber-50 text-amber-600",
            },
            {
              href: "/estates-compliance/tasks",
              icon: "📋",
              label: "Tasks",
              sub: "View & schedule",
              bg: "bg-purple-50 text-purple-600",
            },
            {
              href: "/estates-compliance/helpdesk",
              icon: "🎫",
              label: "Helpdesk",
              sub: "Report issues",
              bg: "bg-rose-50 text-rose-600",
            },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="group">
              <div className="h-full border border-gray-200 rounded-lg hover:border-primary/50 hover:shadow-sm transition-all bg-white p-3 flex items-center gap-3">
                <div
                  className={`p-2 rounded-md ${item.bg} group-hover:scale-105 transition-transform`}
                >
                  <span className="text-lg">{item.icon}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-xs text-gray-900 truncate">
                    {item.label}
                  </p>
                  <p className="text-[10px] text-gray-500 truncate">{item.sub}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* ================================================================
            HEADER — Title + Action Buttons
        ================================================================ */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 pb-4 border-b">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Estates Compliance
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Statutory compliance tracking with urgency-sorted checks
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Link href="/estates-compliance/reports">
              <Button size="sm">
                <FileText className="w-4 h-4 mr-2" />
                Governor Reports
              </Button>
            </Link>
          </div>
        </div>

        {/* ================================================================
            STATS STRIP — 4 pills
        ================================================================ */}
        <div className="flex flex-wrap gap-3 px-6 py-4">
          {/* Overdue */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-100 border border-red-200">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-semibold text-red-700">
              {loading ? "…" : overdue.length}
            </span>
            <span className="text-xs text-red-600">Overdue</span>
          </div>

          {/* Due This Week */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 border border-amber-200">
            <Clock className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-700">
              {loading ? "…" : dueThisWeek.length}
            </span>
            <span className="text-xs text-amber-600">Due This Week</span>
          </div>

          {/* Completed */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 border border-green-200">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-green-700">
              {loading ? "…" : `${completed.length}/${total}`}
            </span>
            <span className="text-xs text-green-600">Completed</span>
          </div>

          {/* Compliance Rate */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 border border-gray-200">
            <ClipboardCheck className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-semibold text-gray-700">
              {loading ? "…" : `${compliancePct}%`}
            </span>
            <span className="text-xs text-gray-500">Compliance Rate</span>
          </div>
        </div>

        {/* ================================================================
            TAB BAR + DOMAIN FILTER PILLS
        ================================================================ */}
        <div className="px-6 space-y-3 pb-3">
          {/* Tabs */}
          <div className="flex gap-1 border-b">
            <button
              onClick={() => setActiveTab("checks")}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "checks"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <LayoutList className="w-4 h-4" />
              Compliance Checks
            </button>
            <button
              onClick={() => setActiveTab("routines")}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "routines"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Calendar className="w-4 h-4" />
              Daily Routines
            </button>
          </div>

          {/* Filter row — domain dropdown + status tabs */}
          {activeTab === "checks" && (
            <div className="flex items-center gap-3 flex-wrap">
              {/* Domain dropdown */}
              <select
                value={selectedDomain}
                onChange={(e) =>
                  setSelectedDomain(e.target.value as ComplianceDomain | "all")
                }
                className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
              >
                <option value="all">
                  All domains ({applicableChecks.length})
                </option>
                {domainStats.map(
                  ({ domain, metadata, total: dt, completed: dC }) => (
                    <option key={domain} value={domain}>
                      {metadata.icon} {metadata.name} ({dC}/{dt})
                    </option>
                  ),
                )}
              </select>

              {/* Divider */}
              <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />

              {/* Status filters */}
              {(
                [
                  {
                    key: "needs-doing" as StatusFilter,
                    label: "Needs doing",
                    count: overdue.length + dueThisWeek.length,
                  },
                  {
                    key: "awaiting-docs" as StatusFilter,
                    label: "Awaiting docs",
                    count: awaitingDocsChecks.length,
                  },
                  {
                    key: "completed" as StatusFilter,
                    label: "Completed",
                    count: completed.length,
                  },
                  {
                    key: "all" as StatusFilter,
                    label: "All",
                    count: total,
                  },
                ] as const
              ).map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    statusFilter === key
                      ? key === "awaiting-docs"
                        ? "bg-amber-100 text-amber-800 border border-amber-300"
                        : "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {label}
                  {!loading && count > 0 && (
                    <span className="ml-1 text-[10px] opacity-70">
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ================================================================
            CONTENT AREA
        ================================================================ */}
        <div className="px-6 pb-8">
          {/* ----------------------------------------------------------------
              DAILY ROUTINES TAB
          ---------------------------------------------------------------- */}
          {activeTab === "routines" && <DailyChecksCard />}

          {/* ----------------------------------------------------------------
              COMPLIANCE CHECKS TAB
          ---------------------------------------------------------------- */}
          {activeTab === "checks" && (
            <div className="space-y-2">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-10 h-10 border-4 border-gray-200 border-t-primary rounded-full animate-spin" />
                  <p className="text-sm text-gray-500">Loading compliance data...</p>
                </div>
              ) : (
                <>
                  {/* Due checks (overdue → due-today → due-this-week → due-this-month) */}
                  {dueChecks.map((item) => (
                    <CheckRow key={item.check.id} item={item} onDomainClick={setSelectedDomain} />
                  ))}

                  {/* Not-yet-due divider + collapsed list */}
                  {notDueChecks.length > 0 && (
                    <>
                      <div className="flex items-center gap-3 py-3">
                        <div className="flex-1 h-px bg-gray-200" />
                        <button
                          onClick={() => setNotDueExpanded((v) => !v)}
                          className="text-xs text-gray-500 hover:text-gray-700 font-medium whitespace-nowrap"
                        >
                          {notDueExpanded ? "Hide" : "Show"}{" "}
                          {notDueChecks.length} checks not yet due
                        </button>
                        <div className="flex-1 h-px bg-gray-200" />
                      </div>
                      {notDueExpanded &&
                        notDueChecks.map((item) => (
                          <CheckRow key={item.check.id} item={item} onDomainClick={setSelectedDomain} />
                        ))}
                    </>
                  )}

                  {visibleChecks.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                      <ClipboardCheck className="w-10 h-10 mx-auto mb-3 opacity-40" />
                      <p className="text-sm">No checks found for this domain.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* ================================================================
            SETTINGS DIALOG + FEATURE DISCOVERY
        ================================================================ */}
        <SettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          visibleDomains={Object.keys(DOMAIN_METADATA) as ComplianceDomain[]}
          onVisibilityChange={() => {}}
        />

        <div className="px-6">
          <FeatureChecklist
            features={ESTATES_FEATURES}
            moduleFilter="estates"
            accentColor="#00D4D4"
          />
        </div>

      </div>
    </EdBrowserControlWrapper>
  );
}

// ============================================================================
// CHECK ROW COMPONENT
// ============================================================================

function CheckRow({
  item,
  onDomainClick,
}: {
  item: CheckWithStatus;
  onDomainClick?: (domain: ComplianceDomain) => void;
}) {
  const { check, urgency, awaitingDocs, lastCompleted } = item;
  const metadata = DOMAIN_METADATA[check.domain];
  const badge = formatDueBadge(item);
  const border = leftBorderClass(urgency);
  const isNA = urgency === "not-applicable";

  // Calculate days since completion for awaiting docs
  let daysWaiting: number | null = null;
  if (awaitingDocs && lastCompleted) {
    const completedDate = new Date(lastCompleted);
    const now = new Date();
    daysWaiting = Math.floor(
      (now.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  return (
    <Link
      href={`/estates-compliance/${check.domain}/${check.id}`}
      className={`flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all group ${border} ${isNA ? "opacity-50" : ""}`}
    >
      {/* Domain icon — clickable to filter */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDomainClick?.(check.domain);
        }}
        className="text-xl flex-shrink-0 hover:scale-110 transition-transform"
        title={`Filter to ${metadata.name}`}
      >
        {metadata.icon}
      </button>

      {/* Check info */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium truncate ${isNA ? "text-gray-400 line-through" : "text-gray-900"}`}
        >
          {check.name}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {metadata.name} &middot; {check.frequency}
          {isNA && " · Not applicable to this school"}
          {awaitingDocs && daysWaiting !== null && (
            <span className="text-amber-600 font-medium">
              {" "}
              · Docs outstanding {daysWaiting}d
            </span>
          )}
        </p>
      </div>

      {/* Badge area */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {awaitingDocs && (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium border bg-amber-50 text-amber-700 border-amber-200">
            Awaiting docs
          </span>
        )}
        <span
          className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>

      {/* Chevron */}
      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 group-hover:text-gray-600 transition-colors" />
    </Link>
  );
}
