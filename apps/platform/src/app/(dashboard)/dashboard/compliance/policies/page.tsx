"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  FileText,
  Plus,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/SupabaseAuthContext";
import { PolicyList } from "@/components/compliance";
import { PolicyRequirementMatchPanel } from "@/components/compliance";
import { TemplatePickerModal } from "@/components/compliance";
import { PolicyEditor } from "@/components/compliance";
import AppConnectionStatusCard from "@/components/connectors/AppConnectionStatusCard";

export default function PoliciesPage() {
  const { organization } = useAuth();
  const organizationId = organization?.id || "";
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );

  if (selectedPolicyId || selectedTemplateId) {
    return (
      <div className="p-6 md:p-8 min-h-screen max-w-[1600px] mx-auto">
        <PolicyEditor
          organizationId={organizationId}
          itemId={selectedPolicyId || undefined}
          templateId={selectedTemplateId || undefined}
          onClose={() => {
            setSelectedPolicyId(null);
            setSelectedTemplateId(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2rem] border border-purple-100 bg-gradient-to-br from-white via-purple-50/80 to-fuchsia-50 p-6 shadow-sm dark:border-purple-900/40 dark:from-slate-950 dark:via-purple-950/20 dark:to-slate-950"
      >
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-purple-200/40 blur-3xl dark:bg-purple-700/20" />
        <div className="absolute right-24 top-10 h-24 w-24 rounded-full bg-fuchsia-200/40 blur-2xl dark:bg-fuchsia-700/20" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <Link
              href="/dashboard/compliance"
              className="mt-1 rounded-2xl border border-purple-100 bg-white/80 p-2 shadow-sm transition-colors hover:bg-purple-50 dark:border-purple-900/50 dark:bg-slate-900/80 dark:hover:bg-purple-950/30"
              aria-label="Back to Compliance Hub"
            >
              <ArrowLeft className="h-5 w-5 text-purple-600" />
            </Link>
            <div className="rounded-3xl bg-purple-600 p-4 text-white shadow-lg shadow-purple-200/70 dark:shadow-purple-950/40">
              <FileText className="h-7 w-7" />
            </div>
            <div className="max-w-3xl">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-purple-700 ring-1 ring-purple-100 dark:bg-purple-950/40 dark:text-purple-200 dark:ring-purple-900/60">
                <Sparkles size={14} className="animate-pulse" />
                Compliance Hub
              </div>
              <h1 className="text-4xl font-black tracking-tight text-slate-950 dark:text-white md:text-5xl">
                Policy Manager
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Manage statutory policies, source documents, review dates,
                quality checks, Schoolgle templates and the SOPs that turn
                policy into everyday practice.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  "Drive-connected",
                  "Review radar",
                  "Source-backed checks",
                  "SOP ready",
                ].map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 rounded-full border border-purple-100 bg-white/80 px-3 py-1 text-xs font-bold text-slate-700 dark:border-purple-900/50 dark:bg-slate-900/70 dark:text-slate-200"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="relative grid gap-3 sm:grid-cols-2 lg:w-[22rem] lg:grid-cols-1">
            <button
              onClick={() => setShowTemplatePicker(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-purple-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-purple-200/70 transition hover:bg-purple-700 dark:shadow-purple-950/40"
            >
              <Plus className="h-4 w-4" />
              Create policy
            </button>
            <Link
              href="/dashboard/compliance/sops"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-purple-200 bg-white/85 px-5 py-3 text-sm font-black text-purple-700 shadow-sm transition hover:bg-purple-50 dark:border-purple-900/60 dark:bg-slate-900/80 dark:text-purple-200"
            >
              <ClipboardList className="h-4 w-4" />
              Open SOPs
            </Link>
            <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-purple-900/40 dark:bg-slate-900/60">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                    Product model
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    One Compliance app, joined to policies and SOPs
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <AppConnectionStatusCard appKey="policy-manager" />

      <PolicyRequirementMatchPanel organizationId={organizationId} />

      <PolicyList
        organizationId={organizationId}
        onCreatePolicy={() => setShowTemplatePicker(true)}
        onSelectPolicy={(id) => setSelectedPolicyId(id)}
      />

      <TemplatePickerModal
        organizationId={organizationId}
        isOpen={showTemplatePicker}
        onClose={() => setShowTemplatePicker(false)}
        onSelect={(templateId) => {
          setSelectedTemplateId(templateId);
          setShowTemplatePicker(false);
        }}
      />
    </div>
  );
}
