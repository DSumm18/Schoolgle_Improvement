"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, notFound } from "next/navigation";
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
  ExternalLink,
  History,
  Building,
  ChevronDown,
  ChevronUp,
  MapPin,
  Package,
} from "lucide-react";
import {
  DOMAIN_METADATA,
  getChecksForDomain,
  type ComplianceDomain,
  type StatutoryCheck,
} from "@/lib/estates-compliance/statutory-checks";
import {
  calculateComplianceBriefing,
  type BriefingTask,
} from "@/lib/estates-compliance/compliance-briefing";
import { ComplianceCheckBriefing } from "@/components/estates-compliance/ComplianceCheckBriefing";
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

type CompletionApiRecord = CompletionRecord & {
  check_id?: string;
  next_due_date?: string;
  next_due?: string;
};

interface EvidenceApiItem {
  id?: string;
  evidence_type?: EvidenceItem["type"];
  title?: string;
  file_name?: string;
  file_url?: string;
  url?: string;
  uploaded_at?: string;
  created_at?: string;
  uploaded_by?: string;
  file_size?: number;
}

interface LinkedAsset {
  id: string;
  asset_type: string;
  name: string;
  code?: string | null;
  building?: string | null;
  floor?: string | null;
  room?: string | null;
  status?: string | null;
  condition_grade?: string | null;
  last_inspection_date?: string | null;
  next_inspection_due?: string | null;
  linked_compliance_checks?: string[] | null;
  specifications?: {
    linked_compliance_checks?: string[];
    [key: string]: unknown;
  } | null;
  qr_code?: string | null;
}

interface RelatedTicket {
  id: string;
  ticket_number?: string | null;
  title: string;
  description?: string | null;
  priority?: string | null;
  status?: string | null;
  asset_id?: string | null;
  assigned_contractor_name?: string | null;
  created_at?: string | null;
  resolved_at?: string | null;
}

