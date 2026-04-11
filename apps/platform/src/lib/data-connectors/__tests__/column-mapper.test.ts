import { describe, it, expect } from 'vitest';
import {
  inferColumnType,
  detectJoinKeys,
  buildColumnSchema,
} from '../byo/column-mapper';

describe('column-mapper', () => {
  describe('inferColumnType', () => {
    it('detects postcode column by header name', () => {
      expect(inferColumnType('postcode', ['BD2 4ED', 'M1 1AA'])).toBe('postcode');
      expect(inferColumnType('Post Code', ['SW1A 1AA'])).toBe('postcode');
      expect(inferColumnType('postal_code', ['BD2 4ED'])).toBe('postcode');
    });

    it('detects URN column', () => {
      expect(inferColumnType('urn', ['148201', '100000'])).toBe('urn');
      expect(inferColumnType('URN', ['148201'])).toBe('urn');
    });

    it('detects date column', () => {
      expect(inferColumnType('date', ['2026-01-15', '2026-02-20'])).toBe('date');
      expect(inferColumnType('created_at', ['2026-01-15'])).toBe('date');
      expect(inferColumnType('incident_date', ['15/01/2026'])).toBe('date');
    });

    it('detects year_group column', () => {
      expect(inferColumnType('year_group', ['Year 3', 'Year 6'])).toBe('year_group');
      expect(inferColumnType('year', ['3', '6'])).toBe('year_group');
    });

    it('detects number column from values', () => {
      expect(inferColumnType('count', ['12', '45', '100'])).toBe('number');
    });

    it('defaults to text for unknown columns', () => {
      expect(inferColumnType('random_label', ['abc', 'def'])).toBe('text');
    });

    it('returns text for empty values', () => {
      expect(inferColumnType('random', [])).toBe('text');
    });
  });

  describe('detectJoinKeys', () => {
    it('returns join keys from column schema', () => {
      const schema = {
        columns: [
          { name: 'postcode', type: 'postcode' as const, is_join_key: true },
          { name: 'date', type: 'date' as const, is_join_key: true },
          { name: 'notes', type: 'text' as const },
        ],
      };
      const keys = detectJoinKeys(schema);
      expect(keys).toContain('postcode');
      expect(keys).toContain('date');
      expect(keys).not.toContain('notes');
    });

    it('returns empty array if no join keys', () => {
      const schema = { columns: [{ name: 'notes', type: 'text' as const }] };
      expect(detectJoinKeys(schema)).toEqual([]);
    });
  });

  describe('buildColumnSchema', () => {
    it('builds schema from headers and sample rows', () => {
      const headers = ['postcode', 'severity', 'date'];
      const rows = [
        { postcode: 'BD2 4ED', severity: 'high', date: '2026-01-15' },
        { postcode: 'BD3 1XX', severity: 'low', date: '2026-01-20' },
      ];
      const schema = buildColumnSchema(headers, rows);
      expect(schema.columns).toHaveLength(3);
      expect(schema.columns[0].type).toBe('postcode');
      expect(schema.columns[0].is_join_key).toBe(true);
      expect(schema.columns[2].type).toBe('date');
      expect(schema.columns[2].is_join_key).toBe(true);
      expect(schema.columns[1].type).toBe('text');
      expect(schema.columns[1].is_join_key).toBeFalsy();
    });
  });
});
