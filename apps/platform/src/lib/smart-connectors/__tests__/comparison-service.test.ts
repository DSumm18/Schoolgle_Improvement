import { describe, it, expect } from 'vitest';
import { buildComparisonQuery, computeDifferences } from '../comparison-service';

describe('comparison-service', () => {
  it('builds KS2 comparison query with national and LA averages', () => {
    const sql = buildComparisonQuery({
      urn: 148201,
      table: 'ks2_results',
      valueColumn: 'expected_standard_pct',
      timePeriod: '202425',
      laCode: '380',
      phaseName: 'Primary',
      subject: 'Reading',
    });
    expect(sql).toContain('148201');
    expect(sql).toContain('expected_standard_pct');
    expect(sql).toContain("'380'");
    expect(sql).toContain('national_avg');
    expect(sql).toContain('la_avg');
  });

  it('computes correct differences', () => {
    const result = computeDifferences({
      schoolValue: 79,
      nationalAvg: 73.7,
      laAvg: 74.1,
      similarAvg: 75.5,
    });
    expect(result.vsNational).toBeCloseTo(5.3, 1);
    expect(result.vsLa).toBeCloseTo(4.9, 1);
    expect(result.vsSimilar).toBeCloseTo(3.5, 1);
  });

  it('handles null similar average', () => {
    const result = computeDifferences({
      schoolValue: 79,
      nationalAvg: 73.7,
      laAvg: 74.1,
      similarAvg: null,
    });
    expect(result.vsSimilar).toBeNull();
  });
});
