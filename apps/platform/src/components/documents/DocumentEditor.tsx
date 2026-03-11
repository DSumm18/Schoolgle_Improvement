"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Send,
  Check,
  AlertCircle,
  Eye,
  Edit3,
  Loader2,
  Wand2,
  Users,
  User,
  Crown,
  Building2,
  Mail,
  ChevronDown,
} from "lucide-react";
import { PlaceholderInput } from "./PlaceholderInput";
import type {
  DocumentTemplate,
  GeneratedDocument,
  RecipientType,
} from "@/lib/document-engine/types";
import { MODULE_CONFIG } from "@/lib/document-engine/types";

interface DocumentEditorProps {
  template: DocumentTemplate;
  organizationId: string;
  userId: string;
  context?: { type: string; id: string };
  staffId?: string;
  meetingId?: string;
  onGenerated?: (doc: GeneratedDocument) => void;
}

const RECIPIENT_TYPE_OPTIONS: Array<{
  value: RecipientType;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}> = [
  { value: "staff", label: "Staff Member", icon: Users },
  { value: "parent", label: "Parent/Carer", icon: User },
  { value: "governor", label: "Governor", icon: Crown },
  { value: "contractor", label: "Contractor", icon: Building2 },
  { value: "external", label: "External", icon: Mail },
];

function renderPreview(
  bodyTemplate: string,
  subjectTemplate: string,
  values: Record<string, string>,
): { subject: string; body: string } {
  let subject = subjectTemplate;
  let body = bodyTemplate;

  Object.entries(values).forEach(([key, val]) => {
    const placeholder = `{{${key}}}`;
    const display = val || `[${key}]`;
    subject = subject.replaceAll(placeholder, display);
    body = body.replaceAll(placeholder, display);
  });

  return { subject, body };
}

