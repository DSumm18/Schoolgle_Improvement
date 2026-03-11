"use client";

import React from "react";
import { motion } from "framer-motion";
import useSWR from "swr";
import Link from "next/link";
import { useAuth } from "@/context/SupabaseAuthContext";
import { fetcher } from "@/lib/fetchers";
import {
  Target,
  ChevronRight,
  User,
  Wallet,
  CalendarCheck,
  FileText,
  AlertCircle,
  Loader2,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Milestone,
} from "lucide-react";

// Status colors for milestones
const milestoneStatusColors: Record<string, string> = {
  completed:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  in_progress:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  pending: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  delayed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const milestoneStatusIcons: Record<string, React.ElementType> = {
  completed: CheckCircle2,
  in_progress: Clock,
  pending: Clock,
  delayed: AlertTriangle,
};

// Ofsted category label mapping
const categoryLabels: Record<string, string> = {
  "quality-of-education": "Quality of Education",
  "behaviour-attitudes": "Behaviour & Attitudes",
  "personal-development": "Personal Development",
  "leadership-management": "Leadership & Management",
  safeguarding: "Safeguarding",
  inclusion: "Inclusion",
  "curriculum-teaching": "Curriculum & Teaching",
};

function ProgressBar({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  const color =
    clamped >= 75
      ? "bg-green-500"
      : clamped >= 40
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
      <motion.div
        className={`h-2.5 rounded-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </div>
  );
}

function formatCurrency(amount: number): string {
  if (!amount || amount === 0) return "-";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function SDPPage() {
  const { organization } = useAuth();
  const organizationId = organization?.id || "";

  const {
    data: priorities,
    error,
    isLoading,
  } = useSWR(
    organizationId
      ? `/api/sdp/generate?organizationId=${organizationId}`
      : null,
    fetcher,
  );

  // The GET /api/sdp/generate uses protectedRoute which reads org from auth,
  // but we still need to pass it for the fetcher URL pattern
  const { data: sefData, error: sefError } = useSWR(
    organizationId ? `/api/sef/generate` : null,
    fetcher,
  );

  const sdpPriorities: any[] = Array.isArray(priorities) ? priorities : [];
  const sefId = sefData?.sef?.id;

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center text-white">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">
                School Development Plan
              </h1>
              <p className="text-sm text-muted-foreground">
                Strategic priorities generated from the Living SEF
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/sef?tab=sdp"
            className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
          >
            View in Living SEF
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Loading SDP priorities...
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6 text-center"
        >
          <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
          <p className="font-semibold text-destructive">
            Failed to load SDP priorities
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {error.message || "Please try again later."}
          </p>
        </motion.div>
      )}

      {/* Empty State */}
      {!isLoading && !error && sdpPriorities.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-12 text-center"
        >
          <Target className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-lg font-bold mb-2">No SDP Priorities Yet</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            SDP priorities are automatically generated from your Living SEF.
            Generate a SEF first to create your School Development Plan.
          </p>
          <Link
            href="/dashboard/sef"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Go to Living SEF
          </Link>
        </motion.div>
      )}

      {/* Priority Cards */}
      {!isLoading && sdpPriorities.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {sdpPriorities.map((priority: any, index: number) => {
            const milestones = Array.isArray(priority.milestones)
              ? priority.milestones
              : [];
            const successCriteria = Array.isArray(priority.success_criteria)
              ? priority.success_criteria
              : [];
            const eefStrategies = Array.isArray(priority.eef_strategies)
              ? priority.eef_strategies
              : [];
            const crossModuleImpact = Array.isArray(
              priority.cross_module_impact,
            )
              ? priority.cross_module_impact
              : [];
            const progress = priority.progress_percentage || 0;

            return (
              <motion.div
                key={priority.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Card Header */}
                <div className="p-5 border-b border-border">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-600 font-black text-sm shrink-0">
                        {priority.priority_number || index + 1}
                      </div>
                      <h3 className="font-bold text-base leading-tight">
                        {priority.title}
                      </h3>
                    </div>
                    {priority.ofsted_category_id && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-1 rounded-md shrink-0">
                        {categoryLabels[priority.ofsted_category_id] ||
                          priority.ofsted_category_id}
                      </span>
                    )}
                  </div>

                  {priority.rationale && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {priority.rationale}
                    </p>
                  )}

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-muted-foreground">
                        Progress
                      </span>
                      <span className="font-bold">{progress}%</span>
                    </div>
                    <ProgressBar value={progress} />
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-4">
                  {/* Meta Row */}
                  <div className="grid grid-cols-2 gap-3">
                    {priority.lead_person && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{priority.lead_person}</span>
                      </div>
                    )}
                    {priority.budget != null && priority.budget > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <Wallet className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span>{formatCurrency(priority.budget)}</span>
                        {priority.funding_source && (
                          <span className="text-xs text-muted-foreground">
                            ({priority.funding_source})
                          </span>
                        )}
                      </div>
                    )}
                    {priority.review_date && (
                      <div className="flex items-center gap-2 text-sm">
                        <CalendarCheck className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span>Review: {formatDate(priority.review_date)}</span>
                      </div>
                    )}
                    {priority.status && (
                      <div className="flex items-center gap-2 text-sm">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            priority.status === "active"
                              ? "bg-green-500"
                              : priority.status === "completed"
                                ? "bg-blue-500"
                                : "bg-slate-400"
                          }`}
                        />
                        <span className="capitalize">{priority.status}</span>
                      </div>
                    )}
                  </div>

                  {/* Success Criteria */}
                  {successCriteria.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                        Success Criteria
                      </h4>
                      <ul className="space-y-1">
                        {successCriteria
                          .slice(0, 3)
                          .map((c: string, i: number) => (
                            <li
                              key={i}
                              className="text-xs text-muted-foreground flex items-start gap-2"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                              <span>{c}</span>
                            </li>
                          ))}
                        {successCriteria.length > 3 && (
                          <li className="text-xs text-muted-foreground italic">
                            +{successCriteria.length - 3} more
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Milestones */}
                  {milestones.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                        Milestones
                      </h4>
                      <div className="space-y-2">
                        {milestones.map((m: any, i: number) => {
                          const StatusIcon =
                            milestoneStatusIcons[m.status] || Clock;
                          return (
                            <div
                              key={i}
                              className="flex items-center gap-2 text-xs"
                            >
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium ${milestoneStatusColors[m.status] || milestoneStatusColors.pending}`}
                              >
                                <StatusIcon className="w-3 h-3" />
                                {m.status?.replace("_", " ")}
                              </span>
                              <span className="font-medium truncate flex-1">
                                {m.title}
                              </span>
                              {m.targetDate && (
                                <span className="text-muted-foreground shrink-0">
                                  {formatDate(m.targetDate || m.target_date)}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* EEF Strategies */}
                  {eefStrategies.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                        EEF Strategies
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {eefStrategies.map((s: string, i: number) => (
                          <span
                            key={i}
                            className="text-[10px] font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 px-2 py-0.5 rounded-md"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cross-Module Impact */}
                  {crossModuleImpact.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                        Cross-Module Impact
                      </h4>
                      <div className="space-y-1">
                        {crossModuleImpact.map((c: any, i: number) => (
                          <div
                            key={i}
                            className="text-xs flex items-center gap-2"
                          >
                            <span className="font-semibold capitalize text-primary">
                              {c.module}
                            </span>
                            <span className="text-muted-foreground">
                              {c.impact}
                            </span>
                            {c.budgetImplication > 0 && (
                              <span className="text-muted-foreground">
                                ({formatCurrency(c.budgetImplication)})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
