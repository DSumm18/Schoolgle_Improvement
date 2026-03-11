"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import useSWR from "swr";
import { useAuth } from "@/context/SupabaseAuthContext";
import { fetcher } from "@/lib/fetchers";
import {
  TrendingUp,
  Plus,
  Target,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  CheckSquare,
  Sparkles,
  X,
  PoundSterling,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PlanType = "capital" | "improvement" | "financial";
type MoscowBand = "must" | "should" | "could" | "wont";
type ItemStatus =
  | "draft"
  | "approved"
  | "in_progress"
  | "complete"
  | "deferred";

interface StrategicPlan {
  id: string;
  title: string;
  type: PlanType;
  academic_year_start: string;
  duration_years: number;
  created_at: string;
  total_estimated_cost: number;
  item_count: number;
}

interface PlanItem {
  id: string;
  title: string;
  description: string;
  moscow_band: MoscowBand;
  estimated_cost: number;
  risk_score: number;
  statutory: boolean;
  status: ItemStatus;
  linked_risk_id?: string;
  linked_sdp_priority_id?: string;
  priority_rank?: number;
}

interface PrioritiseResult {
  items: PlanItem[];
  summary: {
    must_total: number;
    should_total: number;
    could_total: number;
    wont_total: number;
    total_cost: number;
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MOSCOW_COLORS: Record<MoscowBand, string> = {
  must: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800",
  should:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  could:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  wont: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700",
};

const MOSCOW_BORDER: Record<MoscowBand, string> = {
  must: "border-l-red-500",
  should: "border-l-amber-500",
  could: "border-l-blue-500",
  wont: "border-l-slate-400",
};

const MOSCOW_LABELS: Record<MoscowBand, string> = {
  must: "Must Have",
  should: "Should Have",
  could: "Could Have",
  wont: "Won't Have",
};

const STATUS_LABELS: Record<ItemStatus, string> = {
  draft: "Draft",
  approved: "Approved",
  in_progress: "In Progress",
  complete: "Complete",
  deferred: "Deferred",
};

const STATUS_COLORS: Record<ItemStatus, string> = {
  draft: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  approved:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  in_progress:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  complete:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  deferred:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
};

const PLAN_TYPE_LABELS: Record<PlanType, string> = {
  capital: "Capital",
  improvement: "Improvement",
  financial: "Financial",
};

const PLAN_TYPE_COLORS: Record<PlanType, string> = {
  capital: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  improvement: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  financial:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatGBP(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function currentAcademicYear(): string {
  const now = new Date();
  const year = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}/${year + 1}`;
}

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 animate-pulse">
      <div className="h-4 bg-muted rounded w-3/4 mb-3" />
      <div className="h-3 bg-muted rounded w-1/2 mb-2" />
      <div className="h-3 bg-muted rounded w-1/3" />
    </div>
  );
}

function Spinner({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-8">
      <Loader2 className="w-5 h-5 animate-spin text-primary" />
      <span className="text-sm text-muted-foreground">{text}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create Plan Modal
// ---------------------------------------------------------------------------

function CreatePlanForm({
  organizationId,
  onCreated,
  onCancel,
}: {
  organizationId: string;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<PlanType>("improvement");
  const [yearStart, setYearStart] = useState(currentAcademicYear());
  const [duration, setDuration] = useState(3);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/strategic-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          title: title.trim(),
          type,
          academic_year_start: yearStart,
          duration_years: duration,
        }),
      });
      if (!res.ok) throw new Error("Failed to create plan");
      onCreated();
    } catch {
      alert("Failed to create plan. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold">New Strategic Plan</h2>
        <button
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. 3-Year Capital Improvement Plan"
            required
            className="w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as PlanType)}
              className="w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="capital">Capital</option>
              <option value="improvement">Improvement</option>
              <option value="financial">Financial</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
              Academic Year Start
            </label>
            <input
              type="text"
              value={yearStart}
              onChange={(e) => setYearStart(e.target.value)}
              placeholder="2025/2026"
              className="w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
              Duration (years)
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} year{n > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Plan
          </button>
        </div>
      </form>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Add Item Form
// ---------------------------------------------------------------------------

function AddItemForm({
  planId,
  organizationId,
  onAdded,
  onCancel,
}: {
  planId: string;
  organizationId: string;
  onAdded: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [statutory, setStatutory] = useState(false);
  const [linkedRiskId, setLinkedRiskId] = useState("");
  const [linkedSdpPriorityId, setLinkedSdpPriorityId] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/strategic-plan/${planId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          title: title.trim(),
          description: description.trim(),
          estimated_cost: estimatedCost ? Number(estimatedCost) : 0,
          statutory,
          linked_risk_id: linkedRiskId || undefined,
          linked_sdp_priority_id: linkedSdpPriorityId || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to add item");
      onAdded();
    } catch {
      alert("Failed to add item. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-bold">Add Plan Item</h3>
        <button
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Replace boiler in Block A"
            required
            className="w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Describe the work, rationale and expected outcomes..."
            className="w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
              Estimated Cost
            </label>
            <div className="relative">
              <PoundSterling className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min="0"
                step="100"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                placeholder="0"
                className="w-full bg-transparent border border-border rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer py-2.5">
              <input
                type="checkbox"
                checked={statutory}
                onChange={(e) => setStatutory(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
              />
              <span className="text-sm font-medium">Statutory requirement</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
              Linked Risk ID (optional)
            </label>
            <input
              type="text"
              value={linkedRiskId}
              onChange={(e) => setLinkedRiskId(e.target.value)}
              placeholder="e.g. risk-uuid"
              className="w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
              Linked SDP Priority ID (optional)
            </label>
            <input
              type="text"
              value={linkedSdpPriorityId}
              onChange={(e) => setLinkedSdpPriorityId(e.target.value)}
              placeholder="e.g. sdp-priority-uuid"
              className="w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Add Item
          </button>
        </div>
      </form>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Plan Item Card
// ---------------------------------------------------------------------------

function PlanItemCard({ item }: { item: PlanItem }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card border border-border rounded-xl p-4 border-l-4 ${MOSCOW_BORDER[item.moscow_band]}`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {item.priority_rank != null && (
              <span className="text-[10px] font-bold text-muted-foreground bg-muted rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                {item.priority_rank}
              </span>
            )}
            <h4 className="font-semibold text-sm truncate">{item.title}</h4>
          </div>
          {item.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold ${MOSCOW_COLORS[item.moscow_band]}`}
          >
            {MOSCOW_LABELS[item.moscow_band]}
          </span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold ${STATUS_COLORS[item.status]}`}
          >
            {STATUS_LABELS[item.status]}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
        <span className="font-bold text-foreground">
          {formatGBP(item.estimated_cost)}
        </span>
        {item.risk_score > 0 && (
          <span className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Risk: {item.risk_score}
          </span>
        )}
        {item.statutory && (
          <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-bold">
            <CheckSquare className="w-3 h-3" />
            Statutory
          </span>
        )}
        {item.linked_risk_id && (
          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
            Linked to risk
          </span>
        )}
        {item.linked_sdp_priority_id && (
          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
            Linked to SDP
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Prioritisation Result Panel
// ---------------------------------------------------------------------------

function PrioritisationResult({
  result,
  onClose,
}: {
  result: PrioritiseResult;
  onClose: () => void;
}) {
  const { summary, items } = result;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border-2 border-primary/20 rounded-2xl p-6 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-base">Prioritised Plan</h3>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* MoSCoW summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["must", "should", "could", "wont"] as MoscowBand[]).map((band) => {
          const costs: Record<MoscowBand, number> = {
            must: summary.must_total,
            should: summary.should_total,
            could: summary.could_total,
            wont: summary.wont_total,
          };
          const count = items.filter((i) => i.moscow_band === band).length;
          return (
            <div
              key={band}
              className={`rounded-xl border p-3 ${MOSCOW_COLORS[band]}`}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                {MOSCOW_LABELS[band]}
              </p>
              <p className="text-lg font-black">{formatGBP(costs[band])}</p>
              <p className="text-[10px]">
                {count} item{count !== 1 ? "s" : ""}
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between bg-muted/50 rounded-xl px-4 py-3">
        <span className="text-sm font-bold text-muted-foreground">
          Total Estimated Cost
        </span>
        <span className="text-lg font-black">
          {formatGBP(summary.total_cost)}
        </span>
      </div>

      {/* Sorted items */}
      <div className="space-y-2">
        {items.map((item, idx) => (
          <PlanItemCard
            key={item.id}
            item={{ ...item, priority_rank: idx + 1 }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Plan Detail View
// ---------------------------------------------------------------------------

function PlanDetail({
  plan,
  organizationId,
  onBack,
}: {
  plan: StrategicPlan;
  organizationId: string;
  onBack: () => void;
}) {
  const [showAddItem, setShowAddItem] = useState(false);
  const [prioritising, setPrioritising] = useState(false);
  const [prioritiseResult, setPrioritiseResult] =
    useState<PrioritiseResult | null>(null);

  const {
    data: itemsData,
    isLoading: itemsLoading,
    mutate: mutateItems,
  } = useSWR<{ items: PlanItem[] }>(
    organizationId
      ? `/api/strategic-plan/${plan.id}/items?organizationId=${organizationId}`
      : null,
    fetcher,
  );

  const items = itemsData?.items ?? [];

  async function handlePrioritise() {
    setPrioritising(true);
    setPrioritiseResult(null);
    try {
      const res = await fetch(`/api/strategic-plan/${plan.id}/prioritise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId }),
      });
      if (!res.ok) throw new Error("Prioritisation failed");
      const data: PrioritiseResult = await res.json();
      setPrioritiseResult(data);
      mutateItems();
    } catch {
      alert("Failed to prioritise. Please try again.");
    } finally {
      setPrioritising(false);
    }
  }

  // Group items by MoSCoW band
  const grouped = {
    must: items.filter((i) => i.moscow_band === "must"),
    should: items.filter((i) => i.moscow_band === "should"),
    could: items.filter((i) => i.moscow_band === "could"),
    wont: items.filter((i) => i.moscow_band === "wont"),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black tracking-tight">
                {plan.title}
              </h2>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${PLAN_TYPE_COLORS[plan.type]}`}
              >
                {PLAN_TYPE_LABELS[plan.type]}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {plan.academic_year_start} &middot; {plan.duration_years} year
              {plan.duration_years > 1 ? "s" : ""} &middot; {items.length} item
              {items.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrioritise}
            disabled={prioritising || items.length === 0}
            className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/20 transition-colors disabled:opacity-50"
          >
            {prioritising ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Prioritise
          </button>
          <button
            onClick={() => setShowAddItem(true)}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
      </motion.div>

      {/* Add item form */}
      {showAddItem && (
        <AddItemForm
          planId={plan.id}
          organizationId={organizationId}
          onAdded={() => {
            setShowAddItem(false);
            mutateItems();
          }}
          onCancel={() => setShowAddItem(false)}
        />
      )}

      {/* Prioritisation result */}
      {prioritiseResult && (
        <PrioritisationResult
          result={prioritiseResult}
          onClose={() => setPrioritiseResult(null)}
        />
      )}

      {/* Items */}
      {itemsLoading ? (
        <Spinner text="Loading plan items..." />
      ) : items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-card border border-border rounded-2xl p-12 text-center"
        >
          <Target className="w-12 h-12 mx-auto mb-3 text-muted-foreground/20" />
          <p className="text-sm font-semibold">No items yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Add competing demands to start building your strategic plan.
          </p>
        </motion.div>
      ) : (
        !prioritiseResult && (
          <div className="space-y-6">
            {(["must", "should", "could", "wont"] as MoscowBand[]).map(
              (band) => {
                const bandItems = grouped[band];
                if (bandItems.length === 0) return null;
                const bandCost = bandItems.reduce(
                  (sum, i) => sum + i.estimated_cost,
                  0,
                );
                return (
                  <div key={band}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold ${MOSCOW_COLORS[band]}`}
                        >
                          {MOSCOW_LABELS[band]}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {bandItems.length} item
                          {bandItems.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <span className="text-sm font-bold">
                        {formatGBP(bandCost)}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {bandItems.map((item) => (
                        <PlanItemCard key={item.id} item={item} />
                      ))}
                    </div>
                  </div>
                );
              },
            )}
          </div>
        )
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function StrategicPlanPage() {
  const { organization } = useAuth();
  const organizationId = organization?.id || "";

  const [showCreate, setShowCreate] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<StrategicPlan | null>(null);

  const {
    data: plansData,
    isLoading,
    mutate: mutatePlans,
  } = useSWR<{ plans: StrategicPlan[] }>(
    organizationId
      ? `/api/strategic-plan?organizationId=${organizationId}`
      : null,
    fetcher,
  );

  const plans = plansData?.plans ?? [];

  if (selectedPlan) {
    return (
      <div className="p-6 md:p-8 min-h-screen max-w-[1600px] mx-auto">
        <PlanDetail
          plan={selectedPlan}
          organizationId={organizationId}
          onBack={() => setSelectedPlan(null)}
        />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-sky-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">
              Strategic Plans
            </h1>
            <p className="text-sm text-muted-foreground">
              Multi-year capital and improvement planning with MoSCoW
              prioritisation
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          New Plan
        </button>
      </motion.div>

      {/* Summary Stats */}
      {!isLoading && plans.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-5 border-l-4 border-l-sky-500"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Active Plans
                </p>
                <p className="text-3xl font-black mt-1">{plans.length}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                <Target className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-card border border-border rounded-2xl p-5 border-l-4 border-l-teal-500"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Total Items
                </p>
                <p className="text-3xl font-black mt-1">
                  {plans.reduce((sum, p) => sum + p.item_count, 0)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-2xl p-5 border-l-4 border-l-amber-500"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Total Estimated
                </p>
                <p className="text-3xl font-black mt-1">
                  {formatGBP(
                    plans.reduce((sum, p) => sum + p.total_estimated_cost, 0),
                  )}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                <PoundSterling className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-card border border-border rounded-2xl p-5 border-l-4 border-l-red-500"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Plan Types
                </p>
                <div className="flex gap-1.5 mt-2">
                  {(["capital", "improvement", "financial"] as PlanType[]).map(
                    (t) => {
                      const count = plans.filter((p) => p.type === t).length;
                      if (count === 0) return null;
                      return (
                        <span
                          key={t}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${PLAN_TYPE_COLORS[t]}`}
                        >
                          {count} {PLAN_TYPE_LABELS[t]}
                        </span>
                      );
                    },
                  )}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Create plan form */}
      {showCreate && (
        <CreatePlanForm
          organizationId={organizationId}
          onCreated={() => {
            setShowCreate(false);
            mutatePlans();
          }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {/* Plans list */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <SkeletonCard key={n} />
          ))}
        </div>
      ) : plans.length === 0 && !showCreate ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-card border border-border rounded-2xl p-12 text-center"
        >
          <TrendingUp className="w-12 h-12 mx-auto mb-3 text-muted-foreground/20" />
          <p className="text-sm font-semibold">No strategic plans yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Create your first plan to start prioritising competing demands.
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setSelectedPlan(plan)}
              className="bg-card border border-border rounded-2xl p-5 cursor-pointer hover:border-primary/30 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold text-sm group-hover:text-primary transition-colors line-clamp-2">
                  {plan.title}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ml-2 ${PLAN_TYPE_COLORS[plan.type]}`}
                >
                  {PLAN_TYPE_LABELS[plan.type]}
                </span>
              </div>

              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Academic Year</span>
                  <span className="font-bold text-foreground">
                    {plan.academic_year_start}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Duration</span>
                  <span className="font-bold text-foreground">
                    {plan.duration_years} year
                    {plan.duration_years > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Items</span>
                  <span className="font-bold text-foreground">
                    {plan.item_count}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-2">
                  <span>Estimated Cost</span>
                  <span className="font-bold text-foreground">
                    {formatGBP(plan.total_estimated_cost)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
