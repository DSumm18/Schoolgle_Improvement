"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Calendar,
  User,
  Building2,
  BookOpen,
  Wrench,
  Shield,
  GraduationCap,
  MoreHorizontal,
  Filter,
  AlertTriangle,
} from "lucide-react";
import useSWR from "swr";
import { useAuth } from "@/context/SupabaseAuthContext";
import { MODULES, canUserAccess, Role } from "@/lib/modules/registry";
import type { UnifiedTask } from "@/lib/tasks";

interface MyTasksWidgetProps {
  limit?: number;
}

// Role to modules mapping
const ROLE_MODULES: Record<string, string[]> = {
  admin: [
    "governance",
    "improvement",
    "teaching-learning",
    "estates",
    "compliance",
    "finance",
    "hr",
    "send",
    "training",
    "risk",
  ],
  headteacher: [
    "governance",
    "improvement",
    "teaching-learning",
    "estates",
    "compliance",
    "hr",
    "training",
    "risk",
  ],
  slt: [
    "improvement",
    "teaching-learning",
    "estates",
    "compliance",
    "hr",
    "training",
    "risk",
  ],
  teacher: ["teaching-learning", "hr", "training"],
  governor: ["governance", "improvement", "risk"],
  caretaker: ["estates", "compliance", "training"],
  viewer: ["improvement", "teaching-learning"],
  sbm: ["finance", "estates", "compliance", "hr", "training", "risk"],
  senco: ["send", "teaching-learning", "hr", "training"],
};

// Module icons
const MODULE_ICONS: Record<
  string,
  React.ComponentType<{ className?: string; size?: number }>
> = {
  governance: Shield,
  improvement: BookOpen,
  "teaching-learning": GraduationCap,
  estates: Wrench,
  compliance: Shield,
  finance: Building2,
  hr: User,
  send: BookOpen,
  training: GraduationCap,
  risk: AlertTriangle,
};

const MODULE_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  governance: {
    bg: "bg-purple-50 dark:bg-purple-900/20",
    text: "text-purple-600 dark:text-purple-400",
    border: "border-purple-200 dark:border-purple-800",
  },
  improvement: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
  },
  "teaching-learning": {
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  estates: {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
  },
  compliance: {
    bg: "bg-rose-50 dark:bg-rose-900/20",
    text: "text-rose-600 dark:text-rose-400",
    border: "border-rose-200 dark:border-rose-800",
  },
  finance: {
    bg: "bg-green-50 dark:bg-green-900/20",
    text: "text-green-600 dark:text-green-400",
    border: "border-green-200 dark:border-green-800",
  },
  hr: {
    bg: "bg-indigo-50 dark:bg-indigo-900/20",
    text: "text-indigo-600 dark:text-indigo-400",
    border: "border-indigo-200 dark:border-indigo-800",
  },
  send: {
    bg: "bg-pink-50 dark:bg-pink-900/20",
    text: "text-pink-600 dark:text-pink-400",
    border: "border-pink-200 dark:border-pink-800",
  },
  training: {
    bg: "bg-violet-50 dark:bg-violet-900/20",
    text: "text-violet-600 dark:text-violet-400",
    border: "border-violet-200 dark:border-violet-800",
  },
  risk: {
    bg: "bg-red-50 dark:bg-red-900/20",
    text: "text-red-600 dark:text-red-400",
    border: "border-red-200 dark:border-red-800",
  },
};

type FilterStatus =
  | "all"
  | "overdue"
  | "due_today"
  | "due_this_week"
  | "completed";

