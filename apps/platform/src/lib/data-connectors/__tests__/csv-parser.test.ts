import { describe, it, expect } from 'vitest';
import { parseCsvString } from '../byo/csv-parser';

describe('csv-parser', () => {
  it('parses simple CSV with header', () => {
    const csv = 'postcode,severity,date\nBD2 4ED,high,2026-01-15\nBD3 1XX,low,2026-01-20';
    const result = parseCsvString(csv);
    expect(result.headers).toEqual(['postcode', 'severity', 'date']);
    expect(result.rows.length).toBe(2);
    expect(result.rows[0]).toEqual({ postcode: 'BD2 4ED', severity: 'high', date: '2026-01-15' });
  });

  it('handles empty CSV', () => {
    const result = parseCsvString('');
    expect(result.headers).toEqual([]);
    expect(result.rows).toEqual([]);
  });

  it('trims whitespace from headers', () => {
    const csv = ' postcode , severity , date \nBD2 4ED,high,2026-01-15';
    const result = parseCsvString(csv);
    expect(result.headers).toEqual(['postcode', 'severity', 'date']);
  });

  it('handles quoted values with commas', () => {
    const csv = 'postcode,notes\nBD2 4ED,"incident at school, logged by DSL"';
    const result = parseCsvString(csv);
    expect(result.rows[0]?.notes).toBe('incident at school, logged by DSL');
  });

  it('returns row count and header count', () => {
    const csv = 'a,b,c\n1,2,3\n4,5,6\n7,8,9';
    const result = parseCsvString(csv);
    expect(result.headerCount).toBe(3);
    expect(result.rowCount).toBe(3);
  });

  it('limits preview rows', () => {
    const rows = Array.from({ length: 50 }, (_, i) => `${i},x`).join('\n');
    const csv = `id,label\n${rows}`;
    const result = parseCsvString(csv, { previewLimit: 10 });
    expect(result.preview.length).toBe(10);
    expect(result.rowCount).toBe(50);
  });
});
