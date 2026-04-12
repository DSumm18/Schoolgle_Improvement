"use client";

/**
 * Check History Page
 *
 * Complete timeline view of all compliance check completions with:
 * - Chronological timeline of all completions
 * - Detailed completion records
 * - Evidence tracking
 * - Status changes
 * - Contractor information
 *
 * @version 2.0 - Now fetches real data from Supabase
 */

import { useState, useEffect } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/SupabaseAuthContext";
import {
  ArrowLeft,
  History,
  Check,
  Clock,
  AlertTriangle,
  FileText,
  User,
  Calendar,
  Download,
  ExternalLink,
  Filter,
} from "lucide-react";
import {
  DOMAIN_METADATA,
  getChecksForDomain,
  type ComplianceDomain,
  type StatutoryCheck,
} from "@/lib/estates-compliance/statutory-checks";
import { supabase } from "@/lib/supabase";

interface HistoryRecord {
  id: string;
  completedDate: string;
  completedBy: string;
  status: "completed" | "awaiting_documentation" | "in_progress" | "skipped";
  notes: string;
  evidence: OfstedEvidenceItem[];
  nextDueDate: string;
  documentsReceived: boolean;
  contractorName?: string;
  duration?: number; // minutes
}

interface OfstedEvidenceItem {
  id: string;
  type: "certificate" | "report" | "photo" | "document";
  title: string;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
  fileSize?: string;
}