export function MyTasksWidget({ limit = 5 }: MyTasksWidgetProps) {
  const { user, organization } = useAuth();
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  // Get user's role from organization
  const userRole = (organization?.role || "viewer") as Role;

  // Get allowed modules for this role
  const allowedModules = ROLE_MODULES[userRole] || ROLE_MODULES.viewer;

  // Fetch user's tasks
  const {
    data: tasksData,
    isLoading,
    error,
  } = useSWR(
    organization?.id && user?.id
      ? [
          `/api/tasks?organizationId=${organization.id}&assigneeId=${user.id}&limit=50`,
          organization.id,
          user.id,
        ]
      : null,
    async ([url]) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const res = await fetch(url, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
          // Return empty tasks instead of throwing - prevents console errors
          return { tasks: [] };
        }
        return res.json();
      } catch (err) {
        // Return empty tasks on any error - prevents blocking
        return { tasks: [] };
      }
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
      shouldRetryOnError: false,
      onError: (err) => {
        // Suppress error logging in console - we handle it gracefully
        console.debug("Tasks fetch failed (handled gracefully):", err);
      },
    },
  );

  // Filter tasks by role-appropriate modules
  const filteredTasks = useMemo(() => {
    if (!tasksData?.tasks) return [];

    let tasks = tasksData.tasks as UnifiedTask[];

    // Filter by allowed modules
    tasks = tasks.filter((task) => {
      if (!task.module) return true; // General tasks visible to all
      return allowedModules.includes(task.module);
    });

    // Apply status filter
    const today = new Date().toISOString().split("T")[0];
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    const weekFromNowStr = weekFromNow.toISOString().split("T")[0];

    switch (statusFilter) {
      case "overdue":
        return tasks.filter(
          (t) => t.due_date && t.due_date < today && t.status !== "completed",
        );
      case "due_today":
        return tasks.filter(
          (t) => t.due_date === today && t.status !== "completed",
        );
      case "due_this_week":
        return tasks.filter(
          (t) =>
            t.due_date &&
            t.due_date >= today &&
            t.due_date <= weekFromNowStr &&
            t.status !== "completed",
        );
      case "completed":
        return tasks.filter((t) => t.status === "completed");
      default:
        // Show pending/incomplete tasks first
        return tasks.filter((t) => t.status !== "completed").slice(0, limit);
    }
  }, [tasksData, allowedModules, statusFilter, limit]);

  // Group tasks by module
  const tasksByModule = useMemo(() => {
    const grouped: Record<string, UnifiedTask[]> = {};
    filteredTasks.forEach((task) => {
      const module = task.module || "general";
      if (!grouped[module]) grouped[module] = [];
      grouped[module].push(task);
    });
    return grouped;
  }, [filteredTasks]);

  // Task statistics
  const stats = useMemo(() => {
    if (!tasksData?.tasks)
      return { total: 0, overdue: 0, dueToday: 0, dueThisWeek: 0 };

    const today = new Date().toISOString().split("T")[0];
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    const weekFromNowStr = weekFromNow.toISOString().split("T")[0];

    const userTasks = tasksData.tasks.filter((t: UnifiedTask) => {
      if (!t.module) return true;
      return allowedModules.includes(t.module);
    });

    return {
      total: userTasks.filter((t: UnifiedTask) => t.status !== "completed")
        .length,
      overdue: userTasks.filter(
        (t: UnifiedTask) =>
          t.due_date && t.due_date < today && t.status !== "completed",
      ).length,
      dueToday: userTasks.filter(
        (t: UnifiedTask) => t.due_date === today && t.status !== "completed",
      ).length,
      dueThisWeek: userTasks.filter(
        (t: UnifiedTask) =>
          t.due_date &&
          t.due_date >= today &&
          t.due_date <= weekFromNowStr &&
          t.status !== "completed",
      ).length,
    };
  }, [tasksData, allowedModules]);

  const getModuleInfo = (moduleName: string) => {
    return {
      icon: MODULE_ICONS[moduleName] || Calendar,
      colors: MODULE_COLORS[moduleName] || MODULE_COLORS.improvement,
      name:
        moduleName === "general"
          ? "General Tasks"
          : MODULES.find((m) => m.id === moduleName)?.name || moduleName,
    };
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
      case "urgent":
        return "text-rose-600 bg-rose-50 border-rose-200";
      case "high":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "medium":
        return "text-amber-600 bg-amber-50 border-amber-200";
      default:
        return "text-slate-600 bg-slate-50 border-slate-200";
    }
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return dueDate < new Date().toISOString().split("T")[0];
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "No due date";
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dateStr === today.toISOString().split("T")[0]) return "Today";
    if (dateStr === tomorrow.toISOString().split("T")[0]) return "Tomorrow";

    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl p-8 border border-border">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/3"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 bg-slate-200 dark:bg-slate-800 rounded-xl"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Handle error state gracefully
  if (error) {
    return (
      <div className="bg-card rounded-2xl p-8 border border-border">
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-foreground mb-2">
            Unable to load tasks
          </h3>
          <p className="text-sm text-muted-foreground">
            Please try refreshing the page
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
      {/* Header */}
      <div className="px-8 py-6 bg-muted/50 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-600">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                My Tasks
              </h2>
              <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">
                {allowedModules.length > 1
                  ? "Across all modules"
                  : getModuleInfo(allowedModules[0]).name}
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-2">
            {stats.overdue > 0 && (
              <div className="px-3 py-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-bold border border-rose-200 dark:border-rose-800">
                {stats.overdue} overdue
              </div>
            )}
            {stats.dueToday > 0 && (
              <div className="px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg text-xs font-bold border border-amber-200 dark:border-amber-800">
                {stats.dueToday} today
              </div>
            )}
            {stats.total === 0 && (
              <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                All caught up!
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
          {(
            ["all", "overdue", "due_today", "due_this_week"] as FilterStatus[]
          ).map((filter) => {
            const count =
              filter === "all"
                ? stats.total
                : filter === "overdue"
                  ? stats.overdue
                  : filter === "due_today"
                    ? stats.dueToday
                    : stats.dueThisWeek;
            return (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  statusFilter === filter
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                {filter === "all" ? "All" : filter.replace("_", " ")}
                {count > 0 && (
                  <span className="ml-1 opacity-70">({count})</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tasks List */}
      <div className="p-6 space-y-3 max-h-[500px] overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {filteredTasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="inline-flex p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-full text-emerald-500 mb-4">
                <CheckCircle2 size={40} />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {statusFilter === "all"
                  ? "No pending tasks"
                  : `No ${statusFilter.replace("_", " ")} tasks`}
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
                You're all caught up! Great work staying on top of things.
              </p>
            </motion.div>
          ) : (
            filteredTasks.map((task, idx) => {
              const moduleInfo = getModuleInfo(task.module || "general");
              const ModuleIcon = moduleInfo.icon;
              const overdue = task.due_date && isOverdue(task.due_date);

              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group"
                >
                  <button
                    onClick={() =>
                      setExpandedTask(expandedTask === task.id ? null : task.id)
                    }
                    className={`w-full text-left p-4 rounded-xl border transition-all relative overflow-hidden ${
                      overdue
                        ? "bg-rose-50/50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800"
                        : "bg-card border-border hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Module Icon */}
                      <div
                        className={`p-2 rounded-lg ${moduleInfo.colors.bg} ${moduleInfo.colors.text} shrink-0`}
                      >
                        <ModuleIcon size={16} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h3
                            className={`font-semibold text-sm truncate ${overdue ? "text-rose-700 dark:text-rose-300" : "text-foreground"}`}
                          >
                            {task.title}
                          </h3>
                          <div className="flex items-center gap-2 shrink-0">
                            {task.priority && (
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getPriorityColor(task.priority)}`}
                              >
                                {task.priority}
                              </span>
                            )}
                            <MoreHorizontal
                              size={14}
                              className="text-slate-400 group-hover:text-blue-500 transition-colors"
                            />
                          </div>
                        </div>

                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {task.due_date && (
                            <span
                              className={`flex items-center gap-1 ${overdue ? "text-rose-600" : ""}`}
                            >
                              <Clock size={10} />
                              {formatDate(task.due_date)}
                              {overdue && " (overdue)"}
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded ${moduleInfo.colors.bg} ${moduleInfo.colors.text}`}
                          >
                            {moduleInfo.name}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress bar if progress > 0 */}
                    {(task.progress ?? 0) > 0 && (task.progress ?? 0) < 100 && (
                      <div className="mt-3 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${task.progress}%` }}
                          className="h-full bg-blue-500 rounded-full"
                        />
                      </div>
                    )}
                  </button>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      {filteredTasks.length > 0 && (
        <div className="px-8 py-4 bg-muted/50 border-t border-border">
          <a
            href="/dashboard/tasks"
            className="block w-full text-center py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-colors"
          >
            View All Tasks ({stats.total})
            <ArrowRight size={12} className="inline ml-2" />
          </a>
        </div>
      )}
    </div>
  );
}
