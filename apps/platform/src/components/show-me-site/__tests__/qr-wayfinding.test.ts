import { describe, test, expect } from 'vitest';
import { ROOM_OUTLINES } from '../grove-house-3d-data';
import { calculateRoute } from '../route-calculator';

describe('QR Code Generation', () => {
  test('generates a valid URL for each room', () => {
    ROOM_OUTLINES.forEach(room => {
      const url = `/wayfinding/${room.systemId}`;
      // systemId format: "B1-01", "2001-01", "2017-01", "ENT-01"
      expect(url).toMatch(/^\/wayfinding\/[A-Z0-9]+-\d+$/);
    });
  });

  test('all rooms have unique QR URLs', () => {
    const urls = ROOM_OUTLINES.map(r => `/wayfinding/${r.systemId}`);
    const unique = new Set(urls);
    expect(unique.size).toBe(urls.length);
  });
});

describe('Route Calculation', () => {
  test('calculates a path between two rooms in the same block', () => {
    const route = calculateRoute('B1-01', 'B1-02');
    expect(route).toBeDefined();
    expect(route!.points.length).toBeGreaterThan(1);
    expect(route!.distance).toBeLessThan(20);
  });

  test('calculates a path between rooms in different blocks', () => {
    const route = calculateRoute('B1-01', 'B4-01');
    expect(route).toBeDefined();
    expect(route!.points.length).toBeGreaterThan(2);
  });

  test('returns null for invalid room IDs', () => {
    const route = calculateRoute('INVALID', 'B1-01');
    expect(route).toBeNull();
  });

  test('route has distance and estimated walk time', () => {
    const route = calculateRoute('B1-01', 'B3-01');
    expect(route).toBeDefined();
    expect(route!.distance).toBeGreaterThan(0);
    expect(route!.estimatedWalkTime).toBeGreaterThan(0);
  });

  test('same-room route has zero distance', () => {
    const route = calculateRoute('B1-01', 'B1-01');
    expect(route).toBeDefined();
    expect(route!.distance).toBe(0);
    expect(route!.points.length).toBe(1);
  });
});

describe('Wayfinding Page Data', () => {
  test('room lookup by systemId returns correct room', () => {
    const room = ROOM_OUTLINES.find(r => r.systemId === 'B1-01');
    expect(room).toBeDefined();
    expect(room!.block).toBe('Block 1');
  });

  test('all rooms are findable by systemId', () => {
    ROOM_OUTLINES.forEach(room => {
      const found = ROOM_OUTLINES.find(r => r.systemId === room.systemId);
      expect(found).toBeDefined();
    });
  });

  test('all rooms have valid coordinates for 2D rendering', () => {
    ROOM_OUTLINES.forEach(room => {
      expect(typeof room.x).toBe('number');
      expect(typeof room.z).toBe('number');
      expect(room.w).toBeGreaterThan(0);
      expect(room.d).toBeGreaterThan(0);
    });
  });
});
