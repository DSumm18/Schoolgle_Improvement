"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useSWR, { mutate } from "swr";
import {
  AlertTriangle, CheckCircle2, Clock, Calendar,
  ChevronRight, ChevronDown, Award, ClipboardList,
  Check, MoreHorizontal
} from "lucide-react";
import { ConnectorBadge } from "./ConnectorBadge";
import { fetcher } from "@/lib/fetchers";

interface ResponsibilitiesDashboardProps {
  staffId: string;
  organizationId: string;
  compact?: boolean; // For homepage widget vs full page
}

export function ResponsibilitiesDashboard({
  staffId,
  organizationId,
  compact = false,
}: ResponsibilitiesDashboardProps) {
  const [showAllTasks, setShowAllTasks] = useState(false);

  // Fetch connectors for this user
  const { data: connectors = [], isLoading: connLoading } = useSWR(
    organizationId
      ? `/api/connectors?staffId=${staffId}&status=active`
      : null,
    fetcher
  );

  // Fetch tasks for this user
  const { data: tasks = [], isLoading: taskLoading } = useSWR(
    organizationId
      ? `/api/connectors/tasks?staffId=${staffId}`
      : null,
    fetcher
  );

  const isLoading = connLoading || taskLoading;

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-muted rounded w-40" />
        <div className="flex gap-2">
          <div className="h-8 bg-muted rounded-full w-24" />
          <div className="h-8 bg-muted rounded-full w-28" />
        </div>
        <div className="space-y-2 mt-4">
          <div className="h-12 bg-muted rounded-xl" />
          <div className="h-12 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  if (connectors.length === 0) {
    return null; // Don't show widget if no connectors
  }

  // Categorise tasks
  const now = new Date();
  const oneWeekFromNow = new Date();
  oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

  const overdueTasks = tasks.filter(
    (t: any) => t.status === "overdue" || (t.next_due_date && new Date(t.next_due_date) < now && t.status !== "completed")
  );

  const thisWeekTasks = tasks.filter(
    (t: any) =>
      t.status !== "completed" &&
      t.next_due_date &&
      new Date(t.next_due_date) >= now &&
      new Date(t.next_due_date) <= oneWeekFromNow
  );

  const upcomingTasks = tasks.filter(
    (t: any) =>
      t.status !== "completed" &&
      t.next_due_date &&
      new Date(t.next_due_date) > oneWeekFromNow
  );

  const handleCompleteTask = async (taskId: string) => {
    try {
      await fetch("/api/connectors/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId }),
      });
      mutate(`/api/connectors/tasks?staffId=${staffId}`);
    } catch (err) {
      console.error("Error completing task:", err);
    }
  };

  const displayLimit = compact ? 5 : 20;
  const allActiveTasks = [...overdueTasks, ...thisWeekTasks, ...upcomingTasks];
  const displayTasks = showAllTasks ? allActiveTasks : allActiveTasks.slice(0, displayLimit);

  // Training status
  const expiringTraining = connectors.filter((c: any) => {
    if (!c.training_expiry_date) return false;
    const expiry = new Date(c.training_expiry_date);
    return expiry <= oneWeekFromNow && expiry >= now;
  });

  const expiredTraining = connectors.filter((c: any) => {
    if (!c.training_expiry_date) return false;
    return new Date(c.training_expiry_date) < now;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-base flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            Your Responsibilities
          </h2>
          {overdueTasks.length > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold"
            >
              {overdueTasks.length} overdue
            </motion.span>
          )}
        </div>

        {/* Role badges */}
        <div className="flex flex-wrap gap-1.5">
          {connectors.map((c: any, i: number) => (
            <ConnectorBadge
              key={c.id}
              name={c.connector_type?.name || "Unknown"}
              category={c.connector_type?.category || "custom"}
              icon={c.connector_type?.icon}
              color={c.connector_type?.color}
              isPrimary={c.is_primary}
              scope={c.scope}
              trainingExpiry={c.training_expiry_date}
              size="sm"
              delay={i * 0.03}
            />
          ))}
        </div>
      </div>

      {/* Training alerts */}
      {(expiredTraining.length > 0 || expiringTraining.length > 0) && (
        <div className="px-5 py-3 border-b border-border space-y-1.5">
          {expiredTraining.map((c: any) => (
            <motion.div
              key={`exp-${c.id}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2"
            >
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>
                <strong>{c.connector_type?.training_name || c.connector_type?.name} training expired</strong>
                {" "}— {new Date(c.training_expiry_date).toLocaleDateString("en-GB")}
              </span>
            </motion.div>
          ))}
          {expiringTraining.map((c: any) => (
            <motion.div
              key={`exps-${c.id}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2"
            >
              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
              <span>
                <strong>{c.connector_type?.training_name || c.connector_type?.name}</strong>
                {" "}expires {new Date(c.training_expiry_date).toLocaleDateString("en-GB")}
              </span>
            </motion.div>
          ))}
        </div>
      )}

      {/* Tasks */}
      <div className="divide-y divide-border">
        {allActiveTasks.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
            <p>All caught up! No pending tasks.</p>
          </div>
        ) : (
          <>
            {/* Overdue section */}
            {overdueTasks.length > 0 && (
              <div className="px-5 py-2 bg-red-50/50">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-red-600 py-1">
                  Overdue
                </div>
              </div>
            )}
            {overdueTasks.slice(0, compact ? 3 : 10).map((task: any, i: number) => (
              <TaskRow
                key={task.id}
                task={task}
                isOverdue
                delay={i * 0.03}
                onComplete={handleCompleteTask}
              />
            ))}

            {/* This week section */}
            {thisWeekTasks.length > 0 && (
              <div className="px-5 py-2 bg-muted/30">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground py-1">
                  This Week
                </div>
              </div>
            )}
            {thisWeekTasks.slice(0, compact ? 3 : 10).map((task: any, i: number) => (
              <TaskRow
                key={task.id}
                task={task}
                delay={i * 0.03}
                onComplete={handleCompleteTask}
              />
            ))}

            {/* Upcoming section (if not compact) */}
            {!compact && upcomingTasks.length > 0 && (
              <>
                <div className="px-5 py-2 bg-muted/30">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground py-1">
                    Coming Up
                  </div>
                </div>
                {upcomingTasks.slice(0, showAllTasks ? 20 : 3).map((task: any, i: number) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    delay={i * 0.03}
                    onComplete={handleCompleteTask}
                  />
                ))}
              </>
            )}

            {/* Show more */}
            {allActiveTasks.length > displayLimit && !showAllTasks && (
              <button
                onClick={() => setShowAllTasks(true)}
                className="w-full p-3 text-sm text-primary font-medium hover:bg-muted/50 transition-colors flex items-center justify-center gap-1"
              >
                Show all {allActiveTasks.length} tasks
                <ChevronDown className="w-4 h-4" />
              </button>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

function TaskRow({
  task,
  isOverdue = false,
  delay = 0,
  onComplete,
}: {
  task: any;
  isOverdue?: boolean;
  delay?: number;
  onComplete: (id: string) => void;
}) {
  const [completing, setCompleting] = useState(false);

  const handleClick = async () => {
    setCompleting(true);
    await onComplete(task.id);
  };

  const dueDate = task.next_due_date
    ? new Date(task.next_due_date).toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })
    : "No date";

  return (
    <motion.div
      initial={{ opacity: 0, x: -5 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className={`px-5 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors ${
        isOverdue ? "bg-red-50/30" : ""
      }`}
    >
      <button
        onClick={handleClick}
        disabled={completing}
        className={`
          w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center
          transition-all hover:scale-110
          ${completing
            ? "border-emerald-500 bg-emerald-500"
            : isOverdue
              ? "border-red-300 hover:border-red-500"
              : "border-border hover:border-primary"
          }
        `}
      >
        {completing && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            <Check className="w-3 h-3 text-white" />
          </motion.div>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${completing ? "line-through text-muted-foreground" : ""}`}>
          {task.title}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {task.connector_type && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full border font-medium"
              style={{
                borderColor: `${task.connector_type.color || "#6b7280"}30`,
                color: task.connector_type.color || "#6b7280",
                backgroundColor: `${task.connector_type.color || "#6b7280"}10`,
              }}
            >
              {task.connector_type.name}
            </span>
          )}
          {task.scope && task.scope !== "whole school" && (
            <span className="text-[10px] text-muted-foreground">
              {task.scope}
            </span>
          )}
        </div>
      </div>

      <div className={`text-xs flex-shrink-0 ${isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
        {isOverdue && <AlertTriangle className="w-3 h-3 inline mr-1" />}
        {dueDate}
      </div>
    </motion.div>
  );
}
