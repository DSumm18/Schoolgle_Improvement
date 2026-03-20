/**
 * Canvas Viz Renderer — Declarative Chart Specification → React Component Props
 *
 * Converts a VizSpec (JSON) into props for Recharts components.
 * This is the deterministic rendering layer — same spec + same data = same chart.
 *
 * Why not AI-generated HTML?
 * - Deterministic: no variation between renders
 * - Fast: no AI call needed to re-render
 * - Accessible: data table alternative built in
 * - Brandable: school colors applied consistently
 * - Storable: viz spec is JSON, diffable, versioned
 */

import type { VizSpec, ChartType, OverlayData } from "./types";

// ─── Recharts Config Generation ────────────────────────────

export interface OverlaySeries {
  dataKey: string;
  label: string;
  color: string;
  renderAs: "line" | "area_band" | "reference_line";
  dashPattern?: string;
  value?: number; // for reference_line
}

export interface RechartsConfig {
  chartType: ChartType;
  data: Record<string, unknown>[];
  xKey: string;
  series: Array<{
    dataKey: string;
    name: string;
    color: string;
    type?: ChartType;
  }>;
  xLabel?: string;
  yLabel?: string;
  title: string;
  subtitle?: string;
  benchmark?: { value: number; label: string; color: string };
  annotations?: Array<{ x?: string; y?: number; label: string }>;
  anomalies?: Array<{ period: string; description: string }>;
  controls?: VizSpec["controls"];
  branding: {
    primaryColor: string;
    schoolName: string;
    logoUrl?: string;
  };
  dataSources: Array<{ name: string; lastUpdated?: string }>;
  overlaySeries?: OverlaySeries[];
}

// ─── Color Palette ─────────────────────────────────────────

const CHART_PALETTE = [
  // Primary is injected from branding, these are secondary colors
  "#6366f1", // indigo
  "#f59e0b", // amber
  "#10b981", // emerald
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
];

/**
 * Generate a color palette starting with the school's brand color
 */
export function generatePalette(primaryColor: string, count: number): string[] {
  const colors = [primaryColor, ...CHART_PALETTE];
  return colors.slice(0, count);
}

// ─── VizSpec → RechartsConfig ──────────────────────────────

/**
 * Convert a VizSpec into RechartsConfig ready for rendering.
 *
 * @param spec - The declarative chart specification
 * @param data - The actual data to render (query result)
 * @param schoolBranding - School's brand color, name, logo
 */
export function vizSpecToRechartsConfig(
  spec: VizSpec,
  data: Record<string, unknown>[],
  schoolBranding?: {
    primaryColor?: string;
    schoolName?: string;
    logoUrl?: string;
  },
): RechartsConfig {
  const primary =
    schoolBranding?.primaryColor || spec.branding?.primaryColor || "#0F6E56";
  const schoolName =
    schoolBranding?.schoolName || spec.branding?.schoolName || "School";
  const logoUrl = schoolBranding?.logoUrl || spec.branding?.logoUrl;

  const palette = generatePalette(primary, spec.series.length);

  return {
    chartType: spec.chartType,
    data,
    xKey: spec.xAxis?.field || "name",
    series: spec.series.map((s, i) => ({
      dataKey: s.field,
      name: s.label,
      color: s.color || palette[i] || primary,
      type: s.type,
    })),
    xLabel: spec.xAxis?.label,
    yLabel: spec.yAxis?.label,
    title: spec.title,
    subtitle: spec.subtitle,
    benchmark: spec.benchmark
      ? {
          value: spec.benchmark.value,
          label: spec.benchmark.label,
          color: spec.benchmark.color || "#94a3b8",
        }
      : undefined,
    annotations: spec.annotations?.map((a) => ({
      x: a.x,
      y: a.y,
      label: a.label,
    })),
    anomalies: spec.anomalies?.map((a) => ({
      period: a.period,
      description: a.description,
    })),
    controls: spec.controls,
    branding: { primaryColor: primary, schoolName, logoUrl },
    dataSources: spec.dataSources,
  };
}

// ─── Data Table Generation (Accessibility) ─────────────────

export interface DataTableConfig {
  headers: Array<{ key: string; label: string }>;
  rows: Record<string, unknown>[];
  title: string;
  caption: string;
}

