import { describe, it, expect } from 'vitest';
import {
  getConnector,
  getAllConnectors,
  getConnectorsByLayer,
  getConnectorsForConsumer,
} from '../registry';

describe('connector registry', () => {
  it('returns all connectors', () => {
    const all = getAllConnectors();
    expect(all.length).toBeGreaterThan(15);
  });

  it('returns a connector by id', () => {
    const c = getConnector('dfe-attendance');
    expect(c).toBeDefined();
    expect(c?.name).toBe('DfE Attendance');
    expect(c?.layer).toBe(1);
    expect(c?.dataController).toBe('us');
  });

  it('returns undefined for unknown id', () => {
    expect(getConnector('nonexistent')).toBeUndefined();
  });

  it('filters by layer', () => {
    const layer1 = getConnectorsByLayer(1);
    expect(layer1.length).toBeGreaterThanOrEqual(6);
    expect(layer1.every(c => c.layer === 1)).toBe(true);
  });

  it('returns connectors for ofsted-readiness consumer', () => {
    const deps = getConnectorsForConsumer('ofsted-readiness');
    const ids = deps.map(c => c.id);
    expect(ids).toContain('dfe-attendance');
    expect(ids).toContain('dfe-ks2-results');
    expect(ids).toContain('dfe-census');
    expect(ids).toContain('google-drive');
    expect(ids).toContain('contextual-factors');
  });

  it('returns connectors for attendance-behaviour subsection', () => {
    const deps = getConnectorsForConsumer('ofsted-readiness/attendance-behaviour');
    const ids = deps.map(c => c.id);
    expect(ids).toContain('dfe-attendance');
    expect(ids).toContain('dfe-exclusions');
    expect(ids).toContain('live-attendance');
    expect(ids).not.toContain('dfe-ks2-results');
  });

  it('returns empty array for unknown consumer', () => {
    expect(getConnectorsForConsumer('nonexistent-app')).toEqual([]);
  });

  it('all layer 1 active connectors are we-control', () => {
    const layer1 = getConnectorsByLayer(1).filter(c => c.status === 'active');
    expect(layer1.every(c => c.dataController === 'us')).toBe(true);
  });

  it('includes planned connectors', () => {
    const all = getAllConnectors();
    const planned = all.filter(c => c.status === 'planned');
    expect(planned.length).toBeGreaterThan(0);
    const ids = planned.map(c => c.id);
    expect(ids).toContain('police-api');
  });
});
