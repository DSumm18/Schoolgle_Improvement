"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import useSWR from "swr";
import { useAuth } from "@/context/SupabaseAuthContext";
import { fetcher } from "@/lib/fetchers";
import {
  Shield,
  AlertTriangle,
  Plus,
  Filter,
  ChevronDown,
  ChevronRight,
  Clock,
  Search,
  X,
} from "lucide-react";
import {
  getRiskBand,
  getHeatMapData,
  type Risk,
  type RiskCategory,
  type RiskStatus,
  type RiskTier,
  type RiskBand,
  type DirectionOfTravel,
} from "@/lib/risk-engine";
import { RiskHeatMap } from "@/components/risk/RiskHeatMap";
import { RiskScoreBadge } from "@/components/risk/RiskScoreBadge";
import { RiskDirectionIndicator } from "@/components/risk/RiskDirectionIndicator";

// ---------------------------------------------------------------------------
// Types for API response
// ---------------------------------------------------------------------------

interface RiskRow extends Risk {
  residual_score: number;
  effective_score: number;
  risk_band: RiskBand;
  direction_of_travel: DirectionOfTravel;
  above_appetite: boolean;
  owner_name?: string;
  mitigations_total: number;
  mitigations_overdue: number;
}

interface RiskApiResponse {
  risks: RiskRow[];
  summary: {
    total: number;
    critical: number;
    above_appetite: number;
    overdue_mitigations: number;
  };
}

// ---------------------------------------------------------------------------
// Category label / badge helpers
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<RiskCategory, string> = {
  safeguarding: "Safeguarding",
  h_and_s: "H&S",
  financial: "Financial",
  reputational: "Reputation",
  legal: "Legal",
  operational: "Operational",
  educational: "Educational",
  staffing: "Staffing",
  cyber: "Cyber",
  governance: "Governance",
  strategic: "Strategic",
  equality: "Equality",
};

const CATEGORY_COLORS: Record<RiskCategory, string> = {
  safeguarding:
    "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  h_and_s:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  financial:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  reputational:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  legal: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  operational:
    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  educational: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  staffing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  cyber:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  governance:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  strategic: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  equality:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
};

const STATUS_LABELS: Record<RiskStatus, string> = {
  identified: "Identified",
  assessing: "Assessing",
  treating: "Treating",
  tolerated: "Tolerated",
  accepted: "Accepted",
  closed: "Closed",
};

