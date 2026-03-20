"use client";

import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  CheckCircle2,
  AlertTriangle,
  Info,
  Database,
  Shield,
  BarChart3,
  ArrowLeft,
  Save,
  Pin,
  Cloud,
  FileSpreadsheet,
  TrendingUp,
  Filter,
  Layers,
} from "lucide-react";
import { useAuth } from "@/context/SupabaseAuthContext";
import useSWR from "swr";
import { fetcher } from "@/lib/fetchers";
import { CanvasChart } from "@/components/canvas/CanvasChart";
import { vizSpecToRechartsConfig } from "@/lib/canvas/viz-renderer";
import {
  BUSINESS_AREA_LABELS,
  BUSINESS_AREA_COLORS,
  type BusinessArea,
  type IngestResult,
  type VizSpec,
  type ChartType,
  type OverlayData,
} from "@/lib/canvas/types";
import { VizBuilders } from "@/lib/canvas/viz-renderer";
import { ReportBuilder } from "@/components/canvas/ReportBuilder";

// ─── Filter Definitions per Source ─────────────────────────

interface FilterDef {
  field: string;
  label: string;
  type: "select" | "date_range";
  options?: string[];
}

const SOURCE_FILTERS: Record<string, FilterDef[]> = {
  staff: [
    {
      field: "role_category",
      label: "Role",
      type: "select",
      options: [
        "All",
        "Leadership",
        "Teacher",
        "Teaching Assistant",
        "Support",
        "Admin",
        "Premises",
      ],
    },
    {
      field: "is_active",
      label: "Status",
      type: "select",
      options: ["Active", "All Staff"],
    },
  ],
  fms: [
    {
      field: "category",
      label: "Cost Centre",
      type: "select",
      options: [
        "All",
        "Staffing",
        "Premises",
        "Resources",
        "Energy",
        "ICT",
        "Training",
        "Other",
      ],
    },
    {
      field: "type",
      label: "Type",
      type: "select",
      options: ["All", "Income", "Expenditure"],
    },
  ],
  attendance: [
    {
      field: "year_group",
      label: "Year Group",
      type: "select",
      options: [
        "All",
        "Reception",
        "Year 1",
        "Year 2",
        "Year 3",
        "Year 4",
        "Year 5",
        "Year 6",
      ],
    },
    {
      field: "term",
      label: "Term",
      type: "select",
      options: ["All", "Autumn", "Spring", "Summer"],
    },
  ],
  risk: [
    {
      field: "status",
      label: "Status",
      type: "select",
      options: ["Open", "All"],
    },
    {
      field: "category",
      label: "Category",
      type: "select",
      options: [
        "All",
        "Financial",
        "Safeguarding",
        "Staffing",
        "Estates",
        "Governance",
        "Compliance",
      ],
    },
  ],
  send: [
    {
      field: "sen_type",
      label: "SEN Type",
      type: "select",
      options: ["All", "SEN Support (K)", "EHCP (E)"],
    },
    {
      field: "year_group",
      label: "Year Group",
      type: "select",
      options: [
        "All",
        "Reception",
        "Year 1",
        "Year 2",
        "Year 3",
        "Year 4",
        "Year 5",
        "Year 6",
      ],
    },
  ],
  estates: [
    {
      field: "priority",
      label: "Priority",
      type: "select",
      options: ["All", "Urgent", "High", "Medium", "Low"],
    },
    {
      field: "status",
      label: "Status",
      type: "select",
      options: ["Open", "All"],
    },
  ],
};

const CHART_TYPE_OPTIONS: Array<{ type: ChartType; label: string }> = [
  { type: "bar", label: "Bar" },
  { type: "line", label: "Line" },
  { type: "area", label: "Area" },
  { type: "pie", label: "Pie" },
  { type: "table", label: "Table" },
];

// ─── Main Page ─────────────────────────────────────────────

interface SourceSelection {
  id: string;
  name: string;
  category: string;
  type: "schoolgle" | "drive" | "dfe";
  recordCount?: number;
  dfeSuggestions?: Array<{ dfeTable: string; label: string; overlay: string }>;
}

