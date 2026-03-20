/**
 * Canvas Migration Report Generator
 *
 * When a school is migrating from one MIS to another (e.g., Arbor → Bromcom),
 * this generates a comprehensive readiness report:
 *
 * 1. Field mapping comparison between old and new system
 * 2. Record matching (who's in both, who's missing)
 * 3. Data quality issues in the source system
 * 4. Recommended actions before migration
 * 5. Field-by-field conflict report
 *
 * Replaces a £5-10k data migration consultancy.
 */

import { analyseDataset } from "./field-matcher";
import {
  reconcileDatasets,
  buildDataset,
  generateHealthAlerts,
} from "./reconciliation-engine";
import type {
  EntityType,
  IngestResult,
  ReconciliationResult,
  HealthAlert,
  FieldMapping,
} from "./types";

// ─── Types ─────────────────────────────────────────────────

export interface MigrationReportInput {
  /** The system being migrated FROM */
  sourceSystem: {
    name: string;
    headers: string[];
    rows: Record<string, string | number | null | undefined>[];
    mappings: FieldMapping[];
  };
  /** The system being migrated TO */
  targetSystem: {
    name: string;
    headers: string[];
    rows: Record<string, string | number | null | undefined>[];
    mappings: FieldMapping[];
  };
  entityType: EntityType;
}

export interface MigrationReport {
  /** Overall readiness score (0-100) */
  readinessScore: number;
  readinessLabel: "Ready" | "Nearly Ready" | "Action Required" | "Not Ready";

  /** Systems being compared */
  fromSystem: string;
  toSystem: string;
  entityType: EntityType;

  /** Record comparison */
  records: {
    sourceCount: number;
    targetCount: number;
    matchedCount: number;
    onlyInSource: RecordSummary[];
    onlyInTarget: RecordSummary[];
  };

  /** Field mapping comparison */
  fieldMapping: {
    totalSourceFields: number;
    totalTargetFields: number;
    autoMappedFields: number;
    unmappedSourceFields: string[];
    unmappedTargetFields: string[];
    fieldComparison: FieldComparison[];
  };

  /** Data quality issues in source system */
  sourceQualityIssues: HealthAlert[];

  /** Conflicts between matched records */
  reconciliation: ReconciliationResult;

  /** Recommended actions before migration */
  actions: MigrationAction[];

  /** Generated at timestamp */
  generatedAt: string;
}

export interface RecordSummary {
  identifier: string;
  label: string;
  reason: string;
}

export interface FieldComparison {
  sourceField: string;
  targetField: string | null;
  mappedToCanonical: string;
  status: "matched" | "source_only" | "target_only" | "name_mismatch";
  note?: string;
}

export interface MigrationAction {
  priority: "critical" | "important" | "recommended";
  title: string;
  description: string;
  affectedRecords?: number;
  category:
    | "data_quality"
    | "missing_records"
    | "field_mapping"
    | "conflict_resolution";
}

// ─── Report Generator ──────────────────────────────────────

/**
 * Generate a comprehensive migration readiness report
 */
