/**
 * Canvas Overlay Registry — Static compatibility matrix
 *
 * Defines which DfE overlay layers are available for each report type.
 * Each overlay specifies the DfE table, fields to extract, join key,
 * and render style (dashed line, reference line, or shaded band).
 */

import type { OverlayDefinition } from "./types";

// ─── Registry ──────────────────────────────────────────────

const OVERLAY_REGISTRY: Record<string, OverlayDefinition[]> = {
  staff: [
    {
      id: "dfe_workforce_fte",
      label: "DfE Workforce — Staffing",
      description: "National average FTE for teachers and teaching assistants",
      table: "workforce",
      fields: [
        {
          source: "fte_teachers",
          label: "National Teachers FTE",
          color: "#94a3b8",
        },
        {
          source: "fte_teaching_assistants",
          label: "National TAs FTE",
          color: "#cbd5e1",
        },
      ],
      joinKey: "time_period",
      renderAs: "line",
      color: "#94a3b8",
      dashPattern: "6 4",
    },
    {
      id: "dfe_workforce_qts",
      label: "DfE Workforce — QTS Rate",
      description: "National % of teachers with Qualified Teacher Status",
      table: "workforce",
      fields: [
        {
          source: "teachers_with_qts_pct",
          label: "National QTS %",
          color: "#a78bfa",
        },
      ],
      joinKey: "time_period",
      renderAs: "reference_line",
      color: "#a78bfa",
    },
  ],

  staff_overview: [
    {
      id: "dfe_workforce_fte",
      label: "DfE Workforce — Staffing",
      description: "National average FTE for teachers and teaching assistants",
      table: "workforce",
      fields: [
        {
          source: "fte_teachers",
          label: "National Teachers FTE",
          color: "#94a3b8",
        },
        {
          source: "fte_teaching_assistants",
          label: "National TAs FTE",
          color: "#cbd5e1",
        },
      ],
      joinKey: "time_period",
      renderAs: "line",
      color: "#94a3b8",
      dashPattern: "6 4",
    },
  ],

  attendance: [
    {
      id: "dfe_attendance_national",
      label: "DfE National Attendance",
      description: "National average overall attendance rate",
      table: "attendance",
      fields: [
        {
          source: "overall_attendance_pct",
          label: "National Attendance %",
          color: "#94a3b8",
        },
      ],
      joinKey: "time_period",
      renderAs: "line",
      color: "#94a3b8",
      dashPattern: "6 4",
    },
    {
      id: "dfe_persistent_absence",
      label: "DfE Persistent Absence",
      description: "National persistent absence rate",
      table: "attendance",
      fields: [
        {
          source: "persistent_absence_pct",
          label: "Persistent Absence %",
          color: "#ef4444",
        },
      ],
      joinKey: "time_period",
      renderAs: "line",
      color: "#ef4444",
      dashPattern: "6 4",
    },
  ],

  budget: [
    {
      id: "dfe_workforce_pay",
      label: "DfE Average Teacher Pay",
      description: "National average teacher salary for context",
      table: "workforce",
      fields: [
        {
          source: "average_teacher_pay",
          label: "National Avg Teacher Pay",
          color: "#94a3b8",
        },
      ],
      joinKey: "time_period",
      renderAs: "reference_line",
      color: "#94a3b8",
    },
  ],

  finance: [
    {
      id: "dfe_workforce_pay",
      label: "DfE Average Teacher Pay",
      description: "National average teacher salary for context",
      table: "workforce",
      fields: [
        {
          source: "average_teacher_pay",
          label: "National Avg Teacher Pay",
          color: "#94a3b8",
        },
      ],
      joinKey: "time_period",
      renderAs: "reference_line",
      color: "#94a3b8",
    },
  ],

  send: [
    {
      id: "dfe_census_sen",
      label: "DfE National SEN Rate",
      description: "National % of pupils with SEN from school census",
      table: "census",
      fields: [
        { source: "sen_pct", label: "National SEN %", color: "#94a3b8" },
      ],
      joinKey: "time_period",
      renderAs: "reference_line",
      color: "#94a3b8",
    },
  ],

  pupils: [
    {
      id: "dfe_census_demographics",
      label: "DfE Census Demographics",
      description: "National FSM, EAL, SEN percentages",
      table: "census",
      fields: [
        { source: "fsm_pct", label: "National FSM %", color: "#94a3b8" },
        { source: "eal_pct", label: "National EAL %", color: "#cbd5e1" },
        { source: "sen_pct", label: "National SEN %", color: "#a78bfa" },
      ],
      joinKey: "time_period",
      renderAs: "line",
      color: "#94a3b8",
      dashPattern: "6 4",
    },
  ],

  assessments: [
    {
      id: "dfe_ks2_expected",
      label: "DfE KS2 Expected Standard",
      description: "National % achieving expected standard by subject",
      table: "ks2_results",
      fields: [
        {
          source: "expected_standard_pct",
          label: "National Expected %",
          color: "#94a3b8",
        },
      ],
      joinKey: "time_period",
      renderAs: "line",
      color: "#94a3b8",
      dashPattern: "6 4",
    },
    {
      id: "dfe_ks2_higher",
      label: "DfE KS2 Higher Standard",
      description: "National % achieving higher standard",
      table: "ks2_results",
      fields: [
        {
          source: "higher_standard_pct",
          label: "National Higher %",
          color: "#cbd5e1",
        },
      ],
      joinKey: "time_period",
      renderAs: "line",
      color: "#cbd5e1",
      dashPattern: "4 4",
    },
  ],

  behaviour: [
    {
      id: "dfe_exclusion_rates",
      label: "DfE National Exclusion Rates",
      description: "National fixed-period and permanent exclusion rates",
      table: "exclusions",
      fields: [
        {
          source: "fixed_period_exclusions_rate",
          label: "National Fixed Rate",
          color: "#94a3b8",
        },
        {
          source: "permanent_exclusions_rate",
          label: "National Permanent Rate",
          color: "#fca5a5",
        },
      ],
      joinKey: "time_period",
      renderAs: "line",
      color: "#94a3b8",
      dashPattern: "6 4",
    },
  ],
};

// ─── Public API ──────────────────────────────────────────────

/**
 * Get available overlay definitions for a report type.
 * Returns empty array for DfE-only report types (no point overlaying DfE on DfE).
 */
export function getAvailableOverlays(reportType: string): OverlayDefinition[] {
  return OVERLAY_REGISTRY[reportType] || [];
}

/**
 * Get a specific overlay definition by ID across all report types.
 */
export function getOverlayById(
  overlayId: string,
): OverlayDefinition | undefined {
  for (const overlays of Object.values(OVERLAY_REGISTRY)) {
    const found = overlays.find((o) => o.id === overlayId);
    if (found) return found;
  }
  return undefined;
}

/**
 * Build the Supabase query fields needed for an overlay.
 */
export function getOverlayQueryFields(overlay: OverlayDefinition): string {
  const fields = new Set<string>();
  fields.add(overlay.joinKey);
  for (const f of overlay.fields) {
    fields.add(f.source);
  }
  return [...fields].join(", ");
}

/**
 * Normalize a DfE time_period (e.g. "202324") into display format ("2023/24").
 */
export function formatTimePeriod(tp: string): string {
  if (tp.length === 6) {
    return `${tp.slice(0, 4)}/${tp.slice(4)}`;
  }
  return tp;
}