// Map from connector category IDs to field-registry source IDs
const CATEGORY_TO_SOURCE: Record<string, string> = {
  staff: "staff",
  fms: "finance",
  finance: "finance",
  attendance: "attendance",
  send: "send",
  risk: "risks",
  estates: "estates",
};

export default function CanvasPage() {
  const [view, setView] = useState<"home" | "builder">("home");
  const [initialSourceId, setInitialSourceId] = useState<string>("staff");

  const handleExplore = (source: SourceSelection) => {
    const mappedId = CATEGORY_TO_SOURCE[source.category] || source.category;
    setInitialSourceId(mappedId);
    setView("builder");
  };

  const handleBack = () => {
    setView("home");
  };

  if (view === "builder") {
    return (
      <ReportBuilder initialSourceId={initialSourceId} onBack={handleBack} />
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
      <DataSourcesView onExplore={handleExplore} />
    </div>
  );
}

// ─── View 1: Your Data ────────────────────────────────────

function DataSourcesView({
  onExplore,
}: {
  onExplore: (source: SourceSelection) => void;
}) {
  const { organization } = useAuth();
  const organizationId = organization?.id || "";

  const { data, isLoading } = useSWR(
    organizationId
      ? `/api/canvas/connectors?organizationId=${organizationId}`
      : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const { data: savedData } = useSWR(
    organizationId
      ? `/api/canvas/reports?organizationId=${organizationId}&widget=true&limit=4`
      : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const drive = data?.drive || { connected: false, connectors: [] };
  const internal = (data?.internal || []) as Array<Record<string, unknown>>;
  const dfe = (data?.dfe || []) as Array<Record<string, unknown>>;
  const summary = data?.summary || {};
  const pinnedCanvases = savedData?.data || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
          <Database className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Canvas</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? "Loading your data sources..."
              : `${summary.activeSources || 0} active data sources — ${summary.driveFiles || 0} files in Google Drive`}
          </p>
        </div>
      </div>

      {/* Pinned Charts */}
      {pinnedCanvases.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Pinned Charts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {pinnedCanvases.map((c: Record<string, unknown>) => (
              <div
                key={String(c.id)}
                className="bg-card border border-border rounded-xl p-3"
              >
                <span className="text-xs font-bold">{String(c.title)}</span>
                <span className="text-[10px] text-muted-foreground block">
                  {String(c.business_area)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Schoolgle Platform Data */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Your School Data
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {internal.map((c) => {
                const hasData = ((c.recordCount as number) || 0) > 0;
                return (
                  <button
                    key={String(c.id)}
                    onClick={() =>
                      hasData
                        ? onExplore({
                            id: String(c.id),
                            name: String(c.name),
                            category: String(c.category),
                            type: "schoolgle",
                            recordCount: c.recordCount as number,
                            dfeSuggestions:
                              c.dfeSuggestions as SourceSelection["dfeSuggestions"],
                          })
                        : undefined
                    }
                    className={`text-left bg-card border border-border rounded-xl p-4 transition-all ${hasData ? "hover:border-emerald-500 hover:shadow-md cursor-pointer" : "opacity-50 cursor-default"}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${hasData ? "bg-emerald-500" : "bg-zinc-400"}`}
                        />
                        <span className="text-sm font-bold">
                          {String(c.name)}
                        </span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {hasData ? `${c.recordCount} records` : "No data"}
                      </span>
                    </div>
                    {hasData &&
                      (c.dfeSuggestions as Array<Record<string, string>>)
                        ?.length > 0 && (
                        <p className="text-[10px] text-purple-600 dark:text-purple-400 mt-1">
                          + DfE overlay:{" "}
                          {
                            (
                              c.dfeSuggestions as Array<Record<string, string>>
                            )[0].overlay
                          }
                        </p>
                      )}
                    {hasData ? (
                      <span className="text-[10px] text-emerald-600 font-semibold mt-2 block">
                        Explore data →
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground mt-2 block">
                        Import data via Smart Ingest
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Google Drive */}
          {drive.connected &&
            (drive.connectors as Array<Record<string, unknown>>).length > 0 && (
              <div className="space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Google Drive — {drive.folderName} ({drive.totalFiles} files)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(drive.connectors as Array<Record<string, unknown>>).map(
                    (c) => (
                      <button
                        key={String(c.id)}
                        onClick={() =>
                          onExplore({
                            id: String(c.id),
                            name: String(c.name),
                            category: String(c.category),
                            type: "drive",
                            recordCount: c.fileCount as number,
                            dfeSuggestions:
                              c.dfeSuggestions as SourceSelection["dfeSuggestions"],
                          })
                        }
                        className="text-left bg-card border border-blue-200 dark:border-blue-800 rounded-xl p-4 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="flex items-center gap-2">
                            <Cloud className="w-3 h-3 text-blue-500" />
                            <span className="text-sm font-bold">
                              {String(c.name)}
                            </span>
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {c.fileCount} files
                          </span>
                        </div>
                        {(c.dfeSuggestions as Array<Record<string, string>>)
                          ?.length > 0 && (
                          <p className="text-[10px] text-purple-600 dark:text-purple-400 mt-1">
                            + DfE overlay:{" "}
                            {
                              (
                                c.dfeSuggestions as Array<
                                  Record<string, string>
                                >
                              )[0].overlay
                            }
                          </p>
                        )}
                        <span className="text-[10px] text-blue-600 font-semibold mt-2 block">
                          Pick file & chart →
                        </span>
                      </button>
                    ),
                  )}
                </div>
              </div>
            )}

          {/* DfE National Data */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              DfE National Data
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {dfe.map((c) => (
                <button
                  key={String(c.id)}
                  onClick={() =>
                    onExplore({
                      id: String(c.id),
                      name: String(c.name),
                      category: String(c.category),
                      type: "dfe",
                      recordCount: c.recordCount as number,
                    })
                  }
                  className="text-left bg-card border border-purple-200 dark:border-purple-800 rounded-xl p-4 hover:border-purple-500 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold">{String(c.name)}</span>
                    <span className="text-xs text-muted-foreground">
                      {String(c.description)}
                    </span>
                  </div>
                  <span className="text-[10px] text-purple-600 font-semibold mt-2 block">
                    Explore national data →
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* GDPR */}
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                Drive data is read-only and processed in memory. Every decision
                is logged for GDPR Article 5(1)(d) compliance.
              </p>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}

// ─── View 2: Explore Data ──────────────────────────────────

function ExploreView({
  source,
  onBack,
}: {
  source: SourceSelection;
  onBack: () => void;
}) {
  const { organization, session } = useAuth();
  const organizationId = organization?.id || "";

  const [chartType, setChartType] = useState<ChartType>("bar");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeOverlayIds, setActiveOverlayIds] = useState<Set<string>>(
    new Set(),
  );

  // Build query string from filters
  const filterParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set(
      "type",
      source.category === "fms"
        ? "budget"
        : source.category === "risk"
          ? "risks"
          : source.category,
    );
    params.set("organizationId", organizationId);
    for (const [key, val] of Object.entries(filters)) {
      if (val && val !== "All" && val !== "All Staff" && val !== "Open") {
        params.set(key, val);
      }
    }
    if (activeOverlayIds.size > 0) {
      params.set("overlays", [...activeOverlayIds].join(","));
    }
    return params.toString();
  }, [source, organizationId, filters, activeOverlayIds]);

  const { data: reportData, isLoading } = useSWR(
    organizationId ? `/api/canvas/quick-report?${filterParams}` : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const availableFilters = SOURCE_FILTERS[source.category] || [];
  const charts = (reportData?.charts || []) as Array<Record<string, unknown>>;
  const empty = reportData?.empty;
  const title = reportData?.title || source.name;
  const subtitle = reportData?.subtitle;
  const availableOverlays = (reportData?.availableOverlays || []) as Array<{
    id: string;
    label: string;
    description: string;
    renderAs: string;
    color: string;
  }>;
  const overlayData = (reportData?.overlays || []) as OverlayData[];

  const handleSave = async (asWidget: boolean) => {
    setSaving(true);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session?.access_token)
        headers["Authorization"] = `Bearer ${session.access_token}`;

      await fetch(`/api/canvas/reports?organizationId=${organizationId}`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          title: title,
          businessArea: source.category,
          description: subtitle || `${chartType} chart from ${source.name}`,
          vizSpec: charts[0] || null,
          mode: "live",
          isWidget: asWidget,
        }),
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-black tracking-tight">{source.name}</h1>
            <p className="text-xs text-muted-foreground">
              {source.type === "schoolgle" &&
                `${source.recordCount || 0} records`}
              {source.type === "drive" &&
                `${source.recordCount || 0} files in Google Drive`}
              {source.type === "dfe" &&
                `National data — ${source.recordCount?.toLocaleString() || 0} records`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleSave(false)}
            disabled={saving || empty}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 disabled:opacity-50"
          >
            <Save className="w-3 h-3" />
            {saved ? "Saved!" : "Save"}
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving || empty}
            className="flex items-center gap-1.5 px-3 py-2 bg-muted rounded-lg text-xs font-semibold hover:bg-muted/80 disabled:opacity-50"
          >
            <Pin className="w-3 h-3" />
            Pin
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      {availableFilters.length > 0 && (
        <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          {availableFilters.map((f) => (
            <select
              key={f.field}
              value={filters[f.field] || f.options?.[0] || ""}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, [f.field]: e.target.value }))
              }
              className="bg-transparent border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {f.options?.map((opt) => (
                <option key={opt} value={opt}>
                  {f.label}: {opt}
                </option>
              ))}
            </select>
          ))}
        </div>
      )}

      {/* Layers Panel — toggle DfE overlays */}
      {availableOverlays.length > 0 && source.type !== "dfe" && (
        <div className="bg-card border border-border rounded-xl px-4 py-3 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5" />
            Layers
          </div>
          {/* School data — always on */}
          <div className="flex items-center gap-3 text-xs">
            <div className="w-8 flex justify-center">
              <div className="w-4 h-4 rounded bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              </div>
            </div>
            <div className="flex-1">
              <span className="font-semibold">Your School</span>
              <span className="text-muted-foreground ml-1.5">
                — {source.name} ({source.recordCount || 0} records)
              </span>
            </div>
          </div>
          {/* DfE overlays */}
          {availableOverlays.map((overlay) => {
            const isActive = activeOverlayIds.has(overlay.id);
            const isPieChart = chartType === "pie" || chartType === "donut";
            return (
              <div key={overlay.id} className="flex items-center gap-3 text-xs">
                <div className="w-8 flex justify-center">
                  <button
                    onClick={() => {
                      setActiveOverlayIds((prev) => {
                        const next = new Set(prev);
                        if (next.has(overlay.id)) {
                          next.delete(overlay.id);
                        } else {
                          next.add(overlay.id);
                        }
                        return next;
                      });
                    }}
                    disabled={isPieChart}
                    className={`w-8 h-4 rounded-full transition-colors relative ${
                      isActive && !isPieChart
                        ? "bg-purple-500"
                        : "bg-zinc-300 dark:bg-zinc-600"
                    } ${isPieChart ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                    title={
                      isPieChart
                        ? "Overlays not available for pie charts"
                        : `Toggle ${overlay.label}`
                    }
                  >
                    <div
                      className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${
                        isActive && !isPieChart
                          ? "translate-x-4"
                          : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
                <div className="flex-1 flex items-center gap-2">
                  {/* Colored line swatch */}
                  <svg width="20" height="10" className="shrink-0">
                    <line
                      x1="0"
                      y1="5"
                      x2="20"
                      y2="5"
                      stroke={overlay.color}
                      strokeWidth="2"
                      strokeDasharray="4 3"
                    />
                  </svg>
                  <div>
                    <span className="font-semibold">{overlay.label}</span>
                    <span className="text-muted-foreground ml-1.5 hidden sm:inline">
                      — {overlay.description}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Chart Type Toggle */}
      <div className="flex gap-1 bg-muted/50 p-1 rounded-lg w-fit">
        {CHART_TYPE_OPTIONS.map((ct) => (
          <button
            key={ct.type}
            onClick={() => setChartType(ct.type)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              chartType === ct.type
                ? "bg-white dark:bg-zinc-800 shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {ct.label}
          </button>
        ))}
      </div>

      {/* Chart Content */}
      {isLoading ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground mt-3">Loading data...</p>
        </div>
      ) : empty ? (
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <Info className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <h3 className="text-sm font-bold mb-1">{title}</h3>
          <p className="text-xs text-muted-foreground">
            {reportData?.message || "No data available for this source."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {subtitle && (
            <div className="bg-card border border-border rounded-xl px-4 py-2">
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
          )}

          {charts.map((chart) => {
            const chartData = (chart.data || []) as Record<string, unknown>[];
            if (chartData.length === 0) return null;

            const xKey = String(
              chart.xKey || Object.keys(chartData[0])[0] || "name",
            );
            const valueKey = chart.valueKey
              ? String(chart.valueKey)
              : undefined;
            const series = (chart.series ||
              (valueKey
                ? [{ field: valueKey, label: valueKey }]
                : [])) as Array<{
              field: string;
              label: string;
              color?: string;
            }>;
            const benchmark = chart.benchmark as
              | { label: string; value: number; color?: string }
              | undefined;

            const effectiveSeries =
              series.length > 0
                ? series
                : (() => {
                    const keys = Object.keys(chartData[0]).filter(
                      (k) => k !== xKey && typeof chartData[0][k] === "number",
                    );
                    return keys.map((k, i) => ({
                      field: k,
                      label: k
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (c: string) => c.toUpperCase()),
                      color: i === 1 ? "#94a3b8" : undefined,
                    }));
                  })();

            // Merge overlay data into chart if overlays are active
            const effectiveChartType =
              (chart.chartType as ChartType) || chartType;
            const isPieType =
              effectiveChartType === "pie" || effectiveChartType === "donut";
            const applicableOverlays = isPieType ? [] : overlayData;

            let finalData = chartData;
            let overlaySeries: Array<{
              dataKey: string;
              label: string;
              color: string;
              renderAs: "line" | "area_band" | "reference_line";
              dashPattern?: string;
              value?: number;
            }> = [];

            if (applicableOverlays.length > 0) {
              const merged = VizBuilders.mergeOverlays(
                chartData,
                applicableOverlays,
                xKey,
              );
              finalData = merged.mergedData;
              overlaySeries = merged.overlaySeries;
            }

            const config = vizSpecToRechartsConfig(
              {
                chartType: effectiveChartType,
                title: String(chart.title || ""),
                dataSource: { staticData: finalData },
                xAxis: {
                  field: xKey,
                  label: xKey.replace(/_/g, " "),
                  type: "category",
                },
                series: effectiveSeries,
                benchmark,
                dataSources: [
                  {
                    name:
                      source.type === "dfe"
                        ? "Department for Education"
                        : "Schoolgle",
                  },
                ],
              },
              finalData,
              {
                primaryColor:
                  BUSINESS_AREA_COLORS[source.category as BusinessArea] ||
                  "#0F6E56",
                schoolName: organization?.name || "School",
              },
            );

            // Inject overlay series into config
            if (overlaySeries.length > 0) {
              config.overlaySeries = overlaySeries;
            }

            return (
              <CanvasChart
                key={String(chart.id)}
                config={config}
                overlays={applicableOverlays}
                height={
                  (chart.chartType as string) === "metric_card" ? 150 : 400
                }
              />
            );
          })}
        </div>
      )}

      {/* DfE Overlay Suggestion — shown only when no overlays are active and layers are available */}
      {source.dfeSuggestions &&
        source.dfeSuggestions.length > 0 &&
        !empty &&
        activeOverlayIds.size === 0 &&
        availableOverlays.length === 0 && (
          <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-purple-800 dark:text-purple-200">
                  Overlay: {source.dfeSuggestions[0].label}
                </p>
                <p className="text-[10px] text-purple-600 dark:text-purple-400">
                  {source.dfeSuggestions[0].overlay}
                </p>
              </div>
            </div>
          </div>
        )}
    </motion.div>
  );
}