/**
 * Generate an accessible data table from a viz spec + data.
 * This is the WCAG 2.1 AA alternative to every chart.
 */
export function vizSpecToDataTable(
  spec: VizSpec,
  data: Record<string, unknown>[],
): DataTableConfig {
  const headers = [
    ...(spec.xAxis ? [{ key: spec.xAxis.field, label: spec.xAxis.label }] : []),
    ...spec.series.map((s) => ({ key: s.field, label: s.label })),
  ];

  return {
    headers,
    rows: data,
    title: spec.title,
    caption: `Data table for: ${spec.title}. ${spec.dataSources.map((d) => d.name).join(", ")}`,
  };
}

// ─── Print/Export Styles ───────────────────────────────────

/**
 * Generate print-optimized CSS for canvas charts
 */
export function generatePrintStyles(primaryColor: string): string {
  return `
@media print {
  .canvas-chart-container {
    page-break-inside: avoid;
    border: 1px solid #e5e7eb;
    padding: 16px;
    margin-bottom: 16px;
  }
  .canvas-chart-title {
    color: ${primaryColor};
    font-size: 16pt;
    font-weight: bold;
    margin-bottom: 8px;
  }
  .canvas-chart-subtitle {
    color: #6b7280;
    font-size: 10pt;
    margin-bottom: 12px;
  }
  .canvas-data-attribution {
    font-size: 8pt;
    color: #9ca3af;
    border-top: 1px solid #e5e7eb;
    padding-top: 8px;
    margin-top: 12px;
  }
  .canvas-anomaly-banner {
    background: #fef3c7;
    border: 1px solid #f59e0b;
    padding: 8px 12px;
    font-size: 9pt;
    margin-bottom: 8px;
  }
}
`;
}

// ─── Viz Spec Builders (for common chart types) ────────────

/**
 * Quick builders for common school data visualizations
 */
