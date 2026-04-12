"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, notFound, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/SupabaseAuthContext";
import {
  ArrowLeft,
  Check,
  Clock,
  AlertTriangle,
  FileText,
  Upload,
  X,
  Plus,
  Calendar,
  Download,
  ExternalLink,
  History,
  Building,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  DOMAIN_METADATA,
  getChecksForDomain,
  type ComplianceDomain,
  type StatutoryCheck,
  type CheckStatus,
} from "@/lib/estates-compliance/statutory-checks";
import { supabase } from "@/lib/supabase";

// --- Types ---

type CompletionStatus =
  | "completed"
  | "awaiting_documentation"
  | "pending_contractor"
  | "incomplete";

interface EvidenceFile {
  id: string;
  file: File;
  preview: string;
  category: "certificate" | "report" | "photo" | "document";
}

interface EvidenceItem {
  id: string;
  type: "certificate" | "report" | "photo" | "document";
  title: string;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
  fileSize?: string;
}

interface CompletionRecord {
  id: string;
  completed_at: string;
  completed_by: string;
  status: string;
  completion_notes: string;
  next_due: string;
  evidence_ids?: string[];
  evidence?: EvidenceItem[];
}

// --- Helpers ---

function formatDate(dateStr?: string) {
  if (!dateStr) return "Never";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateStr?: string) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDaysUntil(dateStr?: string) {
  if (!dateStr) return null;
  const days = Math.ceil(
    (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `${days}d left`;
}

function calculateNextDueDate(frequency: string): string {
  const next = new Date();
  switch (frequency) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    case "quarterly":
      next.setMonth(next.getMonth() + 3);
      break;
    case "annually":
      next.setFullYear(next.getFullYear() + 1);
      break;
    case "termly":
      next.setMonth(next.getMonth() + 4);
      break;
    default:
      next.setMonth(next.getMonth() + 1);
  }
  return next.toISOString().split("T")[0];
}

function statusBadgeClasses(status: string) {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800 border border-green-300";
    case "awaiting_documentation":
      return "bg-amber-100 text-amber-800 border border-amber-300";
    case "pending_contractor":
      return "bg-blue-100 text-blue-800 border border-blue-300";
    case "incomplete":
    case "overdue":
      return "bg-red-100 text-red-800 border border-red-300";
    default:
      return "bg-gray-100 text-gray-700 border border-gray-300";
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "completed":
      return "Fully Completed";
    case "awaiting_documentation":
      return "Awaiting Documentation";
    case "pending_contractor":
      return "Pending Contractor";
    case "incomplete":
      return "Incomplete";
    case "overdue":
      return "Overdue";
    case "pending":
      return "Pending";
    default:
      return status.replace(/_/g, " ");
  }
}

function isCheckDue(completions: CompletionRecord[]): boolean {
  if (completions.length === 0) return true;
  const latest = completions[0];
  if (!latest.next_due) return true;
  return new Date(latest.next_due) <= new Date();
}

// --- Main Page ---