export function generateMigrationReport(
  input: MigrationReportInput,
): MigrationReport {
  const { sourceSystem, targetSystem, entityType } = input;

  // 1. Build canonical datasets
  const sourceDataset = buildDataset(
    sourceSystem.name,
    entityType,
    sourceSystem.rows,
    sourceSystem.mappings.map((m) => ({
      sourceColumn: m.sourceColumn,
      targetField: m.targetField,
    })),
  );

  const targetDataset = buildDataset(
    targetSystem.name,
    entityType,
    targetSystem.rows,
    targetSystem.mappings.map((m) => ({
      sourceColumn: m.sourceColumn,
      targetField: m.targetField,
    })),
  );

  // 2. Find matched records and orphans
  const sourceIndex = new Map<
    string,
    { label: string; fields: Record<string, string | null> }
  >();
  const targetIndex = new Map<
    string,
    { label: string; fields: Record<string, string | null> }
  >();

  // Build match keys using name-based matching
  for (const rec of sourceDataset.records) {
    const key = buildSimpleKey(rec.fields, entityType);
    if (key) sourceIndex.set(key, rec);
  }
  for (const rec of targetDataset.records) {
    const key = buildSimpleKey(rec.fields, entityType);
    if (key) targetIndex.set(key, rec);
  }

  const matchedKeys = new Set<string>();
  const onlyInSource: RecordSummary[] = [];
  const onlyInTarget: RecordSummary[] = [];

  for (const [key, rec] of sourceIndex) {
    if (targetIndex.has(key)) {
      matchedKeys.add(key);
    } else {
      onlyInSource.push({
        identifier: key,
        label: rec.label,
        reason: `Found in ${sourceSystem.name} but not in ${targetSystem.name}`,
      });
    }
  }

  for (const [key, rec] of targetIndex) {
    if (!sourceIndex.has(key)) {
      onlyInTarget.push({
        identifier: key,
        label: rec.label,
        reason: `Found in ${targetSystem.name} but not in ${sourceSystem.name}`,
      });
    }
  }

  // 3. Compare field mappings
  const sourceMappedFields = new Set(
    sourceSystem.mappings.map((m) => m.targetField),
  );
  const targetMappedFields = new Set(
    targetSystem.mappings.map((m) => m.targetField),
  );
  const allCanonicalFields = new Set([
    ...sourceMappedFields,
    ...targetMappedFields,
  ]);

  const fieldComparison: FieldComparison[] = [];
  let autoMappedCount = 0;

  for (const canonical of allCanonicalFields) {
    const inSource = sourceMappedFields.has(canonical);
    const inTarget = targetMappedFields.has(canonical);

    const sourceMapping = sourceSystem.mappings.find(
      (m) => m.targetField === canonical,
    );
    const targetMapping = targetSystem.mappings.find(
      (m) => m.targetField === canonical,
    );

    if (inSource && inTarget) {
      autoMappedCount++;
      fieldComparison.push({
        sourceField: sourceMapping?.sourceColumn || canonical,
        targetField: targetMapping?.sourceColumn || canonical,
        mappedToCanonical: canonical,
        status:
          sourceMapping?.sourceColumn === targetMapping?.sourceColumn
            ? "matched"
            : "name_mismatch",
        note:
          sourceMapping?.sourceColumn !== targetMapping?.sourceColumn
            ? `${sourceSystem.name} calls this "${sourceMapping?.sourceColumn}", ${targetSystem.name} calls it "${targetMapping?.sourceColumn}"`
            : undefined,
      });
    } else if (inSource && !inTarget) {
      fieldComparison.push({
        sourceField: sourceMapping?.sourceColumn || canonical,
        targetField: null,
        mappedToCanonical: canonical,
        status: "source_only",
        note: `This field exists in ${sourceSystem.name} but has no equivalent in ${targetSystem.name}`,
      });
    } else {
      fieldComparison.push({
        sourceField: canonical,
        targetField: targetMapping?.sourceColumn || canonical,
        mappedToCanonical: canonical,
        status: "target_only",
        note: `This field exists in ${targetSystem.name} but was not in the ${sourceSystem.name} export`,
      });
    }
  }

  const unmappedSourceFields = sourceSystem.headers.filter(
    (h) => !sourceSystem.mappings.some((m) => m.sourceColumn === h),
  );
  const unmappedTargetFields = targetSystem.headers.filter(
    (h) => !targetSystem.mappings.some((m) => m.sourceColumn === h),
  );

  // 4. Run reconciliation on matched records
  const reconciliation = reconcileDatasets(sourceDataset, targetDataset);

  // 5. Generate source quality alerts
  const sourceQualityIssues = generateHealthAlerts(
    sourceDataset,
    "data_quality",
  );

  // 6. Generate actions
  const actions = generateMigrationActions(
    onlyInSource,
    onlyInTarget,
    unmappedSourceFields,
    reconciliation,
    sourceQualityIssues,
    sourceSystem.name,
    targetSystem.name,
  );

  // 7. Calculate readiness score
  const readinessScore = calculateReadinessScore(
    matchedKeys.size,
    sourceDataset.records.length,
    autoMappedCount,
    allCanonicalFields.size,
    reconciliation.conflictCount,
    onlyInSource.length,
    sourceQualityIssues.filter((a) => a.severity === "critical").length,
  );

  const readinessLabel =
    readinessScore >= 90
      ? "Ready"
      : readinessScore >= 70
        ? "Nearly Ready"
        : readinessScore >= 40
          ? "Action Required"
          : "Not Ready";

  return {
    readinessScore,
    readinessLabel,
    fromSystem: sourceSystem.name,
    toSystem: targetSystem.name,
    entityType,
    records: {
      sourceCount: sourceDataset.records.length,
      targetCount: targetDataset.records.length,
      matchedCount: matchedKeys.size,
      onlyInSource,
      onlyInTarget,
    },
    fieldMapping: {
      totalSourceFields: sourceSystem.headers.length,
      totalTargetFields: targetSystem.headers.length,
      autoMappedFields: autoMappedCount,
      unmappedSourceFields,
      unmappedTargetFields,
      fieldComparison,
    },
    sourceQualityIssues,
    reconciliation,
    actions,
    generatedAt: new Date().toISOString(),
  };
}

