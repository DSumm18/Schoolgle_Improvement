import type { ColumnType, ConnectorColumn, ConnectorFieldSchema, JoinKey } from '../types';

const JOIN_KEY_TYPES: ColumnType[] = [
  'urn', 'postcode', 'pupil_hash', 'staff_id', 'year_group', 'cohort', 'location_code', 'date',
];

const HEADER_PATTERNS: Array<{ pattern: RegExp; type: ColumnType }> = [
  { pattern: /^(post[\s_-]?code|postal[\s_-]?code|zip)$/i, type: 'postcode' },
  { pattern: /^urn$/i, type: 'urn' },
  { pattern: /^(pupil[\s_-]?hash|student[\s_-]?hash)$/i, type: 'pupil_hash' },
  { pattern: /^(staff[\s_-]?id|employee[\s_-]?id|teacher[\s_-]?id)$/i, type: 'staff_id' },
  { pattern: /(year[\s_-]?group|^year$|yr[\s_-]?group)/i, type: 'year_group' },
  { pattern: /^cohort$/i, type: 'cohort' },
  { pattern: /^(room|location|location[\s_-]?code|building)$/i, type: 'location_code' },
  { pattern: /(date|_at$|time|when)/i, type: 'date' },
];

export function inferColumnType(header: string, values: string[]): ColumnType {
  for (const { pattern, type } of HEADER_PATTERNS) {
    if (pattern.test(header)) {
      return type;
    }
  }

  const nonEmptyValues = values.filter(v => v && v.trim() !== '').slice(0, 20);
  if (nonEmptyValues.length === 0) return 'text';

  const allNumeric = nonEmptyValues.every(v => /^-?\d+(\.\d+)?$/.test(v.trim()));
  if (allNumeric) return 'number';

  const allDates = nonEmptyValues.every(v =>
    /^\d{4}-\d{2}-\d{2}/.test(v.trim()) || /^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(v.trim()),
  );
  if (allDates) return 'date';

  return 'text';
}

export function detectJoinKeys(schema: ConnectorFieldSchema): JoinKey[] {
  return schema.columns
    .filter(c => c.is_join_key && JOIN_KEY_TYPES.includes(c.type))
    .map(c => c.type as JoinKey);
}

export function buildColumnSchema(
  headers: string[],
  rows: Record<string, string>[],
): ConnectorFieldSchema {
  const columns: ConnectorColumn[] = headers.map(header => {
    const values = rows.map(r => r[header] ?? '');
    const type = inferColumnType(header, values);
    const is_join_key = JOIN_KEY_TYPES.includes(type);
    return { name: header, type, is_join_key };
  });
  return { columns };
}
