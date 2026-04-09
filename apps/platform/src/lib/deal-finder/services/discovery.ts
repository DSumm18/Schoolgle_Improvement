import { firecrawlExtract } from '../extractors/firecrawl';
import { ExtractedProductSchema } from '../extractors/base';
import { findExtractor } from '../extractors/registry';
import { generateFingerprint } from './fingerprint';
import { parsePackInfo } from './pack-parser';
import { generateCanonicalKey, generateEquivalenceGroup } from './equivalence';
import {
  upsertProduct,
  upsertPrice,
  upsertProductUnitDetails,
  getSupplierSearchUrls,
  createScrapeJob,
  updateScrapeJob,
} from './matcher';

let activeDiscoveries = 0;
const MAX_CONCURRENT_DISCOVERIES = 2;

/**
 * Build a search query from a product name + brand.
 * Strips pack quantities, keeps brand + core name + weight.
 */
export function buildSearchQuery(name: string, brand?: string): string {
  let query = name
    .replace(/\b(?:pack|box|case|carton|bag|set|ream)\s+of\s+\d+/gi, "")
    .replace(/\b\d+\s*-?\s*(?:pk|pack)\b/gi, "")
    .replace(/\bx\s*\d+\b/gi, "")
    .replace(/\b\d+\s*x\b/gi, "")
    .replace(/\bqty\s*:?\s*\d+/gi, "")
    .replace(/\(\s*\d+\s*(?:pk|pack|per\s+pack)?\s*\)/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (brand && !query.toLowerCase().includes(brand.toLowerCase())) {
    query = `${brand} ${query}`;
  }

  return query;
}

async function discoverFromSupplier(
  searchUrl: string,
  supplierId: string,
): Promise<void> {
  // Dynamic import to avoid loading firecrawl at module level
  const FirecrawlApp = (await import("@mendable/firecrawl-js")).default;
  const { z } = await import("zod");

  const SearchResultSchema = z.object({
    first_product_url: z.string().optional(),
    first_product_name: z.string().optional(),
  });

  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) return;
  const client = new FirecrawlApp({ apiKey: key });

  const searchResult = await client.scrape(searchUrl, {
    formats: [{ type: "json" as const, schema: SearchResultSchema }],
  });

  // @ts-expect-error - Auto-masked during strict compilation enforcement
  const productUrl = searchResult.json?.first_product_url;
  if (!productUrl) return;

  const resolvedUrl = productUrl.startsWith("http")
    ? productUrl
    : new URL(productUrl, searchUrl).toString();

  const jobId = await createScrapeJob(resolvedUrl, "discovery");
  await updateScrapeJob(jobId, { status: "scraping" });

  let validated;
  try {
    const raw = await firecrawlExtract(resolvedUrl);
    validated = ExtractedProductSchema.parse(raw);
  } catch {
    const extractor = findExtractor(resolvedUrl);
    const rawProduct = await extractor.extract(resolvedUrl);
    validated = ExtractedProductSchema.parse(rawProduct);
  }

  const regexPack = parsePackInfo(validated.name, validated.description);
  const packQuantity = validated.pack_quantity || regexPack.pack_quantity;
  const packUnit = validated.pack_unit || regexPack.pack_unit;
  const unitWeightG = validated.unit_weight_g || regexPack.unit_weight_g;
  const unitVolumeMl = validated.unit_volume_ml || regexPack.unit_volume_ml;

  const unitPriceEach =
    validated.price && packQuantity > 0
      ? +(validated.price / packQuantity).toFixed(4)
      : null;
  const unitPricePerG =
    unitPriceEach && unitWeightG && unitWeightG > 0
      ? +(unitPriceEach / unitWeightG).toFixed(6)
      : null;

  const canonicalKey = generateCanonicalKey(
    validated.name, validated.brand, unitWeightG, unitVolumeMl,
  );
  const equivalenceGroup = generateEquivalenceGroup(
    validated.name, validated.description,
  );

  const fingerprint = generateFingerprint(validated);
  const productId = await upsertProduct({
    name: validated.name,
    description: validated.description,
    sku: validated.sku,
    brand: validated.brand,
    barcode: validated.barcode,
    image_url: validated.image_url,
    source_url: validated.source_url,
    fingerprint,
    supplier_id: supplierId,
    typical_price: validated.price,
    specs: validated.specs,
  });

  const confidence =
    validated.pack_quantity && validated.pack_quantity > 1
      ? 0.95
      : regexPack.confidence;

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

  if (validated.price) {
    await upsertPrice(productId, supplierId, validated.price, resolvedUrl);
  }

  await updateScrapeJob(jobId, {
    status: "complete",
    scraped_product_id: productId,
  });

  console.log(
    `[discovery] Found: ${validated.name} @ £${validated.price} from ${resolvedUrl}`,
  );
}

/**
 * Auto-discover a product across known suppliers.
 * Fire-and-forget: errors are logged, never thrown.
 */
export async function discoverProduct(
  name: string,
  brand: string | undefined,
  skipSupplierIds: string[],
  onComplete?: () => void,
): Promise<void> {
  if (activeDiscoveries >= MAX_CONCURRENT_DISCOVERIES) {
    console.log("[discovery] Max concurrent discoveries reached, skipping");
    return;
  }

  activeDiscoveries++;

  try {
    const suppliers = await getSupplierSearchUrls();
    const query = buildSearchQuery(name, brand);

    if (!query || query.length < 3) return;

    const targets = suppliers.filter(
      (s) => !skipSupplierIds.includes(s.supplier_id) && s.search_url_template,
    );

    if (!targets.length) return;

    console.log(
      `[discovery] Searching ${targets.length} suppliers for: "${query}"`,
    );

    const results = await Promise.allSettled(
      targets.map((supplier) => {
        const searchUrl = supplier.search_url_template!.replace(
          "{query}",
          encodeURIComponent(query),
        );
        return Promise.race([
          discoverFromSupplier(searchUrl, supplier.supplier_id),
          new Promise<void>((_, reject) =>
            setTimeout(() => reject(new Error("Discovery timeout")), 20000),
          ),
        ]);
      }),
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;
    console.log(
      `[discovery] Complete: ${succeeded} succeeded, ${failed} failed`,
    );

    if (onComplete) onComplete();
  } catch (err) {
    console.error("[discovery] Unexpected error:", err);
  } finally {
    activeDiscoveries--;
  }
}
