export interface CsvParseResult {
  headers: string[];
  headerCount: number;
  rows: Record<string, string>[];
  rowCount: number;
  preview: Record<string, string>[];
}

export interface CsvParseOptions {
  previewLimit?: number;
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export function parseCsvString(csv: string, options: CsvParseOptions = {}): CsvParseResult {
  const previewLimit = options.previewLimit ?? 10;
  const trimmed = csv.trim();

  if (!trimmed) {
    return { headers: [], headerCount: 0, rows: [], rowCount: 0, preview: [] };
  }

  const lines = trimmed.split(/\r?\n/);
  if (lines.length === 0) {
    return { headers: [], headerCount: 0, rows: [], rowCount: 0, preview: [] };
  }

  const headers = splitCsvLine(lines[0]).map(h => h.trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const values = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = (values[idx] ?? '').trim();
    });
    rows.push(row);
  }

  return {
    headers,
    headerCount: headers.length,
    rows,
    rowCount: rows.length,
    preview: rows.slice(0, previewLimit),
  };
}
