"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  MessageSquare,
  Mail,
  Zap,
  RefreshCw,
} from "lucide-react";
import type { MCApprovalItem } from "@/lib/mission-control/types";

function ItemTypeIcon({ type }: { type: string }) {
  switch (type) {
    case "social_post":
      return <MessageSquare className="h-4 w-4 text-blue-400" />;
    case "email_draft":
      return <Mail className="h-4 w-4 text-emerald-400" />;
    case "skill_output":
      return <Zap className="h-4 w-4 text-violet-400" />;
    case "document":
      return <FileText className="h-4 w-4 text-amber-400" />;
    default:
      return <FileText className="h-4 w-4 text-zinc-400" />;
  }
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    urgent: "bg-red-900/30 text-red-400 border-red-800",
    high: "bg-amber-900/30 text-amber-400 border-amber-800",
    normal: "bg-zinc-800 text-zinc-400 border-zinc-700",
    low: "bg-zinc-800/50 text-zinc-500 border-zinc-700",
  };
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${styles[priority] || styles.normal}`}
    >
      {priority}
    </span>
  );
}

export default function ApprovalsPage() {
  const [items, setItems] = useState<MCApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deciding, setDeciding] = useState<string | null>(null);

  async function fetchApprovals() {
    setLoading(true);
    try {
      const res = await fetch("/api/mission-control/approvals");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (e) {
      console.error("Failed to fetch approvals:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleDecision(id: string, decision: "approved" | "rejected") {
    setDeciding(id);
    try {
      const res = await fetch(`/api/mission-control/approvals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, decision }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, status: decision } : item,
          ),
        );
      }
    } catch (e) {
      console.error("Failed to submit decision:", e);
    } finally {
      setDeciding(null);
    }
  }

  useEffect(() => {
    fetchApprovals();
  }, []);

  const pendingItems = items.filter((i) => i.status === "pending");
  const decidedItems = items.filter((i) => i.status !== "pending");

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Approval Queue</h1>
          <p className="text-sm text-zinc-500">
            {pendingItems.length} item{pendingItems.length !== 1 ? "s" : ""}{" "}
            awaiting your decision
          </p>
        </div>
        <button
          onClick={fetchApprovals}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Pending Items */}
      {pendingItems.length === 0 && !loading ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-16 text-center">
          <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-500/50" />
          <p className="text-lg font-medium text-zinc-300">All clear</p>
          <p className="text-sm text-zinc-500">
            No items pending approval. Check back later.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingItems.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
            >
              <div className="flex items-start gap-4">
                <ItemTypeIcon type={item.item_type} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-zinc-200">{item.title}</h3>
                    <PriorityBadge priority={item.priority} />
                  </div>
                  {item.description && (
                    <p className="mt-1 text-sm text-zinc-400">
                      {item.description}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-4 text-xs text-zinc-600">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                    {item.source_skill && (
                      <span className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        {item.source_skill}
                      </span>
                    )}
                  </div>
                  {item.preview_data &&
                    Object.keys(item.preview_data).length > 0 && (
                      <div className="mt-3 rounded-lg bg-zinc-950 p-3">
                        <pre className="max-h-32 overflow-auto text-xs text-zinc-400">
                          {JSON.stringify(item.preview_data, null, 2)}
                        </pre>
                      </div>
                    )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => handleDecision(item.id, "approved")}
                    disabled={deciding === item.id}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-900/30 px-3 py-1.5 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-900/50 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleDecision(item.id, "rejected")}
                    disabled={deciding === item.id}
                    className="flex items-center gap-1.5 rounded-lg bg-red-900/30 px-3 py-1.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-900/50 disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Decided Items */}
      {decidedItems.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-zinc-300">
            Recent Decisions
          </h2>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800">
            {decidedItems.slice(0, 10).map((item) => (
              <div key={item.id} className="flex items-center gap-4 px-4 py-3">
                <ItemTypeIcon type={item.item_type} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-zinc-400">{item.title}</p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    item.status === "approved"
                      ? "bg-emerald-900/30 text-emerald-400"
                      : "bg-red-900/30 text-red-400"
                  }`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
