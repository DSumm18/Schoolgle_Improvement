"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetchers";
import { Building2, Clock, CheckCircle2, XCircle, Lock, Save, RefreshCw } from "lucide-react";
import { ED_CHATBOT_MODULE_ID } from "@/lib/ed/visibility";

interface OrgRow {
  organizationId: string;
  name: string;
  parentOrganizationId: string | null;
  subscription: {
    status: string;
    enabled_modules: string[] | null;
    trial_end: string | null;
    current_period_end: string | null;
    plan_id: string;
    product: string;
    updated_at: string;
  } | null;
}

const ALL_MODULES = [
  "improvement",
  "governance",
  "finance",
  "hr",
  "estates",
  "connectors",
  "compliance",
  "safeguarding",
  "risk",
  "communications",
  "calendar",
  "surveys",
  "school-intelligence",
  "attendance",
  "send",
  "behaviour",
  "canvas",
  "teaching-learning",
  ED_CHATBOT_MODULE_ID,
];

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function statusBadge(status: string, daysRemaining: number | null) {
  if (status === "trialing") {
    const expired = daysRemaining !== null && daysRemaining <= 0;
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
          expired ? "bg-red-500/10 text-red-600" : "bg-blue-500/10 text-blue-600"
        }`}
      >
        <Clock size={12} />
        {expired ? "Trial expired" : `Trial (${daysRemaining}d)`}
      </span>
    );
  }
  if (status === "active")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-600">
        <CheckCircle2 size={12} /> Active
      </span>
    );
  if (status === "cancelled")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-red-500/10 text-red-600">
        <XCircle size={12} /> Cancelled
      </span>
    );
  if (status === "past_due")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-600">
        <Lock size={12} /> Past due
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-slate-500/10 text-slate-500">
      No subscription
    </span>
  );
}

export default function AdminSubscriptionsPage() {
  const { data, mutate, isLoading } = useSWR<{ rows: OrgRow[] }>(
    "/api/admin/subscription-state",
    fetcher,
    { revalidateOnFocus: false },
  );

  const rows = data?.rows || [];
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [editModules, setEditModules] = useState<Set<string>>(new Set());
  const [editTrialEnd, setEditTrialEnd] = useState<string>("");
  const [editStatus, setEditStatus] = useState<string>("trialing");
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selected = rows.find((r) => r.organizationId === selectedOrgId) || null;

  useEffect(() => {
    if (selected) {
      setEditModules(new Set(selected.subscription?.enabled_modules || []));
      setEditTrialEnd(
        selected.subscription?.trial_end
          ? selected.subscription.trial_end.slice(0, 10)
          : "",
      );
      setEditStatus(selected.subscription?.status || "trialing");
    }
  }, [selectedOrgId]);

  async function save() {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/subscription-state?organizationId=${selected.organizationId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enabled_modules: Array.from(editModules),
            trial_end: editTrialEnd ? new Date(editTrialEnd + "T23:59:59Z").toISOString() : null,
            status: editStatus,
          }),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setToast("Error: " + (err.error || res.statusText));
      } else {
        setToast("Saved");
        await mutate();
      }
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 2500);
    }
  }

  function toggleModule(mid: string) {
    const next = new Set(editModules);
    if (next.has(mid)) next.delete(mid);
    else next.add(mid);
    setEditModules(next);
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black">Subscription Management</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Toggle modules and trial end dates per organisation. Changes are live immediately.
          </p>
        </div>
        <button
          onClick={() => mutate()}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Refresh"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {toast && (
        <div className="fixed top-4 right-4 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {toast}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: org list */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
            <h2 className="font-bold">Organisations ({rows.length})</h2>
          </div>
          <div className="max-h-[70vh] overflow-y-auto">
            {isLoading && <div className="p-6 text-sm text-slate-500">Loading…</div>}
            {rows.map((r) => {
              const daysRemaining = daysUntil(
                r.subscription?.status === "trialing"
                  ? (r.subscription?.trial_end ?? null)
                  : (r.subscription?.current_period_end ?? null),
              );
              const isSelected = r.organizationId === selectedOrgId;
              return (
                <button
                  key={r.organizationId}
                  onClick={() => setSelectedOrgId(r.organizationId)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition ${
                    isSelected ? "bg-blue-50 dark:bg-blue-950/30" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 min-w-0">
                      <Building2 size={16} className="mt-1 text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="font-semibold text-sm truncate">
                          {r.name}
                          {r.parentOrganizationId && (
                            <span className="text-xs text-slate-400 font-normal ml-2">(child)</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {statusBadge(r.subscription?.status || "none", daysRemaining)}
                          {r.subscription?.enabled_modules?.length ? (
                            <span className="ml-2">
                              {r.subscription.enabled_modules.length} module
                              {r.subscription.enabled_modules.length === 1 ? "" : "s"}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT: editor */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          {!selected ? (
            <div className="text-sm text-slate-500">Select an organisation to edit its subscription.</div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-lg">{selected.name}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Org ID: <code className="text-[10px]">{selected.organizationId}</code>
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="trialing">Trialing</option>
                  <option value="active">Active</option>
                  <option value="past_due">Past due</option>
                  <option value="paused">Paused</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  {editStatus === "trialing" ? "Trial end date" : "Subscription end date"}
                </label>
                <input
                  type="date"
                  value={editTrialEnd}
                  onChange={(e) => setEditTrialEnd(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Access is cut off at 23:59 UTC on this date. Use a past date to simulate an expired subscription.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Enabled modules ({editModules.size} of {ALL_MODULES.length})
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_MODULES.map((mid) => (
                    <label
                      key={mid}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={editModules.has(mid)}
                        onChange={() => toggleModule(mid)}
                      />
                      <span className="text-sm font-medium">{mid}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={save}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-60"
                >
                  <Save size={16} />
                  {saving ? "Saving…" : "Save changes"}
                </button>
                <button
                  onClick={() => setSelectedOrgId(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
