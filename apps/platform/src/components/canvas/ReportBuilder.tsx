"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  Users,
  PoundSterling,
  CalendarCheck,
  Heart,
  AlertTriangle,
  Building,
  Hash,
  Type,
  Calendar,
  ChevronDown,
  ChevronRight,
  Plus,
  X,
  GripVertical,
  Layers,
  BarChart3,
  Filter,
  CheckCircle2,
} from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetchers";
import { useAuth } from "@/context/SupabaseAuthContext";
import { CanvasChart } from "@/components/canvas/CanvasChart";
import { vizSpecToRechartsConfig } from "@/lib/canvas/viz-renderer";
import {
  DATA_SOURCES,
  getDataSource,
  getDimensions,
  getMetrics,
  getDefaultDimension,
  getDefaultMetric,
  type DataSourceDefinition,
  type FieldDefinition,
} from "@/lib/canvas/field-registry";
import type { ChartType } from "@/lib/canvas/types";

// ─── Icon Map ───────────────────────────────────────────────

const SOURCE_ICONS: Record<string, React.ReactNode> = {
  Users: <Users className="w-4 h-4" />,
  PoundSterling: <PoundSterling className="w-4 h-4" />,
  CalendarCheck: <CalendarCheck className="w-4 h-4" />,
  Heart: <Heart className="w-4 h-4" />,
  AlertTriangle: <AlertTriangle className="w-4 h-4" />,
  Building: <Building className="w-4 h-4" />,
};

const FIELD_TYPE_ICONS: Record<string, React.ReactNode> = {
  text: <Type className="w-3 h-3 text-blue-400" />,
  number: <Hash className="w-3 h-3 text-emerald-400" />,
  currency: <PoundSterling className="w-3 h-3 text-amber-400" />,
  date: <Calendar className="w-3 h-3 text-purple-400" />,
  boolean: <CheckCircle2 className="w-3 h-3 text-pink-400" />,
  percentage: <Hash className="w-3 h-3 text-emerald-400" />,
};

const CHART_TYPES: Array<{ type: ChartType; label: string }> = [
  { type: "bar", label: "Bar" },
  { type: "line", label: "Line" },
  { type: "area", label: "Area" },
  { type: "pie", label: "Pie" },
  { type: "table", label: "Table" },
];

// ─── Types ──────────────────────────────────────────────────

interface WidgetConfig {
  id: string;
  sourceId: string;
  dimensions: string[];
  metrics: Array<{ field: string; aggregation: string; alias?: string }>;
  filters: Array<{ field: string; operator: string; value: string }>;
  chartType: ChartType;
  dateBin?: string;
  title?: string;
}

// ─── Main Component ─────────────────────────────────────────

interface ReportBuilderProps {
  initialSourceId?: string;
  onBack: () => void;
}

