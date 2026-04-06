"use client";

/**
 * Compliance Checks Page
 *
 * Shows ALL statutory and good-practice compliance checks across every domain.
 * Supports filtering by domain, status, and free-text search.
 * Domain can be pre-selected via the `?domain=` query param (click-through from dashboard).
 */

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  ChevronRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase";
import {
  DOMAIN_METADATA,
  STATUTORY_CHECKS,
  type ComplianceDomain,
  type StatutoryCheck,
} from "@/lib/estates-compliance/statutory-checks";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type StatusFilter = "all" | "compliant" | "due_soon" | "overdue" | "not_applicable";

interface CheckWithStatus extends StatutoryCheck {
  ragStatus: "compliant" | "due_soon" | "overdue" | "not_checked";
  nextDueDate: string | null;
  lastCompletedDate: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CATEGORY_BADGE: Record<string, { label: string; className: string }> = {
  statutory: {
    label: "Statutory",
    className: "bg-red-100 text-red-800 border-red-200",
  },
  good_practice: {
    label: "Good Practice",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  custom: {
    label: "Custom",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
};

const FREQUENCY_LABELS: Record<string, string> = {
  hourly: "Hourly",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  termly: "Termly",
  annually: "Annual",
  ad_hoc: "Ad Hoc",
};

function ragSortOrder(status: string): number {
  if (status === "overdue") return 0;
  if (status === "due_soon") return 1;
  if (status === "not_checked") return 2;
  return 3; // compliant
}

function RagIndicator({ status }: { status: CheckWithStatus["ragStatus"] }) {
  if (status === "compliant")
    return <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />;
  if (status === "overdue")
    return <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />;
  if (status === "due_soon")
    return <Clock className="h-4 w-4 text-amber-500 shrink-0" />;
  return <Clock className="h-4 w-4 text-gray-400 shrink-0" />;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ComplianceChecksPage() {
  const searchParams = useSearchParams();
  const { organizationId, session } = useAuth();

  // Pre-select domain from URL query param (click-through from dashboard)
  const urlDomain = searchParams.get("domain") as ComplianceDomain | null;

  const [selectedDomain, setSelectedDomain] = useState<ComplianceDomain | "all">(
    urlDomain ?? "all",
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchText, setSearchText] = useState("");
  const [completionData, setCompletionData] = useState<
    Record<string, { next_due_date: string | null; last_completed_date: string | null; status: string }>
  >({});
  const [loading, setLoading] = useState(false);

  // Fetch completion data from API
  useEffect(() => {
    if (!organizationId) return;
    setLoading(true);

    const params = new URLSearchParams();
    if (selectedDomain !== "all") params.set("domain", selectedDomain);

    fetch(`/api/estates/statutory-completions?${params.toString()}`, {
      headers: { Authorization: `Bearer ${session?.access_token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.completions) {
          const map: typeof completionData = {};
          for (const c of data.completions) {
            map[c.check_id] = {
              next_due_date: c.next_due_date,
              last_completed_date: c.last_completed_at,
              status: c.status,
            };
          }
          setCompletionData(map);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [organizationId, selectedDomain, session?.access_token]);

  // Build flat list of all checks, enriched with RAG status
  const allChecks: CheckWithStatus[] = useMemo(() => {
    const domains =
      selectedDomain === "all"
        ? (Object.keys(STATUTORY_CHECKS) as ComplianceDomain[])
        : [selectedDomain];

    const result: CheckWithStatus[] = [];

    for (const domain of domains) {
      const checks = STATUTORY_CHECKS[domain] ?? [];
      for (const check of checks) {
        const comp = completionData[check.id];
        let ragStatus: CheckWithStatus["ragStatus"] = "not_checked";

        if (comp) {
          if (comp.status === "completed") ragStatus = "compliant";
          else if (comp.status === "overdue") ragStatus = "overdue";
          else if (comp.status === "pending") ragStatus = "due_soon";
          else ragStatus = "not_checked";
        }

        result.push({
          ...check,
          ragStatus,
          nextDueDate: comp?.next_due_date ?? null,
          lastCompletedDate: comp?.last_completed_date ?? null,
        });
      }
    }

    return result;
  }, [selectedDomain, completionData]);

  // Apply filters
  const filteredChecks = useMemo(() => {
    let checks = allChecks;

    if (statusFilter !== "all") {
      checks = checks.filter((c) => {
        if (statusFilter === "compliant") return c.ragStatus === "compliant";
        if (statusFilter === "due_soon") return c.ragStatus === "due_soon";
        if (statusFilter === "overdue") return c.ragStatus === "overdue";
        if (statusFilter === "not_applicable") return c.ragStatus === "not_checked";
        return true;
      });
    }

    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      checks = checks.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q),
      );
    }

    // Sort: overdue → due_soon → not_checked → compliant, then alphabetical
    return [...checks].sort((a, b) => {
      const order = ragSortOrder(a.ragStatus) - ragSortOrder(b.ragStatus);
      if (order !== 0) return order;
      return a.name.localeCompare(b.name);
    });
  }, [allChecks, statusFilter, searchText]);

  // Group filtered checks by domain
  const grouped = useMemo(() => {
    const groups: Record<string, CheckWithStatus[]> = {};
    for (const check of filteredChecks) {
      if (!groups[check.domain]) groups[check.domain] = [];
      groups[check.domain].push(check);
    }
    return groups;
  }, [filteredChecks]);

  const sortedDomains = Object.keys(grouped).sort(
    (a, b) =>
      (DOMAIN_METADATA[a as ComplianceDomain]?.order ?? 99) -
      (DOMAIN_METADATA[b as ComplianceDomain]?.order ?? 99),
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link
              href="/estate"
              className="flex items-center gap-1 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Estate
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-gray-900 font-medium">Compliance Checks</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Compliance Checks
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {filteredChecks.length} check{filteredChecks.length !== 1 ? "s" : ""} across{" "}
                {sortedDomains.length} domain{sortedDomains.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search checks..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F1239] focus:border-transparent"
              />
            </div>

            {/* Domain filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400 shrink-0" />
              <select
                value={selectedDomain}
                onChange={(e) =>
                  setSelectedDomain(e.target.value as ComplianceDomain | "all")
                }
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#9F1239] focus:border-transparent bg-white"
              >
                <option value="all">All Domains</option>
                {(Object.keys(DOMAIN_METADATA) as ComplianceDomain[])
                  .sort(
                    (a, b) => DOMAIN_METADATA[a].order - DOMAIN_METADATA[b].order,
                  )
                  .map((d) => (
                    <option key={d} value={d}>
                      {DOMAIN_METADATA[d].name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#9F1239] focus:border-transparent bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="overdue">Overdue</option>
              <option value="due_soon">Due Soon</option>
              <option value="compliant">Compliant</option>
              <option value="not_applicable">Not Checked</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        {loading && (
          <div className="text-center py-12 text-gray-500 text-sm">
            Loading checks...
          </div>
        )}

        {!loading && sortedDomains.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <Search className="h-8 w-8 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No checks match your filters</p>
            <p className="text-sm mt-1">Try adjusting the domain, status, or search term.</p>
          </div>
        )}

        {!loading &&
          sortedDomains.map((domain) => {
            const meta = DOMAIN_METADATA[domain as ComplianceDomain];
            const checks = grouped[domain];

            return (
              <div key={domain}>
                {/* Domain heading */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{meta.icon}</span>
                  <h2 className="text-base font-semibold text-gray-900">
                    {meta.name}
                  </h2>
                  <Badge
                    variant="outline"
                    className="text-xs text-gray-500 border-gray-200"
                  >
                    {checks.length}
                  </Badge>
                </div>

                {/* Desktop: card list */}
                <div className="space-y-2">
                  {checks.map((check) => (
                    <Card
                      key={check.id}
                      className="border border-gray-200 hover:border-[#9F1239]/30 hover:shadow-sm transition-all"
                    >
                      <CardContent className="p-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
                          {/* RAG indicator */}
                          <div className="shrink-0 sm:w-5 flex sm:justify-center">
                            <RagIndicator status={check.ragStatus} />
                          </div>

                          {/* Main content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="font-medium text-sm text-gray-900 truncate">
                                {check.name}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-xs border ${CATEGORY_BADGE[check.category]?.className ?? ""}`}
                              >
                                {CATEGORY_BADGE[check.category]?.label ?? check.category}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="text-xs text-gray-600 border-gray-200"
                              >
                                {FREQUENCY_LABELS[check.frequency] ?? check.frequency}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2">
                              {check.description}
                            </p>
                          </div>

                          {/* Next due + action */}
                          <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1 shrink-0">
                            {check.nextDueDate && (
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(check.nextDueDate).toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                })}
                              </span>
                            )}
                            <Link href={`/estate/checks/${check.id}`}>
                              <Button
                                size="sm"
                                className="bg-[#9F1239] hover:bg-[#881030] text-white text-xs h-7 px-3"
                              >
                                Log Check
                                <ChevronRight className="h-3 w-3 ml-1" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
