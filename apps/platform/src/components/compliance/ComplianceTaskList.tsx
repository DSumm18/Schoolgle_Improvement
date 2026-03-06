"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ListTodo,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  User,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ComplianceTask } from "@/lib/compliance/types";

interface ComplianceTaskListProps {
  organizationId: string;
}

const STATUS_OPTIONS = ["pending", "in_progress", "completed"] as const;

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: any }
> = {
  pending: {
    label: "To Do",
    color: "bg-slate-100 text-slate-700",
    icon: Clock,
  },
  in_progress: {
    label: "In Progress",
    color: "bg-blue-100 text-blue-700",
    icon: AlertTriangle,
  },
  completed: {
    label: "Done",
    color: "bg-emerald-100 text-emerald-700",
    icon: CheckCircle,
  },
};

export default function ComplianceTaskList({
  organizationId,
}: ComplianceTaskListProps) {
  const [tasks, setTasks] = useState<ComplianceTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, [organizationId]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/compliance/tasks?organizationId=${organizationId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch("/api/compliance/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          taskId,
          status: newStatus,
          completed_at:
            newStatus === "completed" ? new Date().toISOString() : null,
        }),
      });
      if (response.ok) {
        fetchTasks();
      }
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const grouped = useMemo(() => {
    const groups: Record<string, ComplianceTask[]> = {
      pending: [],
      in_progress: [],
      completed: [],
    };
    tasks.forEach((task) => {
      const key = groups[task.status] ? task.status : "pending";
      groups[key].push(task);
    });
    return groups;
  }, [tasks]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const isOverdue = (task: ComplianceTask) => {
    if (!task.due_date || task.status === "completed") return false;
    return new Date(task.due_date) < new Date();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {STATUS_OPTIONS.map((status) => {
        const config = STATUS_CONFIG[status];
        const StatusIcon = config.icon;
        const statusTasks = grouped[status] || [];

        return (
          <Card key={status}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <StatusIcon className="w-4 h-4" />
                {config.label}
                <Badge variant="secondary" className="ml-2 text-xs">
                  {statusTasks.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statusTasks.length === 0 ? (
                <p className="text-sm text-slate-400 py-2">No tasks</p>
              ) : (
                <div className="space-y-2">
                  {statusTasks.map((task, idx) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        isOverdue(task)
                          ? "bg-rose-50 border-rose-200 dark:bg-rose-900/10"
                          : "bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {task.title}
                        </p>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          {task.due_date && (
                            <span
                              className={`flex items-center gap-1 text-xs ${
                                isOverdue(task)
                                  ? "text-rose-600 font-semibold"
                                  : "text-slate-500"
                              }`}
                            >
                              <Calendar className="w-3 h-3" />
                              {formatDate(task.due_date)}
                              {isOverdue(task) && " (overdue)"}
                            </span>
                          )}
                          {task.assigned_to_role && (
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <User className="w-3 h-3" />
                              {task.assigned_to_role}
                            </span>
                          )}
                          {task.compliance_item && (
                            <span className="flex items-center gap-1 text-xs text-purple-600">
                              <Link2 className="w-3 h-3" />
                              {task.compliance_item.title}
                            </span>
                          )}
                          {task.evidence_required && (
                            <Badge variant="outline" className="text-[10px]">
                              Evidence needed
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-3">
                        {status !== "pending" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            onClick={() =>
                              handleStatusChange(task.id, "pending")
                            }
                          >
                            To Do
                          </Button>
                        )}
                        {status !== "in_progress" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            onClick={() =>
                              handleStatusChange(task.id, "in_progress")
                            }
                          >
                            Start
                          </Button>
                        )}
                        {status !== "completed" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-emerald-600 hover:text-emerald-700"
                            onClick={() =>
                              handleStatusChange(task.id, "completed")
                            }
                          >
                            Done
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {tasks.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <ListTodo className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-semibold">
              No compliance tasks yet
            </p>
            <p className="text-sm text-slate-400 mt-1">
              Tasks will appear here when linked to policies or reviews
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
