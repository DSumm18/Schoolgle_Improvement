import { describe, it, expect } from 'vitest';
import { calculateDistanceMiles, buildProximityQuery } from '../proximity';

describe('proximity', () => {
  // Grove House: easting 417106, northing 435598
  // Bradford City Centre approx: easting 416500, northing 433800
  // ~1.9km apart = ~1.2 miles

  it('calculates distance between two OS grid points in miles', () => {
    const distance = calculateDistanceMiles(
      417106, 435598,  // Grove House
      416500, 433800   // Bradford centre
    );
    expect(distance).toBeGreaterThan(1.0);
    expect(distance).toBeLessThan(1.5);
  });

  it('returns 0 for same point', () => {
    const distance = calculateDistanceMiles(417106, 435598, 417106, 435598);
    expect(distance).toBe(0);
  });

  it('builds correct SQL for proximity search', () => {
    const sql = buildProximityQuery({
      easting: 417106,
      northing: 435598,
      radiusMiles: 5,
      phaseName: 'Primary',
      excludeUrn: 148201,
    });
    expect(sql).toContain('417106');
    expect(sql).toContain('435598');
    expect(sql).toContain('1609.34');
    expect(sql).toContain("phase_name = 'Primary'");
    expect(sql).toContain('148201');
    expect(sql).toContain('distance_miles');
  });

  it('builds SQL without phase filter when not provided', () => {
    const sql = buildProximityQuery({
      easting: 417106,
      northing: 435598,
      radiusMiles: 3,
      excludeUrn: 148201,
    });
    // phase_name appears in SELECT but NOT in WHERE clause
    expect(sql).not.toContain("phase_name = '");
  });
});
