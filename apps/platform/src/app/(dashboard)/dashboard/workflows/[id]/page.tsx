"use client";

import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  User,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WorkflowProgress } from "@/components/workflows/WorkflowProgress";
import {
  WorkflowStepCard,
  type WorkflowStep,
} from "@/components/workflows/WorkflowStepCard";
import { useAuth } from "@/context/SupabaseAuthContext";
import { fetcher } from "@/lib/fetchers";
import { supabase } from "@/lib/supabase";
import { useState, useCallback } from "react";

interface WorkflowPhase {
  id: string;
  phase_number: number;
  title: string;
  status: string;
  steps: WorkflowStep[];
}

interface WorkflowDetail {
  id: string;
  title: string;
  status: string;
  progress_pct: number;
  owner_name: string | null;
  owner_role: string | null;
  current_phase_index: number;
  phases: WorkflowPhase[];
}

const PHASE_STATUS_BADGE: Record<string, string> = {
  completed:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
  active: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  pending: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

const WORKFLOW_STATUS_BADGE: Record<string, string> = {
  active:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
  completed: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  draft: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  paused: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
  cancelled: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
};

function LoadingSkeleton() {
  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1200px] mx-auto animate-pulse">
      <div className="h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
      <div className="space-y-3">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-4 w-48 bg-slate-100 dark:bg-slate-800 rounded" />
      </div>
      <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full" />
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-5 space-y-3">
            <div className="h-5 w-40 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800 rounded" />
            <div className="space-y-2">
              <div className="h-12 w-full bg-slate-50 dark:bg-slate-800/50 rounded-xl" />
              <div className="h-12 w-full bg-slate-50 dark:bg-slate-800/50 rounded-xl" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function WorkflowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { organization } = useAuth();
  const organizationId = organization?.id || "";

  const { data, isLoading, mutate } = useSWR(
    organizationId
      ? `/api/workflows/${id}?organizationId=${organizationId}`
      : null,
    fetcher,
  );

  // Map API response to UI shape
  const rawWorkflow = data?.data?.workflow || data?.workflow;
  const workflow: WorkflowDetail | null = rawWorkflow
    ? {
        id: rawWorkflow.id,
        title: rawWorkflow.title,
        status: rawWorkflow.status,
        progress_pct: rawWorkflow.progress || 0,
        owner_name: rawWorkflow.owner_name,
        owner_role: rawWorkflow.owner_role,
        current_phase_index: (rawWorkflow.current_phase || 1) - 1,
        phases: (rawWorkflow.workflow_phases || []).map((p: any) => ({
          id: p.id,
          phase_number: p.phase_number,
          title: p.title,
          status: p.status,
          steps: (p.workflow_steps || []).map((s: any) => ({
            ...s,
            sort_order: s.step_number ?? s.sort_order ?? 0,
          })) as WorkflowStep[],
        })),
      }
    : null;

  // Track which phases are expanded; active phase is expanded by default
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>(
    {},
  );

  const isPhaseExpanded = useCallback(
    (phase: WorkflowPhase, index: number): boolean => {
      if (expandedPhases[phase.id] !== undefined) {
        return expandedPhases[phase.id];
      }
      // Default: expand active phase
      return (
        phase.status === "active" ||
        index === (workflow?.current_phase_index ?? 0)
      );
    },
    [expandedPhases, workflow?.current_phase_index],
  );

  const togglePhase = (phaseId: string) => {
    setExpandedPhases((prev) => ({
      ...prev,
      [phaseId]: !isPhaseExpanded(
        workflow!.phases.find((p) => p.id === phaseId)!,
        workflow!.phases.findIndex((p) => p.id === phaseId),
      ),
    }));
  };

  const handleStepStatusChange = async (stepId: string, newStatus: string) => {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      await fetch(
        `/api/workflows/${id}/steps/${stepId}?organizationId=${organizationId}`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({ status: newStatus, organizationId }),
        },
      );
      mutate();
    } catch {
      // Silently fail — SWR will re-fetch
    }
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!workflow) {
    return (
      <div className="p-6 md:p-8 min-h-screen max-w-[1200px] mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/workflows")}
          className="mb-6 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Workflows
        </Button>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
            Workflow not found
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            This workflow may have been deleted or you may not have access.
          </p>
        </div>
      </div>
    );
  }

  const totalSteps = workflow.phases.reduce(
    (sum, p) => sum + p.steps.length,
    0,
  );
  const completedSteps = workflow.phases.reduce(
    (sum, p) => sum + p.steps.filter((s) => s.status === "done").length,
    0,
  );

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1200px] mx-auto">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={() => router.push("/dashboard/workflows")}
        className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Workflows
      </Button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {workflow.title}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                  WORKFLOW_STATUS_BADGE[workflow.status] ||
                  WORKFLOW_STATUS_BADGE.draft
                }`}
              >
                {workflow.status}
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {completedSteps} of {totalSteps} steps complete
              </span>
              {workflow.owner_name && (
                <span className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                  <User className="w-3.5 h-3.5" />
                  {workflow.owner_name}
                  {workflow.owner_role && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold capitalize">
                      {workflow.owner_role}
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <WorkflowProgress
          progress={workflow.progress_pct}
          phases={workflow.phases.map((p) => ({
            title: p.title,
            status: p.status,
          }))}
          currentPhase={workflow.current_phase_index}
        />
      </motion.div>

      {/* Phase accordion / timeline */}
      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {workflow.phases.map((phase, phaseIndex) => {
            const expanded = isPhaseExpanded(phase, phaseIndex);
            const phaseCompleted = phase.steps.filter(
              (s) => s.status === "done",
            ).length;

            return (
              <motion.div
                key={phase.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: phaseIndex * 0.08 }}
              >
                <Card
                  className={`overflow-hidden ${
                    phase.status === "active"
                      ? "ring-1 ring-teal-200 dark:ring-teal-800"
                      : ""
                  }`}
                >
                  {/* Phase header */}
                  <button
                    onClick={() => togglePhase(phase.id)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {/* Phase number circle */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          phase.status === "completed"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : phase.status === "active"
                              ? "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400"
                              : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {phase.phase_number}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                          {phase.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {phaseCompleted} of {phase.steps.length} steps
                          complete
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                          PHASE_STATUS_BADGE[phase.status] ||
                          PHASE_STATUS_BADGE.pending
                        }`}
                      >
                        {phase.status}
                      </span>
                      {expanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* Steps list */}
                  <AnimatePresence initial={false}>
                    {expanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                          {phase.steps
                            .sort((a, b) => a.sort_order - b.sort_order)
                            .map((step) => (
                              <WorkflowStepCard
                                key={step.id}
                                step={step}
                                onStatusChange={handleStepStatusChange}
                                disabled={
                                  phase.status === "completed" ||
                                  workflow.status === "completed" ||
                                  workflow.status === "cancelled"
                                }
                              />
                            ))}
                          {phase.steps.length === 0 && (
                            <div className="flex items-center justify-center py-8 text-sm text-slate-400 dark:text-slate-500">
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Steps will appear when this phase begins
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
