// Spreadsheet parser for school assessment data import.
// Parses XLSX files that match the trust mid-year spreadsheet structure
// and validates them against the metrics config.

import * as XLSX from 'xlsx';
import { COHORT_METRICS, YEAR_GROUP_METRICS, SECTIONS, YEAR_GROUPS, validateCell, type MetricDef, type YearGroup, type SectionKey } from './metrics-config';

export interface ParsedCell {
  yearGroup: YearGroup;
  section: SectionKey;
  metric: string;
  value: number | null;
  row: number;
  col: number;
  rawValue: string | number;
}

export interface ValidationError {
  row: number;
  col: number;
  cell: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ParsedSpreadsheetResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  data: ParsedCell[];
  preview: {
    yearGroups: YearGroup[];
    sections: SectionKey[];
    totalCells: number;
    filledCells: number;
  };
}

// Expected column order (must match trust spreadsheet)
const EXPECTED_COHORT_COLUMNS = ['Cohort', 'SEND', 'EHCP', 'FSM'];
const EXPECTED_ATTAINMENT_COLUMNS = ['R ARE', 'R GD', 'W ARE', 'W GD', 'M ARE', 'M GD', 'C ARE', 'C GD', 'GLD', 'Phonics', 'MTC'];

export function parseAssessmentSpreadsheet(buffer: ArrayBuffer): ParsedSpreadsheetResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const data: ParsedCell[] = [];

  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    errors.push({ row: 0, col: 0, cell: 'N/A', message: 'File contains no sheets', severity: 'error' });
    return { valid: false, errors, warnings, data: [], preview: { yearGroups: [], sections: [], totalCells: 0, filledCells: 0 } };
  }

  const worksheet = workbook.Sheets[sheetName];
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

  // Parse header row to find year groups
  const yearGroupCols = new Map<number, YearGroup>();
  const sectionRows = new Map<number, SectionKey>();
  const metricCols = new Map<number, { section: SectionKey; metric: string }>();

  let headerRow = -1;

  // Find header row (look for "Year" or year group names)
  for (let row = range.s.r; row <= Math.min(range.e.r, 20); row++) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = worksheet[cellAddress];
      const value = cell?.v?.toString().trim();

      if (YEAR_GROUPS.some((yg) => value === yg)) {
        headerRow = row;
        break;
      }
    }
    if (headerRow !== -1) break;
  }

  if (headerRow === -1) {
    errors.push({ row: 0, col: 0, cell: 'N/A', message: 'Could not find header row with year group names (EYFS, Year 1, etc.)', severity: 'error' });
    return { valid: false, errors, warnings, data: [], preview: { yearGroups: [], sections: [], totalCells: 0, filledCells: 0 } };
  }

  // Parse year groups from header row
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: headerRow, c: col });
    const cell = worksheet[cellAddress];
    const value = cell?.v?.toString().trim();

    if (YEAR_GROUPS.includes(value as YearGroup)) {
      yearGroupCols.set(col, value as YearGroup);
    }
  }

  if (yearGroupCols.size === 0) {
    errors.push({ row: headerRow + 1, col: 0, cell: 'Header', message: 'No year group columns found in header row', severity: 'error' });
    return { valid: false, errors, warnings, data: [], preview: { yearGroups: [], sections: [], totalCells: 0, filledCells: 0 } };
  }

  // Find section rows (Cohort, All Pupils, FSM6, Not FSM6)
  const sectionLabels = new Map<string, SectionKey>([
    ['Cohort', 'cohort'],
    ['All Pupils', 'all_pupils'],
    ['FSM6', 'fsm6'],
    ['Not FSM6', 'not_fsm6'],
    ['Not FSM', 'not_fsm6'],
    ['Non-FSM', 'not_fsm6'],
  ]);

  for (let row = headerRow + 1; row <= Math.min(range.e.r, headerRow + 20); row++) {
    const labelCell = worksheet[XLSX.utils.encode_cell({ r: row, c: range.s.c })];
    const value = labelCell?.v?.toString().trim();

    if (sectionLabels.has(value)) {
      sectionRows.set(row, sectionLabels.get(value)!);
    }
  }

  if (sectionRows.size === 0) {
    errors.push({ row: headerRow + 2, col: 0, cell: 'N/A', message: 'Could not find section rows (Cohort, All Pupils, FSM6, Not FSM6)', severity: 'error' });
    return { valid: false, errors, warnings, data: [], preview: { yearGroups: [], sections: [], totalCells: 0, filledCells: 0 } };
  }

  // Build cohort size lookup for validation
  const cohortSizes = new Map<YearGroup, number>();

  // Parse cells
  for (let row = headerRow + 1; row <= range.e.r; row++) {
    const section = sectionRows.get(row);
    if (!section) continue;

    for (let col = range.s.c + 1; col <= range.e.c; col++) {
      const yearGroup = yearGroupCols.get(col);
      if (!yearGroup) continue;

      // Find metric header
      const metricCell = worksheet[XLSX.utils.encode_cell({ r: headerRow - 1, c: col })];
      const metricLabel = metricCell?.v?.toString().trim() || '';

      // Try to find metric in first column instead (common format)
      const rowLabelCell = worksheet[XLSX.utils.encode_cell({ r: row, c: range.s.c })];
      const rowLabel = rowLabelCell?.v?.toString().trim() || '';

      // Determine metric key
      let metricKey: string | null = null;
      let metricDef: MetricDef | undefined;

      if (section === 'cohort') {
        // Cohort section - determine metric from row label
        const cohortMetric = COHORT_METRICS.find((m) => m.label.toLowerCase() === rowLabel.toLowerCase());
        if (cohortMetric) {
          metricKey = cohortMetric.key;
          metricDef = cohortMetric;
        }
      } else {
        // Attainment sections - determine from column header or position
        // First, try to match column header
        const colLabel = worksheet[XLSX.utils.encode_cell({ r: headerRow - 1, c: col })]?.v?.toString().trim();

        if (colLabel) {
          const attainmentMetrics = YEAR_GROUP_METRICS[yearGroup];
          metricDef = attainmentMetrics?.find((m) => m.label === colLabel || m.label.toLowerCase() === colLabel.toLowerCase());
        }

        // If not found in header, try position-based mapping (common format)
        if (!metricDef) {
          const attainmentMetrics = YEAR_GROUP_METRICS[yearGroup];
          const colIndex = col - range.s.c - 1; // -1 for label column
          if (attainmentMetrics && colIndex >= 0 && colIndex < attainmentMetrics.length) {
            metricDef = attainmentMetrics[colIndex];
          }
        }

        if (metricDef) {
          metricKey = metricDef.key;
        }
      }

      if (!metricKey || !metricDef) {
        // Unknown metric - add warning but don't fail
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        warnings.push({
          row: row + 1,
          col: col + 1,
          cell: cellRef,
          message: `Unknown metric at ${yearGroup} / ${section} (row label: "${rowLabel}")`,
          severity: 'warning',
        });
        continue;
      }

      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = worksheet[cellAddress];
      const rawValue = cell?.v;

      // Store cohort size for validation
      if (section === 'cohort' && metricKey === 'number_in_cohort' && typeof rawValue === 'number') {
        cohortSizes.set(yearGroup, rawValue);
      }

      const parsedCell: ParsedCell = {
        yearGroup,
        section,
        metric: metricKey,
        value: rawValue === null || rawValue === undefined ? null : Number(rawValue),
        row: row + 1,
        col: col + 1,
        rawValue: rawValue ?? '',
      };

      // Validate cell value
      const validationError = validateCell(metricDef, parsedCell.value, cohortSizes.get(yearGroup));
      if (validationError) {
        errors.push({
          row: row + 1,
          col: col + 1,
          cell: cellAddress,
          message: `${yearGroup} / ${metricDef.label}: ${validationError}`,
          severity: 'error',
        });
      }

      data.push(parsedCell);
    }
  }

  const yearGroups = Array.from(new Set(data.map((d) => d.yearGroup)));
  const sections = Array.from(new Set(data.map((d) => d.section)));

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    data,
    preview: {
      yearGroups,
      sections,
      totalCells: data.length,
      filledCells: data.filter((d) => d.value !== null).length,
    },
  };
}

export function parsedCellsToCaptureData(cells: ParsedCell[]): Array<{
  year_group: string;
  section: string;
  metric: string;
  value: number | null;
}> {
  return cells.map((cell) => ({
    year_group: cell.yearGroup,
    section: cell.section,
    metric: cell.metric,
    value: cell.value,
  }));
}
