"use client";

/**
 * Individual Compliance Check Detail & Completion Logging
 *
 * Shows check metadata, completion history, and a form to log a new completion.
 */

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  User,
  FileText,
  Upload,
  Send,
  Clock,
  Shield,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/context/SupabaseAuthContext";
import {
  DOMAIN_METADATA,
  STATUTORY_CHECKS,
  type StatutoryCheck,
  type ComplianceDomain,
} from "@/lib/estates-compliance/statutory-checks";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CheckCompletion {
  id: string;
  check_id: string;
  completed_at: string;
  completed_by: string;
  contractor_name?: string;
  cost?: number;
  notes?: string;
  status: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const RISK_CONFIG: Record<
  string,
  { label: string; className: string; icon: React.ReactNode }
> = {
  low: {
    label: "Low Risk",
    className: "bg-green-50 text-green-700 border-green-200",
    icon: <Shield className="h-3.5 w-3.5" />,
  },
  medium: {
    label: "Medium Risk",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  high: {
    label: "High Risk",
    className: "bg-orange-50 text-orange-700 border-orange-200",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
  critical: {
    label: "Critical Risk",
    className: "bg-red-50 text-red-700 border-red-200",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
};

const CATEGORY_BADGE: Record<string, string> = {
  statutory: "bg-red-100 text-red-800 border-red-200",
  good_practice: "bg-amber-100 text-amber-800 border-amber-200",
  custom: "bg-blue-100 text-blue-800 border-blue-200",
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

/** Find a StatutoryCheck by its id across all domains */
function findCheck(id: string): StatutoryCheck | null {
  for (const domain of Object.keys(STATUTORY_CHECKS) as ComplianceDomain[]) {
    const found = STATUTORY_CHECKS[domain].find((c) => c.id === id);
    if (found) return found;
  }
  return null;
}

function todayIso(): string {
  return new Date().toISOString().split("T")[0];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CheckDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { organizationId, session } = useAuth();

  const checkId = typeof params.id === "string" ? params.id : params.id?.[0] ?? "";
  const check = findCheck(checkId);

  const [history, setHistory] = useState<CheckCompletion[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Form state
  const [dateCompleted, setDateCompleted] = useState(todayIso());
  const [completedBy, setCompletedBy] = useState("");
  const [contractor, setContractor] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch completion history
  useEffect(() => {
    if (!organizationId || !checkId) return;

    fetch(
      `/api/estates/statutory-completions?check_id=${encodeURIComponent(checkId)}`,
      {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      },
    )
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.completions)) {
          setHistory(data.completions);
        }
      })
      .catch(console.error)
      .finally(() => setHistoryLoading(false));
  }, [organizationId, checkId, session?.access_token]);

  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!completedBy.trim()) {
      toast.error("Please enter who completed this check.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        action: "complete",
        check_id: checkId,
        check_data: {
          completed_at: dateCompleted,
          completed_by: completedBy.trim(),
          contractor_name: contractor.trim() || undefined,
          cost: cost ? parseFloat(cost) : undefined,
          notes: notes.trim() || undefined,
          status: "completed",
        },
      };

      const res = await fetch("/api/estates/statutory-completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `Server error ${res.status}`);
      }

      toast.success("Check logged successfully.");
      router.push("/estate/checks");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      toast.error(`Failed to log check: ${message}`);
    } finally {
      setSubmitting(false);
    }
  }

  // Check not found guard
  if (!check) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-700">Check Not Found</h2>
          <p className="text-sm text-gray-500 mt-1 mb-4">
            The check with ID <code className="bg-gray-100 px-1 rounded">{checkId}</code> does not exist.
          </p>
          <Link href="/estate/checks">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Checks
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const domainMeta = DOMAIN_METADATA[check.domain];
  const riskKey = check.risk_level ?? "medium";
  const riskConfig = RISK_CONFIG[riskKey] ?? RISK_CONFIG.medium;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Sticky header / breadcrumb */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link
              href="/estate"
              className="hover:text-gray-700 transition-colors"
            >
              Estate
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link
              href="/estate/checks"
              className="hover:text-gray-700 transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Checks
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-gray-900 font-medium truncate max-w-xs">
              {check.name}
            </span>
          </nav>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Check info card */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{domainMeta.icon}</span>
                  <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                    {domainMeta.name}
                  </span>
                </div>
                <CardTitle className="text-xl">{check.name}</CardTitle>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className={`text-xs border ${CATEGORY_BADGE[check.category] ?? ""}`}
                >
                  {check.category === "statutory"
                    ? "Statutory"
                    : check.category === "good_practice"
                    ? "Good Practice"
                    : "Custom"}
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-xs border flex items-center gap-1 ${riskConfig.className}`}
                >
                  {riskConfig.icon}
                  {riskConfig.label}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">{check.description}</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-0.5">
                  Frequency
                </p>
                <p className="text-gray-900 font-medium">
                  {FREQUENCY_LABELS[check.frequency] ?? check.frequency}
                </p>
              </div>
              {check.estimatedDuration && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-0.5">
                    Est. Duration
                  </p>
                  <p className="text-gray-900 font-medium">
                    {check.estimatedDuration} min
                  </p>
                </div>
              )}
              {check.requiresQualification && (
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-0.5">
                    Qualification Required
                  </p>
                  <p className="text-gray-900 font-medium text-xs">
                    {check.requiresQualification}
                  </p>
                </div>
              )}
            </div>

            {check.reference && (
              <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <FileText className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Reference</p>
                  {check.referenceUrl ? (
                    <a
                      href={check.referenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#9F1239] hover:underline font-medium"
                    >
                      {check.reference}
                    </a>
                  ) : (
                    <p className="text-sm font-medium text-gray-900">
                      {check.reference}
                    </p>
                  )}
                </div>
              </div>
            )}

            {check.evidenceRequired.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">
                  Evidence Required
                </p>
                <ul className="space-y-1">
                  {check.evidenceRequired.map((e) => (
                    <li key={e} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#9F1239] shrink-0" />
                      {e}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {check.notes && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-700 font-medium mb-0.5">Note</p>
                <p className="text-sm text-amber-800">{check.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completion history */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              Completion History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {historyLoading && (
              <p className="text-sm text-gray-400 py-4 text-center">
                Loading history...
              </p>
            )}
            {!historyLoading && history.length === 0 && (
              <p className="text-sm text-gray-400 py-4 text-center">
                No completions recorded yet. Use the form below to log the first one.
              </p>
            )}
            {!historyLoading && history.length > 0 && (
              <div className="divide-y divide-gray-100">
                {history.map((entry) => (
                  <div key={entry.id} className="py-3 flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {entry.completed_by}
                        </span>
                        {entry.contractor_name && (
                          <span className="text-xs text-gray-500">
                            via {entry.contractor_name}
                          </span>
                        )}
                        <Badge
                          variant="outline"
                          className={`text-xs border ${
                            entry.status === "completed"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-gray-50 text-gray-600 border-gray-200"
                          }`}
                        >
                          {entry.status}
                        </Badge>
                      </div>
                      {entry.notes && (
                        <p className="text-xs text-gray-500 mt-0.5">{entry.notes}</p>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 shrink-0">
                      {new Date(entry.completed_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                      {entry.cost != null && (
                        <span className="ml-2 text-gray-500">
                          £{entry.cost.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Log completion form */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="h-4 w-4 text-[#9F1239]" />
              Log Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Date completed */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="h-3.5 w-3.5 inline mr-1.5 text-gray-400" />
                    Date Completed
                    <span className="text-[#9F1239] ml-0.5">*</span>
                  </label>
                  <input
                    type="date"
                    value={dateCompleted}
                    onChange={(e) => setDateCompleted(e.target.value)}
                    max={todayIso()}
                    required
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#9F1239] focus:border-transparent"
                  />
                </div>

                {/* Completed by */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <User className="h-3.5 w-3.5 inline mr-1.5 text-gray-400" />
                    Completed By
                    <span className="text-[#9F1239] ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    value={completedBy}
                    onChange={(e) => setCompletedBy(e.target.value)}
                    placeholder="Name or role"
                    required
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#9F1239] focus:border-transparent"
                  />
                </div>

                {/* Contractor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <User className="h-3.5 w-3.5 inline mr-1.5 text-gray-400" />
                    Contractor
                    <span className="text-xs text-gray-400 ml-1">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={contractor}
                    onChange={(e) => setContractor(e.target.value)}
                    placeholder="Contractor company or name"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#9F1239] focus:border-transparent"
                  />
                </div>

                {/* Cost */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cost
                    <span className="text-xs text-gray-400 ml-1">(optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                      £
                    </span>
                    <input
                      type="number"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full pl-7 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9F1239] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FileText className="h-3.5 w-3.5 inline mr-1.5 text-gray-400" />
                  Notes
                  <span className="text-xs text-gray-400 ml-1">(optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Any observations, actions taken, or follow-up required..."
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#9F1239] focus:border-transparent resize-none"
                />
              </div>

              {/* Evidence upload (placeholder) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Upload className="h-3.5 w-3.5 inline mr-1.5 text-gray-400" />
                  Evidence Upload
                  <span className="text-xs text-gray-400 ml-1">(optional)</span>
                </label>
                <div className="border-2 border-dashed border-gray-200 rounded-lg px-4 py-6 text-center hover:border-[#9F1239]/40 transition-colors">
                  <Upload className="h-6 w-6 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">
                    Drag and drop files here, or{" "}
                    <label className="text-[#9F1239] cursor-pointer hover:underline">
                      browse
                      <input type="file" multiple className="sr-only" />
                    </label>
                  </p>
                  <p className="text-xs text-gray-300 mt-1">
                    Photos, PDFs, reports — up to 10 MB each
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <Link href="/estate/checks">
                  <Button type="button" variant="outline" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#9F1239] hover:bg-[#881030] text-white"
                >
                  {submitting ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Logging...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Log Completion
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
