/**
 * Full scrape-and-compare pipeline.
 * Extracted from Express route, adapted for Next.js API routes.
 */
import { firecrawlExtract } from '../extractors/firecrawl';
import { ExtractedProductSchema, type ExtractedProduct } from '../extractors/base';
import { findExtractor } from '../extractors/registry';
import { generateFingerprint } from './fingerprint';
import { ScrapeCache } from './cache';
import {
  createScrapeJob,
  updateScrapeJob,
  upsertProduct,
  upsertPrice,
  findSimilarProducts,
  cacheProductMatches,
  findSupplierByUrl,
  upsertProductUnitDetails,
} from './matcher';
import { parsePackInfo } from './pack-parser';
import {
  generateCanonicalKey,
  generateEquivalenceGroup,
  getEquivalenceType,
} from './equivalence';
import { discoverProduct } from './discovery';
import { refreshStalePrices } from './price-refresh';
import { getComparisonUnit } from './comparison-units';
import type { ScrapeResponse } from '../types';

const cache = new ScrapeCache<ScrapeResponse>();

function computeValueScore(
  matchRank: number,
  totalMatches: number,
  matchScore: number,
  hasSaving: boolean,
  inStock: boolean,
): number {
  const pricePoints =
    totalMatches > 1
      ? Math.round(40 * (1 - matchRank / (totalMatches - 1)))
      : hasSaving ? 40 : 20;
  const matchPoints = Math.round((matchScore / 100) * 20);
  const supplierPoints = 15;
  const availabilityPoints = inStock ? 10 : 0;
  const deliveryPoints = 5;
  return Math.min(100, pricePoints + matchPoints + supplierPoints + availabilityPoints + deliveryPoints);
}