export const VizBuilders = {
  /**
   * Attendance trend line chart (term-on-term or year-on-year)
   */
  attendanceTrend(
    data: Record<string, unknown>[],
    options: {
      schoolName: string;
      primaryColor: string;
      nationalBenchmark?: number;
      periodField?: string;
      valueField?: string;
    },
  ): VizSpec {
    return {
      chartType: "line",
      title: "Attendance Trend",
      subtitle: `${options.schoolName} attendance over time`,
      dataSource: { staticData: data },
      xAxis: {
        field: options.periodField || "period",
        label: "Period",
        type: "category",
      },
      yAxis: {
        field: options.valueField || "attendance_rate",
        label: "Attendance %",
        type: "percentage",
      },
      series: [
        {
          field: options.valueField || "attendance_rate",
          label: "School",
          color: options.primaryColor,
        },
      ],
      benchmark: options.nationalBenchmark
        ? {
            label: "National Average",
            value: options.nationalBenchmark,
            color: "#94a3b8",
          }
        : undefined,
      dataSources: [{ name: "Schoolgle Attendance" }],
    };
  },

  /**
   * Budget vs actual bar chart
   */
  budgetComparison(
    data: Record<string, unknown>[],
    options: { schoolName: string; primaryColor: string },
  ): VizSpec {
    return {
      chartType: "bar",
      title: "Budget vs Actual",
      subtitle: `${options.schoolName} — current financial year`,
      dataSource: { staticData: data },
      xAxis: { field: "category", label: "Cost Centre", type: "category" },
      yAxis: { field: "budget", label: "Amount (£)", type: "number" },
      series: [
        { field: "budget", label: "Budget", color: "#94a3b8" },
        { field: "actual", label: "Actual", color: options.primaryColor },
      ],
      dataSources: [{ name: "Schoolgle Finance" }],
    };
  },

  /**
   * Staffing composition pie chart
   */
  staffingComposition(
    data: Record<string, unknown>[],
    options: { schoolName: string; primaryColor: string },
  ): VizSpec {
    return {
      chartType: "pie",
      title: "Staff Composition",
      subtitle: `${options.schoolName} — by role category`,
      dataSource: { staticData: data },
      series: [{ field: "count", label: "Staff Count" }],
      dataSources: [{ name: "Schoolgle HR" }],
    };
  },

  /**
   * Reconciliation conflict summary
   */
  reconciliationSummary(
    conflicts: Array<{ field: string; count: number }>,
    options: { sourceA: string; sourceB: string },
  ): VizSpec {
    return {
      chartType: "bar",
      title: "Data Discrepancies",
      subtitle: `${options.sourceA} vs ${options.sourceB}`,
      dataSource: { staticData: conflicts },
      xAxis: { field: "field", label: "Field", type: "category" },
      yAxis: { field: "count", label: "Conflicts", type: "number" },
      series: [{ field: "count", label: "Discrepancies", color: "#ef4444" }],
      dataSources: [{ name: options.sourceA }, { name: options.sourceB }],
    };
  },

  /**
   * Migration readiness gauge (metric card)
   */
  /**
   * Merge overlay data into primary chart data (LEFT JOIN on xKey).
   * Returns merged data array and overlay series definitions.
   */
  mergeOverlays(
    primaryData: Record<string, unknown>[],
    overlays: OverlayData[],
    xKey: string,
  ): {
    mergedData: Record<string, unknown>[];
    overlaySeries: OverlaySeries[];
  } {
    if (!overlays || overlays.length === 0) {
      return { mergedData: primaryData, overlaySeries: [] };
    }

    // Build lookup maps for each overlay
    const overlayMaps: Array<{
      overlay: OverlayData;
      map: Map<string, Record<string, unknown>>;
    }> = overlays.map((overlay) => {
      const map = new Map<string, Record<string, unknown>>();
      for (const row of overlay.data) {
        const key = String(row[xKey] ?? "");
        if (key) map.set(key, row);
      }
      return { overlay, map };
    });

    // LEFT JOIN: merge overlay fields into primary data
    const mergedData = primaryData.map((row) => {
      const merged = { ...row };
      const key = String(row[xKey] ?? "");
      for (const { overlay, map } of overlayMaps) {
        const overlayRow = map.get(key);
        if (overlayRow) {
          for (const field of overlay.fields) {
            merged[field.dataKey] = overlayRow[field.dataKey];
          }
        }
      }
      return merged;
    });

    // Build overlay series definitions
    const overlaySeries: OverlaySeries[] = [];
    for (const overlay of overlays) {
      if (overlay.renderAs === "reference_line") {
        // For reference lines, compute the average value
        for (const field of overlay.fields) {
          const values = overlay.data
            .map((r) => parseFloat(String(r[field.dataKey] ?? "")))
            .filter((v) => !isNaN(v));
          if (values.length > 0) {
            const avg = values.reduce((a, b) => a + b, 0) / values.length;
            overlaySeries.push({
              dataKey: field.dataKey,
              label: field.label,
              color: field.color,
              renderAs: "reference_line",
              value: Math.round(avg * 10) / 10,
            });
          }
        }
      } else {
        for (const field of overlay.fields) {
          overlaySeries.push({
            dataKey: field.dataKey,
            label: field.label,
            color: field.color,
            renderAs: overlay.renderAs,
            dashPattern: "6 4",
          });
        }
      }
    }

    return { mergedData, overlaySeries };
  },

  migrationReadiness(
    metrics: {
      totalFields: number;
      mappedFields: number;
      recordsMatched: number;
      totalRecords: number;
      conflicts: number;
    },
    options: { fromSystem: string; toSystem: string },
  ): VizSpec {
    return {
      chartType: "metric_card",
      title: "Migration Readiness",
      subtitle: `${options.fromSystem} → ${options.toSystem}`,
      dataSource: {
        staticData: [
          {
            label: "Fields Mapped",
            value: metrics.mappedFields,
            total: metrics.totalFields,
            pct: Math.round((metrics.mappedFields / metrics.totalFields) * 100),
          },
          {
            label: "Records Matched",
            value: metrics.recordsMatched,
            total: metrics.totalRecords,
            pct: Math.round(
              (metrics.recordsMatched / metrics.totalRecords) * 100,
            ),
          },
          {
            label: "Conflicts Found",
            value: metrics.conflicts,
            total: metrics.recordsMatched,
            pct:
              metrics.recordsMatched > 0
                ? Math.round((metrics.conflicts / metrics.recordsMatched) * 100)
                : 0,
          },
        ],
      },
      series: [{ field: "value", label: "Value" }],
      dataSources: [{ name: options.fromSystem }, { name: options.toSystem }],
    };
  },
};