export default function CheckHistoryPage() {
  const params = useParams();
  const { organizationId } = useAuth();
  const domainSlug = params.domain as ComplianceDomain;
  const checkId = params.checkId as string;

  const [check, setCheck] = useState<StatutoryCheck | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [filter, setFilter] = useState<
    "all" | "completed" | "awaiting_documentation"
  >("all");
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState({
    step: "Initializing...",
    checkId: checkId || "none",
    domain: domainSlug || "none",
    count: 0,
  });

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    async function initializeData() {
      setDebugInfo({
        step: "Starting...",
        checkId: checkId || "none",
        domain: domainSlug || "none",
        count: 0,
      });

      // Validate domain
      if (!domainSlug || !DOMAIN_METADATA[domainSlug]) {
        setDebugInfo((prev) => ({ ...prev, step: "Invalid domain" }));
        notFound();
        return;
      }

      // Find the check
      const domainChecks = getChecksForDomain(domainSlug);
      const foundCheck = domainChecks.find((c) => c.id === checkId);

      if (!foundCheck) {
        setDebugInfo((prev) => ({ ...prev, step: "Check NOT found!" }));
        notFound();
        return;
      }

      if (mounted) {
        setCheck(foundCheck);
        setDebugInfo((prev) => ({
          ...prev,
          step: "Check found: " + foundCheck.name,
        }));
      }

      // Fetch real completions from API with timeout
      if (organizationId) {
        setDebugInfo((prev) => ({ ...prev, step: "Fetching from API..." }));

        // Add timeout to prevent hanging requests
        const timeoutId = setTimeout(
          () => controller.abort("Request timed out"),
          30000,
        );

        try {
          console.log("[HISTORY] Fetching completions for:", {
            organizationId,
            checkId,
            domainSlug,
          });

          // Get auth session for API call
          const {
            data: { session },
          } = await supabase.auth.getSession();
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
          };
          if (session?.access_token) {
            headers["Authorization"] = `Bearer ${session.access_token}`;
          }

          const response = await fetch(
            `/api/estates/statutory-completions?organizationId=${organizationId}&domain=${domainSlug}`,
            {
              headers,
              signal: controller.signal,
            },
          );

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API error: ${response.status} ${errorText}`);
          }

          const result = await response.json();
          const data = result.completions || [];

          // Filter for this specific check ID since API returns all for domain
          const checkCompletions = data.filter(
            (r: any) => r.check_id === checkId,
          );

          console.log("[HISTORY] Result:", {
            totalDomainRecords: data.length,
            checkSpecificRecords: checkCompletions.length,
          });

          if (mounted) {
            // Convert records to HistoryRecord format and fetch evidence
            const historyRecords: HistoryRecord[] = await Promise.all(
              checkCompletions.map(async (record: any) => {
                // Fetch evidence files if evidence_ids exist
                let evidence: OfstedEvidenceItem[] = [];
                const evidenceIds = record.evidence_ids || [];
                if (evidenceIds.length > 0) {
                  try {
                    const evidenceRes = await fetch(
                      `/api/estates/evidence?ids=${evidenceIds.join(",")}`,
                      { headers },
                    );
                    if (evidenceRes.ok) {
                      const evidenceData = await evidenceRes.json();
                      const items = evidenceData?.data || evidenceData || [];
                      evidence = (
                        Array.isArray(items) ? items : [items]
                      ).map((ev: any) => ({
                        id: ev.id,
                        type: ev.evidence_type || "document",
                        title: ev.title || ev.file_name || "Evidence",
                        url: ev.file_url || ev.url || "",
                        uploadedAt: ev.uploaded_at || ev.created_at || "",
                        uploadedBy: ev.uploaded_by || "Unknown",
                        fileSize: ev.file_size
                          ? `${Math.round(ev.file_size / 1024)} KB`
                          : undefined,
                      }));
                    }
                  } catch (e) {
                    console.warn(
                      "[HISTORY] Failed to fetch evidence for record",
                      record.id,
                      e,
                    );
                  }
                }

                return {
                  id: record.id,
                  completedDate: record.completed_at,
                  completedBy: record.completed_by || "Unknown",
                  status: record.status || "completed",
                  notes: record.completion_notes || "",
                  nextDueDate: record.next_due || "",
                  documentsReceived:
                    record.documents_received || evidenceIds.length > 0,
                  evidence,
                  contractorName: record.contractor_name,
                  duration: record.duration_minutes,
                };
              }),
            );

            // Sort by completed date descending (just in case)
            historyRecords.sort(
              (a, b) =>
                new Date(b.completedDate).getTime() -
                new Date(a.completedDate).getTime(),
            );

            setHistory(historyRecords);
            setDebugInfo((prev) => ({
              ...prev,
              step: "Loaded " + historyRecords.length + " records",
              count: historyRecords.length,
            }));
            setLoading(false);
          }
        } catch (error: any) {
          clearTimeout(timeoutId);
          if (mounted) {
            if (
              error.name === "AbortError" ||
              error?.message?.includes("aborted")
            ) {
              console.warn("[HISTORY] Request timed out");
              setDebugInfo((prev) => ({ ...prev, step: "Timeout Error" }));
            } else {
              console.error("[HISTORY ERROR]", error);
              setDebugInfo((prev) => ({
                ...prev,
                step: "ERROR: " + String(error),
              }));
            }
            // Even on error, stop loading to show "0 records" state or partial data
            setLoading(false);
          }
        }
      } else {
        if (mounted) {
          setDebugInfo((prev) => ({
            ...prev,
            step: "No organizationId - showing empty",
          }));
          setLoading(false);
        }
      }
    }

    initializeData();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [domainSlug, checkId, organizationId]);

  const getStatusInfo = (status: HistoryRecord["status"]) => {
    switch (status) {
      case "completed":
        return {
          label: "Completed",
          bg: "bg-green-50 dark:bg-green-950/30",
          border: "border-green-300 dark:border-green-700",
          text: "text-green-800 dark:text-green-300",
          icon: <Check className="w-5 h-5" />,
        };
      case "awaiting_documentation":
        return {
          label: "Awaiting Documentation",
          bg: "bg-amber-50 dark:bg-amber-950/30",
          border: "border-amber-300 dark:border-amber-700",
          text: "text-amber-800 dark:text-amber-300",
          icon: <Clock className="w-5 h-5" />,
        };
      case "in_progress":
        return {
          label: "In Progress",
          bg: "bg-blue-50 dark:bg-blue-950/30",
          border: "border-blue-300 dark:border-blue-700",
          text: "text-blue-800 dark:text-blue-300",
          icon: <Clock className="w-5 h-5" />,
        };
      default:
        return {
          label: "Skipped",
          bg: "bg-gray-50 dark:bg-gray-900/30",
          border: "border-gray-300 dark:border-gray-700",
          text: "text-gray-800 dark:text-gray-300",
          icon: <AlertTriangle className="w-5 h-5" />,
        };
    }
  };

  const getEvidenceIcon = (type: OfstedEvidenceItem["type"]) => {
    switch (type) {
      case "certificate":
        return "📜";
      case "report":
        return "📊";
      case "photo":
        return "📷";
      case "document":
        return "📄";
      default:
        return "📎";
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredHistory = history.filter((record) => {
    if (filter === "all") return true;
    return record.status === filter;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-14 h-14 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
        <div className="text-gray-600 dark:text-gray-400 font-semibold text-lg">
          Loading history...
        </div>
      </div>
    );
  }

  if (!check) {
    notFound();
    return null;
  }

  const metadata = DOMAIN_METADATA[domainSlug];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 pb-6 border-b-2 border-gray-200 dark:border-gray-700">
        <Link
          href={`/estates-compliance/${domainSlug}/${checkId}`}
          className="inline-flex items-center gap-2 w-fit px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {check.name}
        </Link>

        <div className="flex items-center gap-3">
          <span className="text-4xl">{metadata.icon}</span>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Compliance History
            </h1>
            <p className="text-gray-600 dark:text-gray-400 font-medium mt-1">
              {metadata.name} • {check.name}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-teal-100 dark:bg-teal-900/50">
              <History className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                Total Completions
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {history.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border-2 border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/30 p-5 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/50">
              <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                Fully Complete
              </p>
              <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                {history.filter((h) => h.status === "completed").length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-5 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/50">
              <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                Awaiting Docs
              </p>
              <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">
                {
                  history.filter((h) => h.status === "awaiting_documentation")
                    .length
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-lg">
        <div className="flex items-center gap-3 flex-wrap">
          <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Filter by status:
          </span>
          <div className="flex gap-2">
            {[
              { value: "all", label: "All Records" },
              { value: "completed", label: "Completed" },
              { value: "awaiting_documentation", label: "Awaiting Docs" },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value as any)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
                  filter === f.value
                    ? "bg-teal-600 text-white border-teal-700"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-8 top-0 bottom-0 w-1 bg-gray-300 dark:bg-gray-700"></div>

        <div className="space-y-6">
          {filteredHistory.map((record, idx) => {
            const statusInfo = getStatusInfo(record.status);

            return (
              <div key={record.id} className="relative flex gap-6">
                {/* Timeline Dot */}
                <div
                  className={`relative z-10 w-16 h-16 rounded-full border-4 flex items-center justify-center shadow-lg ${statusInfo.bg} ${statusInfo.border}`}
                >
                  {statusInfo.icon}
                </div>

                {/* Content */}
                <div
                  className={`flex-1 rounded-xl border-2 shadow-lg overflow-hidden ${statusInfo.bg} ${statusInfo.border}`}
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {idx === 0
                              ? "Most Recent"
                              : `Completion #${history.length - idx}`}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-lg text-sm font-bold border-2 flex items-center gap-1.5 shadow-sm ${statusInfo.text} ${statusInfo.border} bg-white dark:bg-gray-800`}
                          >
                            {statusInfo.icon}
                            {statusInfo.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDateTime(record.completedDate)}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {record.completedBy}
                          </span>
                          {record.duration && (
                            <span>{record.duration} minutes</span>
                          )}
                        </div>
                      </div>
                      {record.contractorName && (
                        <div className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600">
                          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                            Contractor
                          </p>
                          <p className="font-bold text-gray-900 dark:text-white">
                            {record.contractorName}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    {record.notes && (
                      <div className="mb-4 p-4 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700">
                        <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                          {record.notes}
                        </p>
                      </div>
                    )}

                    {/* Evidence */}
                    {record.evidence && record.evidence.length > 0 && (
                      <div>
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Evidence Documents ({record.evidence.length})
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {record.evidence.map((ev) => (
                            <a
                              key={ev.id}
                              href={ev.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 hover:border-teal-400 dark:hover:border-teal-600 hover:shadow-md transition-all group"
                            >
                              <span className="text-2xl">
                                {getEvidenceIcon(ev.type)}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-teal-600 dark:group-hover:text-teal-400">
                                  {ev.title}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {ev.uploadedBy} •{" "}
                                  {ev.fileSize ||
                                    new Date(ev.uploadedAt).toLocaleDateString(
                                      "en-GB",
                                    )}
                                </p>
                              </div>
                              <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 flex-shrink-0" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Document Status */}
                    <div className="mt-4 flex flex-wrap gap-3">
                      <div
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-bold ${
                          record.documentsReceived
                            ? "bg-green-100 dark:bg-green-900/50 border-green-300 dark:border-green-700 text-green-800 dark:text-green-300"
                            : "bg-red-100 dark:bg-red-900/50 border-red-300 dark:border-red-700 text-red-800 dark:text-red-300"
                        }`}
                      >
                        {record.documentsReceived ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <AlertTriangle className="w-4 h-4" />
                        )}
                        {record.documentsReceived
                          ? "Documents Received"
                          : "Documents Outstanding"}
                      </div>
                      <div className="px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Next due: {formatDate(record.nextDueDate)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Debug Footer - Always visible for troubleshooting */}
      <div className="fixed bottom-0 left-0 right-0 bg-purple-600 text-white text-xs py-2 px-4 font-mono z-50">
        <div className="flex flex-wrap items-center justify-between gap-1">
          <span>
            📜 <strong>Step:</strong> {debugInfo.step}
          </span>
          <span>
            <strong>Domain:</strong> {debugInfo.domain}
          </span>
          <span>
            <strong>CheckID:</strong> {debugInfo.checkId}
          </span>
          <span>
            <strong>Records:</strong> {debugInfo.count}
          </span>
        </div>
      </div>
    </div>
  );
}