// ─── Helpers ───────────────────────────────────────────────

function buildSimpleKey(
  fields: Record<string, string | null>,
  entityType: EntityType,
): string | null {
  if (entityType === "staff") {
    // Try NI number first, then name + DOB, then name
    if (fields.ni_number)
      return fields.ni_number.toLowerCase().replace(/\s/g, "");
    if (fields.email) return fields.email.toLowerCase().trim();
    if (fields.first_name && fields.last_name) {
      const base = `${fields.first_name}|${fields.last_name}`.toLowerCase();
      return fields.date_of_birth ? `${base}|${fields.date_of_birth}` : base;
    }
  }
  if (entityType === "pupil") {
    if (fields.upn) return fields.upn.toLowerCase();
    if (fields.first_name && fields.last_name && fields.date_of_birth) {
      return `${fields.first_name}|${fields.last_name}|${fields.date_of_birth}`.toLowerCase();
    }
  }
  return null;
}

function calculateReadinessScore(
  matchedRecords: number,
  totalRecords: number,
  mappedFields: number,
  totalFields: number,
  conflicts: number,
  orphans: number,
  criticalIssues: number,
): number {
  if (totalRecords === 0) return 0;

  // Record match rate (40% weight)
  const matchRate = (matchedRecords / totalRecords) * 100;
  const matchScore = Math.min(40, matchRate * 0.4);

  // Field mapping rate (25% weight)
  const fieldRate = totalFields > 0 ? (mappedFields / totalFields) * 100 : 100;
  const fieldScore = Math.min(25, fieldRate * 0.25);

  // Conflict rate — lower is better (20% weight)
  const conflictRate =
    matchedRecords > 0 ? (conflicts / matchedRecords) * 100 : 0;
  const conflictScore = Math.max(0, 20 - conflictRate * 0.4);

  // Orphan penalty (10% weight)
  const orphanRate = totalRecords > 0 ? (orphans / totalRecords) * 100 : 0;
  const orphanScore = Math.max(0, 10 - orphanRate * 0.2);

  // Critical issue penalty (5% weight)
  const criticalScore = Math.max(0, 5 - criticalIssues * 2.5);

  return Math.round(
    matchScore + fieldScore + conflictScore + orphanScore + criticalScore,
  );
}

