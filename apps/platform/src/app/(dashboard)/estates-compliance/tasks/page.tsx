"use client";

/**
 * Compliance Tasks Page
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ComplianceTask,
  TaskStatus,
  TaskPriority,
} from "@/types/estates-compliance";
import { useAuth } from "@/context/SupabaseAuthContext";

type TabMode = "all" | "pending" | "overdue" | "upcoming" | "completed";

export default function TasksPage() {
  const { organizationId, session } = useAuth();
  const [tasks, setTasks] = useState<ComplianceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabMode>("all");
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    overdue: 0,
    upcoming: 0,
    completed: 0,
  });

  useEffect(() => {
    const controller = new AbortController();
    if (organizationId) {
      fetchTasks(controller.signal);
      fetchStats();
    }
    return () => controller.abort("Component updated or unmounted");
  }, [activeTab, organizationId]);

  const fetchTasks = useCallback(
    async (signal?: AbortSignal) => {
      // If already aborted, don't start
      if (signal?.aborted) return;

      // Use a local controller to manage the fetch timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort("Tasks fetch timed out"),
        30000,
      );

      // Link the passed signal to our local controller
      const onAbort = () => controller.abort(signal?.reason);
      if (signal) {
        if (signal.aborted) onAbort();
        else signal.addEventListener("abort", onAbort, { once: true });
      }

      try {
        setLoading(true);
        setError(null);
        const filters: any = {};
        if (activeTab === "pending") filters.status = "pending";
        if (activeTab === "completed") filters.status = "completed";
        if (activeTab === "overdue") filters.overdue_only = true;
        filters.organizationId = organizationId;

        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, String(value));
        });

        const response = await fetch(
          `/api/estates/tasks?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${session?.access_token}`,
            },
            signal: controller.signal,
          },
        );
        if (!response.ok) {
          throw new Error("Failed to fetch tasks");
        }
        const data = await response.json();
        setTasks(data.tasks || []);
      } catch (err: any) {
        const errorString = typeof err === "string" ? err : err?.message || "";
        const isAbort =
          err.name === "AbortError" ||
          errorString.toLowerCase().includes("abort") ||
          errorString.toLowerCase().includes("unmounted") ||
          errorString.toLowerCase().includes("refreshed");

        if (isAbort) {
          console.info("[TasksPage] Fetch aborted:", errorString);
        } else {
          setError(err instanceof Error ? err.message : "Failed to load tasks");
        }
      } finally {
        clearTimeout(timeoutId);
        if (signal) signal.removeEventListener("abort", onAbort);
        setLoading(false);
      }
    },
    [organizationId, activeTab, session],
  );

  const fetchStats = async () => {
    try {
      const response = await fetch(
        `/api/estates/tasks/stats?organizationId=${organizationId}`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        },
      );
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch task stats:", err);
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    const colors = {
      critical: "bg-red-100 text-red-800",
      high: "bg-orange-100 text-orange-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-gray-100 text-gray-800",
    };
    return colors[priority];
  };

  const getStatusColor = (status: TaskStatus) => {
    const colors: Record<string, string> = {
      pending: "bg-blue-100 text-blue-800",
      in_progress: "bg-purple-100 text-purple-800",
      awaiting_contractor: "bg-yellow-100 text-yellow-800",
      contractor_scheduled: "bg-indigo-100 text-indigo-800",
      completed: "bg-green-100 text-green-800",
      overdue: "bg-red-100 text-red-800",
      skipped: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/estates-compliance" className="hover:text-foreground">
              Estates Compliance
            </Link>
            <span>/</span>
            <span>Tasks</span>
          </nav>
          <h1 className="text-3xl font-bold tracking-tight">
            Compliance Tasks
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage inspections, maintenance, and testing schedules
          </p>
        </div>
        <Link
          href="/estates-compliance/tasks/new"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Create Task
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Total"
          value={stats.total}
          onClick={() => setActiveTab("all")}
          active={activeTab === "all"}
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          onClick={() => setActiveTab("pending")}
          active={activeTab === "pending"}
        />
        <StatCard
          label="Overdue"
          value={stats.overdue}
          onClick={() => setActiveTab("overdue")}
          active={activeTab === "overdue"}
          variant="danger"
        />
        <StatCard
          label="Upcoming"
          value={stats.upcoming}
          onClick={() => setActiveTab("upcoming")}
          active={activeTab === "upcoming"}
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          onClick={() => setActiveTab("completed")}
          active={activeTab === "completed"}
          variant="success"
        />
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-4">
          {(
            ["all", "pending", "overdue", "upcoming", "completed"] as TabMode[]
          ).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading tasks...</div>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          Error: {error}
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card p-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <span className="text-2xl">📋</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
          <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
            {activeTab === "all"
              ? "Get started by creating your first compliance task."
              : `No ${activeTab} tasks found.`}
          </p>
          {activeTab === "all" && (
            <Link
              href="/estates-compliance/tasks/new"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Create Your First Task
            </Link>
          )}
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr className="text-left text-sm">
                  <th className="px-4 py-3 font-medium">Task</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Domain</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Due Date</th>
                  <th className="px-4 py-3 font-medium">Assigned To</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {tasks.map((task) => (
                  <tr key={task.id} className="text-sm hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium">{task.title}</div>
                      {task.description && (
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {task.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 capitalize">
                      {task.task_type.replace("_", " ")}
                    </td>
                    <td className="px-4 py-3 capitalize">
                      {task.compliance_domain}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getPriorityColor(task.priority || "medium")}`}
                      >
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {task.due_date
                        ? new Date(task.due_date).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {task.assigned_to || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(task.status)}`}
                      >
                        {task.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/estates-compliance/tasks/${task.id}`}
                        className="inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-medium hover:bg-accent"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  onClick?: () => void;
  active?: boolean;
  variant?: "default" | "danger" | "success";
}

function StatCard({
  label,
  value,
  onClick,
  active,
  variant = "default",
}: StatCardProps) {
  const variantStyles = {
    default: "bg-card border-card hover:bg-accent",
    danger: "bg-red-50 border-red-200 hover:bg-red-100",
    success: "bg-green-50 border-green-200 hover:bg-green-100",
  };

  return (
    <button
      onClick={onClick}
      className={`rounded-lg border p-4 transition-colors text-left ${variantStyles[variant]} ${active ? "ring-2 ring-primary" : ""}`}
    >
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </button>
  );
}
