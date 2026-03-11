"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Send,
  Download,
  Search,
  Eye,
  ChevronRight,
  ChevronDown,
  Loader2,
  X,
  Calendar,
  Filter,
} from "lucide-react";
import { DocumentStatusBadge } from "./DocumentStatusBadge";
import { DocumentTimeline } from "./DocumentTimeline";
import type {
  GeneratedDocument,
  DocumentStatus,
  DocumentModule,
} from "@/lib/document-engine/types";
import { MODULE_CONFIG } from "@/lib/document-engine/types";

interface DocumentListProps {
  organizationId: string;
  module?: string;
  contextType?: string;
  contextId?: string;
}

const STATUS_OPTIONS: Array<{ value: DocumentStatus | "all"; label: string }> =
  [
    { value: "all", label: "All Statuses" },
    { value: "draft", label: "Draft" },
    { value: "pending_approval", label: "Pending Approval" },
    { value: "approved", label: "Approved" },
    { value: "finalised", label: "Finalised" },
    { value: "sent", label: "Sent" },
    { value: "delivered", label: "Delivered" },
    { value: "acknowledged", label: "Acknowledged" },
    { value: "rejected", label: "Rejected" },
  ];

const MODULE_OPTIONS: Array<{ value: DocumentModule | "all"; label: string }> =
  [
    { value: "all", label: "All Modules" },
    ...Object.entries(MODULE_CONFIG).map(([key, val]) => ({
      value: key as DocumentModule,
      label: val.label,
    })),
  ];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function DocumentList({
  organizationId,
  module: initialModule,
  contextType,
  contextId,
}: DocumentListProps) {
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | "all">(
    "all",
  );
  const [moduleFilter, setModuleFilter] = useState<DocumentModule | "all">(
    (initialModule as DocumentModule) || "all",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!organizationId) return;
    setLoading(true);
    setError(null);

    const url = new URL("/api/documents", window.location.origin);
    url.searchParams.set("organizationId", organizationId);
    if (contextType) url.searchParams.set("contextType", contextType);
    if (contextId) url.searchParams.set("contextId", contextId);

    fetch(url.toString())
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load documents");
        return res.json();
      })
      .then((data) => {
        setDocuments(data.documents || data.data || []);
      })
      .catch((err) => {
        console.error("Failed to fetch documents:", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [organizationId, contextType, contextId]);

  const filtered = useMemo(() => {
    let result = documents;

    if (statusFilter !== "all") {
      result = result.filter((d) => d.status === statusFilter);
    }
    if (moduleFilter !== "all") {
      result = result.filter((d) => d.module === moduleFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.subject.toLowerCase().includes(q) ||
          (d.recipient_name && d.recipient_name.toLowerCase().includes(q)) ||
          (d.recipient_email && d.recipient_email.toLowerCase().includes(q)) ||
          d.category.toLowerCase().includes(q),
      );
    }
    if (dateFrom) {
      const from = new Date(dateFrom);
      result = result.filter((d) => new Date(d.created_at) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter((d) => new Date(d.created_at) <= to);
    }

    return result;
  }, [documents, statusFilter, moduleFilter, searchQuery, dateFrom, dateTo]);

  const handleSend = async (docId: string) => {
    try {
      const res = await fetch(`/api/documents/${docId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId }),
      });
      if (res.ok) {
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === docId
              ? {
                  ...d,
                  status: "sent" as DocumentStatus,
                  sent_at: new Date().toISOString(),
                }
              : d,
          ),
        );
      }
    } catch (err) {
      console.error("Send failed:", err);
    }
  };

  const handleDownload = async (docId: string) => {
    try {
      const res = await fetch(
        `/api/documents/${docId}/download?organizationId=${organizationId}`,
      );
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `document-${docId}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
            showFilters
              ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
              : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          <Filter size={14} />
          Filters
          {(statusFilter !== "all" ||
            moduleFilter !== "all" ||
            dateFrom ||
            dateTo) && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">
              {
                [
                  statusFilter !== "all",
                  moduleFilter !== "all",
                  !!dateFrom,
                  !!dateTo,
                ].filter(Boolean).length
              }
            </span>
          )}
        </button>
      </div>

      {/* Expanded Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-700 bg-slate-800/50 p-4 sm:grid-cols-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  Status
                </label>
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value as DocumentStatus | "all")
                    }
                    className="w-full appearance-none rounded-lg border border-slate-600 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={12}
                    className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  Module
                </label>
                <div className="relative">
                  <select
                    value={moduleFilter}
                    onChange={(e) =>
                      setModuleFilter(e.target.value as DocumentModule | "all")
                    }
                    className="w-full appearance-none rounded-lg border border-slate-600 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
                  >
                    {MODULE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={12}
                    className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  From
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  To
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <Loader2 size={24} className="mb-3 animate-spin" />
          <p className="text-sm">Loading documents...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <FileText size={32} className="mb-3 opacity-50" />
          <p className="text-sm font-medium text-slate-300">
            No documents found
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {documents.length > 0
              ? "Try adjusting your filters"
              : "Generate your first document to get started"}
          </p>
        </div>
      )}

      {/* Document Rows */}
      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-2">
          {/* Header */}
          <div className="hidden items-center gap-4 px-5 py-2 text-[11px] font-medium uppercase tracking-wider text-slate-500 sm:grid sm:grid-cols-12">
            <div className="col-span-3">Recipient</div>
            <div className="col-span-3">Template</div>
            <div className="col-span-2">Module</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1">Date</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          {filtered.map((doc) => {
            const modConfig = MODULE_CONFIG[doc.module];
            const isExpanded = expandedId === doc.id;

            return (
              <div key={doc.id}>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : doc.id)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-5 py-3.5 text-left transition-all hover:border-slate-600 hover:bg-slate-800"
                >
                  <div className="grid items-center gap-4 sm:grid-cols-12">
                    {/* Recipient */}
                    <div className="col-span-3 min-w-0">
                      <p className="truncate text-sm font-medium text-slate-200">
                        {doc.recipient_name || "No recipient"}
                      </p>
                      {doc.recipient_email && (
                        <p className="truncate text-xs text-slate-500">
                          {doc.recipient_email}
                        </p>
                      )}
                    </div>

                    {/* Template / Subject */}
                    <div className="col-span-3 min-w-0">
                      <p className="truncate text-sm text-slate-300">
                        {doc.subject}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {doc.category.replace(/_/g, " ")}
                      </p>
                    </div>

                    {/* Module */}
                    <div className="col-span-2">
                      <span
                        className="rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                        style={{
                          backgroundColor: `${modConfig?.color || "#94a3b8"}15`,
                          color: modConfig?.color || "#94a3b8",
                        }}
                      >
                        {modConfig?.label || doc.module}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="col-span-2">
                      <DocumentStatusBadge status={doc.status} size="sm" />
                    </div>

                    {/* Date */}
                    <div className="col-span-1">
                      <p className="text-xs text-slate-500">
                        {formatDate(doc.created_at)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedId(isExpanded ? null : doc.id);
                        }}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors"
                        title="View"
                      >
                        <Eye size={14} />
                      </button>
                      {(doc.status === "finalised" ||
                        doc.status === "approved") && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSend(doc.id);
                          }}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-500/20 hover:text-blue-400 transition-colors"
                          title="Send"
                        >
                          <Send size={14} />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(doc.id);
                        }}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors"
                        title="Download"
                      >
                        <Download size={14} />
                      </button>
                      <ChevronRight
                        size={14}
                        className={`text-slate-600 transition-transform ${
                          isExpanded ? "rotate-90" : ""
                        }`}
                      />
                    </div>
                  </div>
                </button>

                {/* Expanded Detail */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mx-2 mb-2 grid grid-cols-1 gap-4 rounded-xl border border-slate-700/50 bg-slate-900/50 p-5 lg:grid-cols-2">
                        {/* Preview */}
                        <div>
                          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Preview
                          </h4>
                          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                            <p className="mb-2 text-sm font-medium text-slate-200">
                              {doc.subject}
                            </p>
                            <div
                              className="prose prose-sm prose-invert max-w-none text-xs text-slate-400"
                              dangerouslySetInnerHTML={{
                                __html: doc.body_html,
                              }}
                            />
                          </div>
                        </div>

                        {/* Timeline */}
                        <div>
                          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Timeline
                          </h4>
                          <DocumentTimeline document={doc} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
