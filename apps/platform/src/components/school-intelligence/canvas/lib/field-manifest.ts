/**
 * Field manifest — describes what fields each connector provides.
 *
 * Used by the report builder to show the user what data will go into
 * their report BEFORE they click Generate. Sample values are fetched
 * live from Supabase for the current school, so users see real numbers
 * next to each field name.
 */

export interface ConnectorField {
  id: string;                  // supabase column name
  label: string;               // display label
  description: string;         // plain-English what it means
  format?: 'percent' | 'number' | 'year' | 'text';
}

export interface ConnectorFieldGroup {
  connectorId: string;
  fields: ConnectorField[];
  /** The Supabase table these fields live in, for sample-value fetching */
  table: string;
}

export const FIELD_MANIFEST: ConnectorFieldGroup[] = [
  {
    connectorId: 'dfe-attendance',
    table: 'attendance',
    fields: [
      {
        id: 'overall_attendance_pct',
        label: 'Overall Attendance',
        description: 'Weighted attendance rate for the academic year',
        format: 'percent',
      },
      {
        id: 'overall_absence_pct',
        label: 'Overall Absence',
        description: 'All absence — authorised and unauthorised',
        format: 'percent',
      },
      {
        id: 'authorized_absence_pct',
        label: 'Authorised Absence',
        description: 'Illness, appointments, approved leave',
        format: 'percent',
      },
      {
        id: 'unauthorized_absence_pct',
        label: 'Unauthorised Absence',
        description: 'Absence without valid reason — key Ofsted metric',
        format: 'percent',
      },
      {
        id: 'persistent_absence_pct',
        label: 'Persistent Absence',
        description: 'Pupils missing 10% or more of sessions',
        format: 'percent',
      },
    ],
  },
  {
    connectorId: 'dfe-census',
    table: 'census',
    fields: [
      {
        id: 'number_on_roll',
        label: 'Number on Roll',
        description: 'Total pupils at the school',
        format: 'number',
      },
      {
        id: 'fsm_pct',
        label: 'Free School Meals',
        description: 'Percentage eligible for FSM — disadvantage indicator',
        format: 'percent',
      },
      {
        id: 'eal_pct',
        label: 'English as Additional Language',
        description: 'Pupils with EAL — used for contextual comparisons',
        format: 'percent',
      },
    ],
  },
  {
    connectorId: 'dfe-ks2-results',
    table: 'ks2_results',
    fields: [
      {
        id: 'expected_standard_pct',
        label: 'Expected Standard',
        description: 'Percentage meeting the expected standard',
        format: 'percent',
      },
      {
        id: 'higher_standard_pct',
        label: 'Higher Standard',
        description: 'Percentage meeting the higher standard',
        format: 'percent',
      },
      {
        id: 'average_scaled_score',
        label: 'Average Scaled Score',
        description: 'Average pupil scaled score',
        format: 'number',
      },
    ],
  },
  {
    connectorId: 'dfe-workforce',
    table: 'workforce',
    fields: [
      {
        id: 'fte_teachers',
        label: 'FTE Teachers',
        description: 'Full-time equivalent teaching staff',
        format: 'number',
      },
      {
        id: 'fte_teaching_assistants',
        label: 'FTE Teaching Assistants',
        description: 'Full-time equivalent TAs',
        format: 'number',
      },
      {
        id: 'fte_total',
        label: 'FTE Total',
        description: 'All full-time equivalent staff combined',
        format: 'number',
      },
    ],
  },
  {
    connectorId: 'dfe-exclusions',
    table: 'exclusions',
    fields: [
      {
        id: 'fixed_period_exclusions_count',
        label: 'Fixed-period Exclusions',
        description: 'Count of suspensions in the period',
        format: 'number',
      },
      {
        id: 'permanent_exclusions_count',
        label: 'Permanent Exclusions',
        description: 'Count of permanent exclusions',
        format: 'number',
      },
    ],
  },
  {
    connectorId: 'contextual-factors',
    table: 'school_contextual_factors',
    fields: [
      {
        id: 'factor_type',
        label: 'Event Type',
        description: 'What happened — staff change, intervention, etc.',
        format: 'text',
      },
      {
        id: 'description',
        label: 'Description',
        description: 'Plain-English detail',
        format: 'text',
      },
      {
        id: 'start_date',
        label: 'When',
        description: 'Date the event started',
        format: 'text',
      },
    ],
  },
  {
    connectorId: 'google-drive',
    table: 'ofsted_drive_connections',
    fields: [
      {
        id: 'folder_name',
        label: 'Evidence Folder',
        description: 'Connected Drive folder name',
        format: 'text',
      },
      {
        id: 'total_files',
        label: 'Files Scanned',
        description: 'Total documents available for analysis',
        format: 'number',
      },
    ],
  },
];

export function getFieldGroup(connectorId: string): ConnectorFieldGroup | undefined {
  return FIELD_MANIFEST.find((g) => g.connectorId === connectorId);
}

export function formatSampleValue(value: unknown, format?: ConnectorField['format']): string {
  if (value === null || value === undefined || value === '') return '—';
  if (format === 'percent') {
    const n = typeof value === 'number' ? value : parseFloat(String(value));
    if (isNaN(n)) return '—';
    return `${n.toFixed(1)}%`;
  }
  if (format === 'number') {
    const n = typeof value === 'number' ? value : parseFloat(String(value));
    if (isNaN(n)) return '—';
    return n.toLocaleString();
  }
  return String(value);
}