export default function CheckDetailPage() {
  const router = useRouter();
  const { user, organizationId } = useAuth();
  const params = useParams();
  const domainSlug = params.domain as ComplianceDomain;
  const checkId = params.checkId as string;

  const [check, setCheck] = useState<StatutoryCheck | null>(null);
  const [completions, setCompletions] = useState<CompletionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [descExpanded, setDescExpanded] = useState(false);
  const [formExpanded, setFormExpanded] = useState(false);

  // Form state
  const [completionStatus, setCompletionStatus] =
    useState<CompletionStatus>("completed");
  const [notes, setNotes] = useState("");
  const [nextDueDate, setNextDueDate] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!domainSlug || !DOMAIN_METADATA[domainSlug]) {
        notFound();
        return;
      }

      const domainChecks = getChecksForDomain(domainSlug);
      const foundCheck = domainChecks.find((c) => c.id === checkId);

      if (!foundCheck) {
        notFound();
        return;
      }

      if (!cancelled) {
        setCheck(foundCheck);
        setNextDueDate(calculateNextDueDate(foundCheck.frequency));
      }

      if (organizationId) {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          const headers: Record<string, string> = {};
          if (session?.access_token) {
            headers["Authorization"] = `Bearer ${session.access_token}`;
          }

          const res = await fetch(
            `/api/estates/statutory-completions?organizationId=${organizationId}&domain=${domainSlug}`,
            { headers },
          );

          if (res.ok) {
            const result = await res.json();
            const all = result.completions || [];
            const mine = all.filter((r: any) => r.check_id === checkId);

            // Sort newest first
            mine.sort(
              (a: any, b: any) =>
                new Date(b.completed_at).getTime() -
                new Date(a.completed_at).getTime(),
            );

            // Fetch evidence for each record
            const withEvidence: CompletionRecord[] = await Promise.all(
              mine.map(async (record: any) => {
                const evidenceIds: string[] = record.evidence_ids || [];
                let evidence: EvidenceItem[] = [];

                if (evidenceIds.length > 0) {
                  try {
                    const evRes = await fetch(
                      `/api/estates/evidence?ids=${evidenceIds.join(",")}`,
                      { headers },
                    );
                    if (evRes.ok) {
                      const evData = await evRes.json();
                      const items = evData?.data || evData || [];
                      evidence = (Array.isArray(items) ? items : [items]).map(
                        (ev: any) => ({
                          id: ev.id,
                          type: ev.evidence_type || "document",
                          title: ev.title || ev.file_name || "Evidence",
                          url: ev.file_url || ev.url || "",
                          uploadedAt: ev.uploaded_at || ev.created_at || "",
                          uploadedBy: ev.uploaded_by || "Unknown",
                          fileSize: ev.file_size
                            ? `${Math.round(ev.file_size / 1024)} KB`
                            : undefined,
                        }),
                      );
                    }
                  } catch {
                    // silent fail — evidence just won't show
                  }
                }

                return { ...record, evidence };
              }),
            );

            if (!cancelled) {
              setCompletions(withEvidence);
              // Auto-expand form if check is due
              setFormExpanded(isCheckDue(withEvidence));
            }
          }
        } catch (err) {
          console.error("[CHECK DETAIL] fetch error", err);
        }
      } else {
        if (!cancelled) setFormExpanded(true);
      }

      if (!cancelled) setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [domainSlug, checkId, organizationId]);

  // --- File upload handlers ---

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles: EvidenceFile[] = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      category: "document",
    }));
    setEvidenceFiles((prev) => [...prev, ...newFiles]);
    // Reset input so same file can be re-added if removed
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (id: string) => {
    setEvidenceFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const updateFileCategory = (
    id: string,
    category: EvidenceFile["category"],
  ) => {
    setEvidenceFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, category } : f)),
    );
  };

  // --- Form submission ---

  const handleSubmit = async () => {
    if (!organizationId) {
      setSubmitError("You must be logged in to complete a check");
      return;
    }
    if (!notes.trim()) {
      setSubmitError("Please enter completion notes before saving");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const authHeader: Record<string, string> = {};
      if (session?.access_token) {
        authHeader["Authorization"] = `Bearer ${session.access_token}`;
      }

      // Step 1: Upload evidence files
      const uploadedIds: string[] = [];
      for (const ef of evidenceFiles) {
        const formData = new FormData();
        formData.append("file", ef.file);
        formData.append("title", ef.file.name);
        formData.append("evidence_type", ef.category);
        formData.append("source_type", "upload");
        formData.append("compliance_domain", domainSlug);
        formData.append(
          "description",
          `Evidence for ${check?.name || checkId} - ${completionStatus}`,
        );
        formData.append(
          "tags",
          `compliance,${domainSlug},${checkId},${ef.category}`,
        );

        const uploadRes = await fetch("/api/estates/evidence", {
          method: "POST",
          headers: authHeader,
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadResult = await uploadRes.json();
          const evidenceId =
            uploadResult?.data?.id || uploadResult?.evidence?.id;
          if (evidenceId) uploadedIds.push(evidenceId);
        } else {
          console.warn("[EVIDENCE UPLOAD FAILED]", ef.file.name);
        }
      }

      // Step 2: Save completion record
      const response = await fetch("/api/estates/statutory-completions", {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          action: "complete",
          check_id: checkId,
          check_data: {
            compliance_domain: domainSlug,
            status:
              completionStatus === "incomplete" ? "pending" : completionStatus,
            completion_notes: notes,
            next_due_date: nextDueDate,
            evidence_ids: uploadedIds,
            documents_received:
              uploadedIds.length > 0 || completionStatus === "completed",
          },
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to save completion");
      }

      // Reset form and reload
      setNotes("");
      setEvidenceFiles([]);
      setCompletionStatus("completed");
      setFormExpanded(false);

      // Reload page to show new history entry
      router.refresh();
      // Trigger a re-fetch by reloading
      window.location.reload();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to save completion",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // --- Render ---

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64 py-24">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            Loading check details...
          </p>
        </div>
      </div>
    );
  }

  if (!check) {
    notFound();
    return null;
  }

  const metadata = DOMAIN_METADATA[domainSlug];
  const latestCompletion = completions[0];
  const currentDue = latestCompletion?.next_due;
  const isOverdue = currentDue && new Date(currentDue) < new Date();
  const daysUntil = getDaysUntil(currentDue);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* 1. Back link */}
      <div>
        <Link
          href={`/estates-compliance/${domainSlug}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {metadata.name}
        </Link>
      </div>

      {/* 2. Check header */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{metadata.icon}</span>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {check.name}
              </h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300">
                  {metadata.name}
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 capitalize">
                  {check.frequency.replace("_", " ")}
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 capitalize">
                  {check.category === "statutory" ? "Statutory" : "Advisory"}
                </span>
                {latestCompletion && (
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusBadgeClasses(latestCompletion.status)}`}
                  >
                    {statusLabel(latestCompletion.status)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Due date chip */}
          <div
            className={`text-right shrink-0 px-3 py-2 rounded-lg border ${isOverdue ? "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800" : "bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700"}`}
          >
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Next Due
            </p>
            <p
              className={`text-sm font-bold ${isOverdue ? "text-red-700 dark:text-red-400" : "text-gray-900 dark:text-white"}`}
            >
              {formatDate(currentDue)}
            </p>
            {daysUntil && (
              <p
                className={`text-xs font-medium ${isOverdue ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400"}`}
              >
                {daysUntil}
              </p>
            )}
          </div>
        </div>

        {/* Collapsible description */}
        {check.description && (
          <div className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-4">
            <button
              onClick={() => setDescExpanded((v) => !v)}
              className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <FileText className="w-4 h-4" />
              Regulation details
              {descExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {descExpanded && (
              <div className="mt-3 space-y-3">
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {check.description}
                </p>
                {check.reference && (
                  <div className="inline-block px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mr-2">
                      Ref:
                    </span>
                    <span className="font-mono text-sm text-teal-700 dark:text-teal-400 font-bold">
                      {check.reference}
                    </span>
                  </div>
                )}
                {check.referenceUrl && (
                  <a
                    href={check.referenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-teal-600 dark:text-teal-400 hover:underline font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View official guidance
                  </a>
                )}
                {check.requiresQualification && (
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <p className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-0.5">
                      Required Qualification
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      {check.requiresQualification}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Completion form */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Form header — always visible */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Check className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            {formExpanded ? "Record completion" : "Record new completion"}
          </h2>
          <button
            onClick={() => setFormExpanded((v) => !v)}
            className="text-sm font-medium text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
          >
            {formExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" /> Collapse
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Expand
              </>
            )}
          </button>
        </div>

        {formExpanded && (
          <div className="p-5 space-y-5">
            {/* Status selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Completion status
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(
                  [
                    {
                      value: "completed",
                      label: "Fully Completed",
                      icon: <Check className="w-4 h-4" />,
                      color: "green",
                    },
                    {
                      value: "awaiting_documentation",
                      label: "Awaiting Docs",
                      icon: <Clock className="w-4 h-4" />,
                      color: "amber",
                    },
                    {
                      value: "pending_contractor",
                      label: "Pending Contractor",
                      icon: <Building className="w-4 h-4" />,
                      color: "blue",
                    },
                    {
                      value: "incomplete",
                      label: "Incomplete",
                      icon: <AlertTriangle className="w-4 h-4" />,
                      color: "red",
                    },
                  ] as const
                ).map((opt) => {
                  const selected = completionStatus === opt.value;
                  const colorMap = {
                    green: selected
                      ? "bg-green-600 text-white border-green-600"
                      : "border-gray-200 text-gray-700 hover:border-green-400 dark:border-gray-700 dark:text-gray-300",
                    amber: selected
                      ? "bg-amber-500 text-white border-amber-500"
                      : "border-gray-200 text-gray-700 hover:border-amber-400 dark:border-gray-700 dark:text-gray-300",
                    blue: selected
                      ? "bg-blue-600 text-white border-blue-600"
                      : "border-gray-200 text-gray-700 hover:border-blue-400 dark:border-gray-700 dark:text-gray-300",
                    red: selected
                      ? "bg-red-600 text-white border-red-600"
                      : "border-gray-200 text-gray-700 hover:border-red-400 dark:border-gray-700 dark:text-gray-300",
                  };

                  return (
                    <button
                      key={opt.value}
                      onClick={() => setCompletionStatus(opt.value)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 text-xs font-semibold text-center transition-all ${colorMap[opt.color]}`}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Completion notes{" "}
                <span className="text-red-500 font-normal">(required)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Describe what was done, any observations, or issues found..."
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Evidence upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Evidence files{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-5 text-center cursor-pointer hover:border-teal-400 dark:hover:border-teal-500 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const files = e.dataTransfer.files;
                  if (files) {
                    const newFiles: EvidenceFile[] = Array.from(files).map(
                      (file) => ({
                        id: Math.random().toString(36).substr(2, 9),
                        file,
                        preview: URL.createObjectURL(file),
                        category: "document",
                      }),
                    );
                    setEvidenceFiles((prev) => [...prev, ...newFiles]);
                  }
                }}
              >
                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Drag & drop files or{" "}
                  <span className="text-teal-600 dark:text-teal-400">
                    browse
                  </span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Certificates, reports, photos, documents
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />

              {/* File previews */}
              {evidenceFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {evidenceFiles.map((ef) => (
                    <div
                      key={ef.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                    >
                      <FileText className="w-5 h-5 text-gray-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {ef.file.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {(ef.file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <select
                        value={ef.category}
                        onChange={(e) =>
                          updateFileCategory(
                            ef.id,
                            e.target.value as EvidenceFile["category"],
                          )
                        }
                        className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none"
                      >
                        <option value="document">Document</option>
                        <option value="certificate">Certificate</option>
                        <option value="report">Report</option>
                        <option value="photo">Photo</option>
                      </select>
                      <button
                        onClick={() => removeFile(ef.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Next due date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Next due date
              </label>
              <input
                type="date"
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Auto-calculated from frequency ({check.frequency}) — adjust if
                needed
              </p>
            </div>

            {/* Error */}
            {submitError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                {submitError}
              </div>
            )}

            {/* Submit */}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleSubmit}
                disabled={submitting || !notes.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Save &amp; Complete
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setFormExpanded(false);
                  setSubmitError(null);
                }}
                className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Completion history */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <History className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            Completion history
          </h2>
          <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
            {completions.length} record{completions.length !== 1 ? "s" : ""}
          </span>
        </div>

        {completions.length === 0 ? (
          <div className="py-12 text-center">
            <Clock className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              No completions recorded yet
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Use the form above to record the first completion
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {completions.map((record, idx) => (
              <div key={record.id} className="p-5">
                {/* Record header */}
                <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${statusBadgeClasses(record.status)}`}
                    >
                      {record.status === "completed" && (
                        <Check className="w-3 h-3" />
                      )}
                      {(record.status === "awaiting_documentation" ||
                        record.status === "in_progress") && (
                        <Clock className="w-3 h-3" />
                      )}
                      {(record.status === "overdue" ||
                        record.status === "incomplete") && (
                        <AlertTriangle className="w-3 h-3" />
                      )}
                      {statusLabel(record.status)}
                    </span>
                    {idx === 0 && (
                      <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
                        Most recent
                      </span>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Next due
                    </p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {formatDate(record.next_due)}
                    </p>
                  </div>
                </div>

                {/* Meta */}
                <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDateTime(record.completed_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    By{" "}
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {record.completed_by || "Unknown"}
                    </span>
                  </span>
                </div>

                {/* Notes */}
                {record.completion_notes && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                    {record.completion_notes}
                  </p>
                )}

                {/* Evidence files */}
                {record.evidence && record.evidence.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                      Evidence ({record.evidence.length})
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {record.evidence.map((ev) => (
                        <a
                          key={ev.id}
                          href={ev.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-teal-400 dark:hover:border-teal-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group"
                        >
                          <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate group-hover:text-teal-700 dark:group-hover:text-teal-400">
                              {ev.title}
                            </p>
                            <p className="text-xs text-gray-400">
                              {ev.uploadedBy}
                              {ev.fileSize ? ` · ${ev.fileSize}` : ""}
                            </p>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-teal-500 shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
