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
import { calculateEquivalentBasket } from '@/lib/deal-finder/services/basket-comparison';
import { buildRetailerSearchLinks } from '@/lib/deal-finder/services/retailer-search-links';
import { hasVerifiedSaving, selectBestValueMatch } from '@/lib/deal-finder/services/value-ranking';
import { applyAffiliateParameters, buildAmazonSearchUrl } from '@/lib/deal-finder/affiliate-links';
import { normaliseSupplierProduct } from '@/lib/deal-finder/services/supplier-product-normalisation';
import {
  choosePackDetails,
  hasProcurementComparablePack,
  hasTrustworthyPackForComparison,
  shouldRetryWithSpecificExtractor,
} from '@/lib/deal-finder/services/scrape-pipeline';
import { extractFallbackProductFromHtml } from '@/lib/deal-finder/extractors/firecrawl';
import {
  buildDiscoveryQueries,
  extractProductCandidatesFromSearchHtml,
  isRelevantProductName,
  needsMoreChoiceDiscovery,
} from '@/lib/deal-finder/services/discovery';
import { ScrapeCache } from '@/lib/deal-finder/services/cache';
import {
  getSearchableSupplierDefinitions,
  SEARCHABLE_SUPPLIER_TARGET,
  SUPPLIERS,
} from '@/lib/deal-finder/suppliers';
import type { ExtractedProduct } from '@/lib/deal-finder/extractors/base';
import type { ProductMatch } from '@/lib/deal-finder/types';

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

  test('extracts supplier shorthand "pk 600" pattern', () => {
    const result = parsePackInfo('Staedtler Noris HB Pencil Classpack pk 600');
    expect(result.pack_quantity).toBe(600);
    expect(result.pack_unit).toBe('pack');
  });

  test('prefers a parsed supplier pack over a stale single-pack database value', () => {
    const parsed = parsePackInfo('Staedtler Noris HB Pencil Classpack pk 600');
    const result = choosePackDetails(1, 'pack', parsed);

    expect(result.packQuantity).toBe(600);
    expect(result.packUnit).toBe('pack');
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

  test('normalises A4 copy paper sheets to reams', () => {
    const singleReam = parsePackInfo('HP Copy A4 Printer Paper 80gsm 500 Sheets');
    expect(singleReam.pack_quantity).toBe(1);
    expect(singleReam.pack_unit).toBe('ream');

    const fiveReams = parsePackInfo('Viking A4 Copy Paper 500 Sheets Pack of 5');
    expect(fiveReams.pack_quantity).toBe(5);
    expect(fiveReams.pack_unit).toBe('ream');
  });

  test('normalises copy paper pack of 2500 as five reams', () => {
    const result = parsePackInfo('Blank A4 White Copier Paper Pack of 2500');

    expect(result.pack_quantity).toBe(5);
    expect(result.pack_unit).toBe('ream');
  });
});

// ============================================================================
// Equivalent Basket Comparison
// ============================================================================
describe('Equivalent Basket Comparison', () => {
  test('does not treat one cheap ream as a saving against a five-ream box', () => {
    const result = calculateEquivalentBasket({
      sourcePackQuantity: 5,
      sourcePrice: 12.49,
      sourceUnitPrice: 2.498,
      sourceUnitLabel: 'per ream',
      matchPackQuantity: 1,
      matchPrice: 4.31,
      matchUnitPrice: 4.31,
      matchUnitLabel: 'per ream',
    });

    expect(result.sourceComparisonQuantity).toBe(5);
    expect(result.equivalentTotalPrice).toBe(21.55);
    expect(result.savingGbp).toBe(-9.06);
    expect(result.unitSavingGbp).toBe(-1.812);
  });

  test('compares two five-ream paper boxes by same basket quantity', () => {
    const result = calculateEquivalentBasket({
      sourcePackQuantity: 5,
      sourcePrice: 12.49,
      sourceUnitPrice: 2.498,
      sourceUnitLabel: 'per ream',
      matchPackQuantity: 5,
      matchPrice: 14.05,
      matchUnitPrice: 2.81,
      matchUnitLabel: 'per ream',
    });

    expect(result.sourceComparisonQuantity).toBe(5);
    expect(result.equivalentTotalPrice).toBe(14.05);
    expect(result.savingGbp).toBe(-1.56);
    expect(result.unitSavingGbp).toBe(-0.312);
  });

  test('can identify a bulk option when buying enough units', () => {
    const result = calculateEquivalentBasket({
      sourcePackQuantity: 1,
      sourcePrice: 4.31,
      sourceUnitPrice: 4.31,
      sourceUnitLabel: 'per ream',
      matchPackQuantity: 5,
      matchPrice: 12.49,
      matchUnitPrice: 2.498,
      matchUnitLabel: 'per ream',
    });

    expect(result.sourceComparisonQuantity).toBe(5);
    expect(result.equivalentTotalPrice).toBe(12.49);
    expect(result.savingGbp).toBe(9.06);
    expect(result.unitSavingGbp).toBe(1.812);
  });
});

