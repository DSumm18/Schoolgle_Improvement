/**
 * Canvas Data Intelligence Platform — Core Types
 *
 * The type system for smart data ingestion, semantic field matching,
 * GDPR reconciliation, and composable reporting.
 */

// ─── Source Systems ────────────────────────────────────────

export type SourceSystem =
  | "arbor"
  | "bromcom"
  | "sims"
  | "every_hr"
  | "sampeople"
  | "la_payroll"
  | "sage"
  | "sims_fms"
  | "access_finance"
  | "iris_psf"
  | "xero"
  | "wonde"
  | "google_drive"
  | "onedrive"
  | "csv_upload"
  | "unknown";

export type SystemCategory =
  | "mis"
  | "finance"
  | "hr"
  | "payroll"
  | "cloud_storage"
  | "public_data"
  | "other";

export type EntityType =
  | "staff"
  | "pupil"
  | "transaction"
  | "attendance"
  | "supplier"
  | "asset"
  | "contact"
  | "address";

// ─── Field Matching ────────────────────────────────────────

export type DetectionMethod =
  | "label_exact"
  | "label_fuzzy"
  | "data_pattern"
  | "data_fingerprint"
  | "user_confirmed"
  | "ai_inferred";

export interface FieldMapping {
  sourceColumn: string;
  targetEntity: EntityType;
  targetField: string;
  confidence: number;
  detectionMethod: DetectionMethod;
  dataPatternDescription?: string;
  sampleValues?: string[];
}

export interface ColumnAnalysis {
  name: string;
  index: number;
  nonNullCount: number;
  uniqueCount: number;
  totalCount: number;
  sampleValues: string[];
  detectedType:
    | "text"
    | "number"
    | "date"
    | "boolean"
    | "email"
    | "postcode"
    | "phone"
    | "currency"
    | "unknown";
  fingerprints: FingerprintMatch[];
  suggestedMapping?: FieldMapping;
}

export interface FingerprintMatch {
  fingerprintName: string;
  matchRatio: number;
  likelyEntity: EntityType;
  likelyField: string;
  confidence: number;
}

// ─── Source Detection ──────────────────────────────────────

export interface SourceDetectionResult {
  detectedSystem: SourceSystem;
  exportType: string;
  confidence: number;
  matchedColumns: string[];
  missingColumns: string[];
  defaultMappings: Record<
    string,
    { target_entity: string; target_field: string; confidence: number }
  >;
}

export interface IngestResult {
  /** Auto-detected source system */
  sourceDetection: SourceDetectionResult | null;

  /** Column-by-column analysis */
  columns: ColumnAnalysis[];

  /** Suggested field mappings (best guess per column) */
  suggestedMappings: FieldMapping[];

  /** Data entity type detected */
  entityType: EntityType;

  /** Row count */
  totalRows: number;

  /** Warnings (missing data, format issues) */
  warnings: IngestWarning[];

  /** Raw headers from the file */
  rawHeaders: string[];

  /** Sample data (first 5 rows, anonymised) */
  sampleRows: Record<string, string>[];
}

export interface IngestWarning {
  type:
    | "missing_data"
    | "format_inconsistency"
    | "duplicate_rows"
    | "encoding_issue"
    | "column_mismatch";
  message: string;
  column?: string;
  severity: "info" | "warning" | "error";
  affectedRows?: number;
}

// ─── Reconciliation ────────────────────────────────────────

export type ReconciliationResolution =
  | "accept_a"
  | "accept_b"
  | "manual_value"
  | "deferred"
  | "dismissed";

export interface ReconciliationConflict {
  entityType: EntityType;
  entityIdentifier: string;
  entityLabel: string; // human-readable: "Jane Smith" (for display only, not stored)
  fieldName: string;
  fieldLabel: string; // human-readable: "Home Address"
  sourceA: string;
  sourceAValue: string | null;
  sourceATrustRanking: number;
  sourceB: string;
  sourceBValue: string | null;
  sourceBTrustRanking: number;
  recommendation: ReconciliationResolution;
  recommendationReason: string;
}

export interface ReconciliationDecision {
  conflictIndex: number;
  resolution: ReconciliationResolution;
  resolvedValue?: string;
  reason: string;
}

export interface ReconciliationResult {
  conflicts: ReconciliationConflict[];
  totalRecordsCompared: number;
  matchedRecords: number;
  conflictCount: number;
  sourceASummary: { system: string; records: number; trustRanking: number };
  sourceBSummary: { system: string; records: number; trustRanking: number };
}

// ─── Source of Truth ───────────────────────────────────────

export const DEFAULT_TRUST_RANKINGS: Record<string, number> = {
  la_payroll: 1,
  payroll: 1,
  arbor: 2,
  bromcom: 2,
  sims: 2,
  every_hr: 3,
  sampeople: 3,
  schoolgle: 4,
  csv_upload: 5,
  google_drive: 5,
  onedrive: 5,
  unknown: 6,
};

export const TRUST_RANKING_LABELS: Record<number, string> = {
  1: "Payroll (verified monthly by staff)",
  2: "MIS (primary admin system)",
  3: "HR System (secondary)",
  4: "Schoolgle (platform data)",
  5: "Spreadsheet/Upload (no audit trail)",
  6: "Unknown source",
};

// ─── Canvas Session ────────────────────────────────────────

export type CanvasStage =
  | "WELCOME"
  | "TOPIC_CONFIRMED"
  | "DATA_DISCOVERY"
  | "CONNECTOR_NEEDED"
  | "CONNECTOR_WAITING"
  | "SCOPE_AGREED"
  | "VIZ_GENERATING"
  | "VIZ_SHOWN"
  | "REFINEMENT"
  | "ANOMALY_FLAGGED"
  | "RECONCILIATION"
  | "RECONCILIATION_REVIEW"
  | "SAVING"
  | "REPORT_OFFERED"
  | "DONE";

