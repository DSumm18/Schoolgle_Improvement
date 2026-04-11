import { describe, it, expect } from 'vitest';
import {
  reconcileValues,
  buildReconciliationQueries,
  categoriseDiscrepancy,
} from '../reconciliation-engine';

describe('reconciliation-engine', () => {
  describe('reconcileValues', () => {
    it('returns match when values are equal', () => {
      const result = reconcileValues('FSM %', 28.9, 28.9, 'GIAS', 'Census');
      expect(result.status).toBe('match');
      expect(result.difference).toBe(0);
    });

    it('returns match when values are within 0.5 tolerance', () => {
      const result = reconcileValues('FSM %', 28.9, 28.5, 'GIAS', 'Census');
      expect(result.status).toBe('match');
    });

    it('returns discrepancy when values differ beyond tolerance', () => {
      const result = reconcileValues('FSM %', 28.9, 27.3, 'GIAS', 'Census', 0.5);
      expect(result.status).toBe('discrepancy');
      expect(result.difference).toBeCloseTo(1.6, 1);
    });

    it('returns missing when either value is null', () => {
      const result = reconcileValues('SEN %', null, 5.2, 'GIAS', 'Census');
      expect(result.status).toBe('missing');
    });
  });

  describe('categoriseDiscrepancy', () => {
    it('explains FSM differences as snapshot timing', () => {
      const explanation = categoriseDiscrepancy('FSM %', 1.6);
      expect(explanation).toContain('snapshot');
    });

    it('flags large differences as potential errors', () => {
      const explanation = categoriseDiscrepancy('FSM %', 10.0);
      expect(explanation).toContain('Significant');
    });
  });

  describe('buildReconciliationQueries', () => {
    it('returns queries for all reconcilable fields', () => {
      const queries = buildReconciliationQueries(148201);
      expect(queries.length).toBeGreaterThan(0);
      expect(queries[0]).toContain('148201');
    });
  });
});