export function ReportBuilder({ initialSourceId, onBack }: ReportBuilderProps) {
  const { organization, session } = useAuth();
  const organizationId = organization?.id || "";

  // Active source in sidebar
  const [activeSourceId, setActiveSourceId] = useState(
    initialSourceId || "staff",
  );
  const [expandedSources, setExpandedSources] = useState<Set<string>>(
    new Set([initialSourceId || "staff"]),
  );

  // Widget being configured
  const [widget, setWidget] = useState<WidgetConfig>(() =>
    createDefaultWidget(initialSourceId || "staff"),
  );

  // Chart type
  const [chartType, setChartType] = useState<ChartType>(
    getDataSource(initialSourceId || "staff")?.defaultChartType || "bar",
  );

  // Source record counts
  const { data: connectorData } = useSWR(
    organizationId
      ? `/api/canvas/connectors?organizationId=${organizationId}`
      : null,
    fetcher,
    { revalidateOnFocus: false },
  );
  const internalSources = (connectorData?.internal || []) as Array<
    Record<string, unknown>
  >;

  function getRecordCount(sourceId: string): number {
    const mapping: Record<string, string> = {
      staff: "staff",
      finance: "fms",
      attendance: "attendance",
      send: "send",
      risks: "risk",
      estates: "estates",
    };
    const key = mapping[sourceId] || sourceId;
    const source = internalSources.find(
      (s) => s.id === key || s.category === key,
    );
    return (source?.recordCount as number) || 0;
  }

  // Build query URL
  const queryUrl = useMemo(() => {
    if (!organizationId || widget.dimensions.length === 0) return null;
    const body = {
      source: widget.sourceId,
      dimensions: widget.dimensions,
      metrics:
        widget.metrics.length > 0
          ? widget.metrics
          : [{ field: "id", aggregation: "count" }],
      filters: widget.filters.filter((f) => f.value),
      dateBin: widget.dateBin,
      limit: 100,
    };
    return JSON.stringify(body);
  }, [widget, organizationId]);

  const { data: queryResult, isLoading } = useSWR(
    queryUrl && organizationId
      ? [`/api/canvas/query`, queryUrl, organizationId]
      : null,
    async ([url, body, orgId]) => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session?.access_token)
        headers["Authorization"] = `Bearer ${session.access_token}`;
      const res = await fetch(`${url}?organizationId=${orgId}`, {
        method: "POST",
        headers,
        body,
      });
      return res.json();
    },
    { revalidateOnFocus: false },
  );

  const chartData = (queryResult?.data || []) as Record<string, unknown>[];
  const source = getDataSource(widget.sourceId);

  // ─── Handlers ───────────────────────────────────────────

  function selectSource(sourceId: string) {
    setActiveSourceId(sourceId);
    setExpandedSources((prev) => {
      const next = new Set(prev);
      if (next.has(sourceId)) next.delete(sourceId);
      else next.add(sourceId);
      return next;
    });
  }

  function selectSourceAndReset(sourceId: string) {
    setActiveSourceId(sourceId);
    setExpandedSources(new Set([sourceId]));
    const newWidget = createDefaultWidget(sourceId);
    setWidget(newWidget);
    setChartType(getDataSource(sourceId)?.defaultChartType || "bar");
  }

  function addDimension(field: string) {
    setWidget((prev) => ({
      ...prev,
      dimensions: prev.dimensions.includes(field)
        ? prev.dimensions
        : [...prev.dimensions, field],
    }));
  }

  function removeDimension(field: string) {
    setWidget((prev) => ({
      ...prev,
      dimensions: prev.dimensions.filter((d) => d !== field),
    }));
  }

  function addMetric(field: string, aggregation: string) {
    setWidget((prev) => ({
      ...prev,
      metrics: [
        ...prev.metrics.filter((m) => m.field !== field),
        { field, aggregation },
      ],
    }));
  }

  function removeMetric(field: string) {
    setWidget((prev) => ({
      ...prev,
      metrics: prev.metrics.filter((m) => m.field !== field),
    }));
  }

  function addFilter(field: string) {
    setWidget((prev) => ({
      ...prev,
      filters: [
        ...prev.filters.filter((f) => f.field !== field),
        { field, operator: "eq", value: "" },
      ],
    }));
  }

  function updateFilter(field: string, value: string) {
    setWidget((prev) => ({
      ...prev,
      filters: prev.filters.map((f) =>
        f.field === field ? { ...f, value } : f,
      ),
    }));
  }

  function removeFilter(field: string) {
    setWidget((prev) => ({
      ...prev,
      filters: prev.filters.filter((f) => f.field !== field),
    }));
  }

  // ─── Build chart config ─────────────────────────────────

  const rechartsConfig = useMemo(() => {
    if (chartData.length === 0 || !source) return null;

    const xKey = widget.dimensions[0] || Object.keys(chartData[0])[0] || "name";

    // For pie charts with many slices, cap at top 8 and group rest as "Other"
    let displayData = chartData;
    if (
      (chartType === "pie" || chartType === "donut") &&
      chartData.length > 8
    ) {
      const metricKey =
        widget.metrics.length > 0
          ? widget.metrics[0].alias ||
            `${widget.metrics[0].aggregation}_${widget.metrics[0].field}`
          : Object.keys(chartData[0]).find(
              (k) => k !== xKey && typeof chartData[0][k] === "number",
            ) || "count";
      const sorted = [...chartData].sort(
        (a, b) => Number(b[metricKey] || 0) - Number(a[metricKey] || 0),
      );
      const top = sorted.slice(0, 8);
      const rest = sorted.slice(8);
      const otherTotal = rest.reduce(
        (sum, r) => sum + Number(r[metricKey] || 0),
        0,
      );
      top.push({
        [xKey]: "Other",
        [metricKey]: Math.round(otherTotal * 100) / 100,
      });
      displayData = top;
    }
    const series = widget.metrics.map((m) => {
      const fieldDef = source.fields.find((f) => f.field === m.field);
      return {
        field: m.alias || `${m.aggregation}_${m.field}`,
        label:
          m.alias ||
          `${m.aggregation === "count" ? "" : m.aggregation + " "}${fieldDef?.label || m.field}`.trim(),
      };
    });

    // If no explicit metrics, use auto-detected numeric keys
    const effectiveSeries =
      series.length > 0
        ? series
        : Object.keys(chartData[0])
            .filter((k) => k !== xKey && typeof chartData[0][k] === "number")
            .map((k) => ({
              field: k,
              label: k
                .replace(/_/g, " ")
                .replace(/\b\w/g, (c: string) => c.toUpperCase()),
            }));

    return vizSpecToRechartsConfig(
      {
        chartType: chartType,
        title:
          widget.title ||
          `${source.label} — ${widget.dimensions.map((d) => source.fields.find((f) => f.field === d)?.label || d).join(" × ")}`,
        dataSource: { staticData: displayData },
        xAxis: {
          field: xKey,
          label:
            source.fields.find((f) => f.field === xKey)?.label ||
            xKey.replace(/_/g, " "),
          type: "category",
        },
        series: effectiveSeries,
        dataSources: [{ name: source.label }],
      },
      displayData,
      {
        primaryColor: source.color,
        schoolName: organization?.name || "School",
      },
    );
  }, [chartData, widget, chartType, source, organization]);

  // ─── Render ─────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* ── Left Sidebar: Data Sources + Fields ── */}
      <div className="w-64 border-r border-border bg-card flex flex-col overflow-hidden shrink-0">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Data Sources
            </h2>
            <button
              onClick={onBack}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Source List */}
        <div className="flex-1 overflow-y-auto py-2">
          {DATA_SOURCES.map((ds) => {
            const isExpanded = expandedSources.has(ds.id);
            const isActive = activeSourceId === ds.id;
            const count = getRecordCount(ds.id);
            const dimensions = getDimensions(ds.id);
            const metrics = getMetrics(ds.id);

            return (
              <div key={ds.id}>
                {/* Source header */}
                <button
                  onClick={() => selectSource(ds.id)}
                  onDoubleClick={() => selectSourceAndReset(ds.id)}
                  className={`w-full flex items-center gap-2 px-4 py-2 text-left text-xs transition-colors ${
                    isActive
                      ? "bg-muted/60 text-foreground"
                      : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                  }`}
                >
                  {isExpanded ? (
                    <ChevronDown className="w-3 h-3 shrink-0" />
                  ) : (
                    <ChevronRight className="w-3 h-3 shrink-0" />
                  )}
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: ds.color }}
                  />
                  <span className="font-semibold truncate flex-1">
                    {ds.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {count > 0 ? count : "—"}
                  </span>
                </button>

                {/* Fields */}
                {isExpanded && (
                  <div className="pl-7 pr-2 pb-2">
                    {/* Dimensions */}
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1 mb-1 px-2">
                      Dimensions
                    </div>
                    {dimensions.map((field) => {
                      const isSelected =
                        widget.sourceId === ds.id &&
                        widget.dimensions.includes(field.field);
                      return (
                        <button
                          key={field.field}
                          onClick={() => {
                            if (widget.sourceId !== ds.id)
                              selectSourceAndReset(ds.id);
                            if (isSelected) removeDimension(field.field);
                            else addDimension(field.field);
                          }}
                          className={`w-full flex items-center gap-2 px-2 py-1 rounded text-[11px] transition-colors ${
                            isSelected
                              ? "bg-blue-500/20 text-blue-300"
                              : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                          }`}
                        >
                          {FIELD_TYPE_ICONS[field.dataType] || (
                            <Type className="w-3 h-3" />
                          )}
                          <span className="truncate">{field.label}</span>
                          {isSelected && (
                            <span className="ml-auto text-[9px] bg-blue-500/30 px-1 rounded">
                              X
                            </span>
                          )}
                        </button>
                      );
                    })}

                    {/* Metrics */}
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-2 mb-1 px-2">
                      Metrics
                    </div>
                    {metrics.map((field) => {
                      const isSelected =
                        widget.sourceId === ds.id &&
                        widget.metrics.some((m) => m.field === field.field);
                      return (
                        <button
                          key={field.field}
                          onClick={() => {
                            if (widget.sourceId !== ds.id)
                              selectSourceAndReset(ds.id);
                            if (isSelected) removeMetric(field.field);
                            else
                              addMetric(
                                field.field,
                                field.aggregations?.[0] || "count",
                              );
                          }}
                          className={`w-full flex items-center gap-2 px-2 py-1 rounded text-[11px] transition-colors ${
                            isSelected
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                          }`}
                        >
                          {FIELD_TYPE_ICONS[field.dataType] || (
                            <Hash className="w-3 h-3" />
                          )}
                          <span className="truncate">{field.label}</span>
                          {isSelected && (
                            <span className="ml-auto text-[9px] bg-emerald-500/30 px-1 rounded">
                              #
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Main Area: Config Bar + Chart ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Config Bar */}
        <div className="border-b border-border bg-card px-4 py-3 space-y-3 shrink-0">
          {/* Row 1: Selected fields summary */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Source badge */}
            {source && (
              <div
                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold"
                style={{
                  backgroundColor: source.color + "20",
                  color: source.color,
                }}
              >
                {SOURCE_ICONS[source.icon]}
                {source.label}
              </div>
            )}

            <span className="text-muted-foreground text-xs">Group by:</span>

            {/* Selected dimensions */}
            {widget.dimensions.map((dim) => {
              const field = source?.fields.find((f) => f.field === dim);
              return (
                <div
                  key={dim}
                  className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-md text-xs text-blue-300"
                >
                  {field?.label || dim}
                  {field?.dataType === "date" && (
                    <select
                      value={widget.dateBin || "month"}
                      onChange={(e) =>
                        setWidget((prev) => ({
                          ...prev,
                          dateBin: e.target.value,
                        }))
                      }
                      className="bg-transparent border-none text-[10px] text-blue-400 focus:outline-none ml-1"
                    >
                      {(field.dateBinOptions || ["month", "year"]).map(
                        (bin) => (
                          <option key={bin} value={bin}>
                            by {bin}
                          </option>
                        ),
                      )}
                    </select>
                  )}
                  <button
                    onClick={() => removeDimension(dim)}
                    className="ml-1 hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}

            {widget.dimensions.length === 0 && (
              <span className="text-xs text-muted-foreground italic">
                Click a dimension in the sidebar
              </span>
            )}

            <span className="text-muted-foreground text-xs ml-2">Measure:</span>

            {/* Selected metrics */}
            {widget.metrics.map((m) => {
              const field = source?.fields.find((f) => f.field === m.field);
              return (
                <div
                  key={m.field}
                  className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-xs text-emerald-300"
                >
                  {field?.aggregations && field.aggregations.length > 1 ? (
                    <select
                      value={m.aggregation}
                      onChange={(e) => addMetric(m.field, e.target.value)}
                      className="bg-transparent border-none text-[10px] text-emerald-400 focus:outline-none"
                    >
                      {field.aggregations.map((agg) => (
                        <option key={agg} value={agg}>
                          {agg}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-[10px] text-emerald-400">
                      {m.aggregation}
                    </span>
                  )}
                  {field?.label || m.field}
                  <button
                    onClick={() => removeMetric(m.field)}
                    className="ml-1 hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Row 2: Chart type + filters */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Chart type toggle */}
            <div className="flex gap-0.5 bg-muted/50 p-0.5 rounded-lg">
              {CHART_TYPES.map((ct) => (
                <button
                  key={ct.type}
                  onClick={() => setChartType(ct.type)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    chartType === ct.type
                      ? "bg-white dark:bg-zinc-800 shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {ct.label}
                </button>
              ))}
            </div>

            {/* Active filters */}
            {widget.filters.map((f) => {
              const field = source?.fields.find((fd) => fd.field === f.field);
              const options =
                field?.filterOptions && field.filterOptions !== "dynamic"
                  ? field.filterOptions
                  : [];

              return (
                <div
                  key={f.field}
                  className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-md text-xs text-amber-300"
                >
                  <Filter className="w-3 h-3" />
                  {field?.label || f.field}
                  {options.length > 0 ? (
                    <select
                      value={f.value}
                      onChange={(e) => updateFilter(f.field, e.target.value)}
                      className="bg-transparent border-none text-[10px] text-amber-400 focus:outline-none ml-1"
                    >
                      <option value="">All</option>
                      {options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={f.value}
                      onChange={(e) => updateFilter(f.field, e.target.value)}
                      placeholder="value"
                      className="bg-transparent border-none text-[10px] text-amber-400 focus:outline-none ml-1 w-16"
                    />
                  )}
                  <button
                    onClick={() => removeFilter(f.field)}
                    className="ml-1 hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}

            {/* Add filter button */}
            {source && (
              <div className="relative group">
                <button className="flex items-center gap-1 px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/40">
                  <Plus className="w-3 h-3" />
                  Filter
                </button>
                <div className="hidden group-hover:block absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-lg py-1 z-50 min-w-[140px]">
                  {getDimensions(widget.sourceId)
                    .filter(
                      (f) => !widget.filters.some((wf) => wf.field === f.field),
                    )
                    .map((f) => (
                      <button
                        key={f.field}
                        onClick={() => addFilter(f.field)}
                        className="w-full text-left px-3 py-1.5 text-[11px] text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                      >
                        {f.label}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Record count */}
            <span className="ml-auto text-[10px] text-muted-foreground">
              {isLoading
                ? "Loading..."
                : chartData.length > 0
                  ? `${chartData.length} groups from ${queryResult?.meta?.totalRows || "?"} records`
                  : ""}
            </span>
          </div>
        </div>

        {/* Chart Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {widget.dimensions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <BarChart3 className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-sm font-bold text-muted-foreground mb-1">
                Build your report
              </h3>
              <p className="text-xs text-muted-foreground max-w-xs">
                Click a <span className="text-blue-400">dimension</span> in the
                sidebar to set your X-axis, then add a{" "}
                <span className="text-emerald-400">metric</span> to measure.
              </p>
              <p className="text-[10px] text-muted-foreground mt-2">
                Or double-click a data source to start with its defaults.
              </p>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-sm text-muted-foreground">
                No data found for this query.
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Try changing your filters or selecting different fields.
              </p>
            </div>
          ) : rechartsConfig ? (
            <div className="max-w-4xl mx-auto space-y-4">
              <CanvasChart config={rechartsConfig} height={450} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────

function createDefaultWidget(sourceId: string): WidgetConfig {
  const defaultDim = getDefaultDimension(sourceId);
  const defaultMetric = getDefaultMetric(sourceId);

  return {
    id: crypto.randomUUID?.() || String(Date.now()),
    sourceId,
    dimensions: defaultDim ? [defaultDim.field] : [],
    metrics: defaultMetric
      ? [
          {
            field: defaultMetric.field,
            aggregation: defaultMetric.aggregations?.[0] || "count",
          },
        ]
      : [],
    filters: [],
    chartType: getDataSource(sourceId)?.defaultChartType || "bar",
  };
}