// ============================================================================
// Match Quality
// ============================================================================
describe('Match Quality', () => {
  test('hides class-pack pencil rows when pack size is unknown', () => {
    expect(
      hasTrustworthyPackForComparison({
        product_name: 'STAEDTLER Noris HB Pencils Class Packs',
        equivalence_group: 'pencil',
        pack_quantity: 1,
      }),
    ).toBe(false);
  });

  test('keeps class-pack pencil rows when pack size is known', () => {
    expect(
      hasTrustworthyPackForComparison({
        product_name: 'Staedtler Noris HB Pencil Classpack pk 150',
        equivalence_group: 'pencil',
        pack_quantity: 150,
      }),
    ).toBe(true);
  });

  test('excludes single-pencil rows from bulk school-pack comparisons', () => {
    expect(
      hasProcurementComparablePack('pencil', 50, {
        equivalence_group: 'pencil',
        pack_quantity: 1,
      }),
    ).toBe(false);

    expect(
      hasProcurementComparablePack('pencil', 50, {
        equivalence_group: 'pencil',
        pack_quantity: 12,
      }),
    ).toBe(true);
  });
});

// ============================================================================
// Retailer / Affiliate Links
// ============================================================================
describe('Retailer / Affiliate Links', () => {
  test('adds the Amazon Associate tag to Amazon product URLs only', () => {
    process.env.AMAZON_ASSOCIATE_TAG = 'schoolgle1-21';

    expect(applyAffiliateParameters('https://www.amazon.co.uk/dp/B01FSGVN4M')).toContain(
      'tag=schoolgle1-21',
    );
    expect(applyAffiliateParameters('https://www.ypo.co.uk/product/110787')).toBe(
      'https://www.ypo.co.uk/product/110787',
    );
  });

  test('builds a tagged Amazon search link for manual live checking', () => {
    process.env.AMAZON_ASSOCIATE_TAG = 'schoolgle1-21';

    const url = buildAmazonSearchUrl('A4 copy paper 80gsm 5 reams');

    expect(url).toContain('amazon.co.uk/s');
    expect(url).toContain('tag=schoolgle1-21');
    expect(url).toContain('A4+copy+paper');
  });

  test('shows Amazon as an unpriced live check when no verified Amazon product exists', () => {
    process.env.AMAZON_ASSOCIATE_TAG = 'schoolgle1-21';

    const links = buildRetailerSearchLinks(
      'A4 copy paper 80gsm 5 reams',
      'https://www.viking-direct.co.uk/en/p/1022616',
      [],
    );

    expect(links).toHaveLength(1);
    expect(links[0].supplier_name).toBe('Amazon Business UK');
    expect(links[0].price_verified).toBe(false);
    expect(links[0].url).toContain('tag=schoolgle1-21');
  });

  test('does not add a separate Amazon live check once a verified Amazon price exists', () => {
    const amazonMatch = {
      supplier_name: 'Amazon Business UK',
      price_gbp: 21.49,
      source_url: 'https://www.amazon.co.uk/dp/B01FSGVN4M',
    } as ProductMatch;

    expect(
      buildRetailerSearchLinks(
        'A4 copy paper 80gsm 5 reams',
        'https://www.viking-direct.co.uk/en/p/1022616',
        [amazonMatch],
      ),
    ).toEqual([]);
  });
});

