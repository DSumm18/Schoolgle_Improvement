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
import { discoverProduct, needsMoreChoiceDiscovery } from './discovery';
import { refreshStalePrices } from './price-refresh';
import { getComparisonUnit } from './comparison-units';
import { applyAffiliateParameters } from '../affiliate-links';
import type { ScrapeResponse } from '../types';
import { calculateEquivalentBasket } from './basket-comparison';
import { buildRetailerSearchLinks } from './retailer-search-links';
import { selectBestValueMatch } from './value-ranking';
import { normaliseSupplierProduct } from './supplier-product-normalisation';
import type { PackInfo } from './pack-parser';

const cache = new ScrapeCache<ScrapeResponse>();
const TARGET_COMPARISON_CHOICES = 20;
const RAW_MATCH_CANDIDATE_LIMIT = TARGET_COMPARISON_CHOICES + 12;
const BULK_UNIT_EQUIVALENCE_GROUPS = new Set([
  "pencil",
  "pen",
  "ballpoint-pen",
  "fountain-pen",
  "marker-pen",
  "whiteboard-marker",
  "highlighter",
  "glue-stick",
  "eraser",
]);

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

function hasReliableResultSource(match: { supplier_name?: string; source_url?: string | null; product_name?: string }): boolean {
  const name = match.product_name || "";
  const url = match.source_url || "";
  if (!url || !/^https?:\/\//i.test(url)) return false;
  if (!match.supplier_name || match.supplier_name === "Unknown") return false;
  if (/xxx|placeholder|example\.com/i.test(url)) return false;
  if (/404|page not found|just a moment|access denied|captcha/i.test(name)) return false;
  return true;
}

function comparisonUrlKey(sourceUrl: string | null): string | null {
  if (!sourceUrl) return null;
  try {
    const parsed = new URL(sourceUrl);
    return `${parsed.hostname.toLowerCase()}${parsed.pathname.toLowerCase()}`;
  } catch {
    return sourceUrl.toLowerCase().split("?")[0];
  }
}

export function hasTrustworthyPackForComparison(match: {
  product_name?: string;
  equivalence_group?: string | null;
  pack_quantity?: number | null;
}): boolean {
  const name = match.product_name || "";
  const group = match.equivalence_group || "";

  if (
    group === "pencil" &&
    (match.pack_quantity || 1) <= 1 &&
    /\b(?:class\s*packs?|classpacks?|bulk|box|packs?)\b/i.test(name)
  ) {
    return false;
  }

  return true;
}

export function hasProcurementComparablePack(
  sourceEquivalenceGroup: string | null,
  sourcePackQuantity: number,
  match: {
    equivalence_group?: string | null;
    pack_quantity?: number | null;
  },
): boolean {
  const group = match.equivalence_group || sourceEquivalenceGroup || "";

  if (
    BULK_UNIT_EQUIVALENCE_GROUPS.has(group) &&
    sourcePackQuantity >= 10 &&
    (match.pack_quantity || 1) <= 1
  ) {
    return false;
  }

  return true;
}

export function shouldRetryWithSpecificExtractor(
  product: ExtractedProduct,
  extractionMethod: string,
  url: string,
): boolean {
  if (extractionMethod !== "firecrawl") return false;

  const extractor = findExtractor(url);
  if (!extractor || extractor.key === "generic") return false;

  return !product.price;
}

export function choosePackDetails(
  extractedQuantity: number | null | undefined,
  extractedUnit: string | null | undefined,
  parsedPack: PackInfo,
): { packQuantity: number; packUnit: string } {
  if (parsedPack.pack_unit === "ream" || parsedPack.pack_quantity > 1) {
    return {
      packQuantity: parsedPack.pack_quantity,
      packUnit: parsedPack.pack_unit,
    };
  }

  return {
    packQuantity:
      extractedQuantity && extractedQuantity > 0
        ? extractedQuantity
        : parsedPack.pack_quantity,
    packUnit: extractedUnit || parsedPack.pack_unit,
  };
}

function assertVerifiedProduct(product: ExtractedProduct): void {
  const name = product.name?.trim();
  if (!name) {
    throw new Error("Could not extract a verified product name");
  }

  const blockedTitlePatterns = [
    /unknown product/i,
    /seed match/i,
    /^amazon\.co\.uk$/i,
    /^page not found$/i,
    /not found/i,
    /access denied/i,
    /captcha/i,
    /robot check/i,
    /just a moment/i,
    /cookie preference/i,
  ];

  if (blockedTitlePatterns.some((pattern) => pattern.test(name))) {
    throw new Error(`Could not verify a product from this page (${name})`);
  }

  if (!product.price && !product.sku && !product.brand && !product.image_url) {
    throw new Error(
      "The page did not expose enough product data to compare it safely",
    );
  }
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

    if (shouldRetryWithSpecificExtractor(validated, extractionMethod, url)) {
      const extractor = findExtractor(url);
      try {
        console.warn(
          '[DealFind] Firecrawl result missing price; retrying specific extractor:',
          extractor.key,
        );
        const rawProduct = await extractor.extract(url);
        validated = ExtractedProductSchema.parse(rawProduct);
        extractionMethod = extractor.key;
        console.log('[DealFind] Specific extractor succeeded:', validated.name, '£' + validated.price);
      } catch (specificError) {
        console.warn(
          '[DealFind] Specific extractor failed after incomplete Firecrawl result:',
          specificError instanceof Error ? specificError.message : String(specificError),
        );
      }
    }

    validated = {
      ...normaliseSupplierProduct(validated, url),
      source_url: applyAffiliateParameters(validated.source_url || url),
    };

    assertVerifiedProduct(validated);

    // Parse pack info
    const regexPack = parsePackInfo(validated.name, validated.description);
    const sourcePack = choosePackDetails(
      validated.pack_quantity,
      validated.pack_unit,
      regexPack,
    );
    const packQuantity = sourcePack.packQuantity;
    const packUnit = sourcePack.packUnit;
    const parsedEquivalenceGroup = generateEquivalenceGroup(
      validated.name,
      validated.description,
    );
    const isCopyPaper = parsedEquivalenceGroup === "copy-paper";
    const unitWeightG = isCopyPaper
      ? null
      : validated.unit_weight_g || regexPack.unit_weight_g;
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
    const equivalenceGroup = parsedEquivalenceGroup;

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

    // Find similar products. If the local corpus is thin, run a short live
    // discovery pass before scoring so the first user gets useful options too.
    let matches = await findSimilarProducts(productId, RAW_MATCH_CANDIDATE_LIMIT);
    if (needsMoreChoiceDiscovery(matches.length, TARGET_COMPARISON_CHOICES)) {
      await discoverProduct(
        validated.name,
        validated.brand,
        [],
        () => cache.delete(url),
        {
          equivalenceGroup,
          maxSuppliers: 24,
          maxProductsPerSupplier: 12,
          targetResults: Math.max(
            TARGET_COMPARISON_CHOICES - matches.length + 8,
            1,
          ),
          timeoutMs: 9000,
          useProductPageFallback: false,
        },
      );
      matches = await findSimilarProducts(productId, RAW_MATCH_CANDIDATE_LIMIT);
    }

    // Calculate savings + equivalence + value score
    const matchesWithSavings = matches.map((m) => {
      const normalisedMatch = normaliseSupplierProduct(
        {
          name: m.product_name,
          description: m.product_description || undefined,
          price: m.price_gbp || undefined,
          currency: "GBP",
          image_url: m.image_url || undefined,
          source_url: m.source_url || "",
          in_stock: true,
          pack_quantity: m.pack_quantity,
          pack_unit: m.pack_unit,
        },
        m.source_url || "",
      );
      const matchRegexPack = parsePackInfo(
        normalisedMatch.name,
        normalisedMatch.description,
      );
      const matchPack = choosePackDetails(
        normalisedMatch.pack_quantity || m.pack_quantity,
        normalisedMatch.pack_unit || m.pack_unit,
        matchRegexPack,
      );
      const matchPackQuantity = matchPack.packQuantity;
      const matchPackUnit = matchPack.packUnit;
      const matchUnitPrice =
        m.price_gbp && matchPackQuantity > 0
          ? +(m.price_gbp / matchPackQuantity).toFixed(4)
          : m.unit_price_each ?? m.price_gbp;
      const matchEquivalenceGroup = generateEquivalenceGroup(
        normalisedMatch.name,
        normalisedMatch.description,
      );
      const equivalenceType = getEquivalenceType(
        canonicalKey, m.canonical_product_key,
        equivalenceGroup, matchEquivalenceGroup,
        m.match_type,
      );

      const matchCompUnit = getComparisonUnit(matchEquivalenceGroup);
      const equivalent = calculateEquivalentBasket({
        sourcePackQuantity: packQuantity,
        sourcePrice: validated.price,
        sourceUnitPrice: unitPriceEach,
        sourceUnitLabel: comparisonUnit.label,
        matchPackQuantity,
        matchPrice: m.price_gbp,
        matchUnitPrice,
        matchUnitLabel: matchCompUnit.label,
      });

      return {
        ...m,
        product_name: normalisedMatch.name,
        product_description: normalisedMatch.description ?? m.product_description,
        pack_quantity: matchPackQuantity,
        pack_unit: matchPackUnit,
        unit_price_each: matchUnitPrice,
        equivalence_group: matchEquivalenceGroup,
        saving_gbp: equivalent.savingGbp,
        saving_pct: equivalent.savingPct,
        source_comparison_quantity: equivalent.sourceComparisonQuantity,
        equivalent_quantity: equivalent.equivalentQuantity,
        equivalent_total_price: equivalent.equivalentTotalPrice,
        unit_saving_gbp: equivalent.unitSavingGbp,
        unit_saving_pct: equivalent.unitSavingPct,
        equivalence_type: equivalenceType,
        value_score: 0,
        is_best_value: false,
        price_date: m.price_date ?? null,
        comparison_unit_label: matchCompUnit.label,
        rating_value: m.rating_value ?? null,
        rating_count: m.rating_count ?? null,
      };
    });

    const comparableMatches = Array.from(
      new Map(
        matchesWithSavings
          .filter(
            (match) =>
              match.equivalence_type !== "different" &&
              hasReliableResultSource(match) &&
              hasTrustworthyPackForComparison(match) &&
              hasProcurementComparablePack(equivalenceGroup, packQuantity, match),
          )
          .map((match) => [
            `${match.supplier_name}:${comparisonUrlKey(match.source_url) || match.product_name}`,
            match,
          ]),
      ).values(),
    );

    // Value scoring
    const priceSorted = [...comparableMatches]
      .filter((m) => (m.unit_price_each ?? m.price_gbp) !== null)
      .sort((a, b) => {
        const aPrice = a.unit_price_each ?? a.price_gbp ?? Infinity;
        const bPrice = b.unit_price_each ?? b.price_gbp ?? Infinity;
        return aPrice - bPrice;
      });

    for (const m of comparableMatches) {
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

    const bestBySaving = selectBestValueMatch(comparableMatches);
    if (bestBySaving) {
      const best = comparableMatches.find(
        (match) => match.product_id === bestBySaving.product_id,
      );
      if (best) {
        best.is_best_value = true;
      }
    }

    // Best savings
    const savings = comparableMatches
      .filter((m) => m.saving_gbp !== null && m.saving_gbp > 0)
      .sort((a, b) => (b.saving_gbp || 0) - (a.saving_gbp || 0));

    const bestSavingGbp = savings[0]?.saving_gbp || null;
    const bestSavingPct = savings[0]?.saving_pct || null;

    const unitSavings = comparableMatches
      .filter((m) => m.unit_saving_gbp !== null && m.unit_saving_gbp > 0)
      .sort((a, b) => (b.unit_saving_gbp || 0) - (a.unit_saving_gbp || 0));

    const bestUnitSavingGbp = unitSavings[0]?.unit_saving_gbp || null;
    const bestUnitSavingPct = unitSavings[0]?.unit_saving_pct || null;
    const bestValueMatch = comparableMatches.find((m) => m.is_best_value);

    // Cache matches in DB
    await cacheProductMatches(productId, comparableMatches, validated.price);

    const durationMs = Date.now() - startTime;

    await updateScrapeJob(jobId, {
      status: "complete",
      scraped_product_id: productId,
      match_count: comparableMatches.length,
      best_saving_pct: bestSavingPct ?? undefined,
      best_saving_gbp: bestSavingGbp ?? undefined,
      duration_ms: durationMs,
    });

    // Fire-and-forget: auto-discovery + price refresh
    const discoveryPending = needsMoreChoiceDiscovery(
      comparableMatches.length,
      TARGET_COMPARISON_CHOICES,
    );
    if (discoveryPending) {
      discoverProduct(
        validated.name,
        validated.brand,
        [],
        () => cache.delete(url),
        {
          equivalenceGroup,
          maxSuppliers: 30,
          maxProductsPerSupplier: 12,
          targetResults: TARGET_COMPARISON_CHOICES - comparableMatches.length + 8,
          useProductPageFallback: false,
        },
      ).catch(() => {});
    }

    refreshStalePrices(
      comparableMatches.map((m) => ({
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
      matches: comparableMatches,
      best_saving_gbp: bestSavingGbp,
      best_saving_pct: bestSavingPct,
      best_unit_saving_gbp: bestUnitSavingGbp,
      best_unit_saving_pct: bestUnitSavingPct,
      best_value_match_id: bestValueMatch?.product_id || null,
      match_count: comparableMatches.length,
      duration_ms: durationMs,
      discovery_pending: discoveryPending,
      retailer_search_links: buildRetailerSearchLinks(
        validated.name,
        validated.source_url || url,
        comparableMatches,
      ),
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
    if (
      errorMessage.includes('Could not extract product') ||
      errorMessage.includes('Could not verify') ||
      errorMessage.includes('verified product') ||
      errorMessage.includes('enough product data') ||
      errorMessage.includes('no product data')
    ) {
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
      retailer_search_links: [],
      error: userMessage,
    };
  }
}
