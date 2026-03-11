"use client";

import { useState, useCallback } from "react";
import useSWR, { mutate } from "swr";
import Link from "next/link";
import {
  FileSearch,
  CheckCircle,
  XCircle,
  Edit3,
  AlertTriangle,
  FileText,
  FileSpreadsheet,
  Image,
  File,
  ChevronDown,
  ChevronUp,
  Loader2,
  Clock,
  Filter,
  ListChecks,
  Upload,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExtractedField {
  name: string;
  value: string;
  confidence?: number;
}

interface CrossCheck {
  label: string;
  matched: boolean;
  detail?: string;
}

interface ValidationItem {
  id: string;
  document_name: string;
  document_type: string;
  extracted_at: string;
  overall_confidence: number;
  extracted_fields: ExtractedField[];
  cross_checks: CrossCheck[];
  target_modules: string[];
  anomalies: string[];
  status: "pending_review" | "confirmed" | "rejected";
  rejection_reason?: string;
}

interface ValidationStats {
  pending_count: number;
  confirmed_today: number;
  rejected_count: number;
  average_confidence: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function docIcon(type: string) {
  switch (type.toLowerCase()) {
    case "pdf":
      return <FileText className="h-5 w-5 text-red-500" />;
    case "spreadsheet":
    case "xlsx":
    case "csv":
      return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
    case "image":
    case "png":
    case "jpg":
      return <Image className="h-5 w-5 text-purple-500" />;
    default:
      return <File className="h-5 w-5 text-gray-500" />;
  }
}

function confidenceColor(c: number) {
  if (c >= 90) return "text-green-600";
  if (c >= 70) return "text-amber-600";
  return "text-red-600";
}

function confidenceBg(c: number) {
  if (c >= 90) return "bg-green-100 text-green-800";
  if (c >= 70) return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-800";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  color: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm">
      <div className={`rounded-lg p-2 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-xl font-semibold">{value}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline Review Panel
// ---------------------------------------------------------------------------

function ReviewPanel({
  item,
  onAction,
}: {
  item: ValidationItem;
  onAction: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editedFields, setEditedFields] = useState<ExtractedField[]>(
    item.extracted_fields,
  );
  const [rejectionReason, setRejectionReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (action: "confirm" | "edit_and_confirm" | "reject") => {
    setSubmitting(true);
    try {
      await fetch(`/api/data-validation/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          ...(action === "edit_and_confirm" && { edits: editedFields }),
          ...(action === "reject" && { reason: rejectionReason }),
        }),
      });
      mutate(
        (key: string) =>
          typeof key === "string" && key.startsWith("/api/data-validation"),
      );
      onAction();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border-t bg-gray-50 p-4">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left: extracted fields */}
        <div>
          <h4 className="mb-2 text-sm font-semibold text-gray-700">
            Extracted Fields
          </h4>
          <div className="overflow-hidden rounded-lg border bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2">Field</th>
                  <th className="px-3 py-2">Value</th>
                  <th className="px-3 py-2 text-right">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {editedFields.map((f, i) => (
                  <tr key={i} className="border-t">
                    <td className="whitespace-nowrap px-3 py-2 font-medium text-gray-700">
                      {f.name}
                    </td>
                    <td className="px-3 py-2">
                      {editing ? (
                        <input
                          className="w-full rounded border px-2 py-1 text-sm"
                          value={f.value}
                          onChange={(e) => {
                            const updated = [...editedFields];
                            updated[i] = { ...f, value: e.target.value };
                            setEditedFields(updated);
                          }}
                        />
                      ) : (
                        <span className="text-gray-900">{f.value}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {f.confidence !== undefined ? (
                        <span
                          className={`text-xs font-medium ${confidenceColor(f.confidence)}`}
                        >
                          {f.confidence}%
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">--</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: cross checks */}
        <div>
          <h4 className="mb-2 text-sm font-semibold text-gray-700">
            Cross Checks
          </h4>
          <div className="space-y-2">
            {item.cross_checks.length === 0 && (
              <p className="text-sm text-gray-400">
                No cross checks available.
              </p>
            )}
            {item.cross_checks.map((cc, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-lg border bg-white p-3"
              >
                {cc.matched ? (
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                ) : (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {cc.label}
                  </p>
                  {cc.detail && (
                    <p className="text-xs text-gray-500">{cc.detail}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rejection reason input */}
      {showReject && (
        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Reason for rejection
          </label>
          <textarea
            className="w-full rounded-lg border px-3 py-2 text-sm"
            rows={2}
            placeholder="Why is this extraction incorrect?"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {item.status === "pending_review" && (
          <>
            <button
              disabled={submitting}
              onClick={() => submit("confirm")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4" />
              Confirm
            </button>

            {editing ? (
              <button
                disabled={submitting}
                onClick={() => submit("edit_and_confirm")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Edit3 className="h-4 w-4" />
                Save &amp; Confirm
              </button>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Edit3 className="h-4 w-4" />
                Edit &amp; Confirm
              </button>
            )}

            {showReject ? (
              <button
                disabled={submitting || !rejectionReason.trim()}
                onClick={() => submit("reject")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
                Confirm Rejection
              </button>
            ) : (
              <button
                onClick={() => setShowReject(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </button>
            )}

            {(editing || showReject) && (
              <button
                onClick={() => {
                  setEditing(false);
                  setShowReject(false);
                  setEditedFields(item.extracted_fields);
                  setRejectionReason("");
                }}
                className="text-sm text-gray-500 underline hover:text-gray-700"
              >
                Cancel
              </button>
            )}
          </>
        )}

        {submitting && (
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

type Tab = "queue" | "validated";
type StatusFilter = "all" | "pending_review" | "confirmed" | "rejected";
type SortBy = "newest" | "oldest" | "confidence";

export default function DataValidationPage() {
  const [tab, setTab] = useState<Tab>("queue");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [docTypeFilter, setDocTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Build queue query string
  const queueParams = new URLSearchParams();
  if (statusFilter !== "all") queueParams.set("status", statusFilter);
  else queueParams.set("status", "pending_review");
  if (docTypeFilter !== "all") queueParams.set("document_type", docTypeFilter);
  queueParams.set("sort", sortBy);

  const { data: queueData, isLoading: queueLoading } = useSWR<{
    items: ValidationItem[];
  }>(`/api/data-validation?${queueParams.toString()}`, fetcher, {
    refreshInterval: 30000,
  });

  const { data: statsData } = useSWR<ValidationStats>(
    "/api/data-validation/stats",
    fetcher,
    { refreshInterval: 30000 },
  );

  const { data: validatedData, isLoading: validatedLoading } = useSWR<{
    items: ValidationItem[];
  }>(tab === "validated" ? "/api/data-validation/validated" : null, fetcher);

  const items =
    tab === "queue" ? (queueData?.items ?? []) : (validatedData?.items ?? []);
  const loading = tab === "queue" ? queueLoading : validatedLoading;

  // Derive unique doc types for filter
  const docTypes = Array.from(
    new Set((queueData?.items ?? []).map((i) => i.document_type)),
  );

  const toggleExpand = useCallback(
    (id: string) => setExpandedId((prev) => (prev === id ? null : id)),
    [],
  );

  // Apply client-side filters for the "all" status view
  const filteredItems =
    tab === "queue" && statusFilter === "all" ? items : items;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <FileSearch className="h-7 w-7 text-sky-600" />
            Data Validation
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Review AI-extracted data before it flows to modules.
          </p>
        </div>
        <Link
          href="/dashboard/data-validation/upload"
          className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700"
        >
          <Upload className="h-4 w-4" />
          Upload Document
        </Link>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Pending Review"
          value={statsData?.pending_count ?? "--"}
          color="bg-amber-100 text-amber-700"
          icon={Clock}
        />
        <StatCard
          label="Confirmed Today"
          value={statsData?.confirmed_today ?? "--"}
          color="bg-green-100 text-green-700"
          icon={CheckCircle}
        />
        <StatCard
          label="Rejected"
          value={statsData?.rejected_count ?? "--"}
          color="bg-red-100 text-red-700"
          icon={XCircle}
        />
        <StatCard
          label="Avg AI Confidence"
          value={
            statsData?.average_confidence !== undefined
              ? `${statsData.average_confidence}%`
              : "--"
          }
          color="bg-sky-100 text-sky-700"
          icon={FileSearch}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border bg-gray-100 p-1">
        <button
          onClick={() => setTab("queue")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
            tab === "queue"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <span className="inline-flex items-center gap-1.5">
            <FileSearch className="h-4 w-4" />
            Review Queue
          </span>
        </button>
        <button
          onClick={() => setTab("validated")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
            tab === "validated"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <span className="inline-flex items-center gap-1.5">
            <ListChecks className="h-4 w-4" />
            Validated Data
          </span>
        </button>
      </div>

      {/* Filters (queue tab only) */}
      {tab === "queue" && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <Filter className="h-4 w-4" />
            Filters:
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-lg border bg-white px-3 py-1.5 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="pending_review">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={docTypeFilter}
            onChange={(e) => setDocTypeFilter(e.target.value)}
            className="rounded-lg border bg-white px-3 py-1.5 text-sm"
          >
            <option value="all">All types</option>
            {docTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="rounded-lg border bg-white px-3 py-1.5 text-sm"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="confidence">Confidence</option>
          </select>
        </div>
      )}

      {/* Item List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-500">Loading...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-xl border bg-white py-20 text-center">
          <FileSearch className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">
            {tab === "queue"
              ? "No items in the review queue."
              : "No validated data yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const expanded = expandedId === item.id;
            return (
              <div
                key={item.id}
                className="overflow-hidden rounded-xl border bg-white shadow-sm transition hover:shadow-md"
              >
                {/* Row summary */}
                <button
                  type="button"
                  onClick={() => toggleExpand(item.id)}
                  className="flex w-full items-center gap-4 px-4 py-3 text-left"
                >
                  {/* Doc icon + name */}
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {docIcon(item.document_type)}
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-900">
                        {item.document_name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {item.document_type} &middot;{" "}
                        {formatDate(item.extracted_at)}
                      </p>
                    </div>
                  </div>

                  {/* Confidence */}
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${confidenceBg(item.overall_confidence)}`}
                  >
                    {item.overall_confidence}%
                  </span>

                  {/* Fields count */}
                  <span className="hidden shrink-0 text-xs text-gray-500 sm:inline">
                    {item.extracted_fields.length} fields
                  </span>

                  {/* Target modules */}
                  <div className="hidden shrink-0 gap-1 lg:flex">
                    {item.target_modules.map((m) => (
                      <span
                        key={m}
                        className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700"
                      >
                        {m}
                      </span>
                    ))}
                  </div>

                  {/* Anomalies */}
                  {item.anomalies.length > 0 && (
                    <span className="hidden shrink-0 items-center gap-1 text-xs font-medium text-red-600 sm:inline-flex">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {item.anomalies.length} anomal
                      {item.anomalies.length === 1 ? "y" : "ies"}
                    </span>
                  )}

                  {/* Status pill for non-pending */}
                  {item.status === "confirmed" && (
                    <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      Confirmed
                    </span>
                  )}
                  {item.status === "rejected" && (
                    <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                      Rejected
                    </span>
                  )}

                  {/* Chevron */}
                  {expanded ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
                  )}
                </button>

                {/* Mobile-only badges */}
                {!expanded && (
                  <div className="flex flex-wrap gap-1.5 px-4 pb-3 sm:hidden">
                    {item.target_modules.map((m) => (
                      <span
                        key={m}
                        className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700"
                      >
                        {m}
                      </span>
                    ))}
                    {item.anomalies.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                        <AlertTriangle className="h-3 w-3" />
                        {item.anomalies.length} anomal
                        {item.anomalies.length === 1 ? "y" : "ies"}
                      </span>
                    )}
                  </div>
                )}

                {/* Expanded panel */}
                {expanded && (
                  <>
                    {/* Anomaly warnings */}
                    {item.anomalies.length > 0 && (
                      <div className="border-t bg-red-50 px-4 py-2">
                        {item.anomalies.map((a, i) => (
                          <p
                            key={i}
                            className="flex items-center gap-1.5 text-sm text-red-700"
                          >
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                            {a}
                          </p>
                        ))}
                      </div>
                    )}

                    <ReviewPanel
                      item={item}
                      onAction={() => setExpandedId(null)}
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
