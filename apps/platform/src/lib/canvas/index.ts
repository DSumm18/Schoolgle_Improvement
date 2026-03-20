/**
 * Canvas Data Intelligence Platform
 *
 * Public API:
 * - types: All TypeScript types for Canvas
 * - field-matcher: Smart semantic field matching engine
 * - reconciliation-engine: GDPR Article 5(1)(d) cross-system reconciliation
 * - ingest-service: File parsing and full ingest pipeline
 * - viz-renderer: Declarative VizSpec → Recharts config
 * - migration-report: MIS migration readiness reports
 */

export * from "./types";
export { analyseColumn, analyseDataset } from "./field-matcher";
export {
  reconcileDatasets,
  buildDataset,
  generateHealthAlerts,
} from "./reconciliation-engine";
export { ingestFile, ingestText, parseFile } from "./ingest-service";
export {
  vizSpecToRechartsConfig,
  vizSpecToDataTable,
  generatePalette,
  generatePrintStyles,
  VizBuilders,
} from "./viz-renderer";
export { generateMigrationReport } from "./migration-report";
export type {
  MigrationReport,
  MigrationReportInput,
  MigrationAction,
  FieldComparison,
  RecordSummary,
} from "./migration-report";
export type {
  RechartsConfig,
  DataTableConfig,
  OverlaySeries,
} from "./viz-renderer";
export {
  getAvailableOverlays,
  getOverlayById,
  getOverlayQueryFields,
  formatTimePeriod,
} from "./overlay-registry";
export {
  buildReportPrompt,
  buildReconciliationReportPrompt,
  buildMigrationReportPrompt,
  generateGDPRComplianceStatement,
  generateMigrationTimeline,
  REPORT_PACK_TEMPLATES,
} from "./report-builder";
export type { ReportSection, ReportPack } from "./report-builder";
export { CANVAS_TEMPLATES } from "./templates";
export type { CanvasTemplate } from "./templates";
export {
  generateReconciliationSpreadsheet,
  generateMigrationSpreadsheet,
  generateDataSpreadsheet,
} from "./spreadsheet-generator";
