"use client";

/**
 * Governor Premises Compliance Report — Print-Friendly View
 *
 * Fetches live compliance data from /api/estates/reports/governor-pdf
 * and renders a clean, A4-ready report suitable for governing body meetings.
 * Includes a "Print Report" button hidden from the printed output.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Printer,
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OverdueItem {
  checkId: string;
  nextDue: string;
}

interface DomainRow {
  domain: string;
  name: string;
  icon: string;
  totalChecks: number;
  completedChecks: number;
  overdueChecks: number;
  pendingChecks: number;
  status: "compliant" | "attention" | "critical";
  overdueItems: OverdueItem[];
}

interface ReportSummary {
  totalChecks: number;
  completedChecks: number;
  overdueChecks: number;
  pendingChecks: number;
  compliancePercentage: number;
  overallStatus: "fully_compliant" | "in_progress" | "action_required";
}

interface GovernorReport {
  reportTitle: string;
  generatedAt: string;
  summary: ReportSummary;
  domains: DomainRow[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusLabel(status: ReportSummary["overallStatus"]): string {
  switch (status) {
    case "fully_compliant":
      return "Fully Compliant";
    case "in_progress":
      return "In Progress";
    case "action_required":
      return "Action Required";
  }
}

function statusColour(status: ReportSummary["overallStatus"]): string {
  switch (status) {
    case "fully_compliant":
      return "text-green-600";
    case "in_progress":
      return "text-amber-500";
    case "action_required":
      return "text-red-600";
  }
}

function domainStatusBadge(status: DomainRow["status"]) {
  switch (status) {
    case "compliant":
      return (
        <Badge className="bg-green-100 text-green-700 border-green-300 print:border print:border-green-300">
          Compliant
        </Badge>
      );
    case "attention":
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-300 print:border print:border-amber-300">
          Attention
        </Badge>
      );
    case "critical":
      return (
        <Badge className="bg-red-100 text-red-700 border-red-300 print:border print:border-red-300">
          Action Required
        </Badge>
      );
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function GovernorReportPrintPage() {
  const { organizationId } = useAuth();
  const [report, setReport] = useState<GovernorReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organizationId) return;

    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }

        const res = await fetch("/api/estates/reports/governor-pdf", {
          headers,
        });

        if (!res.ok) {
          throw new Error(`API returned ${res.status}`);
        }

        const json = await res.json();
        // apiSuccess wraps data; handle both shapes
        setReport(json.data ?? json);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to load report";
        setError(message);
      } finally {
        setLoading(false);
      }
    })();
  }, [organizationId]);

  // ---------------------------------------------------------------------------
  // Loading / error states
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Loading compliance report...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <AlertTriangle className="w-10 h-10 text-red-500" />
        <p className="font-medium">Could not load report</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Link href="/estates-compliance/reports">
          <Button variant="outline" size="sm">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Reports
          </Button>
        </Link>
      </div>
    );
  }

  const { summary, domains } = report;

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <>
      {/* Screen-only action bar — hidden when printing */}
      <div className="print:hidden flex items-center justify-between mb-6 px-6 pt-6">
        <Link href="/estates-compliance/reports">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Reports
          </Button>
        </Link>
        <Button onClick={() => window.print()} size="sm">
          <Printer className="w-4 h-4 mr-2" />
          Print Report
        </Button>
      </div>

      {/* Report body — full width for print */}
      <div className="max-w-4xl mx-auto px-6 pb-12 print:px-8 print:max-w-none print:text-black">
        {/* Header */}
        <div className="border-b pb-6 mb-6 print:border-gray-300">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-slate-100 rounded-lg print:hidden">
                  <FileText className="w-5 h-5 text-slate-600" />
                </div>
                <h1 className="text-2xl font-bold print:text-3xl">
                  {report.reportTitle}
                </h1>
              </div>
              <p className="text-sm text-muted-foreground print:text-gray-500">
                Prepared for the Governing Body
              </p>
              <p className="text-sm text-muted-foreground print:text-gray-500">
                Generated: {formatDate(report.generatedAt)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground print:text-gray-500 uppercase tracking-wide font-medium mb-1">
                Overall Status
              </p>
              <p
                className={`text-xl font-bold ${statusColour(summary.overallStatus)} print:text-black`}
              >
                {statusLabel(summary.overallStatus)}
              </p>
            </div>
          </div>
        </div>

        {/* Executive summary — 4-column stats */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 print:text-xl">
            Executive Summary
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div className="rounded-lg border p-4 text-center print:border-gray-300">
              <p className="text-3xl font-bold">{summary.totalChecks}</p>
              <p className="text-xs text-muted-foreground print:text-gray-500 mt-1">
                Total Checks
              </p>
            </div>
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center print:border-gray-300 print:bg-white">
              <p className="text-3xl font-bold text-green-600 print:text-black">
                {summary.completedChecks}
              </p>
              <p className="text-xs text-green-700 print:text-gray-500 mt-1">
                Completed
              </p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center print:border-gray-300 print:bg-white">
              <p className="text-3xl font-bold text-amber-500 print:text-black">
                {summary.pendingChecks}
              </p>
              <p className="text-xs text-amber-700 print:text-gray-500 mt-1">
                Pending
              </p>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center print:border-gray-300 print:bg-white">
              <p className="text-3xl font-bold text-red-600 print:text-black">
                {summary.overdueChecks}
              </p>
              <p className="text-xs text-red-700 print:text-gray-500 mt-1">
                Overdue
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground print:text-gray-500">
                Overall completion
              </span>
              <span className="font-semibold">
                {summary.compliancePercentage}%
              </span>
            </div>
            <Progress
              value={summary.compliancePercentage}
              className="h-3 print:hidden"
            />
            {/* Print-friendly progress bar substitute */}
            <div className="hidden print:block h-3 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full bg-gray-700 rounded-full"
                style={{ width: `${summary.compliancePercentage}%` }}
              />
            </div>
          </div>
        </section>

        {/* Domain breakdown table */}
        <section>
          <h2 className="text-lg font-semibold mb-4 print:text-xl">
            Domain-by-Domain Breakdown
          </h2>
          <div className="rounded-lg border overflow-hidden print:border-gray-300">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 print:bg-gray-100 print:border-gray-300">
                  <th className="text-left py-3 px-4 font-medium">Domain</th>
                  <th className="text-center py-3 px-3 font-medium">
                    Complete
                  </th>
                  <th className="text-center py-3 px-3 font-medium">
                    Pending
                  </th>
                  <th className="text-center py-3 px-3 font-medium">
                    Overdue
                  </th>
                  <th className="text-center py-3 px-3 font-medium">Total</th>
                  <th className="text-center py-3 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y print:divide-gray-300">
                {domains.map((domain) => (
                  <tr
                    key={domain.domain}
                    className="hover:bg-muted/30 transition-colors print:hover:bg-transparent"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-base print:hidden">
                          {domain.icon}
                        </span>
                        <span className="font-medium">{domain.name}</span>
                      </div>
                      {/* Show overdue item IDs if any */}
                      {domain.overdueItems.length > 0 && (
                        <ul className="mt-1 space-y-0.5">
                          {domain.overdueItems.map((item) => (
                            <li
                              key={item.checkId}
                              className="text-xs text-red-600 print:text-gray-600 flex items-center gap-1"
                            >
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              {item.checkId} — due{" "}
                              {formatDate(item.nextDue)}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-semibold text-green-600 print:text-black">
                        {domain.completedChecks}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-semibold text-amber-500 print:text-black">
                        {domain.pendingChecks}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {domain.overdueChecks > 0 ? (
                        <span className="font-semibold text-red-600 print:text-black">
                          {domain.overdueChecks}
                        </span>
                      ) : (
                        <span className="text-muted-foreground print:text-gray-400">
                          —
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center text-muted-foreground print:text-gray-500">
                      {domain.totalChecks}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {domainStatusBadge(domain.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Footer — shown in print only */}
        <div className="hidden print:block mt-12 pt-4 border-t border-gray-300 text-xs text-gray-400 flex justify-between">
          <span>Schoolgle Estates Compliance</span>
          <span>Confidential — For Governing Body use only</span>
          <span>{formatDate(report.generatedAt)}</span>
        </div>

        {/* Screen-only status icons legend */}
        <div className="print:hidden mt-8 border rounded-lg p-4 bg-muted/20">
          <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
            Status Key
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              Compliant — all checks up to date
            </span>
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Attention — checks pending, none overdue
            </span>
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              Action Required — one or more checks overdue
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
