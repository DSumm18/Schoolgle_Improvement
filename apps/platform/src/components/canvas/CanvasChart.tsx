"use client";

import React, { useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Table2, BarChart3 } from "lucide-react";
import type {
  RechartsConfig,
  DataTableConfig,
} from "@/lib/canvas/viz-renderer";
import { vizSpecToDataTable } from "@/lib/canvas/viz-renderer";
import type { VizSpec, OverlayData } from "@/lib/canvas/types";

// ─── Main Chart Component ──────────────────────────────────

interface CanvasChartProps {
  config: RechartsConfig;
  spec?: VizSpec;
  className?: string;
  height?: number;
  showDataTable?: boolean;
  overlays?: OverlayData[];
}

export function CanvasChart({
  config,
  spec,
  className = "",
  height = 350,
  showDataTable: initialShowTable = false,
  overlays,
}: CanvasChartProps) {
  const [showTable, setShowTable] = useState(initialShowTable);

  // Build attribution including overlay sources
  const allSources = [...config.dataSources.map((d) => d.name)];
  if (overlays && overlays.length > 0) {
    allSources.push("Department for Education");
  }
  const uniqueSources = [...new Set(allSources)];

  return (
    <div
      className={`bg-card border border-border rounded-2xl overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div>
          <h3
            className="text-sm font-bold"
            style={{ color: config.branding.primaryColor }}
          >
            {config.title}
          </h3>
          {config.subtitle && (
            <p className="text-xs text-muted-foreground">{config.subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowTable(false)}
            className={`p-1.5 rounded-md transition-colors ${!showTable ? "bg-muted" : "hover:bg-muted/50"}`}
            title="Chart view"
            aria-label="Show chart"
          >
            <BarChart3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowTable(true)}
            className={`p-1.5 rounded-md transition-colors ${showTable ? "bg-muted" : "hover:bg-muted/50"}`}
            title="Data table view"
            aria-label="Show data table"
          >
            <Table2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Anomaly Banner */}
      {config.anomalies && config.anomalies.length > 0 && (
        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200">
          Data gap detected: {config.anomalies[0].description}
        </div>
      )}

      {/* Chart or Table */}
      <div className="p-4">
        {showTable ? (
          <AccessibleDataTable config={config} spec={spec} />
        ) : (
          <ChartRenderer config={config} height={height} />
        )}
      </div>

      {/* Attribution Footer */}
      <div className="px-4 py-2 border-t border-border bg-muted/20 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Data: {uniqueSources.join(" + ")}</span>
        <span>{config.branding.schoolName}</span>
      </div>
    </div>
  );
}

// ─── Chart Renderer ────────────────────────────────────────

function ChartRenderer({
  config,
  height,
}: {
  config: RechartsConfig;
  height: number;
}) {
  const { chartType, data, xKey, series, benchmark, branding } = config;

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-sm text-muted-foreground">No data available</p>
      </div>
    );
  }

  // Metric card (not a chart)
  if (chartType === "metric_card") {
    return <MetricCards data={data} primaryColor={branding.primaryColor} />;
  }

  // Pie/Donut
  if (chartType === "pie" || chartType === "donut") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey={series[0]?.dataKey || "value"}
            nameKey={xKey}
            cx="50%"
            cy="50%"
            innerRadius={chartType === "donut" ? "50%" : 0}
            outerRadius="80%"
            label
          >
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={series[i % series.length]?.color || branding.primaryColor}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  // Bar, Line, Area
  const ChartComponent =
    chartType === "bar"
      ? BarChart
      : chartType === "area"
        ? AreaChart
        : LineChart;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ChartComponent data={data}>
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 11 }}
          label={
            config.xLabel
              ? {
                  value: config.xLabel,
                  position: "insideBottom",
                  offset: -5,
                  fontSize: 11,
                }
              : undefined
          }
        />
        <YAxis
          tick={{ fontSize: 11 }}
          label={
            config.yLabel
              ? {
                  value: config.yLabel,
                  angle: -90,
                  position: "insideLeft",
                  fontSize: 11,
                }
              : undefined
          }
        />
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid var(--border)",
            fontSize: "12px",
          }}
        />
        <Legend wrapperStyle={{ fontSize: "11px" }} />

        {/* Benchmark reference line */}
        {benchmark && (
          <ReferenceLine
            y={benchmark.value}
            stroke={benchmark.color}
            strokeDasharray="5 5"
            label={{
              value: benchmark.label,
              fontSize: 10,
              fill: benchmark.color,
            }}
          />
        )}

        {/* Data series */}
        {series.map((s) => {
          if (chartType === "bar") {
            return (
              <Bar
                key={s.dataKey}
                dataKey={s.dataKey}
                name={s.name}
                fill={s.color}
                radius={[4, 4, 0, 0]}
              />
            );
          }
          if (chartType === "area") {
            return (
              <Area
                key={s.dataKey}
                type="monotone"
                dataKey={s.dataKey}
                name={s.name}
                stroke={s.color}
                fill={s.color}
                fillOpacity={0.1}
              />
            );
          }
          return (
            <Line
              key={s.dataKey}
              type="monotone"
              dataKey={s.dataKey}
              name={s.name}
              stroke={s.color}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          );
        })}

        {/* Overlay series */}
        {config.overlaySeries?.map((overlay) => {
          if (overlay.renderAs === "reference_line" && overlay.value != null) {
            return (
              <ReferenceLine
                key={`overlay-${overlay.dataKey}`}
                y={overlay.value}
                stroke={overlay.color}
                strokeDasharray="5 5"
                strokeWidth={1.5}
                label={{
                  value: `${overlay.label}: ${overlay.value}`,
                  fontSize: 10,
                  fill: overlay.color,
                }}
              />
            );
          }
          // renderAs: "line" — dashed overlay line
          return (
            <Line
              key={`overlay-${overlay.dataKey}`}
              type="monotone"
              dataKey={overlay.dataKey}
              name={overlay.label}
              stroke={overlay.color}
              strokeWidth={1.5}
              strokeDasharray={overlay.dashPattern || "6 4"}
              dot={false}
              connectNulls
            />
          );
        })}
      </ChartComponent>
    </ResponsiveContainer>
  );
}

// ─── Metric Cards ──────────────────────────────────────────

function MetricCards({
  data,
  primaryColor,
}: {
  data: Record<string, unknown>[];
  primaryColor: string;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {data.map((d, i) => {
        const pct = Number(d.pct) || 0;
        const isGood = pct >= 80;
        const isBad = pct < 50;

        return (
          <div key={i} className="bg-muted/30 rounded-xl p-4 text-center">
            <div className="text-xs text-muted-foreground font-medium mb-1">
              {String(d.label)}
            </div>
            <div
              className="text-2xl font-black"
              style={{ color: primaryColor }}
            >
              {String(d.value)}
              <span className="text-sm font-normal text-muted-foreground">
                /{String(d.total)}
              </span>
            </div>
            <div className="mt-2 w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${pct}%`,
                  backgroundColor: isGood
                    ? "#10b981"
                    : isBad
                      ? "#ef4444"
                      : "#f59e0b",
                }}
              />
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">{pct}%</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Accessible Data Table ─────────────────────────────────

function AccessibleDataTable({
  config,
  spec,
}: {
  config: RechartsConfig;
  spec?: VizSpec;
}) {
  const tableConfig: DataTableConfig = spec
    ? vizSpecToDataTable(spec, config.data as Record<string, unknown>[])
    : {
        headers: [
          { key: config.xKey, label: config.xLabel || config.xKey },
          ...config.series.map((s) => ({ key: s.dataKey, label: s.name })),
        ],
        rows: config.data,
        title: config.title,
        caption: `Data for ${config.title}`,
      };

  return (
    <div
      className="overflow-x-auto"
      role="region"
      aria-label={tableConfig.title}
    >
      <table className="w-full text-sm" aria-describedby="table-caption">
        <caption id="table-caption" className="sr-only">
          {tableConfig.caption}
        </caption>
        <thead>
          <tr className="border-b border-border">
            {tableConfig.headers.map((h) => (
              <th
                key={h.key}
                className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                scope="col"
              >
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {tableConfig.rows.map((row, i) => (
            <tr key={i} className="hover:bg-muted/30">
              {tableConfig.headers.map((h) => (
                <td key={h.key} className="px-3 py-2 text-xs">
                  {String(row[h.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Migration Readiness Component ─────────────────────────

interface MigrationReadinessProps {
  score: number;
  label: string;
  fromSystem: string;
  toSystem: string;
  primaryColor: string;
}

export function MigrationReadinessGauge({
  score,
  label,
  fromSystem,
  toSystem,
  primaryColor,
}: MigrationReadinessProps) {
  const gaugeColor =
    score >= 90
      ? "#10b981"
      : score >= 70
        ? "#f59e0b"
        : score >= 40
          ? "#f97316"
          : "#ef4444";

  return (
    <div className="bg-card border border-border rounded-2xl p-6 text-center">
      <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">
        Migration Readiness
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        {fromSystem} → {toSystem}
      </p>

      {/* Circular gauge */}
      <div className="relative w-32 h-32 mx-auto mb-4">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-muted/30"
          />
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke={gaugeColor}
            strokeWidth="2.5"
            strokeDasharray={`${score}, 100`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black" style={{ color: gaugeColor }}>
            {score}
          </span>
          <span className="text-[10px] text-muted-foreground">/ 100</span>
        </div>
      </div>

      <div
        className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white"
        style={{ backgroundColor: gaugeColor }}
      >
        {label}
      </div>
    </div>
  );
}