// --- Helpers ---

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  // Parse date parts directly to avoid any timezone issues
  const parts = dateStr.split("T")[0].split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatDateTime(dateStr?: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year}, ${hours}:${mins}`;
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

function assetLocation(asset: LinkedAsset) {
  return [asset.building, asset.floor, asset.room].filter(Boolean).join(" / ");
}

function isAssetOverdue(asset: LinkedAsset) {
  return Boolean(
    asset.next_inspection_due &&
      new Date(asset.next_inspection_due) < new Date(),
  );
}

function assetStatusLabel(asset: LinkedAsset) {
  if (isAssetOverdue(asset)) return "Check overdue";
  if (asset.status && asset.status !== "active") {
    return asset.status.replace(/_/g, " ");
  }
  if (asset.condition_grade) return `Grade ${asset.condition_grade}`;
  return "Active";
}

/**
 * Calculate the next due date based on the INSPECTION date (not today).
 * Compliance period runs from the date of inspection, not receipt of docs.
 */
function calculateNextDueDate(
  frequency: string,
  fromDate?: string,
): string {
  // Parse as local date parts to avoid timezone shifts
  const parts = fromDate
    ? fromDate.split("-").map(Number)
    : [
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        new Date().getDate(),
      ];
  let [year, month, day] = parts;

  switch (frequency) {
    case "daily":
      day += 1;
      break;
    case "weekly":
      day += 7;
      break;
    case "monthly":
      month += 1;
      break;
    case "quarterly":
      month += 3;
      break;
    case "annually":
      year += 1;
      break;
    case "termly":
      month += 4;
      break;
    default:
      month += 1;
  }

  // Let Date normalise overflow (e.g. month 13 → next year)
  const result = new Date(year, month - 1, day);
  const y = result.getFullYear();
  const m = String(result.getMonth() + 1).padStart(2, "0");
  const d = String(result.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
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

async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = 15000,
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: init.signal || controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function getAccessToken(contextToken?: string | null) {
  if (contextToken) return contextToken;

  return Promise.race([
    supabase.auth
      .getSession()
      .then(({ data }) => data.session?.access_token || null)
      .catch(() => null),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
  ]);
}

// --- Main Page ---

export default function CheckDetailPage() {
  const { user, organizationId, session, loading: authLoading } = useAuth();
  const params = useParams();

  // Resolve a user ID to a display name
  function resolveUserName(uid?: string): string {
    if (!uid) return "Unknown";
    // Current user — show their name
    if (user && uid === user.id) {
      return user.user_metadata?.full_name || user.email || uid;
    }
    // For other users, show email-style format from UID if we can't resolve
    // TODO: add user lookup API for full names
    return uid.length > 20 ? `User ${uid.substring(0, 8)}...` : uid;
  }
  const domainSlug = params.domain as ComplianceDomain;
  const checkId = params.checkId as string;

  const [check, setCheck] = useState<StatutoryCheck | null>(null);
  const [completions, setCompletions] = useState<CompletionRecord[]>([]);
  const [relatedTasks, setRelatedTasks] = useState<BriefingTask[]>([]);
  const [relatedTickets, setRelatedTickets] = useState<RelatedTicket[]>([]);
  const [linkedAssets, setLinkedAssets] = useState<LinkedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [descExpanded, setDescExpanded] = useState(false);
  const [formExpanded, setFormExpanded] = useState(false);

  // Form state
  const [completionStatus, setCompletionStatus] =
    useState<CompletionStatus>("completed");
  const [notes, setNotes] = useState("");
  const todayStr = new Date().toISOString().split("T")[0];
  const [inspectionDate, setInspectionDate] = useState(todayStr);
  const [docsReceivedDate, setDocsReceivedDate] = useState(todayStr);
  const [nextDueDate, setNextDueDate] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isNotApplicable, setIsNotApplicable] = useState(false);
  const [markingNA, setMarkingNA] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reusable function to fetch completions — called on mount and after save
  async function fetchCompletions() {
    if (!organizationId || !domainSlug) return;

    try {
      const token = await getAccessToken(session?.access_token);
      if (!token) {
        console.warn("[CHECK DETAIL] No active auth token available yet");
        return;
      }

      const headers: Record<string, string> = {};
      headers["Authorization"] = `Bearer ${token}`;

      const res = await fetchWithTimeout(
        `/api/estates/statutory-completions?organizationId=${organizationId}&domain=${domainSlug}`,
        { headers },
      );

      if (res.ok) {
        const result = await res.json();
        const all = (result.completions || []) as CompletionApiRecord[];
        const mine = all.filter((record) => record.check_id === checkId);

        mine.sort(
          (a, b) =>
            new Date(b.completed_at).getTime() -
            new Date(a.completed_at).getTime(),
        );

        const withEvidence: CompletionRecord[] = await Promise.all(
          mine.map(async (record) => {
            const evidenceIds: string[] = record.evidence_ids || [];
            let evidence: EvidenceItem[] = [];

            if (evidenceIds.length > 0) {
              try {
                const evRes = await fetchWithTimeout(
                  `/api/estates/evidence?organizationId=${organizationId}&ids=${evidenceIds.join(",")}`,
                  { headers },
                  10000,
                );
                if (evRes.ok) {
                  const evData = await evRes.json();
                  const items = evData?.data || evData || [];
                  const evidenceItems = (Array.isArray(items)
                    ? items
                    : [items]) as EvidenceApiItem[];
                  evidence = evidenceItems.map((ev) => ({
                      id: ev.id || "",
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
              } catch {
                // silent fail
              }
            }

            return {
              ...record,
              next_due: record.next_due_date || record.next_due || "",
              evidence,
            };
          }),
        );

        setCompletions(withEvidence);
        const naRecord = withEvidence.find(
          (r) => r.status === "not_applicable",
        );
        if (naRecord) {
          setIsNotApplicable(true);
          setFormExpanded(false);
        } else {
          setFormExpanded(isCheckDue(withEvidence));
        }
      }
    } catch (err) {
      console.error("[CHECK DETAIL] fetch error", err);
    }
  }

  async function fetchRelatedTasks(foundCheck: StatutoryCheck) {
    if (!organizationId || !domainSlug) return;

    try {
      const token = await getAccessToken(session?.access_token);
      if (!token) {
        console.warn("[CHECK DETAIL] No active auth token available yet");
        return;
      }

      const headers: Record<string, string> = {};
      headers["Authorization"] = `Bearer ${token}`;

      const res = await fetchWithTimeout(
        `/api/estates/tasks?organizationId=${organizationId}&domain=${domainSlug}&pageSize=50`,
        { headers },
      );

      if (!res.ok) return;

      const result = await res.json();
      const tasks = (result.tasks || []) as Array<BriefingTask & Record<string, unknown>>;
      const checkName = foundCheck.name.toLowerCase();
      const exactMatches = tasks.filter((task) => {
        const haystack = [
          task.id,
          task.title,
          task.task_name,
          task.description,
          task["check_id"],
          task["statutory_check_id"],
          task["metadata"],
          task["ai_insights"],
        ]
          .filter(Boolean)
          .map((value) =>
            typeof value === "string" ? value : JSON.stringify(value),
          )
          .join(" ")
          .toLowerCase();

        return haystack.includes(checkId.toLowerCase()) || haystack.includes(checkName);
      });

      setRelatedTasks(exactMatches);
    } catch (err) {
      console.error("[CHECK DETAIL] related tasks fetch error", err);
    }
  }

  async function fetchRelatedTickets() {
    if (!organizationId || !domainSlug || !checkId) return;

    try {
      const token = await getAccessToken(session?.access_token);
      if (!token) {
        console.warn("[CHECK DETAIL] No active auth token available yet");
        return;
      }

      const params = new URLSearchParams({
        organizationId,
        domain: domainSlug,
        checkId,
        pageSize: "20",
      });

      const res = await fetchWithTimeout(
        `/api/estates/helpdesk?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } },
        10000,
      );

      if (!res.ok) return;

      const result = await res.json();
      setRelatedTickets((result.tickets || []) as RelatedTicket[]);
    } catch (err) {
      console.error("[CHECK DETAIL] related tickets fetch error", err);
    }
  }

  async function fetchLinkedAssets() {
    if (!organizationId || !domainSlug || !checkId) return;

    try {
      const token = await getAccessToken(session?.access_token);
      if (!token) {
        console.warn("[CHECK DETAIL] No active auth token available yet");
        return;
      }

      const params = new URLSearchParams({
        organizationId,
        compliance_domain: domainSlug,
        status: "active",
        page_size: "100",
      });

      const res = await fetchWithTimeout(
        `/api/estates/assets?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } },
        10000,
      );

      if (!res.ok) return;

      const result = await res.json();
      const assets = (result.assets || result.data || []) as LinkedAsset[];
      const exactMatches = assets.filter((asset) =>
        asset.linked_compliance_checks?.includes(checkId) ||
        asset.specifications?.linked_compliance_checks?.includes(checkId),
      );
      setLinkedAssets(exactMatches);
    } catch (err) {
      console.error("[CHECK DETAIL] linked assets fetch error", err);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!domainSlug || !DOMAIN_METADATA[domainSlug]) {
        notFound();
        return;
      }

      if (authLoading) {
        return;
      }

      const domainChecks = getChecksForDomain(domainSlug);
      let foundCheck = domainChecks.find((c) => c.id === checkId) || null;

      if (!foundCheck && checkId.startsWith("custom_") && organizationId) {
        const token = await getAccessToken(session?.access_token);
        const customId = checkId.replace(/^custom_/, "");
        if (token && customId) {
          const res = await fetchWithTimeout(
            `/api/estates/checks/custom?domain=${domainSlug}&pageSize=100`,
            { headers: { Authorization: `Bearer ${token}` } },
            10000,
          );
          if (res.ok) {
            const result = await res.json();
            const custom = (result.checks || []).find(
              (item: any) => item.id === customId,
            );
            if (custom) {
              foundCheck = {
                id: checkId,
                domain: custom.compliance_domain,
                name: custom.name,
                description: custom.description,
                category:
                  custom.classification === "statutory"
                    ? "statutory"
                    : "custom",
                frequency: custom.frequency,
                reference: custom.statutory_reference,
                estimatedDuration: custom.estimated_duration,
                requiresQualification: custom.requires_qualification,
                evidenceRequired: custom.evidence_required || [],
                notes: custom.notes,
              };
            }
          }
        }
      }

      if (!foundCheck) {
        notFound();
        return;
      }

      if (!cancelled) {
        setCheck(foundCheck);
        const today = new Date().toISOString().split("T")[0];
        setInspectionDate(today);
        setNextDueDate(calculateNextDueDate(foundCheck.frequency, today));
      }

      if (organizationId) {
        await Promise.all([
          fetchCompletions(),
          fetchRelatedTasks(foundCheck),
          fetchRelatedTickets(),
          fetchLinkedAssets(),
        ]);
      } else {
        if (!cancelled) setFormExpanded(true);
      }

      if (!cancelled) setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [authLoading, domainSlug, checkId, organizationId, session?.access_token]);

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
      const token = await getAccessToken(session?.access_token);
      if (!token) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const authHeader: Record<string, string> = {};
      authHeader["Authorization"] = `Bearer ${token}`;

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

        const uploadRes = await fetchWithTimeout(
          `/api/estates/evidence?organizationId=${organizationId}`,
          {
          method: "POST",
          headers: authHeader,
          body: formData,
          },
          30000,
        );

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
      const response = await fetchWithTimeout("/api/estates/statutory-completions", {
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
            completion_notes:
              docsReceivedDate !== inspectionDate
                ? `${notes}\n\n[Docs received: ${docsReceivedDate}]`
                : notes,
            completed_at: new Date().toISOString(),
            inspection_date: inspectionDate,
            next_due_date: nextDueDate,
            evidence_ids: uploadedIds,
            documents_received:
              uploadedIds.length > 0 || completionStatus === "completed",
          },
        }),
      }, 15000);

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to save completion");
      }

      // Reset form and refresh data without full page reload
      setNotes("");
      setEvidenceFiles([]);
      setCompletionStatus("completed");
      setFormExpanded(false);
      setSubmitError(null);

      // Re-fetch completions to update the history timeline
      await fetchCompletions();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to save completion",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleNA = async () => {
    if (!organizationId) return;
    setMarkingNA(true);
    try {
      const token = await getAccessToken(session?.access_token);
      if (!token) return;

      const authHeader: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const newStatus = isNotApplicable ? "pending" : "not_applicable";

      await fetchWithTimeout("/api/estates/statutory-completions", {
        method: "POST",
        headers: authHeader,
        body: JSON.stringify({
          organizationId,
          action: "complete",
          check_id: checkId,
          check_data: {
            compliance_domain: domainSlug,
            status: newStatus,
            completion_notes: isNotApplicable
              ? "Re-enabled — check now applies to this school"
              : "Marked as not applicable to this school",
            next_due_date: isNotApplicable
              ? calculateNextDueDate(
                  check?.frequency || "annually",
                  new Date().toISOString().split("T")[0],
                )
              : "2099-12-31",
            evidence_ids: [],
            documents_received: false,
          },
        }),
      }, 15000);

      setIsNotApplicable(!isNotApplicable);
      await fetchCompletions();
    } catch (err) {
      console.error("[TOGGLE NA]", err);
    } finally {
      setMarkingNA(false);
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
  const briefing = calculateComplianceBriefing({
    check,
    completions,
    relatedTasks,
  });
  const linkedAssetCount = linkedAssets.length;
  const overdueAssetCount = linkedAssets.filter(isAssetOverdue).length;
  const issueParamsFor = (asset?: LinkedAsset) =>
    new URLSearchParams({
      title: asset ? `${asset.name} issue` : `${check.name} issue`,
      description: asset
        ? `Issue raised from ${metadata.name} / ${check.name} (${checkId}) for asset ${asset.code ? `${asset.code} - ` : ""}${asset.name}. Describe what was found, what is not compliant, and any make-safe action already taken.`
        : `Issue raised from ${metadata.name} / ${check.name} (${checkId}). Describe what was found, what is not compliant, and any make-safe action already taken.`,
      priority: "high",
      category: domainSlug === "legionella" ? "plumbing" : "general",
      domain: domainSlug,
      checkId,
      ...(asset?.id ? { assetId: asset.id } : {}),
    });
  const taskParamsFor = (asset?: LinkedAsset) =>
    new URLSearchParams({
      domain: domainSlug,
      checkId,
      title: asset ? `${asset.name} follow-up` : `${check.name} follow-up`,
      description: asset
        ? `Follow-up from ${metadata.name} / ${check.name} (${checkId}) for asset ${asset.code ? `${asset.code} - ` : ""}${asset.name}.`
        : `Follow-up from ${metadata.name} / ${check.name} (${checkId}).`,
      ...(asset?.id ? { assetId: asset.id } : {}),
    });

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-5 space-y-3 sm:space-y-4">
      {/* 1. Back link */}
      <div>
        <Link
          href={`/estates-compliance/${domainSlug}`}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {metadata.name}
        </Link>
      </div>

      {/* 2. Check header */}
      <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
          <div className="flex items-start gap-2.5 min-w-0">
            <span className="text-2xl sm:text-3xl leading-none">{metadata.icon}</span>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white leading-tight">
                {check.name}
              </h1>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span className="px-2 py-0.5 text-[11px] sm:text-xs font-semibold rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300">
                  {metadata.name}
                </span>
                <span className="px-2 py-0.5 text-[11px] sm:text-xs font-semibold rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 capitalize">
                  {check.frequency.replace("_", " ")}
                </span>
                <span className="px-2 py-0.5 text-[11px] sm:text-xs font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 capitalize">
                  {check.category === "statutory" ? "Statutory" : "Advisory"}
                </span>
                {latestCompletion && (
                  <span
                    className={`px-2 py-0.5 text-[11px] sm:text-xs font-semibold rounded-full ${statusBadgeClasses(latestCompletion.status)}`}
                  >
                    {statusLabel(latestCompletion.status)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Due date chip + N/A toggle */}
          <div className="flex items-stretch gap-2 sm:justify-end">
            <button
              onClick={handleToggleNA}
              disabled={markingNA}
              className={`px-2.5 sm:px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                isNotApplicable
                  ? "bg-slate-200 text-slate-700 border-slate-300 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600"
                  : "bg-white text-gray-500 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
              }`}
              title={
                isNotApplicable
                  ? "Click to re-enable this check"
                  : "Mark as not applicable (e.g. no lift on site)"
              }
            >
              {markingNA
                ? "..."
                : isNotApplicable
                  ? "Re-enable"
                  : "N/A"}
            </button>
            {isNotApplicable ? (
              <div className="text-right px-3 py-2 rounded-lg border bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                <p className="text-xs font-semibold text-slate-500">Status</p>
                <p className="text-sm font-bold text-slate-500">
                  Not Applicable
                </p>
                <p className="text-xs text-slate-400">
                  Does not affect compliance
                </p>
              </div>
            ) : (
              <div
                className={`flex-1 sm:flex-none text-left sm:text-right px-3 py-2 rounded-lg border ${isOverdue ? "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800" : "bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700"}`}
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
            )}
          </div>
        </div>

        {/* Collapsible description */}
        {check.description && (
          <div className="mt-3 border-t border-gray-100 dark:border-gray-800 pt-3">
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

      {/* 3. Follow-up actions */}
      <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg sm:rounded-xl border border-blue-200 dark:border-blue-800 p-3 sm:p-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-blue-950 dark:text-blue-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
              Need follow-up?
            </h2>
            <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 mt-1 max-w-2xl">
              Log a fault, missing evidence, hazard, or non-compliance from
              this check.
            </p>
          </div>
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
            <Link
              href={`/estates-compliance/helpdesk/new?${issueParamsFor().toString()}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800"
            >
              <AlertTriangle className="w-4 h-4" />
              Raise ticket
            </Link>
            <Link
              href={`/estates-compliance/tasks/new?${taskParamsFor().toString()}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-100 dark:hover:bg-blue-900/60"
            >
              <Plus className="w-4 h-4" />
              Add task
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Linked assets */}
      <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
              Assets covered
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Link each check to the actual outlets, extinguishers, lights, or equipment on site.
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-black text-gray-900 dark:text-white leading-none">
              {linkedAssetCount}
            </p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {overdueAssetCount > 0 ? `${overdueAssetCount} overdue` : "linked"}
            </p>
          </div>
        </div>

        {linkedAssets.length === 0 ? (
          <div className="p-4 sm:p-5">
            <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                No assets linked to this check yet.
              </p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                Add outlets, extinguishers, emergency lights, or other items in the asset register and include this check in their linked compliance checks. Then tickets and tasks can be raised against the exact asset.
              </p>
              <Link
                href={`/estates-compliance/assets?compliance_domain=${domainSlug}`}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800 mt-3"
              >
                <Building className="w-4 h-4" />
                Open asset register
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {linkedAssets.slice(0, 8).map((asset) => {
              const overdue = isAssetOverdue(asset);
              const location = assetLocation(asset);
              return (
                <div key={asset.id} className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <Link
                      href={`/estates-compliance/assets/${asset.id}`}
                      className="min-w-0 flex-1"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        {asset.code && (
                          <span className="rounded bg-blue-100 px-2 py-0.5 text-[11px] font-mono font-semibold text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                            {asset.code}
                          </span>
                        )}
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {asset.name}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${
                            overdue
                              ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                              : "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                          }`}
                        >
                          {assetStatusLabel(asset)}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span className="capitalize">{asset.asset_type.replace(/_/g, " ")}</span>
                        {location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {location}
                          </span>
                        )}
                        {asset.next_inspection_due && (
                          <span>Next asset check {formatDate(asset.next_inspection_due)}</span>
                        )}
                      </div>
                    </Link>
                    <div className="grid grid-cols-3 gap-2 sm:flex sm:w-auto">
                      <Link
                        href={`/estates-compliance/assets/${asset.id}`}
                        className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
                      >
                        View
                      </Link>
                      <Link
                        href={`/estates-compliance/helpdesk/new?${issueParamsFor(asset).toString()}`}
                        className="inline-flex items-center justify-center rounded-lg bg-blue-700 px-2.5 py-2 text-xs font-semibold text-white hover:bg-blue-800"
                      >
                        Ticket
                      </Link>
                      <Link
                        href={`/estates-compliance/tasks/new?${taskParamsFor(asset).toString()}`}
                        className="inline-flex items-center justify-center rounded-lg border border-blue-300 bg-blue-50 px-2.5 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-100"
                      >
                        Task
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
            {linkedAssets.length > 8 && (
              <Link
                href={`/estates-compliance/assets?compliance_domain=${domainSlug}&check_id=${checkId}`}
                className="flex items-center justify-center gap-2 p-3 text-sm font-semibold text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950/20"
              >
                View all {linkedAssets.length} linked assets
                <ExternalLink className="w-4 h-4" />
              </Link>
            )}
          </div>
        )}
      </div>

      {/* 5. Quick briefing */}
      <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400" />
              Linked tickets and issues
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Tickets raised from this check become part of the compliance evidence trail.
            </p>
          </div>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {relatedTickets.length}
          </span>
        </div>

        {relatedTickets.length === 0 ? (
          <div className="p-4 sm:p-5">
            <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                No tickets linked to this check yet.
              </p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                If a check fails or needs follow-up, use “Raise ticket” above. The ticket will stay linked here for audit and handover.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {relatedTickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/estates-compliance/helpdesk/${ticket.id}`}
                className="block p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800/60"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {ticket.ticket_number && (
                        <span className="rounded bg-blue-100 px-2 py-0.5 text-[11px] font-mono font-semibold text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                          {ticket.ticket_number}
                        </span>
                      )}
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {ticket.title}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      {ticket.created_at && <span>Raised {formatDate(ticket.created_at)}</span>}
                      {ticket.assigned_contractor_name && (
                        <span>Contractor: {ticket.assigned_contractor_name}</span>
                      )}
                      {ticket.resolved_at && <span>Resolved {formatDate(ticket.resolved_at)}</span>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ticket.priority && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                        {ticket.priority}
                      </span>
                    )}
                    {ticket.status && (
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${statusBadgeClasses(ticket.status)}`}>
                        {ticket.status.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 6. Quick briefing */}
      <ComplianceCheckBriefing briefing={briefing} />

      {/* 7. Completion form (hidden when N/A) */}
      {isNotApplicable ? (
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            This check is marked as <strong>not applicable</strong> to your
            school. It does not affect your compliance rating.
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Click &quot;Re-enable&quot; above if this check becomes relevant.
          </p>
        </div>
      ) : (
      <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Form header — always visible */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
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
          <div className="p-4 sm:p-5 space-y-4">
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

            {/* Dates: inspection, docs received, next due (auto) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Date of inspection
                </label>
                <input
                  type="date"
                  value={inspectionDate}
                  onChange={(e) => {
                    setInspectionDate(e.target.value);
                    setNextDueDate(
                      calculateNextDueDate(check.frequency, e.target.value),
                    );
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  When the check was carried out
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Docs received
                </label>
                <input
                  type="date"
                  value={docsReceivedDate}
                  onChange={(e) => setDocsReceivedDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  When certificate/report arrived
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Next due
                </label>
                <div className="px-3 py-2 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800 text-sm font-bold text-green-800 dark:text-green-300">
                  {nextDueDate ? formatDate(nextDueDate) : "—"}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Auto-calculated ({check.frequency})
                </p>
              </div>
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
      )}

      {/* 6. Completion history */}
      <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center gap-2 px-4 sm:px-5 py-3 border-b border-gray-100 dark:border-gray-800">
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
              <div key={record.id} className="p-4 sm:p-5">
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
                      {resolveUserName(record.completed_by)}
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
