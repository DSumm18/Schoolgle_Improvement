"use client";

/**
 * New Helpdesk Ticket
 *
 * Create a new estates helpdesk ticket. Includes an asset picker with
 * live warranty status check — if the selected asset is under warranty,
 * the user is advised to contact the original supplier first instead
 * of booking a different contractor.
 *
 * Also supports attaching photos and documents which are linked to both
 * the ticket AND the asset (via the ticket_id field on estates_evidence).
 */

import { useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Image as ImageIcon,
  Save,
  Send,
  Upload,
  Wrench,
  X,
} from "lucide-react";
import { useAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase";
import { AssetPicker } from "@/components/estates-compliance/AssetPicker";
import { getWarrantyRoutingRecommendation } from "@/lib/estates-compliance/warranty-routing";
import { toast } from "sonner";

type Priority = "low" | "medium" | "high" | "critical";

const CATEGORIES = [
  { value: "mechanical", label: "Mechanical / Heating" },
  { value: "electrical", label: "Electrical" },
  { value: "plumbing", label: "Plumbing / Water" },
  { value: "fire_safety", label: "Fire Safety" },
  { value: "security", label: "Security / CCTV" },
  { value: "it_equipment", label: "IT Equipment" },
  { value: "furniture", label: "Furniture" },
  { value: "grounds", label: "Grounds / Playground" },
  { value: "kitchen", label: "Kitchen" },
  { value: "general", label: "General" },
];

const PRIORITY_OPTIONS: Array<{
  value: Priority;
  label: string;
  description: string;
  color: string;
}> = [
  {
    value: "critical",
    label: "Critical",
    description: "Immediate safety risk or total loss of service",
    color: "border-red-700 bg-red-950/40 text-red-200",
  },
  {
    value: "high",
    label: "High",
    description: "Affecting the school day, needs attention today",
    color: "border-orange-700 bg-orange-950/40 text-orange-200",
  },
  {
    value: "medium",
    label: "Medium",
    description: "Needs resolving this week",
    color: "border-amber-700 bg-amber-950/40 text-amber-200",
  },
  {
    value: "low",
    label: "Low",
    description: "Routine job, no urgency",
    color: "border-blue-700 bg-blue-950/40 text-blue-200",
  },
];

interface SelectedAsset {
  id: string;
  code: string | null;
  name: string;
}

interface WarrantyInfo {
  warranty_status: "active" | "expiring_soon" | "expired" | "none";
  warranty_expiry: string | null;
  warranty_days_remaining: number | null;
  warranty_provider: string | null;
  supplier_contact: {
    contractor_id: string;
    company_name: string;
    contact_name?: string | null;
    email: string | null;
    phone?: string | null;
  } | null;
}

interface AttachedFile {
  id: string;
  file: File;
  preview: string | null; // data URL for images
}

function FilePreviewCard({
  attached,
  onRemove,
}: {
  attached: AttachedFile;
  onRemove: (id: string) => void;
}) {
  const isImage = attached.file.type.startsWith("image/");
  return (
    <div className="relative flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-2 pr-8 text-sm">
      {isImage && attached.preview ? (
        <img
          src={attached.preview}
          alt={attached.file.name}
          className="h-10 w-10 rounded object-cover flex-shrink-0"
        />
      ) : (
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded bg-muted">
          <FileText className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">
          {attached.file.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {(attached.file.size / 1024).toFixed(0)} KB
        </p>
      </div>
      <button
        type="button"
        onClick={() => onRemove(attached.id)}
        className="absolute right-1.5 top-1.5 rounded p-0.5 text-muted-foreground hover:text-foreground"
        aria-label="Remove file"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function NewTicketPage() {
  const { organizationId } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [title, setTitle] = useState(() => searchParams.get("title") || "");
  const [description, setDescription] = useState(
    () => searchParams.get("description") || "",
  );
  const [priority, setPriority] = useState<Priority>(() => {
    const priorityParam = searchParams.get("priority");
    return ["low", "medium", "high", "critical"].includes(priorityParam || "")
      ? (priorityParam as Priority)
      : "medium";
  });
  const [category, setCategory] = useState(
    () => searchParams.get("category") || "general",
  );
  const [location, setLocation] = useState(
    () => searchParams.get("location") || "",
  );
  const initialAssetId =
    searchParams.get("assetId") || searchParams.get("asset_id") || null;
  const initialDomain =
    searchParams.get("domain") ||
    searchParams.get("compliance_domain") ||
    null;
  const initialCheckId =
    searchParams.get("checkId") ||
    searchParams.get("check_id") ||
    searchParams.get("statutory_check_id") ||
    null;
  const [selectedAsset, setSelectedAsset] = useState<SelectedAsset | null>(null);
  const [warranty, setWarranty] = useState<WarrantyInfo | null>(null);
  const [paidRepairOverride, setPaidRepairOverride] = useState(false);
  const [paidRepairOverrideReason, setPaidRepairOverrideReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files);
    const allowed = arr.filter(
      (f) => f.type.startsWith("image/") || f.type === "application/pdf",
    );
    if (allowed.length < arr.length) {
      toast.warning("Some files were skipped — only images and PDFs are accepted.");
    }
    allowed.forEach((file) => {
      const id = `${Date.now()}-${Math.random()}`;
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setAttachedFiles((prev) => [
            ...prev,
            { id, file, preview: e.target?.result as string },
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        setAttachedFiles((prev) => [...prev, { id, file, preview: null }]);
      }
    });
  }, []);

  function removeFile(id: string) {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }

  async function uploadAttachments(
    ticketId: string,
    ticketTitle: string,
    token: string,
  ): Promise<void> {
    for (const attached of attachedFiles) {
      try {
        const fd = new FormData();
        fd.append("source_type", "upload");
        fd.append("file", attached.file);
        fd.append("title", `${ticketTitle} — ${attached.file.name}`);
        fd.append(
          "evidence_type",
          attached.file.type.startsWith("image/") ? "photo" : "report",
        );
        fd.append("ticket_id", ticketId);
        if (selectedAsset?.id) {
          fd.append("asset_id", selectedAsset.id);
        }
        fd.append("tags", "ticket_attachment");

        const res = await fetch(
          `/api/estates/evidence?organizationId=${organizationId}`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: fd,
          },
        );

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.error("Evidence upload failed:", err);
          toast.error(`Failed to upload ${attached.file.name}`);
        }
      } catch (err) {
        console.error("Evidence upload error:", err);
        toast.error(`Error uploading ${attached.file.name}`);
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!organizationId) {
      toast.error("Not signed in");
      return;
    }
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    const warrantyRecommendation = getWarrantyRoutingRecommendation(warranty);
    if (
      warrantyRecommendation?.requiresOverrideForPaidWork &&
      paidRepairOverride &&
      !paidRepairOverrideReason.trim()
    ) {
      toast.error("Please record why warranty routing is being bypassed");
      return;
    }

    setSubmitting(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) throw new Error("No auth token");

      // Step 1: create ticket
      const res = await fetch("/api/estates/helpdesk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          organizationId,
          title: title.trim(),
          description: buildTicketDescription({
            title: title.trim(),
            description: description.trim(),
            warrantyRecommendation,
            paidRepairOverride,
            paidRepairOverrideReason: paidRepairOverrideReason.trim(),
          }),
          priority,
          category,
          location: location.trim() || undefined,
          asset_id: selectedAsset?.id || undefined,
          compliance_domain: initialDomain || undefined,
          statutory_check_id: initialCheckId || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const body = await res.json();
      const ticket = body?.data || body;
      toast.success(`Ticket ${ticket.ticket_number || ""} created`);

      // Step 2: upload attachments (if any)
      if (attachedFiles.length > 0) {
        setUploadingFiles(true);
        try {
          await uploadAttachments(ticket.id, title.trim(), token);
        } finally {
          setUploadingFiles(false);
        }
      }

      router.push(`/estates-compliance/helpdesk/${ticket.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create ticket";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  const isWorking = submitting || uploadingFiles;
  const warrantyRecommendation = getWarrantyRoutingRecommendation(warranty);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      {/* Header */}
      <div>
        <Link
          href="/estates-compliance/helpdesk"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Helpdesk
        </Link>
        <div className="mt-3 flex items-center gap-3">
          <Wrench className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold text-foreground">New Helpdesk Ticket</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Report a maintenance issue, request a repair, or log a new problem.
        </p>
        {(initialDomain || initialCheckId) && (
          <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-100">
            Linked to compliance check
            {initialDomain ? `: ${initialDomain.replace(/_/g, " ")}` : ""}
            {initialCheckId ? ` / ${initialCheckId}` : ""}. The ticket will
            appear on that check's history.
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Asset picker (drives warranty check) */}
        <div className="rounded-lg border border-border bg-card p-5">
          {organizationId && (
            <AssetPicker
              organizationId={organizationId}
              selectedAssetId={initialAssetId}
              onSelect={(asset, warrantyInfo) => {
                if (asset) {
                  setSelectedAsset({ id: asset.id, code: asset.code, name: asset.name });
                } else {
                  setSelectedAsset(null);
                }
                setWarranty(warrantyInfo);
                setPaidRepairOverride(false);
                setPaidRepairOverrideReason("");
              }}
            />
          )}
        </div>

        {/* Title */}
        <div className="rounded-lg border border-border bg-card p-5">
          <label className="block text-sm font-medium text-foreground">
            Title <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              selectedAsset
                ? `e.g. ${selectedAsset.name} not working`
                : "Brief description of the issue"
            }
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            required
          />
        </div>

        {/* Description */}
        <div className="rounded-lg border border-border bg-card p-5">
          <label className="block text-sm font-medium text-foreground">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="What happened? What have you tried? Any error messages? The more detail, the faster it gets fixed."
            className="mt-2 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Photos & Documents */}
        <div className="rounded-lg border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium text-foreground">Photos &amp; Documents</h2>
            <span className="text-xs text-muted-foreground">(optional)</span>
          </div>

          {/* Drag-drop zone */}
          <div
            role="button"
            tabIndex={0}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
            }}
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border bg-muted/20 hover:bg-muted/40"
            }`}
          >
            <Upload className="h-7 w-7 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              Drag photos or PDFs here, or{" "}
              <span className="text-primary underline underline-offset-2">browse</span>
            </p>
            <p className="text-xs text-muted-foreground">Images and PDFs up to 50 MB</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) {
                addFiles(e.target.files);
                // reset so re-selecting same file works
                e.target.value = "";
              }
            }}
          />

          {/* File list */}
          {attachedFiles.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {attachedFiles.map((af) => (
                <FilePreviewCard key={af.id} attached={af} onRemove={removeFile} />
              ))}
            </div>
          )}

          {uploadingFiles && (
            <p className="text-xs text-muted-foreground animate-pulse">
              Uploading attachments...
            </p>
          )}
        </div>

        {/* Priority */}
        <div className="rounded-lg border border-border bg-card p-5">
          <label className="mb-3 block text-sm font-medium text-foreground">Priority</label>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {PRIORITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPriority(opt.value)}
                className={`rounded-lg border p-3 text-left transition ${
                  priority === opt.value
                    ? `${opt.color} ring-2 ring-primary/50 ring-offset-2 ring-offset-background`
                    : "border-border bg-muted text-muted-foreground hover:border-border/80 hover:bg-accent"
                }`}
              >
                <div className="text-sm font-semibold">{opt.label}</div>
                <div className="mt-1 text-xs opacity-80">{opt.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Category + location */}
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">
                Location <span className="text-xs font-normal text-muted-foreground">(optional)</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Plant Room, Year 3 Classroom"
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

        {/* Warranty routing control */}
        {warrantyRecommendation && warrantyRecommendation.requiresOverrideForPaidWork && (
          <div className="rounded-lg border-2 border-green-600 bg-green-50 p-4 text-sm text-green-900 dark:border-green-700 dark:bg-green-950/40 dark:text-green-200">
            <strong>{warrantyRecommendation.title}:</strong>{" "}
            {warrantyRecommendation.guidance}
            <div className="mt-4 rounded-lg border border-green-200 bg-white/70 p-3 dark:border-green-800 dark:bg-green-950/30">
              <label className="flex items-start gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={paidRepairOverride}
                  onChange={(e) => setPaidRepairOverride(e.target.checked)}
                  className="mt-1"
                />
                <span>
                  We still need to use another contractor or treat this as paid
                  work. Record why for the asset and finance audit trail.
                </span>
              </label>
              {paidRepairOverride && (
                <textarea
                  value={paidRepairOverrideReason}
                  onChange={(e) => setPaidRepairOverrideReason(e.target.value)}
                  rows={3}
                  placeholder="Example: emergency make-safe required; warranty provider unavailable; safety risk if delayed."
                  className="mt-3 w-full resize-y rounded-lg border border-green-300 bg-white px-3 py-2 text-sm text-green-950 placeholder:text-green-700/60 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/20 dark:border-green-700 dark:bg-green-950/60 dark:text-green-100"
                />
              )}
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/estates-compliance/helpdesk"
            className="rounded-lg border border-border bg-muted px-4 py-2 text-sm text-foreground hover:bg-accent"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isWorking || !title.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isWorking ? (
              <>
                <Save className="h-4 w-4 animate-pulse" />
                {uploadingFiles ? "Uploading..." : "Creating..."}
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Create Ticket
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function buildTicketDescription({
  title,
  description,
  warrantyRecommendation,
  paidRepairOverride,
  paidRepairOverrideReason,
}: {
  title: string;
  description: string;
  warrantyRecommendation: ReturnType<typeof getWarrantyRoutingRecommendation>;
  paidRepairOverride: boolean;
  paidRepairOverrideReason: string;
}) {
  const body = description || title;
  if (!warrantyRecommendation) return body;

  const warrantyLines = [
    "",
    "---",
    "Warranty routing check",
    `Recommendation: ${warrantyRecommendation.title}`,
    warrantyRecommendation.guidance,
  ];

  if (paidRepairOverride) {
    warrantyLines.push(
      "Warranty route bypassed for paid/non-warranty work.",
      `Reason: ${paidRepairOverrideReason}`,
    );
  }

  return `${body}${warrantyLines.join("\n")}`;
}