export function DocumentEditor({
  template,
  organizationId,
  userId,
  context,
  staffId,
  meetingId,
  onGenerated,
}: DocumentEditorProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    template.placeholders.forEach((p) => {
      initial[p.key] = p.default_value || "";
    });
    return initial;
  });
  const [autoFilledKeys, setAutoFilledKeys] = useState<Set<string>>(new Set());
  const [recipientType, setRecipientType] = useState<RecipientType>("staff");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const modConfig = MODULE_CONFIG[template.module];

  const handleValueChange = useCallback((key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setAutoFilledKeys((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const handleAutoResolve = async () => {
    setResolving(true);
    setError(null);
    try {
      const res = await fetch("/api/documents/placeholders/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          templateId: template.id,
          placeholders: template.placeholders.map((p) => p.key),
          context: {
            ...(context || {}),
            staffId,
            meetingId,
          },
        }),
      });

      if (!res.ok) throw new Error("Failed to resolve placeholders");

      const data = await res.json();
      const resolved: Record<string, string> = data.resolved || {};
      const newAutoFilled = new Set<string>();

      setValues((prev) => {
        const next = { ...prev };
        Object.entries(resolved).forEach(([key, val]) => {
          if (val && !prev[key]) {
            next[key] = val;
            newAutoFilled.add(key);
          }
        });
        return next;
      });
      setAutoFilledKeys((prev) => new Set([...prev, ...newAutoFilled]));
    } catch (err) {
      console.error("Auto-resolve failed:", err);
      setError("Could not auto-fill placeholders. Please fill them manually.");
    } finally {
      setResolving(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          templateId: template.id,
          placeholderValues: values,
          recipientType,
          recipientName: recipientName || undefined,
          recipientEmail: recipientEmail || undefined,
          relatedEntityType: context?.type,
          relatedEntityId: context?.id,
          staffId,
          meetingId,
          createdBy: userId,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate document");
      }

      const data = await res.json();
      setSuccess(true);
      onGenerated?.(data.document);
    } catch (err: any) {
      console.error("Generate failed:", err);
      setError(err.message || "Failed to generate document");
    } finally {
      setGenerating(false);
    }
  };

  const preview = useMemo(
    () =>
      renderPreview(template.body_template, template.subject_template, values),
    [template.body_template, template.subject_template, values],
  );

  // Group placeholders by data source
  const groupedPlaceholders = useMemo(() => {
    const groups: Record<string, typeof template.placeholders> = {};
    template.placeholders.forEach((p) => {
      const source = p.data_source || "manual";
      if (!groups[source]) groups[source] = [];
      groups[source].push(p);
    });
    return groups;
  }, [template.placeholders]);

  const missingRequired = template.placeholders
    .filter((p) => p.required && !values[p.key])
    .map((p) => p.label);

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center rounded-2xl border border-green-500/30 bg-green-500/10 p-12"
      >
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
          <Check size={32} className="text-green-400" />
        </div>
        <h3 className="text-lg font-bold text-green-300">Document Generated</h3>
        <p className="mt-2 text-sm text-slate-400">
          Your {template.document_type.replace(/_/g, " ")} has been created
          successfully.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Left Panel: Preview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Eye size={14} className="text-blue-400" />
            Document Preview
          </h3>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              showPreview
                ? "bg-blue-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            {showPreview ? "Live Preview" : "Show Full Preview"}
          </button>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-800/50 overflow-hidden">
          {/* Subject Bar */}
          <div className="border-b border-slate-700 px-5 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Subject
            </p>
            <p className="mt-1 text-sm font-medium text-slate-200">
              {preview.subject || "No subject template"}
            </p>
          </div>

          {/* Body */}
          <div className="p-5">
            {showPreview ? (
              <div
                className="prose prose-sm prose-invert max-w-none text-sm text-slate-300"
                dangerouslySetInnerHTML={{ __html: preview.body }}
              />
            ) : (
              <div className="whitespace-pre-wrap text-sm text-slate-300 leading-relaxed">
                {preview.body}
              </div>
            )}
          </div>

          {/* Branding Footer */}
          <div className="border-t border-slate-700/50 px-5 py-3">
            <p className="text-[10px] text-slate-600">
              Module:{" "}
              <span style={{ color: modConfig.color }}>{modConfig.label}</span>{" "}
              | Type: {template.document_type.replace(/_/g, " ")} | v
              {template.version}
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel: Fields */}
      <div className="space-y-5">
        {/* Auto-resolve button */}
        <button
          onClick={handleAutoResolve}
          disabled={resolving}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-sm font-medium text-blue-400 transition-colors hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {resolving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Wand2 size={14} />
          )}
          {resolving ? "Resolving..." : "Auto-fill known values"}
        </button>

        {/* Placeholder Fields grouped by data source */}
        {Object.entries(groupedPlaceholders).map(([source, placeholders]) => (
          <div key={source} className="space-y-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {source === "manual" ? "Manual Entry" : source.replace(/_/g, " ")}
            </h4>
            <div className="space-y-4 rounded-2xl border border-slate-700 bg-slate-800/50 p-4">
              {placeholders.map((p) => (
                <PlaceholderInput
                  key={p.key}
                  placeholder={p}
                  value={values[p.key] || ""}
                  onChange={(v) => handleValueChange(p.key, v)}
                  autoFilled={autoFilledKeys.has(p.key)}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Recipient Section */}
        <div className="space-y-3">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Recipient
          </h4>
          <div className="space-y-4 rounded-2xl border border-slate-700 bg-slate-800/50 p-4">
            {/* Type Selector */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-200">
                Recipient Type
              </label>
              <div className="relative">
                <select
                  value={recipientType}
                  onChange={(e) =>
                    setRecipientType(e.target.value as RecipientType)
                  }
                  className="w-full appearance-none rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-2.5 text-sm text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {RECIPIENT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                />
              </div>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-200">
                Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Recipient name..."
                className="w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-200">
                Email
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="recipient@example.com"
                className="w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <AlertCircle size={14} className="shrink-0" />
            {error}
          </div>
        )}

        {/* Missing required warning */}
        {missingRequired.length > 0 && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-400">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Missing required fields:</p>
              <p className="mt-1 text-amber-500">
                {missingRequired.join(", ")}
              </p>
            </div>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={generating || !recipientName.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {generating ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              <FileText size={16} />
              Generate Document
            </>
          )}
        </button>
      </div>
    </div>
  );
}