const STATUS_COLORS: Record<RiskStatus, string> = {
  identified:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  assessing:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  treating:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  tolerated:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  accepted:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  closed: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

const BAND_LABELS: Record<RiskBand, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

const BAND_BADGE_COLORS: Record<RiskBand, string> = {
  low: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  medium:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  critical: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
};

const TIER_LABELS: Record<RiskTier, string> = {
  strategic: "Strategic",
  operational: "Operational",
  school: "School",
};

// ---------------------------------------------------------------------------
// Filter dropdown component
// ---------------------------------------------------------------------------

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-card border border-border rounded-lg pl-3 pr-8 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
      >
        <option value="">{label}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  borderColor,
  icon: Icon,
  subtitle,
}: {
  label: string;
  value: number;
  borderColor: string;
  icon: React.ElementType;
  subtitle?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card border border-border rounded-2xl p-5 border-l-4 ${borderColor}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            {label}
          </p>
          <p className="text-3xl font-black mt-1">{value}</p>
          {subtitle && (
            <p className="text-[10px] text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-muted-foreground" />
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function RiskRegisterPage() {
  const { organization } = useAuth();
  const organizationId = organization?.id || "";

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [bandFilter, setBandFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [heatMapFilter, setHeatMapFilter] = useState<{
    likelihood: number;
    impact: number;
  } | null>(null);

  // Fetch risks
  const { data, isLoading } = useSWR<RiskApiResponse>(
    organizationId ? `/api/risk?organizationId=${organizationId}` : null,
    fetcher,
    { refreshInterval: 30000 },
  );

  const risks = data?.risks ?? [];
  const summary = data?.summary ?? {
    total: 0,
    critical: 0,
    above_appetite: 0,
    overdue_mitigations: 0,
  };

  // Heat map data from active risks
  const activeRisks = useMemo(
    () => risks.filter((r) => r.status !== "closed"),
    [risks],
  );
  const heatMapMatrix = useMemo(
    () => getHeatMapData(activeRisks),
    [activeRisks],
  );

  // Filtered risks
  const filteredRisks = useMemo(() => {
    let result = risks;

    if (statusFilter) {
      result = result.filter((r) => r.status === statusFilter);
    }
    if (categoryFilter) {
      result = result.filter((r) =>
        r.risk_categories.includes(categoryFilter as RiskCategory),
      );
    }
    if (tierFilter) {
      result = result.filter((r) => r.tier === tierFilter);
    }
    if (bandFilter) {
      result = result.filter((r) => r.risk_band === bandFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.risk_ref.toLowerCase().includes(q) ||
          (r.description ?? "").toLowerCase().includes(q),
      );
    }
    if (heatMapFilter) {
      result = result.filter((r) => {
        const lk = Math.round(
          r.override_residual_likelihood ?? r.system_residual_likelihood,
        );
        const im = Math.round(
          r.override_residual_impact ?? r.system_residual_impact,
        );
        return lk === heatMapFilter.likelihood && im === heatMapFilter.impact;
      });
    }

    return result;
  }, [
    risks,
    statusFilter,
    categoryFilter,
    tierFilter,
    bandFilter,
    searchQuery,
    heatMapFilter,
  ]);

  const hasActiveFilters =
    statusFilter ||
    categoryFilter ||
    tierFilter ||
    bandFilter ||
    searchQuery ||
    heatMapFilter;

  function clearFilters() {
    setStatusFilter("");
    setCategoryFilter("");
    setTierFilter("");
    setBandFilter("");
    setSearchQuery("");
    setHeatMapFilter(null);
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
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">
              Risk Register
            </h1>
            <p className="text-sm text-muted-foreground">
              Identify, assess and monitor risks across the organisation
            </p>
          </div>
        </div>
        <button className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" />
          Add Risk
        </button>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Risks"
          value={summary.total}
          borderColor="border-l-blue-500"
          icon={Shield}
          subtitle="Active register"
        />
        <StatCard
          label="Critical"
          value={summary.critical}
          borderColor="border-l-rose-500"
          icon={AlertTriangle}
          subtitle="Score 17-25"
        />
        <StatCard
          label="Above Appetite"
          value={summary.above_appetite}
          borderColor="border-l-orange-500"
          icon={AlertTriangle}
          subtitle="Exceed threshold"
        />
        <StatCard
          label="Overdue Mitigations"
          value={summary.overdue_mitigations}
          borderColor="border-l-amber-500"
          icon={Clock}
          subtitle="Controls past due"
        />
      </div>

      {/* Heat Map + Filters Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heat Map */}
        <div className="lg:col-span-2">
          <RiskHeatMap
            matrix={heatMapMatrix}
            onCellClick={(likelihood, impact) => {
              if (
                heatMapFilter?.likelihood === likelihood &&
                heatMapFilter?.impact === impact
              ) {
                setHeatMapFilter(null);
              } else {
                setHeatMapFilter({ likelihood, impact });
              }
            }}
          />
        </div>

        {/* Risk Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-5"
        >
          <h3 className="font-bold text-sm mb-4 text-muted-foreground uppercase tracking-wider">
            Risk Breakdown
          </h3>

          <div className="space-y-3">
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                By Band
              </p>
              {(["critical", "high", "medium", "low"] as RiskBand[]).map(
                (band) => {
                  const count = activeRisks.filter(
                    (r) => r.risk_band === band,
                  ).length;
                  const pct =
                    activeRisks.length > 0
                      ? Math.round((count / activeRisks.length) * 100)
                      : 0;
                  return (
                    <div key={band} className="flex items-center gap-2 mb-1.5">
                      <span
                        className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold min-w-[60px] text-center ${BAND_BADGE_COLORS[band]}`}
                      >
                        {BAND_LABELS[band]}
                      </span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            band === "critical"
                              ? "bg-rose-500"
                              : band === "high"
                                ? "bg-orange-400"
                                : band === "medium"
                                  ? "bg-yellow-400"
                                  : "bg-emerald-400"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold tabular-nums w-6 text-right">
                        {count}
                      </span>
                    </div>
                  );
                },
              )}
            </div>

            <div className="border-t border-border pt-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                By Status
              </p>
              {(
                [
                  "identified",
                  "assessing",
                  "treating",
                  "tolerated",
                  "accepted",
                  "closed",
                ] as RiskStatus[]
              ).map((status) => {
                const count = risks.filter((r) => r.status === status).length;
                if (count === 0) return null;
                return (
                  <div
                    key={status}
                    className="flex items-center justify-between py-1"
                  >
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${STATUS_COLORS[status]}`}
                    >
                      {STATUS_LABELS[status]}
                    </span>
                    <span className="text-xs font-bold tabular-nums">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-card border border-border rounded-2xl p-4"
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Filter className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Filters
            </span>
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search risks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border border-border rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <FilterSelect
            label="All Statuses"
            value={statusFilter}
            onChange={setStatusFilter}
            options={Object.entries(STATUS_LABELS).map(([v, l]) => ({
              value: v,
              label: l,
            }))}
          />

          <FilterSelect
            label="All Categories"
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={Object.entries(CATEGORY_LABELS).map(([v, l]) => ({
              value: v,
              label: l,
            }))}
          />

          <FilterSelect
            label="All Tiers"
            value={tierFilter}
            onChange={setTierFilter}
            options={Object.entries(TIER_LABELS).map(([v, l]) => ({
              value: v,
              label: l,
            }))}
          />

          <FilterSelect
            label="All Bands"
            value={bandFilter}
            onChange={setBandFilter}
            options={Object.entries(BAND_LABELS).map(([v, l]) => ({
              value: v,
              label: l,
            }))}
          />

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary font-medium transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}

          {heatMapFilter && (
            <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[10px] font-bold px-2.5 py-1 rounded-full">
              Heat map: L{heatMapFilter.likelihood} x I{heatMapFilter.impact}
              <button onClick={() => setHeatMapFilter(null)}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <span className="text-[10px] text-muted-foreground font-medium ml-auto">
            {filteredRisks.length} of {risks.length} risks
          </span>
        </div>
      </motion.div>

      {/* Risk Register Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-2xl overflow-hidden"
      >
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Loading risks...</p>
          </div>
        ) : filteredRisks.length === 0 ? (
          <div className="p-12 text-center">
            <Shield className="w-12 h-12 mx-auto mb-3 text-muted-foreground/20" />
            <p className="text-sm font-semibold">No risks found</p>
            <p className="text-xs text-muted-foreground mt-1">
              {hasActiveFilters
                ? "Try adjusting your filters"
                : "Click 'Add Risk' to create your first risk entry"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-8" />
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Ref
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Title
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Categories
                  </th>
                  <th className="text-center px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Inherent
                  </th>
                  <th className="text-center px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Residual
                  </th>
                  <th className="text-center px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Band
                  </th>
                  <th className="text-center px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Direction
                  </th>
                  <th className="text-center px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Owner
                  </th>
                  <th className="text-center px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Controls
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRisks.map((risk) => {
                  const isExpanded = expandedRow === risk.id;
                  const inherentScore =
                    risk.inherent_likelihood * risk.inherent_impact;

                  return (
                    <React.Fragment key={risk.id}>
                      <tr
                        className={`hover:bg-muted/30 transition-colors cursor-pointer ${
                          isExpanded ? "bg-muted/20" : ""
                        } ${risk.above_appetite ? "bg-rose-50/30 dark:bg-rose-950/10" : ""}`}
                        onClick={() =>
                          setExpandedRow(isExpanded ? null : risk.id)
                        }
                      >
                        <td className="px-4 py-3">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs font-bold text-muted-foreground">
                            {risk.risk_ref}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm truncate max-w-[250px]">
                              {risk.title}
                            </span>
                            {risk.above_appetite && (
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {risk.risk_categories.map((cat) => (
                              <span
                                key={cat}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${CATEGORY_COLORS[cat]}`}
                              >
                                {CATEGORY_LABELS[cat]}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <RiskScoreBadge score={inherentScore} size="sm" />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <RiskScoreBadge
                            score={risk.effective_score}
                            size="sm"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${BAND_BADGE_COLORS[risk.risk_band]}`}
                          >
                            {BAND_LABELS[risk.risk_band]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <RiskDirectionIndicator
                            direction={risk.direction_of_travel}
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold ${STATUS_COLORS[risk.status]}`}
                          >
                            {STATUS_LABELS[risk.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-muted-foreground">
                            {risk.owner_name ?? "--"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-xs font-bold tabular-nums">
                            {risk.mitigations_total > 0 ? (
                              <span
                                className={
                                  risk.mitigations_overdue > 0
                                    ? "text-rose-500"
                                    : "text-emerald-600 dark:text-emerald-400"
                                }
                              >
                                {risk.mitigations_total -
                                  risk.mitigations_overdue}
                                /{risk.mitigations_total}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">--</span>
                            )}
                          </span>
                        </td>
                      </tr>

                      {/* Expanded detail row */}
                      {isExpanded && (
                        <tr className="bg-muted/10">
                          <td colSpan={11} className="px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                              <div>
                                <p className="font-bold text-muted-foreground uppercase tracking-wider text-[10px] mb-1">
                                  Description
                                </p>
                                <p className="text-muted-foreground leading-relaxed">
                                  {risk.description ||
                                    "No description provided."}
                                </p>
                              </div>
                              <div>
                                <p className="font-bold text-muted-foreground uppercase tracking-wider text-[10px] mb-1">
                                  Scoring Detail
                                </p>
                                <div className="space-y-1 text-muted-foreground">
                                  <p>
                                    Inherent: L{risk.inherent_likelihood} x I
                                    {risk.inherent_impact} ={" "}
                                    <span className="font-bold text-foreground">
                                      {inherentScore}
                                    </span>
                                  </p>
                                  <p>
                                    System Residual: L
                                    {risk.system_residual_likelihood} x I
                                    {risk.system_residual_impact} ={" "}
                                    <span className="font-bold text-foreground">
                                      {risk.residual_score}
                                    </span>
                                  </p>
                                  {risk.target_score != null && (
                                    <p>
                                      Target Score:{" "}
                                      <span className="font-bold text-foreground">
                                        {risk.target_score}
                                      </span>
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div>
                                <p className="font-bold text-muted-foreground uppercase tracking-wider text-[10px] mb-1">
                                  Controls
                                </p>
                                <div className="space-y-1 text-muted-foreground">
                                  <p>
                                    Total mitigations:{" "}
                                    <span className="font-bold text-foreground">
                                      {risk.mitigations_total}
                                    </span>
                                  </p>
                                  {risk.mitigations_overdue > 0 && (
                                    <p className="text-rose-500 font-bold">
                                      {risk.mitigations_overdue} overdue
                                    </p>
                                  )}
                                  <p>
                                    Tier:{" "}
                                    <span className="font-bold text-foreground">
                                      {TIER_LABELS[risk.tier]}
                                    </span>
                                  </p>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
