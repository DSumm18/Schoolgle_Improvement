"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  Bot,
  CheckSquare,
  Zap,
  Heart,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Shield,
  Play,
  RefreshCw,
} from "lucide-react";
import type {
  MCDashboardStatus,
  MCActivityFeedItem,
} from "@/lib/mission-control/types";

function StatusCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  href,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  href?: string;
}) {
  const content = (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition-colors hover:border-zinc-700">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            {title}
          </p>
          <p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p>
          <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>
        </div>
        <div
          className={`rounded-lg p-2 ${color.replace("text-", "bg-").replace("400", "900/30")}`}
        >
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
      </div>
    </div>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

function ActivityIcon({ type }: { type: string }) {
  switch (type) {
    case "skill_execution":
      return <Zap className="h-4 w-4 text-violet-400" />;
    case "approval":
      return <CheckSquare className="h-4 w-4 text-amber-400" />;
    case "security":
      return <Shield className="h-4 w-4 text-red-400" />;
    case "error":
      return <AlertCircle className="h-4 w-4 text-red-400" />;
    default:
      return <Activity className="h-4 w-4 text-zinc-400" />;
  }
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: "bg-emerald-900/30 text-emerald-400",
    running: "bg-blue-900/30 text-blue-400",
    pending: "bg-amber-900/30 text-amber-400",
    failed: "bg-red-900/30 text-red-400",
    approved: "bg-emerald-900/30 text-emerald-400",
    rejected: "bg-red-900/30 text-red-400",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] || "bg-zinc-800 text-zinc-400"}`}
    >
      {status}
    </span>
  );
}

export default function MissionControlDashboard() {
  const [status, setStatus] = useState<MCDashboardStatus | null>(null);
  const [feed, setFeed] = useState<MCActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchDashboard() {
    setLoading(true);
    try {
      const res = await fetch("/api/mission-control/status");
      if (res.ok) {
        const data = await res.json();
        setStatus(data.status);
        setFeed(data.activity || []);
      }
    } catch (e) {
      console.error("Failed to fetch MC status:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboard();
  }, []);

  const dashboardStatus = status || {
    jarvis: { lastPollTime: null, activeAgents: 0, tasksInQueue: 0 },
    pendingApprovals: 0,
    skillsRunToday: 0,
    buildHealth: { lastBuildStatus: "unknown" as const, testCount: 0, vectorScore: null },
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Mission Control</h1>
          <p className="text-sm text-zinc-500">
            Schoolgle operational command centre
          </p>
        </div>
        <button
          onClick={fetchDashboard}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Status Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatusCard
          title="Jarvis Status"
          value={dashboardStatus.jarvis.activeAgents}
          subtitle={
            dashboardStatus.jarvis.lastPollTime
              ? `Last poll: ${new Date(dashboardStatus.jarvis.lastPollTime).toLocaleTimeString()}`
              : "No recent activity"
          }
          icon={Bot}
          color="text-violet-400"
        />
        <StatusCard
          title="Pending Approvals"
          value={dashboardStatus.pendingApprovals}
          subtitle="Items awaiting review"
          icon={CheckSquare}
          color="text-amber-400"
          href="/mission-control/approvals"
        />
        <StatusCard
          title="Skills Run Today"
          value={dashboardStatus.skillsRunToday}
          subtitle="Automated executions"
          icon={Zap}
          color="text-emerald-400"
          href="/mission-control/skills"
        />
        <StatusCard
          title="Build Health"
          value={
            dashboardStatus.buildHealth.lastBuildStatus === "success"
              ? "Healthy"
              : dashboardStatus.buildHealth.lastBuildStatus === "failed"
                ? "Failed"
                : "Unknown"
          }
          subtitle={`${dashboardStatus.buildHealth.testCount} tests${dashboardStatus.buildHealth.vectorScore ? ` | VECTOR: ${dashboardStatus.buildHealth.vectorScore}` : ""}`}
          icon={Heart}
          color={
            dashboardStatus.buildHealth.lastBuildStatus === "success"
              ? "text-emerald-400"
              : dashboardStatus.buildHealth.lastBuildStatus === "failed"
                ? "text-red-400"
                : "text-zinc-400"
          }
        />
      </div>

      {/* Activity Feed */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-zinc-200">
          Activity Feed
        </h2>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900">
          {feed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
              <Activity className="mb-3 h-8 w-8" />
              <p className="text-sm">No activity recorded yet</p>
              <p className="text-xs">
                Activity will appear here as skills run and approvals are
                processed
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {feed.slice(0, 20).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 px-4 py-3"
                >
                  <ActivityIcon type={item.type} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-zinc-300">
                      {item.description}
                    </p>
                    <p className="text-xs text-zinc-600">
                      {new Date(item.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-zinc-200">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <button className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-left text-sm text-zinc-300 transition-colors hover:border-violet-800 hover:bg-violet-900/10">
            <Play className="h-4 w-4 text-violet-400" />
            Run Facebook Monitor
          </button>
          <button
            onClick={fetchDashboard}
            className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-left text-sm text-zinc-300 transition-colors hover:border-violet-800 hover:bg-violet-900/10"
          >
            <Bot className="h-4 w-4 text-violet-400" />
            Check Jarvis Status
          </button>
          <Link
            href="/mission-control/approvals"
            className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-left text-sm text-zinc-300 transition-colors hover:border-amber-800 hover:bg-amber-900/10"
          >
            <CheckSquare className="h-4 w-4 text-amber-400" />
            View Approvals
          </Link>
          <Link
            href="/mission-control/skills"
            className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-left text-sm text-zinc-300 transition-colors hover:border-emerald-800 hover:bg-emerald-900/10"
          >
            <Zap className="h-4 w-4 text-emerald-400" />
            Skill Registry
          </Link>
        </div>
      </div>
    </div>
  );
}