// ============================================================================
// Extraction Fallback
// ============================================================================
describe('Extraction Fallback', () => {
  test('retries Amazon-specific extractor when generic extraction has title but no comparable data', () => {
    expect(
      shouldRetryWithSpecificExtractor(
        {
          name: 'STAEDTLER NORIS SCHOOL PENCILS HB [PACK OF 50) LOOSE : Amazon.co.uk',
          currency: 'GBP',
          source_url: 'https://www.amazon.co.uk/dp/B00Z705PAI',
          in_stock: true,
        },
        'firecrawl',
        'https://www.amazon.co.uk/dp/B00Z705PAI',
      ),
    ).toBe(true);
  });

  test('extracts Amazon price and ASIN from Amazon price markup', () => {
    const html = `
      <html>
        <head>
          <title>STAEDTLER NORIS SCHOOL PENCILS HB [PACK OF 50) LOOSE : Amazon.co.uk</title>
          <meta property="og:image" content="https://m.media-amazon.com/images/I/pencils.jpg" />
        </head>
        <body>
          <span id="productTitle">STAEDTLER NORIS SCHOOL PENCILS HB [PACK OF 50) LOOSE</span>
          <a id="bylineInfo">Visit the STAEDTLER Store</a>
          <div class="a-price">
            <span class="a-offscreen">£11.09</span>
          </div>
        </body>
      </html>
    `;

    const product = extractFallbackProductFromHtml(
      html,
      'https://www.amazon.co.uk/STAEDTLER-NORIS-SCHOOL-PENCILS-LOOSE/dp/B00Z705PAI',
    );

    expect(product.name).toContain('STAEDTLER NORIS SCHOOL PENCILS');
    expect(product.price).toBe(11.09);
    expect(product.sku).toBe('B00Z705PAI');
    expect(product.brand).toBe('STAEDTLER Store');
    expect(product.image_url).toBe('https://m.media-amazon.com/images/I/pencils.jpg');
  });
});

// ============================================================================
// Discovery
// ============================================================================
describe('Discovery', () => {
  test('broadens exact Staedtler pencil searches into school pencil buying queries', () => {
    const queries = buildDiscoveryQueries(
      'STAEDTLER NORIS SCHOOL PENCILS HB [PACK OF 50) LOOSE',
      'STAEDTLER Store',
      'pencil',
    );

    expect(queries).toEqual(
      expect.arrayContaining([
        'HB pencils school pack',
        'pencils classpack',
        'school pencils',
        'bulk HB pencils',
      ]),
    );
  });

  test('accepts singular pencil product names for plural pencil queries', () => {
    expect(
      isRelevantProductName(
        'Staedtler Noris HB Pencil Classpack pk 600',
        'HB pencils school pack',
      ),
    ).toBe(true);
  });

  test('asks discovery for more choices until the comparison set reaches launch quality', () => {
    expect(needsMoreChoiceDiscovery(3, 20)).toBe(true);
    expect(needsMoreChoiceDiscovery(20, 20)).toBe(false);
  });

  test('harvests relevant priced pencil cards directly from supplier search HTML', () => {
    const html = `
      <div class="product-card">
        <a href="/products/staedtler-noris-hb-pencil-classpack-pk-150">
          Staedtler Noris HB Pencil Classpack pk 150
        </a>
        <img src="/images/pencil-150.jpg" />
        <span class="price">£23.99</span>
      </div>
      <div class="product-card">
        <a href="/products/a4-copy-paper">A4 copy paper 5 reams</a>
        <span class="price">£12.49</span>
      </div>
    `;

    const candidates = extractProductCandidatesFromSearchHtml(
      html,
      'https://example-school-supplier.co.uk/search?q=HB+pencils',
      'HB pencils school pack',
    );

    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      name: 'Staedtler Noris HB Pencil Classpack pk 150',
      price: 23.99,
      image_url: 'https://example-school-supplier.co.uk/images/pencil-150.jpg',
      source_url:
        'https://example-school-supplier.co.uk/products/staedtler-noris-hb-pencil-classpack-pk-150',
    });
  });

  test('harvests Amazon search result cards with price and image', () => {
    const html = `
      <div class="s-result-item" data-asin="B123456789">
        <h2><a href="/Example-Pencils/dp/B123456789"><span>HB Pencils Pack of 144 for Schools</span></a></h2>
        <img class="s-image" src="https://m.media-amazon.com/images/I/pencils.jpg" />
        <span class="a-price"><span class="a-offscreen">£8.99</span></span>
      </div>
      <div class="s-result-item" data-asin="B987654321">
        <h2><a href="/Paint-Brushes/dp/B987654321"><span>Paint brushes assorted pack</span></a></h2>
        <span class="a-price"><span class="a-offscreen">£4.99</span></span>
      </div>
    `;

    const candidates = extractProductCandidatesFromSearchHtml(
      html,
      'https://www.amazon.co.uk/s?k=HB+pencils+school+pack',
      'HB pencils school pack',
    );

    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      name: 'HB Pencils Pack of 144 for Schools',
      price: 8.99,
      image_url: 'https://m.media-amazon.com/images/I/pencils.jpg',
      source_url: 'https://www.amazon.co.uk/Example-Pencils/dp/B123456789',
    });
  });
});