function generateMigrationActions(
  onlyInSource: RecordSummary[],
  onlyInTarget: RecordSummary[],
  unmappedFields: string[],
  reconciliation: ReconciliationResult,
  qualityIssues: HealthAlert[],
  fromSystem: string,
  toSystem: string,
): MigrationAction[] {
  const actions: MigrationAction[] = [];

  // Critical: records only in source (will be lost if not migrated)
  if (onlyInSource.length > 0) {
    // Check if any might be leavers vs genuinely missing
    const possibleLeavers = onlyInSource.filter(
      (r) =>
        r.label.toLowerCase().includes("supply") ||
        r.label.toLowerCase().includes("governor"),
    );
    const genuinelyMissing = onlyInSource.filter(
      (r) => !possibleLeavers.includes(r),
    );

    if (genuinelyMissing.length > 0) {
      actions.push({
        priority: "critical",
        title: `${genuinelyMissing.length} records in ${fromSystem} not found in ${toSystem}`,
        description: `These records need to be manually created in ${toSystem} before migration, or confirmed as intentionally excluded (e.g., leavers, governors). Names: ${genuinelyMissing
          .slice(0, 5)
          .map((r) => r.label)
          .join(
            ", ",
          )}${genuinelyMissing.length > 5 ? ` and ${genuinelyMissing.length - 5} more` : ""}.`,
        affectedRecords: genuinelyMissing.length,
        category: "missing_records",
      });
    }

    if (possibleLeavers.length > 0) {
      actions.push({
        priority: "recommended",
        title: `${possibleLeavers.length} records may not need migrating`,
        description: `These appear to be supply staff or governors who may not need records in ${toSystem}: ${possibleLeavers
          .map((r) => r.label)
          .join(", ")}. Confirm whether they should be migrated.`,
        affectedRecords: possibleLeavers.length,
        category: "missing_records",
      });
    }
  }

  // Critical: data quality issues in source (fix before migration)
  const criticalQuality = qualityIssues.filter(
    (q) => q.severity === "critical",
  );
  for (const issue of criticalQuality) {
    actions.push({
      priority: "critical",
      title: `Fix in ${fromSystem} before migration: ${issue.title}`,
      description: issue.description + " " + issue.recommendation,
      affectedRecords: issue.affectedRecords,
      category: "data_quality",
    });
  }

  // Important: reconciliation conflicts
  if (reconciliation.conflictCount > 0) {
    // Group conflicts by field
    const byField = new Map<string, number>();
    for (const c of reconciliation.conflicts) {
      byField.set(c.fieldName, (byField.get(c.fieldName) || 0) + 1);
    }

    for (const [field, count] of byField) {
      actions.push({
        priority: count > 5 ? "important" : "recommended",
        title: `${count} ${field.replace(/_/g, " ")} discrepancies between systems`,
        description: `${fromSystem} and ${toSystem} have different values for ${field.replace(/_/g, " ")} on ${count} records. Review and decide which system has the correct data before migration.`,
        affectedRecords: count,
        category: "conflict_resolution",
      });
    }
  }

  // Important: unmapped fields
  if (unmappedFields.length > 0) {
    actions.push({
      priority: unmappedFields.length > 3 ? "important" : "recommended",
      title: `${unmappedFields.length} fields in ${fromSystem} could not be automatically mapped`,
      description: `These fields may contain important data that won't transfer: ${unmappedFields.slice(0, 5).join(", ")}${unmappedFields.length > 5 ? ` and ${unmappedFields.length - 5} more` : ""}. Check if they have equivalents in ${toSystem} or if the data can be stored in notes/custom fields.`,
      category: "field_mapping",
    });
  }

  // Recommended: records only in target (new system may have extra records)
  if (onlyInTarget.length > 0) {
    actions.push({
      priority: "recommended",
      title: `${onlyInTarget.length} records found only in ${toSystem}`,
      description: `These records exist in ${toSystem} but not in the ${fromSystem} export. They may be test data from setup, or records that were already manually entered. Review and remove any test data before go-live.`,
      affectedRecords: onlyInTarget.length,
      category: "missing_records",
    });
  }

  // Sort by priority
  const priorityOrder: Record<string, number> = {
    critical: 0,
    important: 1,
    recommended: 2,
  };
  actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return actions;
}