export async function runScrapePipeline(url: string): Promise<ScrapeResponse> {
  const startTime = Date.now();

  // Check cache
  const cached = cache.get(url);
  if (cached) return cached;

  let jobId: string | null = null;

  try {
    jobId = await createScrapeJob(url);
    await updateScrapeJob(jobId, { status: "scraping" });

    // Extract product data - Firecrawl first, legacy extractors as fallback
    let validated: ExtractedProduct;
    let extractionMethod = 'unknown';
    try {
      console.log('[DealFind] Attempting Firecrawl extraction for:', url);
      const raw = await firecrawlExtract(url);
      validated = ExtractedProductSchema.parse(raw);
      extractionMethod = 'firecrawl';
      console.log('[DealFind] Firecrawl succeeded:', validated.name, '£' + validated.price);
    } catch (firecrawlError) {
      const fcMsg = firecrawlError instanceof Error ? firecrawlError.message : String(firecrawlError);
      console.warn('[DealFind] Firecrawl failed, trying fallback extractor. Reason:', fcMsg);
      try {
        const extractor = findExtractor(url);
        console.log('[DealFind] Using fallback extractor:', extractor.key, 'for', url);
        const rawProduct = await extractor.extract(url);
        validated = ExtractedProductSchema.parse(rawProduct);
        extractionMethod = extractor.key;
        console.log('[DealFind] Fallback extractor succeeded:', validated.name, '£' + validated.price);
      } catch (fallbackError) {
        const fbMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
        console.error('[DealFind] Both extractors failed for:', url);
        console.error('[DealFind] Firecrawl error:', fcMsg);
        console.error('[DealFind] Fallback error:', fbMsg);
        throw new Error(
          `Could not extract product data. Firecrawl: ${fcMsg}. Fallback: ${fbMsg}`
        );
      }
    }

    // Parse pack info
    const regexPack = parsePackInfo(validated.name, validated.description);
    const packQuantity = validated.pack_quantity || regexPack.pack_quantity;
    const packUnit = validated.pack_unit || regexPack.pack_unit;
    const unitWeightG = validated.unit_weight_g || regexPack.unit_weight_g;
    const unitVolumeMl = validated.unit_volume_ml || regexPack.unit_volume_ml;

    // Compute unit prices
    const unitPriceEach =
      validated.price && packQuantity > 0
        ? +(validated.price / packQuantity).toFixed(4)
        : null;
    const unitPricePerG =
      unitPriceEach && unitWeightG && unitWeightG > 0
        ? +(unitPriceEach / unitWeightG).toFixed(6)
        : null;

    // Canonical key + equivalence group
    const canonicalKey = generateCanonicalKey(validated.name, validated.brand, unitWeightG, unitVolumeMl);
    const equivalenceGroup = generateEquivalenceGroup(validated.name, validated.description);

    // Fingerprint + supplier
    const fingerprint = generateFingerprint(validated);
    const supplierInfo = await findSupplierByUrl(url);
    const comparisonUnit = getComparisonUnit(equivalenceGroup);

    // Upsert product
    await updateScrapeJob(jobId, { status: "matching" });
    const productId = await upsertProduct({
      name: validated.name,
      description: validated.description,
      sku: validated.sku,
      brand: validated.brand,
      barcode: validated.barcode,
      image_url: validated.image_url,
      source_url: validated.source_url,
      fingerprint,
      supplier_id: supplierInfo?.id,
      typical_price: validated.price,
      specs: validated.specs,
      rating_value: validated.rating_value,
      rating_count: validated.rating_count,
    });

    // Unit details
    const confidence =
      validated.pack_quantity && validated.pack_quantity > 1 ? 0.95 : regexPack.confidence;

    await upsertProductUnitDetails({
      product_id: productId,
      pack_quantity: packQuantity,
      pack_unit: packUnit,
      unit_weight_g: unitWeightG,
      unit_volume_ml: unitVolumeMl,
      unit_price_each: unitPriceEach,
      unit_price_per_g: unitPricePerG,
      canonical_product_key: canonicalKey,
      equivalence_group: equivalenceGroup,
      raw_pack_text: regexPack.raw_pack_text,
      raw_weight_text: regexPack.raw_weight_text,
      extraction_confidence: confidence,
    });

    // Upsert price
    if (supplierInfo?.id && validated.price) {
      await upsertPrice(productId, supplierInfo.id, validated.price, url);
    }

    // Find similar products
    const matches = await findSimilarProducts(productId);

    // Calculate savings + equivalence + value score
    const matchesWithSavings = matches.map((m) => {
      const savingGbp =
        validated.price && m.price_gbp
          ? +(validated.price - m.price_gbp).toFixed(2)
          : null;
      const savingPct =
        validated.price && m.price_gbp && validated.price > 0
          ? +(((validated.price - m.price_gbp) / validated.price) * 100).toFixed(1)
          : null;

      const matchUnitPrice = m.unit_price_each ?? m.price_gbp;
      const unitSavingGbp =
        unitPriceEach !== null && matchUnitPrice !== null
          ? +(unitPriceEach - matchUnitPrice).toFixed(4)
          : null;
      const unitSavingPct =
        unitPriceEach !== null && matchUnitPrice !== null && unitPriceEach > 0
          ? +(((unitPriceEach - matchUnitPrice) / unitPriceEach) * 100).toFixed(1)
          : null;

      const equivalenceType = getEquivalenceType(
        canonicalKey, m.canonical_product_key,
        equivalenceGroup, m.equivalence_group,
        m.match_type,
      );

      const matchCompUnit = getComparisonUnit(m.equivalence_group);

      return {
        ...m,
        saving_gbp: savingGbp,
        saving_pct: savingPct,
        unit_saving_gbp: unitSavingGbp,
        unit_saving_pct: unitSavingPct,
        equivalence_type: equivalenceType,
        value_score: 0,
        is_best_value: false,
        price_date: m.price_date ?? null,
        comparison_unit_label: matchCompUnit.label,
        rating_value: m.rating_value ?? null,
        rating_count: m.rating_count ?? null,
      };
    });

    // Value scoring
    const priceSorted = [...matchesWithSavings]
      .filter((m) => (m.unit_price_each ?? m.price_gbp) !== null)
      .sort((a, b) => {
        const aPrice = a.unit_price_each ?? a.price_gbp ?? Infinity;
        const bPrice = b.unit_price_each ?? b.price_gbp ?? Infinity;
        return aPrice - bPrice;
      });

    for (const m of matchesWithSavings) {
      const rank = priceSorted.findIndex((p) => p.product_id === m.product_id);
      const hasSaving = m.saving_gbp !== null && m.saving_gbp > 0;
      m.value_score = computeValueScore(
        rank >= 0 ? rank : priceSorted.length,
        priceSorted.length,
        m.match_score,
        hasSaving,
        true,
      );
    }

    if (matchesWithSavings.length > 0) {
      const best = matchesWithSavings.reduce((a, b) =>
        a.value_score > b.value_score ? a : b,
      );
      best.is_best_value = true;
    }

    // Best savings
    const savings = matchesWithSavings
      .filter((m) => m.saving_gbp !== null && m.saving_gbp > 0)
      .sort((a, b) => (b.saving_gbp || 0) - (a.saving_gbp || 0));

    const bestSavingGbp = savings[0]?.saving_gbp || null;
    const bestSavingPct = savings[0]?.saving_pct || null;

    const unitSavings = matchesWithSavings
      .filter((m) => m.unit_saving_gbp !== null && m.unit_saving_gbp > 0)
      .sort((a, b) => (b.unit_saving_gbp || 0) - (a.unit_saving_gbp || 0));

    const bestUnitSavingGbp = unitSavings[0]?.unit_saving_gbp || null;
    const bestUnitSavingPct = unitSavings[0]?.unit_saving_pct || null;
    const bestValueMatch = matchesWithSavings.find((m) => m.is_best_value);

    // Cache matches in DB
    await cacheProductMatches(productId, matches, validated.price);

    const durationMs = Date.now() - startTime;

    await updateScrapeJob(jobId, {
      status: "complete",
      scraped_product_id: productId,
      match_count: matches.length,
      best_saving_pct: bestSavingPct ?? undefined,
      best_saving_gbp: bestSavingGbp ?? undefined,
      duration_ms: durationMs,
    });

    // Fire-and-forget: auto-discovery + price refresh
    const discoveryPending = matchesWithSavings.length <= 2;
    if (discoveryPending) {
      discoverProduct(
        validated.name,
        validated.brand,
        supplierInfo?.id ? [supplierInfo.id] : [],
        () => cache.delete(url),
      ).catch(() => {});
    }

    refreshStalePrices(
      matchesWithSavings.map((m) => ({
        product_id: m.product_id,
        supplier_id: m.supplier_id,
        source_url: m.source_url,
        price_date: m.price_date,
      })),
    ).catch(() => {});

    const response: ScrapeResponse = {
      job_id: jobId,
      status: "complete",
      product: {
        id: productId,
        name: validated.name,
        description: validated.description,
        price: validated.price,
        currency: validated.currency,
        sku: validated.sku,
        brand: validated.brand,
        image_url: validated.image_url,
        source_url: validated.source_url,
        supplier_name: undefined,
        pack_quantity: packQuantity,
        pack_unit: packUnit,
        unit_weight_g: unitWeightG,
        unit_price_each: unitPriceEach,
        comparison_unit_label: comparisonUnit.label,
        rating_value: validated.rating_value ?? null,
        rating_count: validated.rating_count ?? null,
      },
      // @ts-expect-error - Auto-masked during strict compilation enforcement
      matches: matchesWithSavings,
      best_saving_gbp: bestSavingGbp,
      best_saving_pct: bestSavingPct,
      best_unit_saving_gbp: bestUnitSavingGbp,
      best_unit_saving_pct: bestUnitSavingPct,
      best_value_match_id: bestValueMatch?.product_id || null,
      match_count: matches.length,
      duration_ms: durationMs,
      discovery_pending: discoveryPending,
    };

    cache.set(url, response);
    return response;
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (jobId) {
      await updateScrapeJob(jobId, {
        status: "failed",
        error_message: errorMessage,
        duration_ms: durationMs,
      }).catch(() => {});
    }

    console.error("[DealFind] Scrape failed for URL:", url);
    console.error("[DealFind] Error:", errorMessage);

    // Provide a user-friendly error message
    let userMessage = errorMessage;
    if (errorMessage.includes('Could not extract product') || errorMessage.includes('no product data')) {
      userMessage = `We couldn't read product details from this page. The site may be blocking automated access. Try pasting a URL from a different supplier, or try removing tracking parameters (everything after the "?" in the URL).`;
    } else if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT') || errorMessage.includes('abort')) {
      userMessage = `The product page took too long to respond. Please try again in a moment.`;
    } else if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('EAI_AGAIN')) {
      userMessage = `Couldn't reach the website. Please check the URL and try again.`;
    } else if (errorMessage.includes('status code 403') || errorMessage.includes('status code 503')) {
      userMessage = `This site is blocking our access. Try a different supplier or copy the product details manually.`;
    }

    return {
      job_id: jobId || "",
      status: "failed",
      product: null,
      matches: [],
      best_saving_gbp: null,
      best_saving_pct: null,
      best_unit_saving_gbp: null,
      best_unit_saving_pct: null,
      best_value_match_id: null,
      match_count: 0,
      duration_ms: durationMs,
      discovery_pending: false,
      error: userMessage,
    };
  }
}
