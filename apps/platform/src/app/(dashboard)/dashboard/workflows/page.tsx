"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardCheck, Clock, User, ChevronRight, Inbox } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ModulePageHeader } from "@/components/ui/module-page-header";
import { WorkflowProgress } from "@/components/workflows/WorkflowProgress";
import { useAuth } from "@/context/SupabaseAuthContext";
import { fetcher } from "@/lib/fetchers";

type WorkflowStatus =
  | "all"
  | "active"
  | "completed"
  | "draft"
  | "paused"
  | "cancelled";

const FILTER_TABS: { label: string; value: WorkflowStatus }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
  { label: "Draft", value: "draft" },
];

const STATUS_BADGE: Record<string, string> = {
  active:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
  completed: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  draft: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  paused: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
  cancelled: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
};

interface WorkflowSummary {
  id: string;
  title: string;
  template_name: string;
  status: string;
  progress_pct: number;
  current_phase: string | null;
  owner_name: string | null;
  owner_role: string | null;
  total_steps: number;
  completed_steps: number;
  started_at: string | null;
  target_completion: string | null;
  phases: { title: string; status: string }[];
  current_phase_index: number;
}

function SkeletonCard() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-3 w-32 bg-slate-100 dark:bg-slate-800 rounded" />
          </div>
          <div className="h-5 w-16 bg-slate-100 dark:bg-slate-800 rounded-full" />
        </div>
        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full" />
        <div className="flex justify-between">
          <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800 rounded" />
          <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800 rounded" />
        </div>
      </CardContent>
    </Card>
  );
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "--";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function WorkflowsPage() {
  const [filter, setFilter] = useState<WorkflowStatus>("all");
  const router = useRouter();
  const { organization } = useAuth();
  const organizationId = organization?.id || "";

  const apiUrl = organizationId
    ? filter === "all"
      ? `/api/workflows?organizationId=${organizationId}`
      : `/api/workflows?organizationId=${organizationId}&status=${filter}`
    : null;

  const { data, isLoading } = useSWR(apiUrl, fetcher);

  // Map API response to UI shape
  const rawWorkflows = data?.data?.workflows || data?.workflows || [];
  const workflows: WorkflowSummary[] = rawWorkflows.map((wf: any) => ({
    id: wf.id,
    title: wf.title,
    template_name: wf.template_slug?.replace(/-/g, " ") || "Custom",
    status: wf.status,
    progress_pct: wf.progress || 0,
    current_phase: null, // Will be populated from phase data if available
    owner_name: wf.owner_name,
    owner_role: wf.owner_role,
    total_steps: wf.step_count || 0,
    completed_steps: 0,
    started_at: wf.started_at,
    target_completion: wf.target_completion,
    phases: [],
    current_phase_index: (wf.current_phase || 1) - 1,
  }));

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
      <ModulePageHeader
        moduleId="estates"
        icon={ClipboardCheck}
        label="Workflows"
        title="Workflows"
        description="Ed-orchestrated multi-step processes"
      />

      {/* Filter tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              filter === tab.value
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && workflows.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center mb-4">
            <Inbox className="w-8 h-8 text-teal-500 dark:text-teal-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
            No workflows found
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
            {filter === "all"
              ? "Ed will create workflows automatically when processes are triggered."
              : `No ${filter} workflows right now.`}
          </p>
        </motion.div>
      )}

      {/* Workflow cards */}
      {!isLoading && workflows.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {workflows.map((wf, index) => (
              <motion.div
                key={wf.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                whileHover={{ y: -2 }}
              >
                <Card
                  className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
                  onClick={() => router.push(`/dashboard/workflows/${wf.id}`)}
                >
                  <CardContent className="p-5 space-y-4">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {wf.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          {wf.template_name}
                        </p>
                      </div>
                      <span
                        className={`flex-shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${
                          STATUS_BADGE[wf.status] || STATUS_BADGE.draft
                        }`}
                      >
                        {wf.status}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <WorkflowProgress
                      progress={wf.progress_pct}
                      phases={wf.phases || []}
                      currentPhase={wf.current_phase_index || 0}
                    />

                    {/* Current phase */}
                    {wf.current_phase && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                        <span className="text-xs text-teal-600 dark:text-teal-400 font-medium truncate">
                          {wf.current_phase}
                        </span>
                      </div>
                    )}

                    {/* Steps & owner */}
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>
                        {wf.completed_steps} of {wf.total_steps} steps complete
                      </span>
                      {wf.owner_name && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span className="truncate max-w-[100px]">
                            {wf.owner_name}
                          </span>
                          {wf.owner_role && (
                            <span className="px-1.5 py-0 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-medium capitalize">
                              {wf.owner_role}
                            </span>
                          )}
                        </span>
                      )}
                    </div>

                    {/* Time info */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Started {formatDate(wf.started_at)}
                      </span>
                      {wf.target_completion && (
                        <span>Target: {formatDate(wf.target_completion)}</span>
                      )}
                      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
