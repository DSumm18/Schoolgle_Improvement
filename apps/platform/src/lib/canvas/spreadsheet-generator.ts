/**
 * Canvas Connected Spreadsheets — Round-Trip Data Tool
 *
 * 1. Canvas identifies problems → generates a spreadsheet
 * 2. User fixes data in familiar Excel/Sheets environment
 * 3. User connects the updated spreadsheet back
 * 4. Canvas reads it, applies corrections, logs audit trail
 *
 * Spreadsheets are generated as XLSX with:
 * - Instruction sheet (what to do, what each column means)
 * - Data sheet (the actual data with issues highlighted)
 * - Formatting (headers, colours, column widths)
 */

import * as XLSX from "xlsx";
import type { ReconciliationResult } from "./types";
import type { MigrationReport } from "./migration-report";

// ─── Reconciliation Spreadsheet ────────────────────────────

/**
 * Generate a reconciliation tracker spreadsheet.
 * The user reviews conflicts, makes decisions, and re-uploads.
 */
export function generateReconciliationSpreadsheet(
  result: ReconciliationResult,
  schoolName: string,
): Buffer {
  const wb = XLSX.utils.book_new();

  // ─── Instructions Sheet ──────────────────────────────────
  const instructions = [
    ["RECONCILIATION TRACKER", "", "", ""],
    ["School:", schoolName, "", ""],
    ["Generated:", new Date().toLocaleDateString("en-GB"), "", ""],
    ["", "", "", ""],
    ["HOW TO USE THIS SPREADSHEET", "", "", ""],
    ["1. Review each row on the 'Conflicts' sheet", "", "", ""],
    ["2. In the 'Your Decision' column, enter one of:", "", "", ""],
    [
      "   - 'A' to keep the value from " + result.sourceASummary.system,
      "",
      "",
      "",
    ],
    [
      "   - 'B' to keep the value from " + result.sourceBSummary.system,
      "",
      "",
      "",
    ],
    ["   - Type a new value if both are wrong", "", "", ""],
    [
      "3. Fill in the 'Reason' column (required for GDPR compliance)",
      "",
      "",
      "",
    ],
    ["4. Save this file and upload it back to Canvas", "", "", ""],
    ["", "", "", ""],
    ["SOURCE OF TRUTH", "", "", ""],
    [
      result.sourceASummary.system,
      `Trust Level ${result.sourceASummary.trustRanking}`,
      `${result.sourceASummary.records} records`,
      "",
    ],
    [
      result.sourceBSummary.system,
      `Trust Level ${result.sourceBSummary.trustRanking}`,
      `${result.sourceBSummary.records} records`,
      "",
    ],
    ["", "", "", ""],
    ["SUMMARY", "", "", ""],
    ["Records matched:", String(result.matchedRecords), "", ""],
    ["Conflicts found:", String(result.conflictCount), "", ""],
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
  wsInstructions["!cols"] = [
    { wch: 40 },
    { wch: 30 },
    { wch: 20 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, wsInstructions, "Instructions");

  // ─── Conflicts Sheet ─────────────────────────────────────
  const conflictHeaders = [
    "Person",
    "Field",
    result.sourceASummary.system + " Value",
    result.sourceBSummary.system + " Value",
    "Recommendation",
    "Your Decision",
    "Reason",
  ];

  const conflictRows = result.conflicts.map((c) => [
    c.entityLabel,
    c.fieldLabel,
    c.sourceAValue || "(empty)",
    c.sourceBValue || "(empty)",
    c.recommendation === "accept_a"
      ? `Keep ${result.sourceASummary.system}`
      : `Keep ${result.sourceBSummary.system}`,
    "", // User fills this in
    "", // User fills this in
  ]);

  const wsConflicts = XLSX.utils.aoa_to_sheet([
    conflictHeaders,
    ...conflictRows,
  ]);
  wsConflicts["!cols"] = [
    { wch: 25 },
    { wch: 20 },
    { wch: 30 },
    { wch: 30 },
    { wch: 25 },
    { wch: 20 },
    { wch: 40 },
  ];
  XLSX.utils.book_append_sheet(wb, wsConflicts, "Conflicts");

  // Write to buffer
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return Buffer.from(buf);
}

// ─── Migration Report Spreadsheet ──────────────────────────

/**
 * Generate a migration readiness spreadsheet with action items
 */
export function generateMigrationSpreadsheet(
  report: MigrationReport,
  schoolName: string,
): Buffer {
  const wb = XLSX.utils.book_new();

  // ─── Summary Sheet ───────────────────────────────────────
  const summary = [
    ["MIS MIGRATION READINESS REPORT", ""],
    ["School:", schoolName],
    ["From:", report.fromSystem],
    ["To:", report.toSystem],
    ["Generated:", new Date().toLocaleDateString("en-GB")],
    ["", ""],
    [
      "READINESS SCORE",
      `${report.readinessScore}/100 — ${report.readinessLabel}`,
    ],
    ["", ""],
    ["RECORDS", ""],
    [`${report.fromSystem} records:`, String(report.records.sourceCount)],
    [`${report.toSystem} records:`, String(report.records.targetCount)],
    ["Matched:", String(report.records.matchedCount)],
    [
      `Only in ${report.fromSystem}:`,
      String(report.records.onlyInSource.length),
    ],
    [`Only in ${report.toSystem}:`, String(report.records.onlyInTarget.length)],
    ["", ""],
    ["FIELDS", ""],
    [
      "Auto-mapped:",
      `${report.fieldMapping.autoMappedFields}/${report.fieldMapping.totalSourceFields}`,
    ],
    ["Conflicts:", String(report.reconciliation.conflictCount)],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summary);
  wsSummary["!cols"] = [{ wch: 30 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

  // ─── Missing Records Sheet ───────────────────────────────
  if (report.records.onlyInSource.length > 0) {
    const missingHeaders = ["Name", "Identifier", "Reason", "Action Needed"];
    const missingRows = report.records.onlyInSource.map((r) => [
      r.label,
      r.identifier,
      r.reason,
      `Create in ${report.toSystem}`,
    ]);

    const wsMissing = XLSX.utils.aoa_to_sheet([missingHeaders, ...missingRows]);
    wsMissing["!cols"] = [{ wch: 25 }, { wch: 30 }, { wch: 40 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, wsMissing, "Missing Records");
  }

  // ─── Field Mapping Sheet ─────────────────────────────────
  const fieldHeaders = [
    `${report.fromSystem} Column`,
    `${report.toSystem} Column`,
    "Canonical Field",
    "Status",
    "Notes",
  ];
  const fieldRows = report.fieldMapping.fieldComparison.map((f) => [
    f.sourceField,
    f.targetField || "(no equivalent)",
    f.mappedToCanonical,
    f.status.replace(/_/g, " "),
    f.note || "",
  ]);

  const wsFields = XLSX.utils.aoa_to_sheet([fieldHeaders, ...fieldRows]);
  wsFields["!cols"] = [
    { wch: 25 },
    { wch: 25 },
    { wch: 20 },
    { wch: 15 },
    { wch: 50 },
  ];
  XLSX.utils.book_append_sheet(wb, wsFields, "Field Mapping");

  // ─── Actions Sheet ───────────────────────────────────────
  const actionHeaders = [
    "Priority",
    "Action",
    "Description",
    "Affected Records",
    "Category",
  ];
  const actionRows = report.actions.map((a) => [
    a.priority.toUpperCase(),
    a.title,
    a.description,
    a.affectedRecords ? String(a.affectedRecords) : "",
    a.category.replace(/_/g, " "),
  ]);

  const wsActions = XLSX.utils.aoa_to_sheet([actionHeaders, ...actionRows]);
  wsActions["!cols"] = [
    { wch: 12 },
    { wch: 40 },
    { wch: 60 },
    { wch: 15 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, wsActions, "Actions");

  // ─── Conflicts Sheet ─────────────────────────────────────
  if (report.reconciliation.conflicts.length > 0) {
    const conflictHeaders = [
      "Person",
      "Field",
      `${report.fromSystem} Value`,
      `${report.toSystem} Value`,
      "Recommendation",
      "Your Decision",
      "Reason",
    ];

    const conflictRows = report.reconciliation.conflicts.map((c) => [
      c.entityLabel,
      c.fieldLabel,
      c.sourceAValue || "(empty)",
      c.sourceBValue || "(empty)",
      c.recommendationReason,
      "",
      "",
    ]);

    const wsConflicts = XLSX.utils.aoa_to_sheet([
      conflictHeaders,
      ...conflictRows,
    ]);
    wsConflicts["!cols"] = [
      { wch: 25 },
      { wch: 20 },
      { wch: 30 },
      { wch: 30 },
      { wch: 40 },
      { wch: 20 },
      { wch: 40 },
    ];
    XLSX.utils.book_append_sheet(wb, wsConflicts, "Conflicts");
  }

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return Buffer.from(buf);
}

// ─── Generic Data Export Spreadsheet ───────────────────────

/**
 * Generate a clean spreadsheet from Canvas data for the user to save to Drive
 */
export function generateDataSpreadsheet(
  title: string,
  headers: string[],
  rows: (string | number | null)[][],
  schoolName: string,
): Buffer {
  const wb = XLSX.utils.book_new();

  const data = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Auto-width columns
  ws["!cols"] = headers.map((h) => ({
    wch: Math.max(h.length + 2, 15),
  }));

  XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31)); // Sheet name max 31 chars

  // Add metadata sheet
  const meta = [
    ["Generated by", "Schoolgle Canvas"],
    ["School", schoolName],
    ["Date", new Date().toLocaleDateString("en-GB")],
    ["Rows", String(rows.length)],
    ["", ""],
    ["To use this as a Canvas data source:", ""],
    ["1. Make your edits in the data sheet", ""],
    ["2. Save the file", ""],
    ["3. Upload it to Canvas → Smart Ingest", ""],
    ["4. Canvas will detect changes and process them", ""],
  ];
  const wsMeta = XLSX.utils.aoa_to_sheet(meta);
  wsMeta["!cols"] = [{ wch: 40 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsMeta, "About");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return Buffer.from(buf);
}