// ============================================================================
// Value Ranking
// ============================================================================
describe('Value Ranking', () => {
  test('does not crown an alternative when every option is dearer than the pasted product', () => {
    const matches = [
      {
        product_id: 'ypo',
        saving_gbp: -1.1,
        unit_saving_gbp: -0.22,
        value_score: 81,
      },
      {
        product_id: 'espo',
        saving_gbp: -2,
        unit_saving_gbp: -0.4,
        value_score: 72,
      },
    ] as ProductMatch[];

    expect(matches.some(hasVerifiedSaving)).toBe(false);
    expect(selectBestValueMatch(matches)).toBeNull();
  });

  test('crowns the best scored option only when there is a verified saving', () => {
    const matches = [
      {
        product_id: 'cheap-but-weaker-match',
        saving_gbp: 1.5,
        unit_saving_gbp: 0.3,
        value_score: 70,
      },
      {
        product_id: 'better-match',
        saving_gbp: 1.25,
        unit_saving_gbp: 0.25,
        value_score: 82,
      },
    ] as ProductMatch[];

    expect(selectBestValueMatch(matches)?.product_id).toBe('better-match');
  });
});

// ============================================================================
// Supplier Product Normalisation
// ============================================================================
describe('Supplier Product Normalisation', () => {
  test('restores YPO A4 paper pack size when extraction returns a truncated title', () => {
    const product = normaliseSupplierProduct(
      {
        name: 'A4 Rey Copy Paper 80gsm',
        price: 14.05,
        currency: 'GBP',
        source_url:
          'https://www.ypo.co.uk/product/detail/paper/office%20papers/a4%20printer%20paper/110787',
      },
      'https://www.ypo.co.uk/product/detail/paper/office%20papers/a4%20printer%20paper/110787',
    );

    expect(product.name).toContain('5 Reams');
    expect(product.pack_quantity).toBe(5);
    expect(product.pack_unit).toBe('ream');
  });

  test('restores ESPO Shires paper title so it stays in copy-paper comparisons', () => {
    const product = normaliseSupplierProduct(
      {
        name: 'Shires A4 Multi',
        price: 14.95,
        currency: 'GBP',
        source_url: 'https://www.espo.org/multi-purpose-paper-96520.html',
      },
      'https://www.espo.org/multi-purpose-paper-96520.html',
    );

    expect(product.name).toContain('Paper');
    expect(product.name).toContain('5 Reams');
    expect(product.pack_quantity).toBe(5);
    expect(generateEquivalenceGroup(product.name, product.description)).toBe('copy-paper');
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

  test('classifies plural school pencils as pencil alternatives', () => {
    const group = generateEquivalenceGroup('STAEDTLER NORIS SCHOOL PENCILS HB [PACK OF 50) LOOSE');
    expect(group).toBe('pencil');
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

  test('does not treat broad category items as product alternatives', () => {
    const paperGroup = generateEquivalenceGroup('A4 White Paper 80gsm 500 Sheets');
    const paintBrushGroup = generateEquivalenceGroup('Paint Brushes Assorted Bulk Pack of 100');
    const playgroundGroup = generateEquivalenceGroup('Playground Cones Pack of 50');

    expect(paperGroup).toBe('copy-paper');
    expect(paintBrushGroup).not.toBe(paperGroup);
    expect(playgroundGroup).not.toBe(paperGroup);
    expect(
      getEquivalenceType(
        'a4-white-paper-80gsm',
        'paint-brushes-assorted',
        paperGroup,
        paintBrushGroup,
        'category_equivalence',
      ),
    ).toBe('different');
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
  test('supplier list has at least 70 suppliers', () => {
    expect(SUPPLIERS.length).toBeGreaterThanOrEqual(70);
  });

  test('searchable supplier list meets launch target', () => {
    expect(getSearchableSupplierDefinitions().length).toBeGreaterThanOrEqual(
      SEARCHABLE_SUPPLIER_TARGET,
    );
  });

  test('each supplier has id, name, and website', () => {
    for (const s of SUPPLIERS) {
      expect(s.id).toBeTruthy();
      expect(s.name).toBeTruthy();
      expect(s.website).toBeTruthy();
      expect(s.tags.length).toBeGreaterThan(0);
    }
  });

  test('includes known education suppliers', () => {
    const names = SUPPLIERS.map((s) => s.name.toLowerCase());
    expect(names).toContain('ypo');
    expect(names).toContain('espo');
    expect(names).toContain('tts group');
  });

  test('covers the priority school procurement categories', () => {
    const tags = new Set(SUPPLIERS.flatMap((supplier) => supplier.tags));
    expect(Array.from(tags)).toEqual(
      expect.arrayContaining([
        'stationery',
        'it',
        'printing',
        'cleaning',
        'facilities',
        'sports',
        'furniture',
        'science',
        'art',
        'books',
      ]),
    );
  });
});
