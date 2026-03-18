"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  Loader2,
  Ban,
  SkipForward,
  Clock,
  Bot,
  ExternalLink,
  Shield,
  Link2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface WorkflowStep {
  id: string;
  phase_id: string;
  title: string;
  description: string | null;
  status:
    | "todo"
    | "in_progress"
    | "done"
    | "blocked"
    | "skipped"
    | "waiting_external";
  owner_role: string | null;
  is_automated: boolean;
  is_external: boolean;
  requires_approval: boolean;
  linked_entity_type: string | null;
  linked_entity_id: string | null;
  completion_notes: string | null;
  evidence_url: string | null;
  sort_order: number;
}

interface WorkflowStepCardProps {
  step: WorkflowStep;
  onStatusChange: (stepId: string, newStatus: string) => void;
  disabled?: boolean;
}

const STATUS_CONFIG: Record<
  string,
  { icon: typeof Circle; color: string; label: string; badgeClass: string }
> = {
  todo: {
    icon: Circle,
    color: "text-slate-400 dark:text-slate-500",
    label: "To Do",
    badgeClass:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  },
  in_progress: {
    icon: Loader2,
    color: "text-blue-500 dark:text-blue-400",
    label: "In Progress",
    badgeClass:
      "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
  },
  done: {
    icon: CheckCircle2,
    color: "text-emerald-500 dark:text-emerald-400",
    label: "Done",
    badgeClass:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
  },
  blocked: {
    icon: Ban,
    color: "text-red-500 dark:text-red-400",
    label: "Blocked",
    badgeClass: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
  },
  skipped: {
    icon: SkipForward,
    color: "text-slate-400 dark:text-slate-500",
    label: "Skipped",
    badgeClass:
      "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
  },
  waiting_external: {
    icon: Clock,
    color: "text-amber-500 dark:text-amber-400",
    label: "Waiting",
    badgeClass:
      "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
  },
};

function getNextStatus(current: string): string | null {
  if (current === "todo") return "in_progress";
  if (current === "in_progress") return "done";
  return null;
}

export function WorkflowStepCard({
  step,
  onStatusChange,
  disabled = false,
}: WorkflowStepCardProps) {
  const config = STATUS_CONFIG[step.status] || STATUS_CONFIG.todo;
  const StatusIcon = config.icon;
  const canToggle =
    !disabled && !step.is_automated && getNextStatus(step.status) !== null;

  const handleClick = () => {
    if (!canToggle) return;
    const next = getNextStatus(step.status);
    if (next) onStatusChange(step.id, next);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group flex items-start gap-3 p-4 rounded-xl border transition-all duration-200 ${
        step.status === "done"
          ? "bg-emerald-50/50 dark:bg-emerald-900/5 border-emerald-200/60 dark:border-emerald-800/30"
          : step.status === "blocked"
            ? "bg-red-50/50 dark:bg-red-900/5 border-red-200/60 dark:border-red-800/30"
            : "bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-700/50"
      } ${canToggle ? "cursor-pointer hover:shadow-md" : ""} ${
        disabled ? "opacity-50" : ""
      }`}
      onClick={handleClick}
    >
      {/* Status icon / checkbox */}
      <div className={`mt-0.5 flex-shrink-0 ${config.color}`}>
        <StatusIcon
          className={`w-5 h-5 ${step.status === "in_progress" ? "animate-spin" : ""}`}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p
              className={`text-sm font-semibold ${
                step.status === "done"
                  ? "text-slate-500 dark:text-slate-400 line-through"
                  : "text-slate-900 dark:text-white"
              }`}
            >
              {step.title}
            </p>
            {step.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                {step.description}
              </p>
            )}

            {/* Completion notes */}
            {step.status === "done" && step.completion_notes && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 italic">
                {step.completion_notes}
              </p>
            )}

            {/* Evidence link */}
            {step.status === "done" && step.evidence_url && (
              <a
                href={step.evidence_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 hover:underline mt-1"
                onClick={(e) => e.stopPropagation()}
              >
                <Link2 className="w-3 h-3" />
                View evidence
              </a>
            )}
          </div>

          {/* Right side badges */}
          <div className="flex flex-wrap items-center gap-1.5 flex-shrink-0">
            {step.owner_role && (
              <Badge
                variant="outline"
                className="text-[10px] px-2 py-0 h-5 capitalize"
              >
                {step.owner_role}
              </Badge>
            )}
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${config.badgeClass}`}
            >
              {config.label}
            </span>
          </div>
        </div>

        {/* Type badges row */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          {step.is_automated && (
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 px-2 py-0.5 text-[10px] font-medium">
              <Bot className="w-3 h-3" />
              Ed can do this
            </span>
          )}
          {step.is_external && (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 px-2 py-0.5 text-[10px] font-medium">
              <ExternalLink className="w-3 h-3" />
              External system
            </span>
          )}
          {step.requires_approval && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 text-[10px] font-medium">
              <Shield className="w-3 h-3" />
              Requires approval
            </span>
          )}
          {step.linked_entity_type && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 text-[10px] font-medium">
              <Link2 className="w-3 h-3" />
              {step.linked_entity_type}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
