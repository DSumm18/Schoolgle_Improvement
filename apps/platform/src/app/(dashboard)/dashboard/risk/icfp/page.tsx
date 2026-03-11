"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import useSWR from "swr";
import { useAuth } from "@/context/SupabaseAuthContext";
import { fetcher } from "@/lib/fetchers";
import {
  BarChart3,
  Users,
  PoundSterling,
  TrendingUp,
  Calculator,
  Camera,
  Plus,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ICFPSnapshot {
  id: string;
  organization_id: string;
  academic_year: string;
  snapshot_date: string;
  staffing_percent: number | null;
  pupil_teacher_ratio: number | null;
  average_class_size: number | null;
  average_teacher_cost: number | null;
  teacher_contact_ratio: number | null;
  leadership_percent: number | null;
  leadership_fte_percent: number | null;
  total_income: number | null;
  total_staff_costs: number | null;
  fte_teachers: number | null;
  fte_leadership: number | null;
  nor: number | null;
  notes: string | null;
  created_at: string;
}

interface ICFPScenario {
  id: string;
  name: string;
  description: string | null;
  base_snapshot_id: string;
  adjustments: Record<string, unknown>;
  result_metrics: Record<string, number | null>;
  created_at: string;
}

interface ICFPApiResponse {
  snapshots: ICFPSnapshot[];
  scenarios: ICFPScenario[];
}

// ---------------------------------------------------------------------------
// Metric definitions
// ---------------------------------------------------------------------------

interface MetricDef {
  key: keyof ICFPSnapshot;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  format: (v: number) => string;
  target?: string;
  context?: string;
  getStatus: (v: number) => "green" | "amber" | "red";
}

const METRICS: MetricDef[] = [
  {
    key: "staffing_percent",
    label: "Staff Cost as % of Income",
    shortLabel: "Staffing %",
    icon: PoundSterling,
    format: (v) => `${v.toFixed(1)}%`,
    target: "\u226478%",
    context: "Red if >80%",
    getStatus: (v) => (v <= 78 ? "green" : v <= 80 ? "amber" : "red"),
  },
  {
    key: "pupil_teacher_ratio",
    label: "Pupil to Teacher Ratio",
    shortLabel: "PTR",
    icon: Users,
    format: (v) => v.toFixed(1),
    context: "National avg ~21 primary, ~16 secondary",
    getStatus: (v) =>
      v >= 14 && v <= 24 ? "green" : v >= 10 && v <= 28 ? "amber" : "red",
  },
  {
    key: "average_class_size",
    label: "Average Class Size",
    shortLabel: "Class Size",
    icon: BarChart3,
    format: (v) => v.toFixed(1),
    context: "Max 30 primary, varies secondary",
    getStatus: (v) => (v <= 28 ? "green" : v <= 30 ? "amber" : "red"),
  },
  {
    key: "average_teacher_cost",
    label: "Average Teacher Cost",
    shortLabel: "Avg Teacher Cost",
    icon: PoundSterling,
    format: (v) =>
      `\u00a3${v.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`,
    context: "Includes on-costs (NI, pension)",
    getStatus: (v) => (v <= 55000 ? "green" : v <= 65000 ? "amber" : "red"),
  },
  {
    key: "teacher_contact_ratio",
    label: "Teacher Contact Ratio",
    shortLabel: "TCR",
    icon: TrendingUp,
    format: (v) => v.toFixed(2),
    target: "0.78",
    context: "Proportion of time teaching",
    getStatus: (v) =>
      v >= 0.75 && v <= 0.8 ? "green" : v >= 0.7 && v <= 0.85 ? "amber" : "red",
  },
  {
    key: "leadership_percent",
    label: "Leadership Cost as % of Staff",
    shortLabel: "Leadership %",
    icon: Calculator,
    format: (v) => `${v.toFixed(1)}%`,
    context: "Typical 5\u201310%",
    getStatus: (v) =>
      v >= 5 && v <= 10 ? "green" : v >= 3 && v <= 13 ? "amber" : "red",
  },
  {
    key: "leadership_fte_percent",
    label: "Leadership FTE as % of Teaching FTE",
    shortLabel: "Leadership FTE %",
    icon: Users,
    format: (v) => `${v.toFixed(1)}%`,
    context: "Varies by school size",
    getStatus: (v) =>
      v >= 5 && v <= 15 ? "green" : v >= 3 && v <= 20 ? "amber" : "red",
  },
];

// ---------------------------------------------------------------------------
// Status indicator colours
// ---------------------------------------------------------------------------

const STATUS_STYLES: Record<
  "green" | "amber" | "red",
  { bg: string; border: string; dot: string; label: string }
> = {
  green: {
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    border: "border-l-emerald-500",
    dot: "bg-emerald-500",
    label: "On Target",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-950/20",
    border: "border-l-amber-500",
    dot: "bg-amber-500",
    label: "Watch",
  },
  red: {
    bg: "bg-rose-50 dark:bg-rose-950/20",
    border: "border-l-rose-500",
    dot: "bg-rose-500",
    label: "Action Needed",
  },
};

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(v: number | null): string {
  if (v == null) return "--";
  return `\u00a3${v.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;
}

// ---------------------------------------------------------------------------
// Metric Card
// ---------------------------------------------------------------------------

function MetricCard({ def, value }: { def: MetricDef; value: number | null }) {
  const status = value != null ? def.getStatus(value) : null;
  const style = status ? STATUS_STYLES[status] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card border border-border rounded-2xl p-5 border-l-4 ${style?.border ?? "border-l-muted"}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
            {def.shortLabel}
          </p>
          <p className="text-3xl font-black mt-1 tabular-nums">
            {value != null ? def.format(value) : "--"}
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 ml-2">
          <def.icon className="w-5 h-5 text-muted-foreground" />
        </div>
      </div>

      {/* Status + Target */}
      <div className="flex items-center justify-between gap-2">
        {status && style && (
          <span
            className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${style.bg}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
            {style.label}
          </span>
        )}
        {def.target && (
          <span className="text-[10px] text-muted-foreground font-medium">
            Target: {def.target}
          </span>
        )}
      </div>

      {def.context && (
        <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
          {def.context}
        </p>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Scenario form
// ---------------------------------------------------------------------------

interface ScenarioFormData {
  name: string;
  description: string;
  add_teachers: string;
  remove_tas: string;
  change_nor: string;
  salary_uplift_percent: string;
}

const EMPTY_FORM: ScenarioFormData = {
  name: "",
  description: "",
  add_teachers: "0",
  remove_tas: "0",
  change_nor: "0",
  salary_uplift_percent: "0",
};

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ICFPDashboardPage() {
  const { organization } = useAuth();
  const organizationId = organization?.id || "";

  const { data, isLoading, mutate } = useSWR<ICFPApiResponse>(
    organizationId ? `/api/icfp?organizationId=${organizationId}` : null,
    fetcher,
    { refreshInterval: 30000 },
  );

  const snapshots = data?.snapshots ?? [];
  const scenarios = data?.scenarios ?? [];
  const latest = snapshots[0] ?? null;
  const historicalSnapshots = snapshots.slice(0, 3);

  // Scenario form state
  const [showScenarioForm, setShowScenarioForm] = useState(false);
  const [scenarioForm, setScenarioForm] =
    useState<ScenarioFormData>(EMPTY_FORM);
  const [scenarioResult, setScenarioResult] = useState<Record<
    string,
    number | null
  > | null>(null);
  const [submittingScenario, setSubmittingScenario] = useState(false);
  const [takingSnapshot, setTakingSnapshot] = useState(false);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  async function handleTakeSnapshot() {
    if (!organizationId) return;
    setTakingSnapshot(true);
    try {
      const res = await fetch("/api/icfp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId }),
      });
      if (!res.ok) throw new Error("Failed to take snapshot");
      await mutate();
    } catch (err) {
      console.error("Snapshot error:", err);
    } finally {
      setTakingSnapshot(false);
    }
  }

  async function handleCreateScenario() {
    if (!organizationId || !latest) return;
    setSubmittingScenario(true);
    try {
      const adjustments = {
        add_teachers: parseFloat(scenarioForm.add_teachers) || 0,
        remove_tas: parseFloat(scenarioForm.remove_tas) || 0,
        change_nor: parseInt(scenarioForm.change_nor, 10) || 0,
        salary_uplift_percent:
          parseFloat(scenarioForm.salary_uplift_percent) || 0,
      };
      const res = await fetch("/api/icfp/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          snapshotId: latest.id,
          name: scenarioForm.name || "Untitled Scenario",
          description: scenarioForm.description,
          adjustments,
        }),
      });
      if (!res.ok) throw new Error("Failed to create scenario");
      const result = await res.json();
      setScenarioResult(result.result_metrics ?? null);
      await mutate();
    } catch (err) {
      console.error("Scenario error:", err);
    } finally {
      setSubmittingScenario(false);
    }
  }

  function updateFormField(field: keyof ScenarioFormData, value: string) {
    setScenarioForm((prev) => ({ ...prev, [field]: value }));
  }

  // Count statuses
  const statusCounts = useMemo(() => {
    if (!latest) return { green: 0, amber: 0, red: 0 };
    let green = 0,
      amber = 0,
      red = 0;
    for (const m of METRICS) {
      const v = latest[m.key] as number | null;
      if (v == null) continue;
      const s = m.getStatus(v);
      if (s === "green") green++;
      else if (s === "amber") amber++;
      else red++;
    }
    return { green, amber, red };
  }, [latest]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Calculator className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">
              ICFP Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Integrated Curriculum Financial Planning &mdash; the
              &ldquo;Magnificent Seven&rdquo; metrics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setShowScenarioForm((v) => !v);
              setScenarioResult(null);
              setScenarioForm(EMPTY_FORM);
            }}
            className="inline-flex items-center gap-2 bg-card border border-border text-foreground px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-muted/50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Scenario
          </button>
          <button
            onClick={handleTakeSnapshot}
            disabled={takingSnapshot || !organizationId}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {takingSnapshot ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
            Take Snapshot
          </button>
        </div>
      </motion.div>

      {/* Summary strip */}
      {latest && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-4 flex flex-wrap items-center gap-4 text-xs"
        >
          <span className="font-bold text-muted-foreground uppercase tracking-wider">
            Summary
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-bold">{statusCounts.green}</span> on target
          </span>
          <span className="inline-flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-bold">{statusCounts.amber}</span> watch
          </span>
          <span className="inline-flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span className="font-bold">{statusCounts.red}</span> action needed
          </span>
          <span className="text-muted-foreground ml-auto">
            Latest snapshot: {formatDate(latest.snapshot_date)}
          </span>
        </motion.div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading ICFP data...</p>
        </div>
      )}

      {/* No data state */}
      {!isLoading && !latest && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-12 text-center"
        >
          <Calculator className="w-12 h-12 mx-auto mb-3 text-muted-foreground/20" />
          <p className="text-sm font-semibold">No ICFP snapshots yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Click &ldquo;Take Snapshot&rdquo; to capture your current metrics
            from budget data.
          </p>
        </motion.div>
      )}

      {/* Magnificent Seven metric cards */}
      {latest && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {METRICS.map((m, i) => (
            <motion.div
              key={m.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <MetricCard def={m} value={latest[m.key] as number | null} />
            </motion.div>
          ))}
        </div>
      )}

      {/* New Scenario section */}
      {showScenarioForm && latest && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-card border border-border rounded-2xl p-6 space-y-5"
        >
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">New Scenario</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Model what-if changes and see how they affect your ICFP metrics
            compared to the current baseline.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Scenario Name
              </label>
              <input
                type="text"
                value={scenarioForm.name}
                onChange={(e) => updateFormField("name", e.target.value)}
                placeholder="e.g. Recruit extra maths teacher"
                className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Description
              </label>
              <input
                type="text"
                value={scenarioForm.description}
                onChange={(e) => updateFormField("description", e.target.value)}
                placeholder="Brief description of the scenario"
                className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Add Teachers (FTE)
              </label>
              <input
                type="number"
                step="0.5"
                value={scenarioForm.add_teachers}
                onChange={(e) =>
                  updateFormField("add_teachers", e.target.value)
                }
                className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Remove TAs (FTE)
              </label>
              <input
                type="number"
                step="0.5"
                value={scenarioForm.remove_tas}
                onChange={(e) => updateFormField("remove_tas", e.target.value)}
                className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Change NOR (pupils)
              </label>
              <input
                type="number"
                step="1"
                value={scenarioForm.change_nor}
                onChange={(e) => updateFormField("change_nor", e.target.value)}
                placeholder="+10 or -5"
                className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Salary Uplift (%)
              </label>
              <input
                type="number"
                step="0.5"
                value={scenarioForm.salary_uplift_percent}
                onChange={(e) =>
                  updateFormField("salary_uplift_percent", e.target.value)
                }
                placeholder="e.g. 3.5"
                className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary tabular-nums"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleCreateScenario}
              disabled={submittingScenario}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submittingScenario ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <TrendingUp className="w-4 h-4" />
              )}
              Run Scenario
            </button>
            <button
              onClick={() => {
                setShowScenarioForm(false);
                setScenarioResult(null);
              }}
              className="text-sm text-muted-foreground font-medium hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>

          {/* Scenario results comparison */}
          {scenarioResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-t border-border pt-5 mt-4"
            >
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Scenario Results vs Baseline
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Metric
                      </th>
                      <th className="text-right px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Baseline
                      </th>
                      <th className="text-right px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Scenario
                      </th>
                      <th className="text-right px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Change
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {METRICS.map((m) => {
                      const baseVal = latest[m.key] as number | null;
                      const scenVal =
                        (scenarioResult[m.key as string] as number | null) ??
                        null;
                      const diff =
                        baseVal != null && scenVal != null
                          ? scenVal - baseVal
                          : null;
                      const baseStatus =
                        baseVal != null ? m.getStatus(baseVal) : null;
                      const scenStatus =
                        scenVal != null ? m.getStatus(scenVal) : null;

                      return (
                        <tr
                          key={m.key}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-3 py-2 font-medium text-xs">
                            {m.shortLabel}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-xs">
                            {baseVal != null ? (
                              <span className="inline-flex items-center gap-1.5">
                                {m.format(baseVal)}
                                <span
                                  className={`w-2 h-2 rounded-full ${STATUS_STYLES[baseStatus!].dot}`}
                                />
                              </span>
                            ) : (
                              "--"
                            )}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-xs">
                            {scenVal != null ? (
                              <span className="inline-flex items-center gap-1.5">
                                {m.format(scenVal)}
                                <span
                                  className={`w-2 h-2 rounded-full ${STATUS_STYLES[scenStatus!].dot}`}
                                />
                              </span>
                            ) : (
                              "--"
                            )}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-xs font-bold">
                            {diff != null ? (
                              <span
                                className={
                                  diff > 0
                                    ? "text-rose-500"
                                    : diff < 0
                                      ? "text-emerald-500"
                                      : "text-muted-foreground"
                                }
                              >
                                {diff > 0 ? "+" : ""}
                                {m.format(diff)}
                              </span>
                            ) : (
                              "--"
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Historical Trend */}
      {historicalSnapshots.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-2xl overflow-hidden"
        >
          <div className="p-5 border-b border-border">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              Historical Trend
            </h2>
            <p className="text-[10px] text-muted-foreground mt-1">
              Comparing the last {historicalSnapshots.length} snapshots
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Metric
                  </th>
                  {historicalSnapshots.map((s) => (
                    <th
                      key={s.id}
                      className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                    >
                      {formatDate(s.snapshot_date)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {METRICS.map((m) => (
                  <tr
                    key={m.key}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-xs">
                      {m.shortLabel}
                    </td>
                    {historicalSnapshots.map((s) => {
                      const val = s[m.key] as number | null;
                      const status = val != null ? m.getStatus(val) : null;
                      return (
                        <td
                          key={s.id}
                          className="px-4 py-3 text-right tabular-nums text-xs"
                        >
                          {val != null ? (
                            <span className="inline-flex items-center gap-1.5 justify-end">
                              {m.format(val)}
                              <span
                                className={`w-2 h-2 rounded-full ${STATUS_STYLES[status!].dot}`}
                              />
                            </span>
                          ) : (
                            <span className="text-muted-foreground">--</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {/* Extra context rows */}
                <tr className="hover:bg-muted/30 transition-colors border-t-2 border-border">
                  <td className="px-4 py-3 font-medium text-xs text-muted-foreground">
                    Total Income
                  </td>
                  {historicalSnapshots.map((s) => (
                    <td
                      key={s.id}
                      className="px-4 py-3 text-right tabular-nums text-xs text-muted-foreground"
                    >
                      {formatCurrency(s.total_income)}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-xs text-muted-foreground">
                    Total Staff Costs
                  </td>
                  {historicalSnapshots.map((s) => (
                    <td
                      key={s.id}
                      className="px-4 py-3 text-right tabular-nums text-xs text-muted-foreground"
                    >
                      {formatCurrency(s.total_staff_costs)}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-xs text-muted-foreground">
                    NOR
                  </td>
                  {historicalSnapshots.map((s) => (
                    <td
                      key={s.id}
                      className="px-4 py-3 text-right tabular-nums text-xs text-muted-foreground"
                    >
                      {s.nor ?? "--"}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-xs text-muted-foreground">
                    FTE Teachers
                  </td>
                  {historicalSnapshots.map((s) => (
                    <td
                      key={s.id}
                      className="px-4 py-3 text-right tabular-nums text-xs text-muted-foreground"
                    >
                      {s.fte_teachers != null
                        ? s.fte_teachers.toFixed(1)
                        : "--"}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Saved scenarios */}
      {scenarios.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-card border border-border rounded-2xl overflow-hidden"
        >
          <div className="p-5 border-b border-border">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              Saved Scenarios
            </h2>
          </div>
          <div className="divide-y divide-border">
            {scenarios.map((sc) => (
              <div key={sc.id} className="px-5 py-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">{sc.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDate(sc.created_at)}
                  </span>
                </div>
                {sc.description && (
                  <p className="text-xs text-muted-foreground mb-2">
                    {sc.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-3 text-[10px]">
                  {METRICS.map((m) => {
                    const val =
                      (sc.result_metrics?.[m.key as string] as number | null) ??
                      null;
                    if (val == null) return null;
                    const status = m.getStatus(val);
                    return (
                      <span
                        key={m.key}
                        className="inline-flex items-center gap-1"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLES[status].dot}`}
                        />
                        <span className="font-medium text-muted-foreground">
                          {m.shortLabel}:
                        </span>
                        <span className="font-bold tabular-nums">
                          {m.format(val)}
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Info footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-start gap-2 text-[10px] text-muted-foreground p-4 bg-muted/30 rounded-xl"
      >
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold mb-0.5">About ICFP</p>
          <p className="leading-relaxed">
            The DfE&apos;s Integrated Curriculum Financial Planning (ICFP)
            framework uses seven key metrics to help schools align their
            curriculum with their budget. These metrics let you check staffing
            efficiency, compare against national benchmarks, and model scenarios
            before making decisions. Snapshots capture your current position;
            scenarios let you explore what-if changes.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
