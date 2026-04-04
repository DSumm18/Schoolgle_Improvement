import { firecrawlExtract } from '../extractors/firecrawl';
import { ExtractedProductSchema } from '../extractors/base';
import { findExtractor } from '../extractors/registry';
import {
  upsertPrice,
  findSupplierByUrl,
  createScrapeJob,
  updateScrapeJob,
} from './matcher';

interface MatchWithPriceDate {
  product_id: string;
  supplier_id: string;
  source_url: string | null;
  price_date: string | null;
}

export function isPriceStale(
  priceDate: string | null | undefined,
  staleDays = 7,
): boolean {
  if (!priceDate) return true;
  return getPriceAgeDays(priceDate) > staleDays;
}

export function getPriceAgeDays(priceDate: string | null | undefined): number {
  if (!priceDate) return Infinity;
  const date = new Date(priceDate);
  if (isNaN(date.getTime())) return Infinity;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Re-scrape stale prices in the background.
 * Fire-and-forget: all errors logged, never thrown.
 */
export async function refreshStalePrices(
  matches: MatchWithPriceDate[],
  staleDays = 7,
): Promise<void> {
  const stale = matches.filter(
    (m) => m.source_url && isPriceStale(m.price_date, staleDays),
  );

  if (!stale.length) return;

  console.log(`[price-refresh] Refreshing ${stale.length} stale prices`);

  const results = await Promise.allSettled(
    stale.map(async (match) => {
      try {
        const url = match.source_url!;
        const jobId = await createScrapeJob(url, "refresh");
        await updateScrapeJob(jobId, { status: "scraping" });

        let validated;
        try {
          const raw = await firecrawlExtract(url);
          validated = ExtractedProductSchema.parse(raw);
        } catch {
          const extractor = findExtractor(url);
          const rawProduct = await extractor.extract(url);
          validated = ExtractedProductSchema.parse(rawProduct);
        }

        if (!validated.price) {
          await updateScrapeJob(jobId, {
            status: "failed",
            error_message: "No price extracted",
          });
          return;
        }

        const supplierInfo = await findSupplierByUrl(url);
        const supplierId = supplierInfo?.id || match.supplier_id;

        await upsertPrice(match.product_id, supplierId, validated.price, url);

        await updateScrapeJob(jobId, {
          status: "complete",
          scraped_product_id: match.product_id,
        });

        console.log(
          `[price-refresh] Updated ${match.product_id}: £${validated.price}`,
        );
      } catch (err) {
        console.error(
          `[price-refresh] Failed for ${match.product_id}:`,
          err instanceof Error ? err.message : err,
        );
      }
    }),
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  console.log(`[price-refresh] Done: ${succeeded}/${stale.length} refreshed`);
}
