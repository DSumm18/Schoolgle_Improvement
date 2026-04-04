import { describe, test, expect } from 'vitest';
import { parsePackInfo } from '@/lib/deal-finder/services/pack-parser';
import { generateFingerprint } from '@/lib/deal-finder/services/fingerprint';
import {
  generateCanonicalKey,
  generateEquivalenceGroup,
  getEquivalenceType,
} from '@/lib/deal-finder/services/equivalence';
import {
  getComparisonUnit,
  getComparisonPrice,
} from '@/lib/deal-finder/services/comparison-units';
import { ScrapeCache } from '@/lib/deal-finder/services/cache';
import { SUPPLIERS } from '@/lib/deal-finder/suppliers';
import type { ExtractedProduct } from '@/lib/deal-finder/extractors/base';

// ============================================================================
// Pack Parser
// ============================================================================
describe('Pack Parser', () => {
  test('extracts "Pack of 12" from product name', () => {
    const result = parsePackInfo('Pritt Stick 43g Pack of 12');
    expect(result.pack_quantity).toBe(12);
    expect(result.pack_unit).toBe('pack');
    expect(result.unit_weight_g).toBe(43);
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  test('extracts "Box of 100" from product name', () => {
    const result = parsePackInfo('Paper Clips Box of 100');
    expect(result.pack_quantity).toBe(100);
    expect(result.pack_unit).toBe('box');
  });

  test('extracts "24-pack" pattern', () => {
    const result = parsePackInfo('Whiteboard Markers 24-pack');
    expect(result.pack_quantity).toBe(24);
  });

  test('extracts "x5" pattern', () => {
    const result = parsePackInfo('Sellotape Original x5');
    expect(result.pack_quantity).toBe(5);
  });

  test('extracts weight in grams', () => {
    const result = parsePackInfo('PVA Glue 500ml');
    expect(result.unit_volume_ml).toBe(500);
  });

  test('extracts weight in kg', () => {
    const result = parsePackInfo('Hand Soap 1.5kg Bulk');
    expect(result.unit_weight_g).toBe(1500);
  });

  test('returns quantity 1 for single items', () => {
    const result = parsePackInfo('Stapler');
    expect(result.pack_quantity).toBe(1);
    expect(result.pack_unit).toBe('each');
  });

  test('handles description as fallback', () => {
    const result = parsePackInfo('Glue Stick', 'Pack of 24 large sticks');
    expect(result.pack_quantity).toBe(24);
  });
});

// ============================================================================
// Fingerprint
// ============================================================================
describe('Fingerprint', () => {
  test('generates consistent hash from product data', () => {
    const product: ExtractedProduct = {
      name: 'Pritt Stick 43g',
      source_url: 'https://example.com/pritt',
      brand: 'Pritt',
      sku: 'ABC123',
    };
    const fp1 = generateFingerprint(product);
    const fp2 = generateFingerprint(product);
    expect(fp1).toBe(fp2);
    expect(fp1).toBeTruthy();
  });

  test('normalises to lowercase alphanumeric', () => {
    const product: ExtractedProduct = {
      name: 'Pritt Stick 43g!',
      source_url: 'https://example.com',
      brand: 'PRITT',
      sku: 'abc-123',
    };
    const fp = generateFingerprint(product);
    expect(fp).toBe('prittstick43g|pritt|abc123');
  });

  test('handles missing brand and SKU', () => {
    const product: ExtractedProduct = {
      name: 'Generic Pen',
      source_url: 'https://example.com',
    };
    const fp = generateFingerprint(product);
    expect(fp).toBe('genericpen');
  });
});

// ============================================================================
// Equivalence
// ============================================================================
describe('Equivalence', () => {
  test('generates canonical key from name + brand + weight', () => {
    const key = generateCanonicalKey('Pritt Stick', 'Pritt', 43, null);
    expect(key).toBe('pritt-pritt-stick-43g');
  });

  test('strips pack quantity from canonical key', () => {
    const key = generateCanonicalKey('Pritt Stick Pack of 24', 'Pritt', 43, null);
    expect(key).toBe('pritt-pritt-stick-43g');
  });

  test('classifies "Pritt Stick" as glue-stick', () => {
    const group = generateEquivalenceGroup('Pritt Stick 43g');
    expect(group).toBe('glue-stick');
  });

  test('classifies "ballpoint pen" correctly', () => {
    const group = generateEquivalenceGroup('BIC Cristal Ballpoint Pen');
    expect(group).toBe('ballpoint-pen');
  });

  test('classifies "whiteboard marker" correctly', () => {
    const group = generateEquivalenceGroup('Expo Dry Erase Marker');
    expect(group).toBe('whiteboard-marker');
  });

  test('classifies copy paper correctly', () => {
    const group = generateEquivalenceGroup('Navigator A4 Paper 80gsm');
    expect(group).toBe('copy-paper');
  });

  test('classifies toilet roll correctly', () => {
    const group = generateEquivalenceGroup('Andrex Toilet Roll 9 Pack');
    expect(group).toBe('toilet-roll');
  });

  test('returns identical for same canonical key', () => {
    expect(getEquivalenceType('pritt-43g', 'pritt-43g', 'glue-stick', 'glue-stick', 'fuzzy_name')).toBe('identical');
  });

  test('returns alternative for same equivalence group, different canonical', () => {
    expect(getEquivalenceType('pritt-43g', 'uhu-40g', 'glue-stick', 'glue-stick', 'fuzzy_name')).toBe('alternative');
  });

  test('returns identical for exact_sku match type', () => {
    expect(getEquivalenceType('a', 'b', 'x', 'y', 'exact_sku')).toBe('identical');
  });

  test('returns different when no common group', () => {
    expect(getEquivalenceType('pritt-43g', 'bic-pen', 'glue-stick', 'pen', 'fuzzy_name')).toBe('different');
  });
});

// ============================================================================
// Comparison Units
// ============================================================================
describe('Comparison Units', () => {
  test('glue-stick maps to "per stick"', () => {
    const unit = getComparisonUnit('glue-stick');
    expect(unit.label).toBe('per stick');
    expect(unit.field).toBe('unit_price_each');
  });

  test('hand-soap maps to "per ml" with volume field', () => {
    const unit = getComparisonUnit('hand-soap');
    expect(unit.label).toBe('per ml');
    expect(unit.field).toBe('volume');
  });

  test('unknown group returns default "per unit"', () => {
    const unit = getComparisonUnit('unknown-widget');
    expect(unit.label).toBe('per unit');
  });

  test('null group returns default', () => {
    const unit = getComparisonUnit(null);
    expect(unit.label).toBe('per unit');
  });

  test('getComparisonPrice calculates volume-based price', () => {
    const unit = getComparisonUnit('hand-soap');
    const price = getComparisonPrice(null, null, 500, 3.99, unit);
    expect(price).toBeCloseTo(0.00798, 4);
  });

  test('getComparisonPrice returns unit_price_each for item-based', () => {
    const unit = getComparisonUnit('glue-stick');
    const price = getComparisonPrice(0.50, null, null, 6.0, unit);
    expect(price).toBe(0.50);
  });
});

// ============================================================================
// Cache
// ============================================================================
describe('ScrapeCache', () => {
  test('stores and retrieves values', () => {
    const cache = new ScrapeCache<string>();
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
  });

  test('returns null for missing keys', () => {
    const cache = new ScrapeCache<string>();
    expect(cache.get('missing')).toBeNull();
  });

  test('respects TTL expiry', () => {
    const cache = new ScrapeCache<string>(100, 1); // 1ms TTL
    cache.set('key', 'val');
    // Wait a tiny bit for expiry
    const start = Date.now();
    while (Date.now() - start < 5) { /* busy wait */ }
    expect(cache.get('key')).toBeNull();
  });

  test('evicts oldest when at capacity', () => {
    const cache = new ScrapeCache<string>(2); // Max 2 entries
    cache.set('a', '1');
    cache.set('b', '2');
    cache.set('c', '3'); // Should evict 'a'
    expect(cache.get('a')).toBeNull();
    expect(cache.get('b')).toBe('2');
    expect(cache.get('c')).toBe('3');
  });

  test('delete removes entry', () => {
    const cache = new ScrapeCache<string>();
    cache.set('key', 'val');
    cache.delete('key');
    expect(cache.get('key')).toBeNull();
  });

  test('clear removes all entries', () => {
    const cache = new ScrapeCache<string>();
    cache.set('a', '1');
    cache.set('b', '2');
    cache.clear();
    expect(cache.get('a')).toBeNull();
    expect(cache.get('b')).toBeNull();
  });
});

// ============================================================================
// Suppliers
// ============================================================================
describe('Suppliers', () => {
  test('supplier list has at least 9 suppliers', () => {
    expect(SUPPLIERS.length).toBeGreaterThanOrEqual(9);
  });

  test('each supplier has id, name, and website', () => {
    for (const s of SUPPLIERS) {
      expect(s.id).toBeTruthy();
      expect(s.name).toBeTruthy();
      expect(s.website).toBeTruthy();
    }
  });

  test('includes known education suppliers', () => {
    const names = SUPPLIERS.map((s) => s.name.toLowerCase());
    expect(names).toContain('ypo');
    expect(names).toContain('espo');
    expect(names).toContain('tts group');
  });
});
