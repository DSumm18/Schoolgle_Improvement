"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  Shield,
  Zap,
  CheckSquare,
  AlertCircle,
  Settings,
  RefreshCw,
  Filter,
} from "lucide-react";
import type { MCAuditLogEntry, AuditEventCategory } from "@/lib/mission-control/types";

function CategoryIcon({ category }: { category: AuditEventCategory }) {
  switch (category) {
    case "skill":
      return <Zap className="h-4 w-4 text-violet-400" />;
    case "approval":
      return <CheckSquare className="h-4 w-4 text-amber-400" />;
    case "security":
      return <Shield className="h-4 w-4 text-red-400" />;
    case "error":
      return <AlertCircle className="h-4 w-4 text-red-400" />;
    case "admin":
      return <Settings className="h-4 w-4 text-blue-400" />;
    default:
      return <Activity className="h-4 w-4 text-zinc-400" />;
  }
}

function CategoryBadge({ category }: { category: string }) {
  const styles: Record<string, string> = {
    skill: "bg-violet-900/30 text-violet-400",
    approval: "bg-amber-900/30 text-amber-400",
    security: "bg-red-900/30 text-red-400",
    error: "bg-red-900/30 text-red-400",
    admin: "bg-blue-900/30 text-blue-400",
    system: "bg-zinc-800 text-zinc-400",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[category] || styles.system}`}
    >
      {category}
    </span>
  );
}

export default function ActivityLogPage() {
  const [entries, setEntries] = useState<MCAuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  async function fetchActivity() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      const res = await fetch(`/api/mission-control/activity?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
      }
    } catch (e) {
      console.error("Failed to fetch activity:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchActivity();
  }, [categoryFilter]);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Activity Log</h1>
          <p className="text-sm text-zinc-500">
            Complete audit trail of Mission Control operations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 focus:border-violet-700 focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="system">System</option>
            <option value="skill">Skill</option>
            <option value="approval">Approval</option>
            <option value="admin">Admin</option>
            <option value="security">Security</option>
            <option value="error">Error</option>
          </select>
          <button
            onClick={fetchActivity}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-700 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Activity List */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
            <Activity className="mb-3 h-8 w-8" />
            <p className="text-sm">No activity recorded yet</p>
            <p className="text-xs">
              Events will appear here as operations are performed
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-start gap-4 px-4 py-3">
                <div className="mt-0.5 shrink-0">
                  <CategoryIcon category={entry.event_category} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-zinc-300">
                      {entry.description}
                    </p>
                    <CategoryBadge category={entry.event_category} />
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-zinc-600">
                    <span>
                      {new Date(entry.created_at).toLocaleString()}
                    </span>
                    <span>by {entry.actor}</span>
                    {entry.event_type && (
                      <span className="font-mono text-zinc-700">
                        {entry.event_type}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