export type SessionType =
  | "visualization"
  | "reconciliation"
  | "migration"
  | "health_check"
  | "report_pack";

export type BusinessArea =
  | "finance"
  | "attendance"
  | "staffing_hr"
  | "send"
  | "curriculum_progress"
  | "premises_coshh"
  | "wellbeing"
  | "governance"
  | "safeguarding"
  | "data_quality";

export const BUSINESS_AREA_LABELS: Record<BusinessArea, string> = {
  finance: "Finance",
  attendance: "Attendance",
  staffing_hr: "Staffing & HR",
  send: "SEND",
  curriculum_progress: "Curriculum & Progress",
  premises_coshh: "Premises & COSHH",
  wellbeing: "Wellbeing",
  governance: "Governance",
  safeguarding: "Safeguarding",
  data_quality: "Data Quality",
};

export const BUSINESS_AREA_COLORS: Record<BusinessArea, string> = {
  finance: "#FFAA4C",
  attendance: "#0ea5e9",
  staffing_hr: "#ADD8E6",
  send: "#98FF98",
  curriculum_progress: "#FFB6C1",
  premises_coshh: "#00D4D4",
  wellbeing: "#E6C3FF",
  governance: "#FFD700",
  safeguarding: "#FF6B6B",
  data_quality: "#0F6E56",
};

// ─── Viz Spec (declarative chart definition) ───────────────

export type ChartType =
  | "bar"
  | "line"
  | "area"
  | "pie"
  | "donut"
  | "scatter"
  | "radar"
  | "treemap"
  | "heatmap"
  | "funnel"
  | "table"
  | "metric_card"
  | "timeline"
  | "comparison";

export interface VizSpec {
  chartType: ChartType;
  title: string;
  subtitle?: string;

  // Data
  dataSource: {
    table?: string;
    query?: object;
    staticData?: Record<string, unknown>[];
  };

  // Axes
  xAxis?: {
    field: string;
    label: string;
    type: "category" | "date" | "number";
  };
  yAxis?: { field: string; label: string; type: "number" | "percentage" };

  // Series
  series: Array<{
    field: string;
    label: string;
    color?: string;
    type?: ChartType;
  }>;

  // Features
  benchmark?: { label: string; value: number; color?: string };
  annotations?: Array<{
    x?: string;
    y?: number;
    label: string;
    type: "line" | "area" | "point";
  }>;
  anomalies?: Array<{
    field: string;
    period: string;
    type: string;
    description: string;
  }>;

  // Interactive controls
  controls?: Array<{
    type: "date_range" | "toggle" | "select" | "slider";
    field: string;
    label: string;
    options?: string[];
  }>;

  // Branding (injected at render time)
  branding?: {
    primaryColor: string;
    schoolName: string;
    logoUrl?: string;
  };

  // Data source attribution
  dataSources: Array<{ name: string; lastUpdated?: string }>;
}

// ─── Report Packs ──────────────────────────────────────────

export type ReportTone =
  | "governor_brief"
  | "staff_update"
  | "ofsted_evidence"
  | "parent_communication"
  | "trust_board"
  | "la_return"
  | "custom";

export const REPORT_TONE_LABELS: Record<
  ReportTone,
  { label: string; description: string }
> = {
  governor_brief: {
    label: "Governor Brief",
    description: "Formal, strategic, plain English, no jargon",
  },
  staff_update: {
    label: "Staff Update",
    description: "Professional but warm, action-focused",
  },
  ofsted_evidence: {
    label: "Ofsted Evidence",
    description: "Evaluative, framework language, evidence-referenced",
  },
  parent_communication: {
    label: "Parent Communication",
    description: "Simple, reassuring, positive framing",
  },
  trust_board: {
    label: "Trust Board",
    description: "Data-heavy, benchmarked, risk-flagged",
  },
  la_return: {
    label: "LA Return",
    description: "Compliant format, statutory language",
  },
  custom: { label: "Custom", description: "Your own tone instructions" },
};

// ─── Canvas Report (saved) ─────────────────────────────────

export interface CanvasReport {
  id: string;
  organization_id: string;
  created_by: string;
  title: string;
  business_area: BusinessArea;
  description?: string;
  viz_spec?: VizSpec;
  viz_html_cache?: string;
  query_spec?: object;
  data_source_ids?: string[];
  template_id?: string;
  mode: "snapshot" | "live";
  is_widget: boolean;
  widget_position?: number;
  shared_with_roles?: string[];
  shared_with_users?: string[];
  report_pack_id?: string;
  report_pack_order?: number;
  school_branding_snapshot?: object;
  created_at: string;
  updated_at: string;
}

// ─── Overlay System ──────────────────────────────────────────

export type OverlayRenderAs = "line" | "area_band" | "reference_line";

export interface OverlayField {
  source: string;
  label: string;
  color?: string;
}

export interface OverlayDefinition {
  id: string;
  label: string;
  description: string;
  table: string;
  fields: OverlayField[];
  joinKey: string;
  renderAs: OverlayRenderAs;
  color: string;
  dashPattern?: string;
}

export interface OverlayData {
  overlayId: string;
  label: string;
  renderAs: OverlayRenderAs;
  fields: Array<{ dataKey: string; label: string; color: string }>;
  data: Record<string, unknown>[];
}

// ─── Health Alerts (proactive problem finding) ─────────────

export type AlertSeverity = "critical" | "warning" | "info" | "opportunity";

export interface HealthAlert {
  id: string;
  severity: AlertSeverity;
  category: BusinessArea;
  title: string;
  description: string;
  recommendation: string;
  gdprArticle?: string;
  affectedRecords?: number;
  actionUrl?: string;
}
