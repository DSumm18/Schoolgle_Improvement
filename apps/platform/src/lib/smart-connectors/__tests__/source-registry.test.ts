import { describe, it, expect } from 'vitest';
import { DATA_SOURCES, getSourceByTable } from '../source-registry';

describe('source-registry', () => {
  it('defines all 6 DfE data sources', () => {
    expect(DATA_SOURCES).toHaveLength(6);
    const tableNames = DATA_SOURCES.map(s => s.table);
    expect(tableNames).toContain('ks2_results');
    expect(tableNames).toContain('attendance');
    expect(tableNames).toContain('workforce');
    expect(tableNames).toContain('exclusions');
    expect(tableNames).toContain('ks4_results');
    expect(tableNames).toContain('census');
  });

  it('each source has required metadata', () => {
    for (const source of DATA_SOURCES) {
      expect(source.id).toBeTruthy();
      expect(source.name).toBeTruthy();
      expect(source.table).toBeTruthy();
      expect(source.colour).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(source.logo).toBeTruthy();
      expect(source.description).toBeTruthy();
      expect(source.urnColumn).toBe('urn');
    }
  });

  it('getSourceByTable returns correct source', () => {
    const source = getSourceByTable('ks2_results');
    expect(source?.name).toBe('KS2 Results');
    expect(source?.colour).toBe('#ef4444');
  });

  it('getSourceByTable returns undefined for unknown table', () => {
    expect(getSourceByTable('nonexistent')).toBeUndefined();
  });
});
