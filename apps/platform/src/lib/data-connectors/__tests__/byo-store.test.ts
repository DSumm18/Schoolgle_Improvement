import { describe, it, expect } from 'vitest';
import { buildInsertRows, extractJoinValues } from '../byo/byo-store';

describe('byo-store helpers', () => {
  describe('extractJoinValues', () => {
    it('extracts join key values from a row', () => {
      const schema = {
        columns: [
          { name: 'postcode', type: 'postcode' as const, is_join_key: true },
          { name: 'severity', type: 'text' as const },
          { name: 'date', type: 'date' as const, is_join_key: true },
        ],
      };
      const row = { postcode: 'BD2 4ED', severity: 'high', date: '2026-01-15' };
      const joinValues = extractJoinValues(schema, row);
      expect(joinValues).toEqual({ postcode: 'BD2 4ED', date: '2026-01-15' });
    });

    it('returns empty object when no join keys', () => {
      const schema = { columns: [{ name: 'notes', type: 'text' as const }] };
      const row = { notes: 'hello' };
      expect(extractJoinValues(schema, row)).toEqual({});
    });
  });

  describe('buildInsertRows', () => {
    it('builds insert payload with connector id and org id', () => {
      const schema = {
        columns: [
          { name: 'postcode', type: 'postcode' as const, is_join_key: true },
          { name: 'severity', type: 'text' as const },
        ],
      };
      const rows = [
        { postcode: 'BD2 4ED', severity: 'high' },
        { postcode: 'BD3 1XX', severity: 'low' },
      ];
      const connectorId = '00000000-0000-0000-0000-000000000001';
      const orgId = '00000000-0000-0000-0000-000000000002';

      const payload = buildInsertRows(rows, schema, connectorId, orgId);

      expect(payload).toHaveLength(2);
      expect(payload[0].connector_id).toBe(connectorId);
      expect(payload[0].organization_id).toBe(orgId);
      expect(payload[0].row_data).toEqual({ postcode: 'BD2 4ED', severity: 'high' });
      expect(payload[0].join_values).toEqual({ postcode: 'BD2 4ED' });
    });
  });
});
